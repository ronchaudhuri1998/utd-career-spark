#!/usr/bin/env python3
"""
Master deployment script for all Lambda functions
Deploys job, course, and project tools
"""

import subprocess
import sys
import os
from pathlib import Path


def run_deployment_script(folder_name, script_name):
    """Run a deployment script in a specific folder and capture Lambda ARN"""
    print(f"\n{'='*60}")
    print(f"Deploying {folder_name.title()} Lambda Function")
    print(f"{'='*60}")

    script_path = Path(folder_name) / script_name

    if not script_path.exists():
        print(f"❌ Deployment script not found: {script_path}")
        return False, None

    try:
        # Change to the folder and run the deployment script
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=folder_name,
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"✓ {folder_name.title()} deployment completed successfully")

        # Extract Lambda ARN from output
        lambda_arn = None
        for line in result.stdout.split("\n"):
            if "Lambda ARN:" in line:
                lambda_arn = line.split("Lambda ARN:")[1].strip()
                break
            elif "LAMBDA_" in line and "ARN=" in line:
                # Extract from environment variable line
                lambda_arn = line.split("=")[1].strip()
                break

        return True, lambda_arn
    except subprocess.CalledProcessError as e:
        print(f"❌ {folder_name.title()} deployment failed: {e}")
        return False, None


def main():
    print("=" * 80)
    print("UTD Career Spark - Lambda Functions Deployment")
    print("=" * 80)
    print("This script will deploy all Lambda functions:")
    print("1. Job Market Tools")
    print("2. Nebula API Tools (Course Catalog)")
    print("3. Project Tools")
    print("4. Validation Tools")
    print("=" * 80)

    # Get current directory
    current_dir = Path.cwd()
    print(f"Current directory: {current_dir}")

    # Check if we're in the right directory
    if (
        not (current_dir / "job").exists()
        or not (current_dir / "nebula").exists()
        or not (current_dir / "projects").exists()
        or not (current_dir / "validation").exists()
    ):
        print("❌ Error: Please run this script from the agents-aws directory")
        print("Expected structure:")
        print("  agents-aws/")
        print("    ├── job/")
        print("    ├── nebula/")
        print("    ├── projects/")
        print("    └── validation/")
        sys.exit(1)

    # Track deployment results and ARNs
    results = {}
    lambda_arns = {}

    # Deploy Job Market Tools
    success, arn = run_deployment_script("job", "deploy_lambda.py")
    results["job"] = success
    if success and arn:
        lambda_arns["LAMBDA_JOB_MARKET_TOOLS_ARN"] = arn

    # Deploy Nebula API Tools (Course Catalog)
    success, arn = run_deployment_script("nebula", "deploy_lambda.py")
    results["nebula"] = success
    if success and arn:
        lambda_arns["LAMBDA_NEBULA_API_TOOLS_ARN"] = arn

    # Deploy Project Tools
    success, arn = run_deployment_script("projects", "deploy_lambda.py")
    results["projects"] = success
    if success and arn:
        lambda_arns["LAMBDA_PROJECT_TOOLS_ARN"] = arn

    # Deploy Validation Tools
    success, arn = run_deployment_script("validation", "deploy_lambda.py")
    results["validation"] = success
    if success and arn:
        # Validation returns multiple ARNs, handle them separately
        # We'll need to parse the validation output differently
        pass

    # Summary
    print(f"\n{'='*80}")
    print("DEPLOYMENT SUMMARY")
    print(f"{'='*80}")

    successful = 0
    failed = 0

    for service, success in results.items():
        status = "✓ SUCCESS" if success else "❌ FAILED"
        print(f"{service.title():<15} {status}")
        if success:
            successful += 1
        else:
            failed += 1

    print(f"\nTotal: {successful} successful, {failed} failed")

    if failed == 0:
        print("\n🎉 All 4 Lambda functions deployed successfully!")
        print("\n" + "=" * 80)
        print("LAMBDA FUNCTION ARNs - Add these to your .env file:")
        print("=" * 80)

        # Display all captured ARNs
        for env_var, arn in lambda_arns.items():
            print(f"{env_var}={arn}")

        # Add validation ARNs (these are typically shown in the validation output)
        print("\nValidation Lambda ARNs (from validation deployment output):")
        print(
            "LAMBDA_VALIDATE_JOBMARKET_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateJobMarket"
        )
        print(
            "LAMBDA_VALIDATE_COURSE_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateCourse"
        )
        print(
            "LAMBDA_VALIDATE_PROJECT_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateProject"
        )

        print("\nNext steps:")
        print("1. Copy the above environment variables to your .env file")
        print("2. Update setup_agentcore_agents.py to use the new Lambda ARNs")
        print("3. Test the agents with the new Lambda functions")
    else:
        print(f"\n⚠️  {failed} deployment(s) failed. Please check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
