#!/bin/bash

# AWS App Runner Deployment Script for UTD Career Spark
# This script automates the deployment of both backend and frontend to AWS App Runner

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

echo -e "${BLUE}🚀 UTD Career Spark - AWS App Runner Deployment${NC}"
echo -e "${BLUE}================================================${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create ECR repositories
echo -e "${YELLOW}📦 Creating ECR repositories...${NC}"

# Create backend repository
aws ecr create-repository \
    --repository-name $ECR_BACKEND_REPO \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    2>/dev/null || echo -e "${YELLOW}⚠️  Backend repository already exists${NC}"

# Create frontend repository
aws ecr create-repository \
    --repository-name $ECR_FRONTEND_REPO \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    2>/dev/null || echo -e "${YELLOW}⚠️  Frontend repository already exists${NC}"

echo -e "${GREEN}✅ ECR repositories ready${NC}"

# Login to ECR
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend image
echo -e "${YELLOW}🐳 Building and pushing backend image...${NC}"
cd backend
docker build -t $ECR_BACKEND_REPO .
docker tag $ECR_BACKEND_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
cd ..

# Build and push frontend image
echo -e "${YELLOW}🐳 Building and pushing frontend image...${NC}"
cd frontend
docker build -t $ECR_FRONTEND_REPO .
docker tag $ECR_FRONTEND_REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
cd ..

echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"

# Get auto-scaling configuration ARN
echo -e "${YELLOW}⚙️  Getting auto-scaling configuration...${NC}"
AUTO_SCALING_ARN=$(aws apprunner list-auto-scaling-configurations --region $AWS_REGION --query 'AutoScalingConfigurationSummaryList[0].AutoScalingConfigurationArn' --output text)

if [ "$AUTO_SCALING_ARN" = "None" ] || [ -z "$AUTO_SCALING_ARN" ]; then
    echo -e "${YELLOW}⚠️  No auto-scaling configuration found. Using default.${NC}"
    AUTO_SCALING_ARN="arn:aws:apprunner:$AWS_REGION:$ACCOUNT_ID:autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
fi

# Deploy backend service
echo -e "${YELLOW}🚀 Deploying backend service...${NC}"

# Check if backend service already exists
BACKEND_SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$BACKEND_SERVICE_NAME'].ServiceArn" --output text)

if [ -n "$BACKEND_SERVICE_ARN" ] && [ "$BACKEND_SERVICE_ARN" != "None" ]; then
    echo -e "${YELLOW}⚠️  Backend service already exists. Updating...${NC}"
    
    # Update service configuration
    aws apprunner update-service \
        --service-arn $BACKEND_SERVICE_ARN \
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
        --region $AWS_REGION
else
    # Create new backend service
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
fi

echo -e "${GREEN}✅ Backend service deployed${NC}"

# Wait for backend service to be ready and get URL
echo -e "${YELLOW}⏳ Waiting for backend service to be ready...${NC}"
# Poll the service status until it's running
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

# Deploy frontend service
echo -e "${YELLOW}🚀 Deploying frontend service...${NC}"

# Check if frontend service already exists
FRONTEND_SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$FRONTEND_SERVICE_NAME'].ServiceArn" --output text)

if [ -n "$FRONTEND_SERVICE_ARN" ] && [ "$FRONTEND_SERVICE_ARN" != "None" ]; then
    echo -e "${YELLOW}⚠️  Frontend service already exists. Updating...${NC}"
    
    # Update service configuration
    aws apprunner update-service \
        --service-arn $FRONTEND_SERVICE_ARN \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest\",
                \"ImageConfiguration\": {
                    \"Port\": \"80\",
                    \"RuntimeEnvironmentVariables\": {
                        \"BACKEND_URL\": \"$BACKEND_URL\"
                    }
                },
                \"ImageRepositoryType\": \"ECR\"
            },
            \"AuthenticationConfiguration\": {
                \"AccessRoleArn\": \"arn:aws:iam::$ACCOUNT_ID:role/AppRunnerAgentCoreRole\"
            }
        }" \
        --region $AWS_REGION
else
    # Create new frontend service
    FRONTEND_SERVICE_ARN=$(aws apprunner create-service \
        --service-name $FRONTEND_SERVICE_NAME \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest\",
                \"ImageConfiguration\": {
                    \"Port\": \"80\",
                    \"RuntimeEnvironmentVariables\": {
                        \"BACKEND_URL\": \"$BACKEND_URL\"
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
fi

echo -e "${GREEN}✅ Frontend service deployed${NC}"

# Wait for frontend service to be ready and get URL
echo -e "${YELLOW}⏳ Waiting for frontend service to be ready...${NC}"
# Poll the service status until it's running
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
echo -e "${GREEN}✅ Backend URL: $BACKEND_URL${NC}"
echo -e "${GREEN}✅ Frontend URL: $FRONTEND_URL${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Configure environment variables in App Runner console"
echo -e "2. Set up custom domain (optional)"
echo -e "3. Configure monitoring and alerts"
echo -e "4. Test the application endpoints"
echo -e ""
echo -e "${YELLOW}🔧 Environment variables to configure:${NC}"
echo -e "Backend: AGENTCORE_EXECUTION_ROLE_ARN, AGENTCORE_MEMORY_ID, etc."
echo -e "See AWS_APP_RUNNER_DEPLOYMENT.md for complete list"

