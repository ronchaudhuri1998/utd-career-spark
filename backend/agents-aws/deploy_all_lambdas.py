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
    """Run a deployment script in a specific folder"""
    print(f"\n{'='*60}")
    print(f"Deploying {folder_name.title()} Lambda Function")
    print(f"{'='*60}")

    script_path = Path(folder_name) / script_name

    if not script_path.exists():
        print(f"❌ Deployment script not found: {script_path}")
        return False

    try:
        # Change to the folder and run the deployment script
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=folder_name,
            check=True,
            capture_output=False,
        )
        print(f"✓ {folder_name.title()} deployment completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {folder_name.title()} deployment failed: {e}")
        return False


def main():
    print("=" * 80)
    print("UTD Career Spark - Lambda Functions Deployment")
    print("=" * 80)
    print("This script will deploy all three Lambda functions:")
    print("1. Job Market Tools")
    print("2. Course Catalog Tools")
    print("3. Project Tools")
    print("=" * 80)

    # Get current directory
    current_dir = Path.cwd()
    print(f"Current directory: {current_dir}")

    # Check if we're in the right directory
    if (
        not (current_dir / "job").exists()
        or not (current_dir / "course").exists()
        or not (current_dir / "projects").exists()
    ):
        print("❌ Error: Please run this script from the agents-aws directory")
        print("Expected structure:")
        print("  agents-aws/")
        print("    ├── job/")
        print("    ├── course/")
        print("    └── projects/")
        sys.exit(1)

    # Track deployment results
    results = {}

    # Deploy Job Market Tools
    results["job"] = run_deployment_script("job", "deploy_lambda.py")

    # Deploy Course Catalog Tools
    results["course"] = run_deployment_script("course", "deploy_lambda.py")

    # Deploy Project Tools
    results["projects"] = run_deployment_script("projects", "deploy_lambda.py")

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
        print("\n🎉 All Lambda functions deployed successfully!")
        print("\nNext steps:")
        print("1. Update your .env file with the Lambda ARNs")
        print("2. Update setup_agentcore_agents.py to use the new Lambda ARNs")
        print("3. Test the agents with the new Lambda functions")
    else:
        print(f"\n⚠️  {failed} deployment(s) failed. Please check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
