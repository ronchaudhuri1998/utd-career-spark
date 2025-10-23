import os
import sys
import uuid
from typing import Any, Dict, List, Tuple, Set

import boto3
from botocore.exceptions import ClientError, EventStreamError
from dotenv import load_dotenv

from backend.agentcore_runtime import AgentCoreRuntime

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
MAX_RECENT_SESSIONS = int(os.getenv("SESSION_SUMMARY_MAX_RECENT", "5"))

if not ACCESS_KEY or not SECRET_KEY:
    raise RuntimeError("Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")

client_kwargs: Dict[str, Any] = {
    "region_name": AWS_REGION,
    "aws_access_key_id": ACCESS_KEY,
    "aws_secret_access_key": SECRET_KEY,
}

if SESSION_TOKEN:
    client_kwargs["aws_session_token"] = SESSION_TOKEN

client = boto3.client("bedrock-agent", **client_kwargs)
runtime_client = boto3.client("bedrock-agent-runtime", **client_kwargs)
memory_client = boto3.client("bedrock-agentcore", **client_kwargs)
control_client = boto3.client("bedrock-agentcore-control", **client_kwargs)


def _extract_strategy_prompts(strategy: Dict[str, Any]) -> List[Tuple[str, str]]:
    prompts: List[Tuple[str, str]] = []

    def _walk(node: Any, path: str = "") -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                new_path = f"{path}.{key}" if path else key
                if isinstance(value, str) and key.lower().endswith("prompt"):
                    prompts.append((new_path, value))
                elif isinstance(value, str) and "override" in new_path.lower():
                    # Many overrides keep the actual prompt under appendToPrompt
                    prompts.append((new_path, value))
                else:
                    _walk(value, new_path)
        elif isinstance(node, list):
            for idx, item in enumerate(node):
                _walk(item, f"{path}[{idx}]")

    config = strategy.get("configuration") or {}
    _walk(config)
    return prompts


def _contains_memory_trace(node: Any) -> bool:
    if isinstance(node, dict):
        if "memoryTrace" in node:
            return True
        return any(_contains_memory_trace(value) for value in node.values())
    if isinstance(node, list):
        return any(_contains_memory_trace(item) for item in node)
    return False

agent_profiles: Dict[str, Dict[str, Any]] = {}

agents = [
    {"id": "U0FPAWT9JL", "label": "UTD-CareerPlanner-20251021-1539"},
    {"id": "IWQYFVWSL0", "label": "UTD-JobMarket-20251021-1539"},
    {"id": "XUSPTLMM1B", "label": "UTD-CourseCatalog-20251021-1539"},
    {"id": "7F3PILVKNB", "label": "UTD-ProjectAdvisor-20251021-1539"},
]

DISABLE_JOB_MARKET = os.getenv("DISABLE_JOB_MARKET", "1").strip().lower() not in {"0", "false", "no"}


def ensure_agent_profile(agent_id: str, label: str) -> Dict[str, Any]:
    """Cache agent metadata and alias identifiers for reuse."""
    profile = agent_profiles.get(agent_id)
    if profile is not None:
        return profile

    metadata = client.get_agent(agentId=agent_id)["agent"]
    alias_id = None
    try:
        alias_response = client.list_agent_aliases(agentId=agent_id)
        for alias_summary in alias_response.get("agentAliasSummaries", []):
            if alias_summary.get("agentAliasName") == "prod":
                alias_id = alias_summary.get("agentAliasId")
                break
        if alias_id is None and alias_response.get("agentAliasSummaries"):
            alias_id = alias_response["agentAliasSummaries"][0].get("agentAliasId")
    except ClientError:
        alias_id = None

    profile = {
        "metadata": metadata,
        "alias_id": alias_id,
        "label": label,
        "instruction": metadata.get("instruction", ""),
    }
    agent_profiles[agent_id] = profile
    return profile


