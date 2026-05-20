@echo off
REM Firestore Rules Deployment Script for Windows
REM Usage: deploy-rules.bat [dev|staging|prod]

setlocal enabledelayedexpansion

set PROJECT_ENV=%1
if "%PROJECT_ENV%"=="" set PROJECT_ENV=staging

echo.
echo 🚀 Firestore Rules Deployment Script
echo ======================================
echo Environment: %PROJECT_ENV%
echo.

REM Validate environment
if /i not "%PROJECT_ENV%"=="dev" if /i not "%PROJECT_ENV%"=="staging" if /i not "%PROJECT_ENV%"=="prod" if /i not "%PROJECT_ENV%"=="production" (
    echo ❌ Invalid environment: %PROJECT_ENV%
    echo Usage: %0 [dev|staging|prod^|production]
    exit /b 1
)

REM Map prod to production
if /i "%PROJECT_ENV%"=="prod" set PROJECT_ENV=production

REM Dev environment
if /i "%PROJECT_ENV%"=="dev" (
    echo 🔧 Setting up development environment
    echo.
    
    if not exist "firestore.rules.dev" (
        echo ❌ firestore.rules.dev not found
        exit /b 1
    )
    
    copy firestore.rules.dev firestore.rules > nul
    echo ✅ Copied firestore.rules.dev to firestore.rules
    echo ✅ Ready for local development
    echo.
    echo Next steps:
    echo   1. Run emulator: firebase emulator:start
    echo   2. Run tests: npm test -- firestore-rules.test.ts
    echo   3. Start app: npm run dev
    exit /b 0
)

REM Production warning
if /i "%PROJECT_ENV%"=="production" (
    echo ⚠️  PRODUCTION DEPLOYMENT
    echo This will modify Firestore rules in PRODUCTION
    echo.
    
    if not exist "firestore.rules.prod" (
        echo ❌ firestore.rules.prod not found
        exit /b 1
    )
    
    copy firestore.rules.prod firestore.rules > nul
    echo ✅ Copied firestore.rules.prod to firestore.rules
    echo.
    
    set /p confirm="Type 'yes' to confirm: "
    if /i not "!confirm!"=="yes" (
        echo ❌ Deployment cancelled
        exit /b 1
    )
    
    echo ⏭️  Continuing with production deployment...
)

REM Check Firebase CLI
where firebase > nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found
    echo Install with: npm install -g firebase-tools
    exit /b 1
)

REM Check .firebaserc
if not exist ".firebaserc" (
    echo ❌ .firebaserc not found. Run: firebase init
    exit /b 1
)

REM Switch environment
echo.
echo 🔄 Switching to %PROJECT_ENV% environment...
call firebase use %PROJECT_ENV%

if errorlevel 1 (
    echo ❌ Failed to switch environment
    exit /b 1
)

REM Validate syntax
echo 🔍 Validating rules syntax...
call firebase rules:test firestore.rules

if errorlevel 1 (
    echo ❌ Rules validation failed
    exit /b 1
)

echo ✅ Rules syntax valid

REM Backup
if /i not "%PROJECT_ENV%"=="dev" (
    echo 📦 Creating backup...
    if not exist "firestore-backups" mkdir firestore-backups
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    set BACKUP_FILE=firestore-backups\firestore.rules.%PROJECT_ENV%.!mydate!_!mytime!.backup
    copy firestore.rules "!BACKUP_FILE!" > nul
    echo ✅ Backup: !BACKUP_FILE!
)

REM Deploy
echo.
echo 📤 Deploying to %PROJECT_ENV%...
call firebase deploy --only firestore:rules

if errorlevel 1 (
    echo ❌ Deployment failed
    exit /b 1
)

echo.
echo ✅ Deployment successful!
echo.
echo 📊 Next steps:
echo   1. Check Firebase Console for deployment status
echo   2. Test affected features
echo   3. Monitor Firestore logs for errors
echo.

if /i "%PROJECT_ENV%"=="staging" (
    echo 🔄 When ready for production:
    echo    deploy-rules.bat production
)

exit /b 0
