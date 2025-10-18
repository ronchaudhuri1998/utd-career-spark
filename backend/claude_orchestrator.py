"""
step1_claude_client.py
----------------------
Minimal Claude client for AWS Bedrock (correct Bedrock format)
• Works with Claude models in us-east-1
• Supports 'system_prompt' (top-level field, not a message role)
• Tested with anthropic.claude-3-haiku-20240307-v1:0
"""

import os
import json
from typing import Optional
from dotenv import load_dotenv
import boto3


# -------------------------------------------------
# 1️⃣  Load environment & Bedrock runtime client
# -------------------------------------------------
load_dotenv()
REGION = os.getenv("AWS_REGION") or "us-east-1"
MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"

bedrock = boto3.client("bedrock-runtime", region_name=REGION)


# -------------------------------------------------
# 2️⃣  Claude chat function (correct Bedrock format)
# -------------------------------------------------
def claude_chat(
    user_text: str,
    *,
    system_prompt: Optional[str] = None,
    max_tokens: int = 300,
    temperature: float = 0.3
) -> str:
    """
    Minimal wrapper around Bedrock Claude.
    Uses top-level 'system' instead of a 'system' message (AWS-specific format).
    """

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": user_text}]
            }
        ],
    }

    # ✅ Correct for Bedrock: system prompt goes here
    if system_prompt:
        body["system"] = system_prompt

    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(body),
    )

    payload = json.loads(response["body"].read().decode("utf-8"))
    return payload["content"][0]["text"]


# -------------------------------------------------
# 3️⃣  Test example
# -------------------------------------------------
if __name__ == "__main__":
    print(f"Region: {REGION}")
    print(f"Testing model: {MODEL_ID}")

    msg = claude_chat(
        "Describe the top 10 in-demand tech jobs right now.",
        system_prompt="talk like a consultant/expert trying to help new students"
    )

    print("\n🤖 Claude replied:\n")
    print(msg)
