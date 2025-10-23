#!/usr/bin/env python3
"""
Deploy all 3 validation Lambda functions
"""

import boto3
import os
import zipfile
import shutil
import subprocess
import sys
from dotenv import load_dotenv

load_dotenv()

lambda_client = boto3.client("lambda", region_name=os.getenv("AWS_REGION", "us-east-1"))
iam_client = boto3.client("iam", region_name=os.getenv("AWS_REGION", "us-east-1"))

# Function configurations
FUNCTIONS = [
    {
        "name": "UTD-ValidateJobMarket",
        "file": "lambda_validate_job_market.py",
        "handler": "lambda_validate_job_market.lambda_handler",
        "description": "Validates job market agent output format",
    },
    {
        "name": "UTD-ValidateCourse",
        "file": "lambda_validate_course.py",
        "handler": "lambda_validate_course.lambda_handler",
        "description": "Validates course catalog agent output format",
    },
    {
        "name": "UTD-ValidateProject",
        "file": "lambda_validate_project.py",
        "handler": "lambda_validate_project.lambda_handler",
        "description": "Validates project advisor agent output format",
    },
]

ROLE_NAME = "UTD-ValidationLambdaRole"


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


def create_deployment_package(function_file):
    """Create Lambda deployment ZIP file for a specific function"""
    print(f"\nCreating deployment package for {function_file}...")

    # Create temp directory
    package_dir = f"lambda_package_{function_file.replace('.py', '')}"
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
    shutil.copy(function_file, package_dir)

    # Create ZIP
    zip_path = f"{function_file.replace('.py', '')}_lambda.zip"
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


def deploy_lambda_function(function_config, role_arn, zip_path):
    """Deploy or update Lambda function"""
    print(f"\nDeploying {function_config['name']}...")

    with open(zip_path, "rb") as f:
        zip_content = f.read()

    try:
        # Try to create new function
        response = lambda_client.create_function(
            FunctionName=function_config["name"],
            Runtime="python3.11",
            Role=role_arn,
            Handler=function_config["handler"],
            Code={"ZipFile": zip_content},
            Timeout=30,  # 30 seconds for validation
            MemorySize=256,  # 256 MB for validation
            Description=function_config["description"],
        )
        function_arn = response["FunctionArn"]
        print(f"✓ Created Lambda function: {function_arn}")

    except lambda_client.exceptions.ResourceConflictException:
        # Function exists, update it
        print("  Function exists, updating code...")
        response = lambda_client.update_function_code(
            FunctionName=function_config["name"], ZipFile=zip_content
        )
        function_arn = response["FunctionArn"]
        print(f"✓ Updated Lambda function: {function_arn}")

    return function_arn


def add_bedrock_permission(function_name, function_arn):
    """Add permission for Bedrock to invoke Lambda"""
    print(f"\nAdding Bedrock invoke permission for {function_name}...")

    account_id = boto3.client("sts").get_caller_identity()["Account"]

    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId="AllowBedrockInvoke",
            Action="lambda:InvokeFunction",
            Principal="bedrock.amazonaws.com",
            SourceAccount=account_id,
        )
        print(f"✓ Added Bedrock invoke permission for {function_name}")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"✓ Permission already exists for {function_name}")


def main():
    print("=" * 60)
    print("Deploying Validation Lambda Functions")
    print("=" * 60)

    # Step 1: Get Lambda execution role
    role_arn = get_lambda_role()

    deployed_functions = []

    # Step 2: Deploy each function
    for function_config in FUNCTIONS:
        print(f"\n{'='*60}")
        print(f"Deploying {function_config['name']}")
        print("=" * 60)

        # Create deployment package
        zip_path = create_deployment_package(function_config["file"])

        # Deploy Lambda
        function_arn = deploy_lambda_function(function_config, role_arn, zip_path)

        # Add Bedrock permission
        add_bedrock_permission(function_config["name"], function_arn)

        deployed_functions.append(
            {"name": function_config["name"], "arn": function_arn}
        )

        # Cleanup zip file
        os.remove(zip_path)

    print("\n" + "=" * 60)
    print("SUCCESS! All validation functions deployed")
    print("=" * 60)

    print("\nAdd these to your .env file:")
    for func in deployed_functions:
        env_var = (
            f"LAMBDA_VALIDATE_{func['name'].replace('UTD-Validate', '').upper()}_ARN"
        )
        print(f"{env_var}={func['arn']}")

    print("\nEnvironment variables:")
    print("LAMBDA_VALIDATE_JOBMARKET_ARN=...")
    print("LAMBDA_VALIDATE_COURSE_ARN=...")
    print("LAMBDA_VALIDATE_PROJECT_ARN=...")
    print("\nNow update setup_agentcore_agents.py to use these Lambda ARNs")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        exit(1)
