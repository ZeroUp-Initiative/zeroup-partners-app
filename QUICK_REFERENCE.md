# Firestore Rules - Quick Reference

## 📋 What You Got

Your project now has:
- ✅ **firestore.rules** - Main rules (currently production-ready)
- ✅ **firestore.rules.dev** - Development rules (permissive for testing)
- ✅ **firestore.rules.prod** - Production rules (strict & secure)
- ✅ **deploy-rules.sh** - Deployment script (Mac/Linux)
- ✅ **deploy-rules.bat** - Deployment script (Windows)
- ✅ **firestore-rules.test.ts** - Comprehensive test suite
- ✅ **FIRESTORE_RULES_SETUP.md** - Full setup guide
- ✅ **DEPLOYMENT_CHECKLIST.md** - Deployment checklist

---

## 🚀 Quick Start (Choose One)

### Option 1: Using Deployment Script (Recommended)

**Windows:**
```powershell
.\deploy-rules.bat dev         # Local development
.\deploy-rules.bat staging     # Staging environment
.\deploy-rules.bat production  # Production environment
```

**Mac/Linux:**
```bash
chmod +x deploy-rules.sh
./deploy-rules.sh dev         # Local development
./deploy-rules.sh staging     # Staging environment
./deploy-rules.sh production  # Production environment
```

### Option 2: Manual Deployment

**For Local Development:**
```bash
# Use dev rules
cp firestore.rules.dev firestore.rules

# Start emulator
firebase emulator:start

# Run tests
npm test -- firestore-rules.test.ts
```

**For Staging:**
```bash
firebase use staging
firebase deploy --only firestore:rules
```

**For Production:**
```bash
cp firestore.rules.prod firestore.rules
firebase use production
firebase deploy --only firestore:rules
```

---

## 📚 Rules Overview

### Public Access (No Auth Required)
```javascript
// Anyone can read:
- ✅ Basic user profiles (firstName, lastName, photoURL)
- ✅ Approved payments (for constellation display)
- ✅ Public projects
```

### User Access (Authenticated Users)
```javascript
// Users can:
- ✅ Read their own payments
- ✅ Create payments (pending status only)
- ✅ Update their own profile (except role)
- ✅ Read/write their own notifications
- ✅ Read their own notification preferences
- ❌ Cannot read other users' data
- ❌ Cannot change their role
```

### Admin Access
```javascript
// Admins can:
- ✅ Create/update/delete projects
- ✅ Approve/reject payments
- ✅ Change user roles
- ✅ Create announcements/notifications
- ✅ Delete any data
- ✅ Read all data
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test -- firestore-rules.test.ts
```

### Run Specific Test Suite
```bash
# Test users collection
npm test -- firestore-rules.test.ts -t "Users Collection"

# Test payments
npm test -- firestore-rules.test.ts -t "Payments Collection"

# Test admin access
npm test -- firestore-rules.test.ts -t "Admin"
```

### Expected Test Results
```
✅ Users Collection        (6 tests)
✅ Payments Collection     (6 tests)
✅ Projects Collection     (3 tests)
✅ Notifications Collection (4 tests)
───────────────────────────────────────
✅ Total: 19 tests passed
```

---

## 🔍 Common Scenarios

### Scenario 1: User Trying to View Another User's Payment
```javascript
// ❌ Denied
const payment = doc(db, 'payments', paymentId);
const snapshot = await getDoc(payment); // If userId !== request.auth.uid
// Error: "Permission denied"
```

### Scenario 2: User Approving Their Own Payment
```javascript
// ❌ Denied
await updateDoc(paymentRef, { status: 'approved' });
// Error: "Permission denied" (only admins can update)
```

### Scenario 3: Admin Approving Payment
```javascript
// ✅ Allowed
const adminDb = getFirestore(); // If user has role: 'admin'
await updateDoc(paymentRef, { status: 'approved' });
// Success
```

### Scenario 4: User Changing Their Role
```javascript
// ❌ Denied
await updateDoc(userRef, { role: 'admin' });
// Error: "Permission denied" (role field is protected)
```

---

## 🐛 Troubleshooting

### Problem: "Permission denied" in development
```bash
# Check: Are you using dev rules?
cat firestore.rules | head -5
# Should show: "// DEVELOPMENT RULES - More permissive for testing"

# If using prod rules, switch to dev:
cp firestore.rules.dev firestore.rules

# Restart emulator:
firebase emulator:stop
firebase emulator:start
```

### Problem: Admin operations failing
```javascript
// Debug: Check if user is admin
const userDoc = await db.collection('users').doc(userId).get();
console.log('User role:', userDoc.data()?.role); // Should be 'admin'
```

### Problem: Tests failing
```bash
# 1. Make sure emulator is running
firebase emulator:start

# 2. Run tests with verbose output
npm test -- firestore-rules.test.ts --verbose

# 3. Check Firestore emulator logs:
# Look at terminal running "firebase emulator:start"
```

---

## 📊 Deployment Workflow

```
DEV (Local Testing)
    ↓
STAGING (Team Testing)
    ↓
PRODUCTION (Live)
    ↓
MONITORING (Watch & Alert)
```

### Step-by-Step:

1. **Develop Locally**
   ```bash
   ./deploy-rules.bat dev
   npm test
   ```

2. **Push to Staging**
   ```bash
   git commit -m "Update firestore rules"
   git push
   ./deploy-rules.bat staging
   ```

3. **Test in Staging**
   - Test all user flows
   - Check admin operations
   - Verify payments workflow

4. **Deploy to Production**
   ```bash
   ./deploy-rules.bat production
   ```

5. **Monitor**
   - Check Firebase Firestore logs
   - Watch for denied operations
   - Monitor error rates

---

## 🔐 Security Rules Key Points

### Never Expose Sensitive Data
```javascript
// ❌ Bad - exposes all user data
allow read: if true;
get(userPath).data // Returns everything

// ✅ Good - frontend filters display
allow read: if true;
get(userPath).data.firstName; // Only display name
```

### Validate on Write
```javascript
// ✅ Good - validates payment structure
allow create: if request.resource.data.keys()
  .hasAll(['userId', 'projectId', 'amount', 'status']);
```

### Protect Sensitive Fields
```javascript
// ✅ Good - users can't change their role
allow update: if !request.resource.data
  .diff(resource.data).affectedKeys()
  .hasAny(['role']);
```

---

## 📞 Need Help?

1. **Check logs**: `firebase emulator:start` (see errors in terminal)
2. **Read setup guide**: `FIRESTORE_RULES_SETUP.md`
3. **Check deployment checklist**: `DEPLOYMENT_CHECKLIST.md`
4. **Review test cases**: `__tests__/firestore-rules.test.ts`

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `firestore.rules` | Current active rules |
| `firestore.rules.dev` | Permissive development rules |
| `firestore.rules.prod` | Strict production rules |
| `firestore-rules.test.ts` | Unit tests for rules |
| `FIRESTORE_RULES_SETUP.md` | Detailed setup guide |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checks |
| `deploy-rules.sh` | Mac/Linux deployment script |
| `deploy-rules.bat` | Windows deployment script |
| `QUICK_REFERENCE.md` | This file |

---

## ✅ Next Steps

1. ✅ Review current rules (you're good!)
2. ✅ Run tests locally
   ```bash
   npm test -- firestore-rules.test.ts
   ```
3. ✅ Deploy to staging when ready
   ```bash
   ./deploy-rules.bat staging
   ```
4. ✅ Test with your team
5. ✅ Deploy to production when confident
   ```bash
   ./deploy-rules.bat production
   ```

**Happy deploying! 🎉**
