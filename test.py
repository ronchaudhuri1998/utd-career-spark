import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
EXEC_ROLE_ARN = os.getenv("AGENTCORE_EXECUTION_ROLE_ARN")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

print("Region:", AWS_REGION)
print("Execution role:", EXEC_ROLE_ARN)

sts = boto3.client(
    "sts",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name=AWS_REGION,
)
print("✅ STS identity:", sts.get_caller_identity())

control_client = boto3.client(
    "bedrock-agentcore-control",
    region_name=AWS_REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
)

try:
    response = control_client.create_memory(
        name="CareerAdvisorMemory",
        description="Memory for UTD Career Advisor Agent",
        eventExpiryDuration=90,
        memoryExecutionRoleArn=EXEC_ROLE_ARN,
    )
    memory = response.get("memory", {})
    identifier = (
        memory.get("memoryId")
        or memory.get("id")
        or memory.get("memoryArn")
        or "<no id in response>"
    )
    print("✅ Memory created:", identifier)
    print("Full memory payload:", memory)
except ClientError as exc:
    print("❌ Error creating memory:", exc.response["Error"]["Message"])
