#!/bin/bash

# Recreate App Runner services with correct ECR permissions
set -e

# Configuration
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BACKEND_REPO="utd-career-spark-backend"
ECR_FRONTEND_REPO="utd-career-spark-frontend"
BACKEND_SERVICE_NAME="utd-career-spark-backend"
FRONTEND_SERVICE_NAME="utd-career-spark-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Recreating App Runner Services${NC}"
echo -e "${BLUE}=================================${NC}"

# Wait for services to be deleted
echo -e "${YELLOW}⏳ Waiting for services to be deleted...${NC}"
sleep 60

# Check if services are deleted
SERVICES=$(aws apprunner list-services --region $AWS_REGION --query 'ServiceSummaryList[].ServiceName' --output text)
if [ -n "$SERVICES" ]; then
    echo -e "${YELLOW}⚠️  Services still exist, waiting more...${NC}"
    sleep 30
fi

# Get auto-scaling configuration ARN
echo -e "${YELLOW}⚙️  Getting auto-scaling configuration...${NC}"
AUTO_SCALING_ARN=$(aws apprunner list-auto-scaling-configurations --region $AWS_REGION --query 'AutoScalingConfigurationSummaryList[0].AutoScalingConfigurationArn' --output text)

if [ "$AUTO_SCALING_ARN" = "None" ] || [ -z "$AUTO_SCALING_ARN" ]; then
    echo -e "${YELLOW}⚠️  No auto-scaling configuration found. Using default.${NC}"
    AUTO_SCALING_ARN="arn:aws:apprunner:$AWS_REGION:$ACCOUNT_ID:autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
fi

# Create backend service
echo -e "${YELLOW}🚀 Creating backend service...${NC}"
BACKEND_SERVICE_ARN=$(aws apprunner create-service \
    --service-name $BACKEND_SERVICE_NAME \
    --source-configuration "{
        \"ImageRepository\": {
            \"ImageIdentifier\": \"$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest\",
            \"ImageConfiguration\": {
                \"Port\": \"8000\",
                \"RuntimeEnvironmentVariables\": {
                    \"USE_AGENTCORE\": \"1\",
                    \"AWS_REGION\": \"$AWS_REGION\"
                }
            },
            \"ImageRepositoryType\": \"ECR\"
        },
        \"AuthenticationConfiguration\": {
            \"AccessRoleArn\": \"arn:aws:iam::$ACCOUNT_ID:role/AppRunnerAgentCoreRole\"
        }
    }" \
    --instance-configuration '{
        "Cpu": "1 vCPU",
        "Memory": "2 GB"
    }' \
    --auto-scaling-configuration-arn $AUTO_SCALING_ARN \
    --region $AWS_REGION \
    --query 'Service.ServiceArn' \
    --output text)

echo -e "${GREEN}✅ Backend service created${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend service to be ready...${NC}"
while true; do
    STATUS=$(aws apprunner describe-service --service-arn $BACKEND_SERVICE_ARN --region $AWS_REGION --query 'Service.Status' --output text)
    if [ "$STATUS" = "RUNNING" ]; then
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}❌ Backend service deployment failed with status: $STATUS${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⏳ Backend service status: $STATUS, waiting...${NC}"
    sleep 10
done

BACKEND_URL=$(aws apprunner describe-service --service-arn $BACKEND_SERVICE_ARN --region $AWS_REGION --query 'Service.ServiceUrl' --output text)
echo -e "${GREEN}✅ Backend URL: $BACKEND_URL${NC}"

# Create frontend service
echo -e "${YELLOW}🚀 Creating frontend service...${NC}"
FRONTEND_SERVICE_ARN=$(aws apprunner create-service \
    --service-name $FRONTEND_SERVICE_NAME \
    --source-configuration "{
        \"ImageRepository\": {
            \"ImageIdentifier\": \"$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest\",
            \"ImageConfiguration\": {
                \"Port\": \"80\",
                \"RuntimeEnvironmentVariables\": {
                    \"BACKEND_URL\": \"https://$BACKEND_URL\"
                }
            },
            \"ImageRepositoryType\": \"ECR\"
        },
        \"AuthenticationConfiguration\": {
            \"AccessRoleArn\": \"arn:aws:iam::$ACCOUNT_ID:role/AppRunnerAgentCoreRole\"
        }
    }" \
    --instance-configuration '{
        "Cpu": "0.5 vCPU",
        "Memory": "1 GB"
    }' \
    --auto-scaling-configuration-arn $AUTO_SCALING_ARN \
    --region $AWS_REGION \
    --query 'Service.ServiceArn' \
    --output text)

echo -e "${GREEN}✅ Frontend service created${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend service to be ready...${NC}"
while true; do
    STATUS=$(aws apprunner describe-service --service-arn $FRONTEND_SERVICE_ARN --region $AWS_REGION --query 'Service.Status' --output text)
    if [ "$STATUS" = "RUNNING" ]; then
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}❌ Frontend service deployment failed with status: $STATUS${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⏳ Frontend service status: $STATUS, waiting...${NC}"
    sleep 10
done

FRONTEND_URL=$(aws apprunner describe-service --service-arn $FRONTEND_SERVICE_ARN --region $AWS_REGION --query 'Service.ServiceUrl' --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Backend URL: https://$BACKEND_URL${NC}"
echo -e "${GREEN}✅ Frontend URL: https://$FRONTEND_URL${NC}"
echo -e "${BLUE}================================================${NC}"