def update_memory_configuration(agent_id: str, label: str) -> None:
    """Sync each agent's memory settings while preserving existing metadata."""
    profile = ensure_agent_profile(agent_id, label)
    metadata = profile["metadata"]

    display_name = metadata.get("agentName") or label or agent_id

    memory_config = metadata.get("memoryConfiguration", {})
    enabled_types = memory_config.get("enabledMemoryTypes") or ["SESSION_SUMMARY"]
    storage_days = memory_config.get("storageDays") or 90

    session_summary_config = memory_config.get("sessionSummaryConfiguration", {})
    session_summary_config["maxRecentSessions"] = MAX_RECENT_SESSIONS

    update_payload: Dict[str, Any] = {
        "agentId": agent_id,
        "agentName": metadata["agentName"],
        "instruction": metadata["instruction"],
        "foundationModel": metadata["foundationModel"],
        "agentCollaboration": metadata.get("agentCollaboration", "DISABLED"),
        "memoryConfiguration": {
            "enabledMemoryTypes": enabled_types,
            "storageDays": storage_days,
            "sessionSummaryConfiguration": session_summary_config,
        },
    }

    if metadata.get("agentResourceRoleArn"):
        update_payload["agentResourceRoleArn"] = metadata["agentResourceRoleArn"]

    client.update_agent(**update_payload)

    try:
        client.prepare_agent(agentId=agent_id)
        print(f"✅ Updated memory settings and prepared {display_name} (max recent sessions = {MAX_RECENT_SESSIONS})")
    except ClientError as exc:
        message = exc.response.get("Error", {}).get("Message", str(exc))
        print(f"⚠️ Updated memory but failed to prepare {display_name}: {message}")


for agent in agents:
    try:
        update_memory_configuration(agent["id"], agent["label"])
    except ClientError as exc:
        message = exc.response.get("Error", {}).get("Message", str(exc))
        print(f"❌ Failed to update {agent['label']}: {message}")

runtime = AgentCoreRuntime()


def resolve_planner_profile() -> Dict[str, Any]:
    """Resolve supervisor agent identifiers and metadata."""
    planner_id_env = os.getenv("AGENTCORE_PLANNER_AGENT_ID")
    planner_id = planner_id_env or agents[0]["id"]
    planner_label = next((a["label"] for a in agents if a["id"] == planner_id), planner_id)
    profile = ensure_agent_profile(planner_id, planner_label)

    alias_env = os.getenv("AGENTCORE_PLANNER_ALIAS_ID")
    alias_id = alias_env or profile.get("alias_id")
    if alias_id is None:
        raise RuntimeError(
            "Unable to resolve planner alias id. Set AGENTCORE_PLANNER_ALIAS_ID or create a 'prod' alias."
        )

    profile["alias_id"] = alias_id
    agent_profiles[planner_id]["alias_id"] = alias_id

    return {
        "agent_id": planner_id,
        "alias_id": alias_id,
        "agent_name": profile["metadata"].get("agentName", planner_label),
        "label": planner_label,
        "instruction": profile.get("instruction", ""),
        "metadata": profile["metadata"],
    }


