#!/usr/bin/env python3
"""
Automated Lambda deployment for Job Market tools
"""

import boto3
import os
import zipfile
import shutil
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (3 levels up from this file)
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)
print(f"Loading .env from: {env_path}")

# Explicitly set AWS credentials from .env for boto3
os.environ["AWS_ACCESS_KEY_ID"] = os.getenv("AWS_ACCESS_KEY_ID", "")
os.environ["AWS_SECRET_ACCESS_KEY"] = os.getenv("AWS_SECRET_ACCESS_KEY", "")
os.environ["AWS_REGION"] = os.getenv("AWS_REGION", "us-east-1")

lambda_client = boto3.client("lambda", region_name=os.getenv("AWS_REGION", "us-east-1"))
iam_client = boto3.client("iam", region_name=os.getenv("AWS_REGION", "us-east-1"))

FUNCTION_NAME = "UTD_JobMarketTools"
ROLE_NAME = "UTD_JobMarketToolsLambdaRole"


def get_lambda_role():
    """Get Lambda execution role ARN"""
    print("Getting Lambda execution role...")

    # Check if user provided role ARN in environment
    role_arn = os.getenv("LAMBDA_EXECUTION_ROLE_ARN")

    if role_arn:
        print(f"✓ Using role from environment: {role_arn}")
        return role_arn

    # Try to use the same role as AgentCore
    role_arn = os.getenv("AGENTCORE_EXECUTION_ROLE_ARN")

    if role_arn:
        print(f"✓ Using AgentCore execution role: {role_arn}")
        return role_arn

    # Try to check if default role exists
    try:
        role_response = iam_client.get_role(RoleName=ROLE_NAME)
        role_arn = role_response["Role"]["Arn"]
        print(f"✓ Using existing role: {role_arn}")
        return role_arn
    except:
        print("\n❌ No Lambda execution role found!")
        print("\nPlease create a Lambda execution role or add to .env:")
        print("LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME")
        print("\nOr use the same role as AgentCore:")
        print("You can reuse: AGENTCORE_EXECUTION_ROLE_ARN")
        sys.exit(1)


def create_deployment_package():
    """Create Lambda deployment ZIP file"""
    print("\nCreating deployment package...")

    # Create temp directory
    package_dir = "lambda_package"
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)

    # Install dependencies
    print("  Installing dependencies...")
    subprocess.run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            "lambda_requirements.txt",
            "-t",
            package_dir,
            "--quiet",
        ],
        check=True,
    )

    # Copy Lambda function
    shutil.copy("lambda_job_market_tools.py", package_dir)

    # Create ZIP
    zip_path = "job_market_tools_lambda.zip"
    if os.path.exists(zip_path):
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir)
                zipf.write(file_path, arcname)

    # Cleanup
    shutil.rmtree(package_dir)

    print(f"✓ Created {zip_path}")
    return zip_path


def deploy_lambda_function(role_arn, zip_path):
    """Deploy or update Lambda function"""
    print("\nDeploying Lambda function...")

    with open(zip_path, "rb") as f:
        zip_content = f.read()

    try:
        # Try to create new function
        response = lambda_client.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime="python3.11",
            Role=role_arn,
            Handler="lambda_job_market_tools.lambda_handler",
            Code={"ZipFile": zip_content},
            Timeout=60,  # 60 seconds for web scraping
            MemorySize=512,
            Description="Web scraping tools for UTD Career Spark job market data",
        )
        function_arn = response["FunctionArn"]
        print(f"✓ Created Lambda function: {function_arn}")

    except lambda_client.exceptions.ResourceConflictException:
        # Function exists, update it
        print("  Function exists, updating code...")
        response = lambda_client.update_function_code(
            FunctionName=FUNCTION_NAME, ZipFile=zip_content
        )
        function_arn = response["FunctionArn"]
        print(f"✓ Updated Lambda function: {function_arn}")
    
    except Exception as e:
        if "AccessDenied" in str(type(e)) or "not authorized" in str(e):
            print(f"\n❌ Permission Error: {e}")
            print("\nYour AWS user needs Lambda permissions. Please add these permissions:")
            print("  - lambda:CreateFunction")
            print("  - lambda:UpdateFunctionCode")
            print("  - lambda:UpdateFunctionConfiguration")
            print("  - lambda:GetFunction")
            print("  - lambda:AddPermission")
            print("\nOr ask your AWS admin to add the AWSLambda_FullAccess policy to your user.")
            sys.exit(1)
        raise

    return function_arn


def add_bedrock_permission(function_arn):
    """Add permission for Bedrock to invoke Lambda"""
    print("\nAdding Bedrock invoke permission...")

    account_id = boto3.client("sts").get_caller_identity()["Account"]

    try:
        lambda_client.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId="AllowBedrockInvoke",
            Action="lambda:InvokeFunction",
            Principal="bedrock.amazonaws.com",
            SourceAccount=account_id,
        )
        print("✓ Added Bedrock invoke permission")
    except lambda_client.exceptions.ResourceConflictException:
        print("✓ Permission already exists")


def main():
    print("=" * 60)
    print("Deploying Job Market Tools Lambda Function")
    print("=" * 60)

    # Step 1: Get Lambda execution role
    role_arn = get_lambda_role()

    # Step 2: Create deployment package
    zip_path = create_deployment_package()

    # Step 3: Deploy Lambda
    function_arn = deploy_lambda_function(role_arn, zip_path)

    # Step 4: Add Bedrock permission
    add_bedrock_permission(function_arn)

    print("\n" + "=" * 60)
    print("SUCCESS! Lambda function deployed")
    print("=" * 60)
    print(f"\nLambda ARN: {function_arn}")
    print("\nAdd this to your .env file:")
    print(f"LAMBDA_JOB_MARKET_TOOLS_ARN={function_arn}")
    print("\nNow update setup_agentcore_agents.py to use this Lambda ARN")


if __name__ == "__main__":
    main()
