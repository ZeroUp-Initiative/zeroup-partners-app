#!/bin/bash

# Firestore Rules Deployment Script
# Usage: ./deploy-rules.sh [dev|staging|prod]

set -e

PROJECT_ENV=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Firestore Rules Deployment Script"
echo "======================================"
echo "Environment: $PROJECT_ENV"
echo "Timestamp: $TIMESTAMP"
echo ""

# Validate environment argument
if [[ ! "$PROJECT_ENV" =~ ^(dev|staging|prod|production)$ ]]; then
    echo "❌ Invalid environment: $PROJECT_ENV"
    echo "Usage: $0 [dev|staging|prod|production]"
    exit 1
fi

# Map prod to production
if [ "$PROJECT_ENV" = "prod" ]; then
    PROJECT_ENV="production"
fi

# Dev environment uses local emulator
if [ "$PROJECT_ENV" = "dev" ]; then
    echo "🔧 Setting up development environment (local emulator)"
    echo ""
    
    # Check if rules file exists
    if [ ! -f "firestore.rules.dev" ]; then
        echo "❌ firestore.rules.dev not found"
        exit 1
    fi
    
    # Copy dev rules
    cp firestore.rules.dev firestore.rules
    echo "✅ Copied firestore.rules.dev to firestore.rules"
    
    # Check if emulator is running
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "⚠️  Firebase Emulator not detected on localhost:8080"
        echo "Start it with: firebase emulator:start"
        exit 1
    fi
    
    echo "✅ Firebase Emulator detected"
    echo "✅ Ready for local development and testing"
    echo ""
    echo "Next steps:"
    echo "  1. Run tests: npm test -- firestore-rules.test.ts"
    echo "  2. Start app: npm run dev"
    exit 0
fi

# Production deployments require confirmation
if [ "$PROJECT_ENV" = "production" ]; then
    echo "⚠️  PRODUCTION DEPLOYMENT"
    echo "This will modify Firestore rules in your PRODUCTION database"
    echo ""
    
    # Use strict production rules
    if [ ! -f "firestore.rules.prod" ]; then
        echo "❌ firestore.rules.prod not found"
        exit 1
    fi
    
    cp firestore.rules.prod firestore.rules
    echo "✅ Copied firestore.rules.prod to firestore.rules"
    
    # Require explicit confirmation
    read -p "Type 'yes' to confirm production deployment: " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
    
    echo "⏭️  Continuing with production deployment..."
fi

# Check if firebase is configured
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

# Check .firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo "❌ .firebaserc not found. Initialize with: firebase init"
    exit 1
fi

# Switch to environment
echo "🔄 Switching to $PROJECT_ENV environment..."
firebase use $PROJECT_ENV

if [ $? -ne 0 ]; then
    echo "❌ Failed to switch to $PROJECT_ENV environment"
    echo "Available projects: $(firebase projects:list)"
    exit 1
fi

# Verify rules syntax
echo "🔍 Validating rules syntax..."
firebase rules:test firestore.rules

if [ $? -ne 0 ]; then
    echo "❌ Rules validation failed"
    exit 1
fi

echo "✅ Rules syntax is valid"

# Backup current rules (staging/prod only)
if [ "$PROJECT_ENV" != "dev" ]; then
    echo "📦 Backing up current rules..."
    mkdir -p ./firestore-backups
    BACKUP_FILE="./firestore-backups/firestore.rules.$PROJECT_ENV.$TIMESTAMP.backup"
    
    # Note: Firestore API doesn't support fetching current rules,
    # so we just backup our source file
    cp firestore.rules "$BACKUP_FILE"
    echo "✅ Backup saved to: $BACKUP_FILE"
fi

# Deploy rules
echo ""
echo "📤 Deploying rules to $PROJECT_ENV..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Next steps:"
    echo "  1. Monitor deployment in Firebase Console"
    echo "  2. Test affected features"
    echo "  3. Monitor Firestore logs for errors"
    echo ""
    
    if [ "$PROJECT_ENV" = "staging" ]; then
        echo "🔄 When ready for production, run:"
        echo "   ./deploy-rules.sh production"
    fi
else
    echo "❌ Deployment failed"
    echo "Check your connection and Firebase project configuration"
    exit 1
fi