def fetch_collaborator_map(planner_agent_id: str) -> Dict[str, Dict[str, Any]]:
    """Retrieve collaborator metadata keyed by collaboration name."""
    attempts = []
    response = None
    for version in ("DRAFT", "1"):
        try:
            response = client.list_agent_collaborators(
                agentId=planner_agent_id, agentVersion=version
            )
            break
        except ClientError as exc:
            attempts.append(exc.response["Error"]["Message"])
            continue

    if response is None:
        raise RuntimeError(
            f"Unable to list collaborators for agent {planner_agent_id}: {attempts}"
        )

    mapping: Dict[str, Dict[str, Any]] = {}
    for summary in response.get("agentCollaboratorSummaries", []):
        collab_name = summary.get("collaboratorName")
        alias_arn = summary.get("agentDescriptor", {}).get("aliasArn", "")
        alias_parts = alias_arn.split("/")
        collaborator_agent_id = alias_parts[-2] if len(alias_parts) >= 2 else None
        collaborator_alias_id = alias_parts[-1] if len(alias_parts) >= 1 else None
        label = next(
            (a["label"] for a in agents if a["id"] == collaborator_agent_id),
            collaborator_agent_id or collab_name,
        )

        collab_profile = None
        if collaborator_agent_id:
            collab_profile = ensure_agent_profile(collaborator_agent_id, label)
            if (
                collaborator_alias_id
                and not collab_profile.get("alias_id")
            ):
                collab_profile["alias_id"] = collaborator_alias_id
                agent_profiles[collaborator_agent_id]["alias_id"] = collaborator_alias_id

        mapping[collab_name] = {
            "agent_id": collaborator_agent_id,
            "alias_id": collaborator_alias_id,
            "agent_name": (
                collab_profile["metadata"].get("agentName")
                if collab_profile
                else label
            ),
            "instruction": (
                collab_profile.get("instruction", "")
                if collab_profile
                else ""
            ),
        }

    return mapping


