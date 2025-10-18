"""
bedrock_claude_ping.py
----------------------
Direct Bedrock Claude test (no Strands layer)
"""

import boto3, json, os
from dotenv import load_dotenv

# 1️⃣  Load AWS creds
load_dotenv()
region = os.getenv("AWS_REGION") or "us-east-1"

bedrock = boto3.client("bedrock-runtime", region_name=region)

model_id = "anthropic.claude-3-haiku-20240307-v1:0"  # same one shown in your teammate's screenshot
prompt = "Say hi to Subid"

print(f"✅ Testing model: {model_id}\n")
# 2️⃣  Build request payload (Anthropic-style)
body = json.dumps({
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 100,
    "messages": [
        {"role": "user", "content": prompt}
    ]
})

# 3️⃣  Call Bedrock runtime directly
response = bedrock.invoke_model(
    modelId=model_id,
    body=body
)

# 4️⃣  Decode response
result = json.loads(response["body"].read().decode())
assistant_message = result["content"][0]["text"]
print("🤖 Claude replied:\n")
print(assistant_message)
