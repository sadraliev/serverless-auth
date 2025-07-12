#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
PROJECT_NAME="auth-serverless"
LAYER_NAME="${PROJECT_NAME}-dependencies"

echo -e "${GREEN}🚀 Starting deployment for ${PROJECT_NAME}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${YELLOW}📋 AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Step 1: Deploy infrastructure with Terraform
echo -e "${YELLOW}🏗️  Deploying infrastructure with Terraform...${NC}"
cd infra/terraform

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    terraform init
fi

# Plan and apply
terraform plan -out=tfplan
terraform apply tfplan

# Get outputs
LAMBDA_ROLE_ARN=$(terraform output -raw lambda_execution_role_arn)
DYNAMODB_TABLE_NAME=$(terraform output -raw dynamodb_table_name)

cd ../..

# Step 2: Build the project
echo -e "${YELLOW}🔨 Building TypeScript handlers...${NC}"
npm run build

# Step 3: Create Lambda layer
echo -e "${YELLOW}📦 Creating Lambda layer...${NC}"
mkdir -p layer/nodejs
cp package.json layer/nodejs/
cd layer/nodejs
npm ci --production
cd ../..
zip -r lambda-layer.zip layer/

# Step 4: Publish Lambda layer
echo -e "${YELLOW}📤 Publishing Lambda layer...${NC}"
LAYER_VERSION=$(aws lambda publish-layer-version \
    --layer-name $LAYER_NAME \
    --description "Dependencies for ${PROJECT_NAME} functions" \
    --zip-file fileb://lambda-layer.zip \
    --compatible-runtimes nodejs20.x \
    --query 'Version' \
    --output text)

LAYER_ARN="arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:layer:${LAYER_NAME}:${LAYER_VERSION}"
echo -e "${GREEN}✅ Layer published: ${LAYER_ARN}${NC}"

# Step 5: Deploy Lambda functions
echo -e "${YELLOW}🚀 Deploying Lambda functions...${NC}"
for handler_dir in dist/*/; do
    if [ -d "$handler_dir" ]; then
        handler_name=$(basename "$handler_dir")
        function_name="auth-${handler_name}"
        
        echo -e "${YELLOW}📦 Packaging ${function_name}...${NC}"
        zip -j "${handler_name}.zip" "${handler_dir}index.js"
        
        # Check if function exists
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            echo -e "${YELLOW}🔄 Updating existing function: ${function_name}${NC}"
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file fileb://"${handler_name}.zip"
        else
            echo -e "${YELLOW}🆕 Creating new function: ${function_name}${NC}"
            aws lambda create-function \
                --function-name "$function_name" \
                --runtime nodejs20.x \
                --role "$LAMBDA_ROLE_ARN" \
                --handler index.handler \
                --zip-file fileb://"${handler_name}.zip" \
                --layers "$LAYER_ARN" \
                --timeout 30 \
                --memory-size 256 \
                --environment Variables="{DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE_NAME}"
        fi
        
        echo -e "${GREEN}✅ Function ${function_name} deployed successfully${NC}"
    fi
done

# Step 6: Cleanup
echo -e "${YELLOW}🧹 Cleaning up build artifacts...${NC}"
rm -rf dist/
rm -rf layer/
rm -f *.zip

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 DynamoDB Table: ${DYNAMODB_TABLE_NAME}${NC}"
echo -e "${GREEN}🔗 Lambda Layer: ${LAYER_ARN}${NC}" 