def invoke_supervisor_session(
    goal: str,
    session_id: str,
    planner_profile: Dict[str, Any],
    extra_context: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    """Invoke the supervisor agent and capture collaborator output traces."""
    input_sections = [f"Career goal: {goal}"]
    if extra_context:
        for key, value in extra_context.items():
            if value:
                label = key.replace("_", " ").strip().title()
                input_sections.append(f"{label}: {value}")

    if DISABLE_JOB_MARKET:
        input_sections.append(
            "Note: JobMarketAgent is temporarily unavailable. Coordinate only with CourseCatalogAgent and ProjectAdvisorAgent."
        )

    input_text = "\n".join(input_sections)
    print("\n--- Supervisor Input ---")
    print(input_text)
    print("------------------------\n")
    response = runtime_client.invoke_agent(
        agentId=planner_profile["agent_id"],
        agentAliasId=planner_profile["alias_id"],
        sessionId=session_id,
        inputText=input_text,
        enableTrace=True,
    )

    final_chunks: list[str] = []
    collaborator_outputs: Dict[str, list[str]] = {}
    traces = []

    for event in response["completion"]:
        if "chunk" in event:
            chunk = event["chunk"]
            text = chunk.get("bytes", b"").decode("utf-8")
            if text:
                final_chunks.append(text)
        elif "trace" in event:
            trace_payload = event["trace"].get("trace", {})
            orchestration = trace_payload.get("orchestrationTrace")
            if not orchestration:
                continue

            observation = orchestration.get("observation")
            if observation and observation.get("type") == "AGENT_COLLABORATOR":
                collab_output = observation.get("agentCollaboratorInvocationOutput", {})
                collab_name = collab_output.get("agentCollaboratorName")
                output_text = collab_output.get("output", {}).get("text")
                if collab_name and output_text:
                    collaborator_outputs.setdefault(collab_name, []).append(output_text)

            traces.append(event["trace"])

    final_text = "".join(final_chunks).strip()
    collab_texts = {
        name: "\n\n".join(parts) for name, parts in collaborator_outputs.items()
    }

    return {
        "input_text": input_text,
        "final_text": final_text,
        "collaborator_outputs": collab_texts,
        "traces": traces,
    }


def invoke_collaborator_agent(
    agent_id: str,
    alias_id: str,
    session_id: str,
    prompt: str,
) -> str:
    """Invoke an individual collaborator agent and return its textual response."""
    response = runtime_client.invoke_agent(
        agentId=agent_id,
        agentAliasId=alias_id,
        sessionId=session_id,
        inputText=prompt,
        enableTrace=False,
    )

    chunks: List[str] = []
    for event in response["completion"]:
        if "chunk" in event:
            text = event["chunk"].get("bytes", b"").decode("utf-8")
            if text:
                chunks.append(text)
    return "".join(chunks).strip()


def fallback_collaborator_session(
    goal: str,
    session_id: str,
    collaborator_map: Dict[str, Dict[str, Any]],
    extra_context: Dict[str, str],
) -> Dict[str, Any] | None:
    """Fallback path when supervisor invocation fails; call collaborators directly."""
    outputs: Dict[str, str] = {}

    prompt_template = (
        "Student goal: {goal}\n"
        "Student year: {student_year}\n"
        "Courses completed or in progress: {courses_taken}\n"
        "Weekly availability: {time_commitment}\n"
        "Respond with your standard structured format and actionable recommendations."
    )

    summary_lines: List[str] = []
    for collab_name, info in collaborator_map.items():
        agent_id = info.get("agent_id")
        if not agent_id:
            print(f"⚠️ Missing agent id for collaborator {collab_name}; skipping.")
            continue

        if DISABLE_JOB_MARKET and agent_id == agents[1]["id"]:
            placeholder = "JobMarketAgent output unavailable (Lambda tools currently inaccessible)."
            outputs[collab_name] = placeholder
            summary_lines.append("JobMarketAgent unavailable")
            continue

        alias_id = info.get("alias_id") or agent_profiles.get(agent_id, {}).get("alias_id")
        if not alias_id:
            profile = ensure_agent_profile(agent_id, info.get("agent_name", agent_id))
            alias_id = profile.get("alias_id")

        if not alias_id:
            print(f"⚠️ No alias id available for collaborator {collab_name}; skipping.")
            continue

        prompt = prompt_template.format(goal=goal, **extra_context)
        try:
            print(f"\n--- Collaborator Input ({collab_name}) ---")
            print(prompt)
            print("----------------------------------------\n")
            output_text = invoke_collaborator_agent(agent_id, alias_id, session_id, prompt)
        except (ClientError, EventStreamError) as exc:
            print(f"⚠️ Collaborator {collab_name} invocation failed: {exc}")
            continue
        except Exception as exc:
            print(f"⚠️ Unexpected error invoking {collab_name}: {exc}")
            continue

        if output_text:
            outputs[collab_name] = output_text
            summary_lines.append(collab_name)

    if not outputs:
        print("⚠️ No collaborator outputs were captured during the fallback path.")
        return None

    if summary_lines:
        final_summary = "JobMarketAgent skipped. Collaborators responded: " + ", ".join(summary_lines)
    else:
        final_summary = "JobMarketAgent skipped."

    return {
        "input_text": f"Fallback collaborator invocations for goal: {goal}",
        "final_text": final_summary,
        "collaborator_outputs": outputs,
        "traces": [],
    }


def persist_conversation_to_memory(
    session_id: str,
    goal: str,
    planner_profile: Dict[str, Any],
    conversation: Dict[str, Any],
    collaborator_map: Dict[str, Dict[str, Any]],
) -> bool:
    """Record user + agent events into AgentCore memory using shared runtime."""
    if not runtime.available or not runtime.memory_id:
        print(f"⚠️ AgentCore runtime unavailable: {runtime.status_message}")
        return False

    runtime.record_user_goal(session_id, goal)

    supervisor_actor = planner_profile["agent_name"]
    if conversation.get("final_text"):
        runtime.record_agent_output(
            session_id,
            supervisor_actor,
            conversation["final_text"],
        )

    for collab_name, text in conversation.get("collaborator_outputs", {}).items():
        actor_name = collaborator_map.get(collab_name, {}).get("agent_name") or collab_name
        runtime.record_agent_output(session_id, actor_name, text)

    return True


def verify_memory_records(session_id: str, actors: list[tuple[str, str]]) -> Dict[str, List[str]]:
    """Retrieve persisted events from AgentCore memory and return messages per actor."""
    results: Dict[str, List[str]] = {}

    if not runtime.memory_id:
        print("⚠️ AgentCore memory id unavailable; skipping verification readback.")
        return results

    for actor_id, label in actors:
        try:
            response = memory_client.list_events(
                memoryId=runtime.memory_id,
                sessionId=session_id,
                actorId=actor_id,
                includePayloads=True,
                maxResults=5,
            )
        except ClientError as exc:
            message = exc.response.get("Error", {}).get("Message", str(exc))
            print(f"⚠️ Unable to read back events for {actor_id}: {message}")
            continue

        events = response.get("events", [])
        if not events:
            print(f"⚠️ No events stored yet for {actor_id}.")
            continue

        for event in events:
            payload = event.get("payload", [])
            messages = []
            for record in payload:
                conversational = record.get("conversational") or {}
                text = (conversational.get("content") or {}).get("text")
                if text:
                    messages.append(text.strip())
            combined = "\n".join(messages) if messages else "<no conversational text>"
            print(f" • {label}: {combined}")
            results.setdefault(actor_id, []).append(combined)

    return results


def run_agent_memory_test() -> None:
    """Drive a real supervisor invocation and persist outputs into shared memory."""
    try:
        planner_profile = resolve_planner_profile()
    except Exception as exc:
        print(f"❌ Unable to resolve planner profile: {exc}")
        return

    try:
        collaborator_map = fetch_collaborator_map(planner_profile["agent_id"])
    except Exception as exc:
        print(f"⚠️ Unable to resolve collaborator metadata: {exc}")
        collaborator_map = {}

    session_id = (
        runtime.allocate_session()
        if runtime.available
        else uuid.uuid4().hex
    )
    env_goal = os.getenv("TEST_CAREER_GOAL", "").strip()
    session_override_env = os.getenv("TEST_SESSION_ID", "").strip()
    interactive = sys.stdin is not None and sys.stdin.isatty()
    if session_override_env:
        session_id = session_override_env
    if len(session_id) < 2:
        session_id = session_id.ljust(2, "0") if session_id else uuid.uuid4().hex

    if env_goal:
        goal = env_goal
        student_year = os.getenv(
            "TEST_STUDENT_YEAR", "First-year MS Business Analytics student"
        )
        courses_taken = os.getenv("TEST_COURSES_TAKEN", "STAT 5351, CS 6350")
        time_commitment = os.getenv("TEST_TIME_COMMITMENT", "15 hours per week")
    elif interactive:
        print("TEST_CAREER_GOAL not set. Enter details to run the workflow:\n")
        goal = input("Career goal: ").strip()
        while not goal:
            goal = input("Career goal (required): ").strip()
        student_year = input("Student year (optional): ").strip()
        courses_taken = input("Courses taken (optional): ").strip()
        time_commitment = input("Weekly time commitment (optional): ").strip()
    else:
        raise RuntimeError(
            "TEST_CAREER_GOAL is not set and interactive input is unavailable."
        )

    extra_context = {
        "student_year": student_year or "Not provided",
        "courses_taken": courses_taken or "Not provided",
        "time_commitment": time_commitment or "Not provided",
    }

    existing_memory_present = False
    existing_memory_actors: Set[str] = set()
    if runtime.memory_id:
        actors_to_check = {"Student", planner_profile["agent_name"]}
        actors_to_check.update(
            info.get("agent_name")
            for info in collaborator_map.values()
            if info.get("agent_name")
        )
        total_events = 0
        for actor in actors_to_check:
            try:
                events = memory_client.list_events(
                    memoryId=runtime.memory_id,
                    sessionId=session_id,
                    actorId=actor,
                    includePayloads=False,
                    maxResults=5,
                ).get("events", [])
            except ClientError as exc:
                message = exc.response.get("Error", {}).get("Message", str(exc))
                print(f"⚠️ Unable to inspect existing memory for {actor}: {message}")
                continue

            if events:
                existing_memory_present = True
                existing_memory_actors.add(actor)
                total_events += len(events)

        if existing_memory_present:
            print(f"ℹ️ Found {total_events} existing memory event(s) for session {session_id} before invocation.")

    conversation = None
    skip_supervisor_flag = os.getenv("SKIP_SUPERVISOR", "0").strip().lower()
    skip_supervisor = skip_supervisor_flag not in {"0", "false", "no"}
    used_fallback = False

    if not skip_supervisor:
        try:
            conversation = invoke_supervisor_session(
                goal, session_id, planner_profile, extra_context
            )
        except (ClientError, EventStreamError) as exc:
            message = str(exc)
            print(f"❌ Supervisor invocation failed: {message}")
            if "Access denied while invoking Lambda" not in message:
                return
        except Exception as exc:
            print(f"❌ Unexpected error during supervisor invocation: {exc}")
            return
    else:
        print("⚠️ Supervisor invocation skipped (SKIP_SUPERVISOR=1).")
        used_fallback = True

    if conversation is None:
        if not collaborator_map:
            print("⚠️ No collaborator metadata available; cannot call collaborators directly.")
            return
        conversation = fallback_collaborator_session(
            goal, session_id, collaborator_map, extra_context
        )
        if conversation is None:
            return
        used_fallback = True

    print(f"\nSession ID: {session_id}")

    print(f"Supervisor agent ({planner_profile['agent_name']}) response:\n")
    supervisor_text = conversation.get("final_text", "")
    if supervisor_text:
        print(supervisor_text)
    else:
        print("<empty response>")
        if conversation.get("collaborator_outputs"):
            print("⚠️ Supervisor response unavailable; showing collaborator outputs captured separately.")

    if conversation["collaborator_outputs"]:
        print("\nCollaborator outputs captured from trace:")
        for collab_name, text in conversation["collaborator_outputs"].items():
            actor_name = collaborator_map.get(collab_name, {}).get("agent_name") or collab_name
            print(f"\n[{actor_name}]")
            print(text)

    wrote_memory = persist_conversation_to_memory(
        session_id,
        goal,
        planner_profile,
        conversation,
        collaborator_map,
    )
    statuses: List[Tuple[str, str, str]] = []

    if wrote_memory:
        participants = [("Student", "Student goal")]
        supervisor_actor = planner_profile["agent_name"]
        expected_collaborators: Dict[str, str] = {}

        if supervisor_text:
            participants.append((supervisor_actor, f"{supervisor_actor} response"))

        for collab_name in conversation.get("collaborator_outputs", {}):
            actor_name = collaborator_map.get(collab_name, {}).get("agent_name") or collab_name
            expected_collaborators[collab_name] = actor_name
            participants.append((actor_name, f"{actor_name} response"))

        print(f"\n✅ Persisted conversation to AgentCore memory {runtime.memory_id}. Reading back latest events:")
        memory_records = verify_memory_records(session_id, participants)

        student_memory_ok = bool(memory_records.get("Student"))
        supervisor_memory_ok = supervisor_actor in memory_records and bool(memory_records[supervisor_actor])
        collaborator_memory_ok = all(
            (actor_name in memory_records and bool(memory_records[actor_name]))
            for actor_name in expected_collaborators.values()
        )

        memory_ok = student_memory_ok and supervisor_memory_ok and collaborator_memory_ok

        print("\nMemory Verification:")
        for actor_id, label in participants:
            entries = memory_records.get(actor_id, [])
            if entries:
                icon = "✅"
                msg = f"{label} stored {len(entries)} record(s)."
            else:
                icon = "❌"
                msg = f"{label} missing from memory."
            print(f"  {icon} {msg}")
    else:
        print("⚠️ Skipped memory readback because the runtime was unavailable.")
        memory_ok = False
        supervisor_actor = planner_profile["agent_name"]
        expected_collaborators = {}

    strategy_prompts: List[Tuple[str, str]] = []
    if runtime.memory_id:
        try:
            memory_info = control_client.get_memory(memoryId=runtime.memory_id).get("memory", {})
            strategies = memory_info.get("strategies", [])
            if strategies:
                print("\nMemory Strategies:")
                for strat in strategies:
                    status_icon = "✅" if strat.get("status") == "ACTIVE" else "⚠️"
                    strategy_id = strat.get("strategyId") or strat.get("name", "<unknown>")
                    strategy_type = strat.get("type", "<type>")
                    namespaces = ", ".join(strat.get("namespaces", [])) or "<default>"
                    print(f"  {status_icon} {strategy_id} [{strategy_type}] → {namespaces}")
                    for prompt_path, prompt_text in _extract_strategy_prompts(strat):
                        snippet = prompt_text.strip().replace("\n", " ")
                        if len(snippet) > 160:
                            snippet = snippet[:157] + "..."
                        print(f"      ↳ {prompt_path}: {snippet}")
                        strategy_prompts.append((strategy_id, prompt_path))
        except ClientError as exc:
            message = exc.response.get("Error", {}).get("Message", str(exc))
            print(f"⚠️ Unable to describe memory strategies: {message}")

    memory_read_detected = any(_contains_memory_trace(trace) for trace in conversation.get("traces", []))

    core_ok = bool(supervisor_text.strip()) and len(conversation.get("collaborator_outputs", {})) >= 2

    if core_ok:
        statuses.append(("ok", "Career Guidance Coverage", "Supervisor summary and collaborator details produced."))
    else:
        statuses.append(("fail", "Career Guidance Coverage", "Supervisor or collaborator output missing."))

    if used_fallback:
        statuses.append(("warn", "Multi-Agent Coordination", "Supervisor fell back to direct collaborator calls."))
    elif core_ok:
        statuses.append(("ok", "Multi-Agent Coordination", "Supervisor orchestrated CourseCatalog and ProjectAdvisor without fallback."))
    else:
        statuses.append(("fail", "Multi-Agent Coordination", "Collaboration degraded; supervisor response incomplete."))

    if memory_ok:
        statuses.append(("ok", "Shared Memory Sync", "Student, supervisor, and collaborators persisted to AgentCore."))
    else:
        statuses.append(("fail", "Shared Memory Sync", "Memory entries missing for one or more participants."))

    if DISABLE_JOB_MARKET:
        statuses.append(("warn", "Job Market Signals", "JobMarketAgent intentionally skipped (Lambda invocation disabled)."))
    else:
        jm_name = agent_profiles.get(agents[1]["id"], {}).get("metadata", {}).get("agentName", agents[1]["label"])
        job_market_ok = jm_name in conversation.get("collaborator_outputs", {})
        statuses.append(("ok" if job_market_ok else "warn", "JobMarketAgent – Lambda Tools", "JobMarketAgent responded successfully." if job_market_ok else "JobMarketAgent did not return data."))

    if strategy_prompts:
        statuses.append(("ok", "Memory Strategy Prompts", f"Loaded {len(strategy_prompts)} strategy prompt overrides."))
    else:
        statuses.append(("warn", "Memory Strategy Prompts", "No strategy prompts exposed; using default behavior."))

    if existing_memory_present:
        if memory_read_detected:
            statuses.append(("ok", "Shared Memory Retrieval", "Supervisor trace shows memory retrieval for this session."))
            print("✅ Successfully detected memory retrieval activity in agent trace.")
        else:
            statuses.append(("warn", "Shared Memory Retrieval", "Prior session data exists but no memory retrieval was detected in traces."))
    else:
        statuses.append(("info", "Shared Memory Retrieval", "No prior session memory available to retrieve."))

    print("\nDiagnostics:")
    icon_map = {"ok": "✅", "warn": "⚠️", "fail": "❌"}
    for severity, label, detail in statuses:
        icon = icon_map.get(severity, "ℹ️")
        print(f"{icon} {label}: {detail}")


run_agent_memory_test()
