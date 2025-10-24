#!/usr/bin/env python3
"""
Check available Bedrock models in your region
"""

import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def list_available_models():
    """List all available Bedrock models."""
    region = os.getenv("AWS_REGION", "us-east-1")
    
    try:
        # List foundation models
        bedrock_client = boto3.client("bedrock", region_name=region)
        
        print(f"🔍 Checking available models in region: {region}")
        print("=" * 50)
        
        # Get foundation models
        response = bedrock_client.list_foundation_models()
        
        claude_models = []
        for model in response.get("modelSummaries", []):
            if "claude" in model.get("modelId", "").lower():
                claude_models.append({
                    "modelId": model.get("modelId"),
                    "modelName": model.get("modelName"),
                    "providerName": model.get("providerName"),
                    "inputModalities": model.get("inputModalities", []),
                    "outputModalities": model.get("outputModalities", [])
                })
        
        print("🤖 Available Claude Models:")
        for model in claude_models:
            print(f"  • {model['modelId']}")
            print(f"    Name: {model['modelName']}")
            print(f"    Provider: {model['providerName']}")
            print(f"    Input: {model['inputModalities']}")
            print(f"    Output: {model['outputModalities']}")
            print()
        
        # Test a simple model
        print("🧪 Testing model availability...")
        bedrock_runtime = boto3.client("bedrock-runtime", region_name=region)
        
        # Try the most common working model
        test_model = "anthropic.claude-3-haiku-20240307-v1:0"
        try:
            test_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 10,
                "messages": [
                    {"role": "user", "content": [{"type": "text", "text": "Hello"}]}
                ]
            }
            
            response = bedrock_runtime.invoke_model(
                modelId=test_model,
                body=json.dumps(test_body)
            )
            print(f"✅ {test_model} is working!")
            
        except Exception as e:
            print(f"❌ {test_model} failed: {e}")
            
    except Exception as e:
        print(f"❌ Error checking models: {e}")

if __name__ == "__main__":
    import json
    list_available_models()
