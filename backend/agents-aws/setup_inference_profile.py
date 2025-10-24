#!/usr/bin/env python3
"""
Create inference profile for Claude 3.7 and update agent configuration
"""

import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

def create_inference_profile():
    """Create inference profile for Claude 3.7"""
    region = os.getenv("AWS_REGION", "us-east-1")
    bedrock_client = boto3.client("bedrock", region_name=region)
    
    profile_name = "UTD-Claude-3-Haiku-Profile"
    
    try:
        # Check if profile already exists
        try:
            response = bedrock_client.get_inference_profile(inferenceProfileIdentifier=profile_name)
            print(f"✓ Inference profile already exists: {response['inferenceProfile']['inferenceProfileArn']}")
            return response['inferenceProfile']['inferenceProfileArn']
        except bedrock_client.exceptions.ResourceNotFoundException:
            pass
        
        # Create the inference profile
        print(f"Creating inference profile: {profile_name}")
        
        create_params = {
            "inferenceProfileName": profile_name,
            "description": "Inference profile for Claude 3.5 Sonnet for UTD Career Spark AgentCore",
            "modelSource": {
                "copyFrom": f"arn:aws:bedrock:{region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
            }
        }
        
        response = bedrock_client.create_inference_profile(**create_params)
        profile_arn = response['inferenceProfile']['inferenceProfileArn']
        
        print(f"✓ Created inference profile: {profile_arn}")
        return profile_arn
        
    except Exception as e:
        print(f"❌ Error creating inference profile: {e}")
        return None

def update_agent_configuration(profile_arn):
    """Update the agent setup script to use inference profile ARN"""
    setup_file = "/Users/davis/Desktop/GitHub/utd-career-spark/backend/agents-aws/setup_agentcore_agents.py"
    
    try:
        with open(setup_file, 'r') as f:
            content = f.read()
        
        # Replace the foundation model with inference profile ARN
        old_model = '"foundationModel": "anthropic.claude-3-haiku-20240307-v1:0",'
        new_model = f'"foundationModel": "{profile_arn}",'
        
        if old_model in content:
            content = content.replace(old_model, new_model)
            
            with open(setup_file, 'w') as f:
                f.write(content)
            
            print(f"✓ Updated agent configuration to use inference profile: {profile_arn}")
            return True
        else:
            print("⚠️  Could not find the foundation model configuration to update")
            return False
            
    except Exception as e:
        print(f"❌ Error updating agent configuration: {e}")
        return False

def main():
    print("=" * 60)
    print("Setting up Claude 3.7 Inference Profile for AgentCore")
    print("=" * 60)
    
    # Create inference profile
    profile_arn = create_inference_profile()
    
    if profile_arn:
        # Update agent configuration
        if update_agent_configuration(profile_arn):
            print("\n✓ Setup complete!")
            print(f"✓ Inference Profile ARN: {profile_arn}")
            print("✓ Agent configuration updated")
            print("\nYou can now run the agent setup script to create agents with Claude 3.7")
        else:
            print("\n❌ Failed to update agent configuration")
    else:
        print("\n❌ Failed to create inference profile")

if __name__ == "__main__":
    main()
