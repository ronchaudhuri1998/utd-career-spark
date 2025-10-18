import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

client = boto3.client(
    "bedrock-agentcore-control",
    region_name=AWS_REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
)

response = client.list_memories()
memories = response.get("memories", [])
for memory in memories:
    mem_id = memory.get("id") or memory.get("memoryId")
    name = memory.get("name")
    status = memory.get("status")
    print(f"Memory name: {name}, ID: {mem_id}, status: {status}")
