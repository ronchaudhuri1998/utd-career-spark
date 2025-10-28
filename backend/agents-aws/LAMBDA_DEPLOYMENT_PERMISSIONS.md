# Lambda Deployment - Permission Requirements

## Issue
The AWS user `agentcore-dev` needs additional IAM permissions to deploy Lambda functions.

## Required IAM Permissions

Your AWS user needs the following Lambda permissions to deploy functions:

### Option 1: Attach AWS Managed Policy (Easiest)
Attach the `AWSLambda_FullAccess` policy to your IAM user:
- AWS Console → IAM → Users → `agentcore-dev` → Add permissions → Attach policies directly → Search `AWSLambda_FullAccess` → Attach

### Option 2: Custom Policy (More Restrictive)
Create a custom policy with only the permissions needed:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:GetFunction",
                "lambda:AddPermission",
                "lambda:RemovePermission",
                "lambda:ListFunctions",
                "lambda:DeleteFunction",
                "lambda:UpdateFunction"
            ],
            "Resource": "arn:aws:lambda:us-east-1:556316456032:function:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "arn:aws:lambda:us-east-1:556316456032:function:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:TagResource",
                "lambda:UntagResource",
                "lambda:ListTags"
            ],
            "Resource": "arn:aws:lambda:us-east-1:556316456032:function:*"
        }
    ]
}
```

## After Adding Permissions

Once permissions are added, you can deploy the Lambda functions:

```bash
# Deploy a specific function
cd backend/agents-aws/job
python3 deploy_lambda.py

cd ../nebula
python3 deploy_lambda.py

cd ../projects
python3 deploy_lambda.py

cd ../validation
python3 deploy_lambda.py

# Or deploy all at once
cd backend/agents-aws
python3 deploy_all_lambdas.py
```

## Function Names (Using Underscores)

All Lambda functions now use underscores instead of hyphens in their names:
- ✅ `UTD_JobMarketTools` (was `UTD-JobMarketTools`)
- ✅ `UTD_NebulaAPITools` (was `UTD-NebulaAPITools`)
- ✅ `UTD_ProjectTools` (was `UTD-ProjectTools`)
- ✅ `UTD_ValidateJobMarket` (was `UTD-ValidateJobMarket`)
- ✅ `UTD_ValidateCourse` (was `UTD-ValidateCourse`)
- ✅ `UTD_ValidateProject` (was `UTD-ValidateProject`)

This prevents issues with AWS Bedrock AgentCore action group naming conflicts.

