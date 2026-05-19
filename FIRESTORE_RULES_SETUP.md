# Firestore Rules Setup Guide

## Overview
This guide explains the three versions of Firestore rules and how to deploy them.

### Files
- `firestore.rules` - Current rules (use for production)
- `firestore.rules.dev` - Development/testing rules (permissive for local dev)
- `firestore.rules.prod` - Strict production rules (recommended for production)

---

## Development Setup (Local Testing)

### 1. Use Development Rules Locally
```bash
# Copy dev rules to active rules file
cp firestore.rules.dev firestore.rules
```

### 2. Start Firebase Emulator
```bash
npm install -g firebase-tools
firebase emulator:start --import=./firebase-emulator-state
```

### 3. Configure Firebase to use Emulator in Development
In your Firebase config (or env file), set:
```javascript
const firebaseConfig = {
  // ... your config
  // Development
  firestoreSettings: {
    host: 'localhost:8080',
    ssl: false,
  }
};
```

### 4. Test with Relaxed Rules
The dev rules allow all authenticated users to read/write all collections, perfect for:
- Testing without auth concerns
- Rapid development iteration
- Full CRUD operation testing

---

## Staging Environment

### Deploy Staging Rules to Firebase
```bash
# Switch to staging
firebase use staging

# Copy staging rules (same as dev for now, or create staging-specific rules)
cp firestore.rules.dev firestore.rules

# Deploy
firebase deploy --only firestore:rules --project=staging-project-id
```

---

## Production Deployment

### 1. Use Strict Production Rules
```bash
# Copy production rules
cp firestore.rules.prod firestore.rules
```

### 2. Deploy to Production
```bash
# Switch to production project
firebase use production

# Deploy production rules
firebase deploy --only firestore:rules --project=production-project-id
```

### 3. Verify Deployment
```bash
firebase rules:list --project=production-project-id
```

---

## Key Differences Between Versions

### Development Rules
✅ All authenticated users can read/write all collections
✅ No role restrictions
✅ Faster development and testing
❌ INSECURE for production

### Production Rules
✅ Strict access control
✅ Role-based permissions (admin only for sensitive ops)
✅ Field-level validation
✅ Users can only modify their own data
✅ Approved payments are public (for constellation display)
✅ Private payments require authentication

---

## Testing Rules Locally

### 1. Test with Firebase Emulator

```javascript
// __tests__/firestore.rules.test.ts
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("Firestore Rules", () => {
  beforeAll(async () => {
    await initializeTestEnvironment({
      projectId: "test-project",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: "localhost",
        port: 8080,
      },
    });
  });

  test("Public can read approved payments", async () => {
    const unauth = getFirestore();
    const q = query(collection(unauth, "payments"), where("status", "==", "approved"));
    // Should succeed
  });

  test("User cannot read other users' payments", async () => {
    const auth = getAuth();
    // Test should fail
  });
});
```

### 2. Run Rule Tests
```bash
npm test -- firestore.rules.test.ts
```

---

## Common Rule Patterns

### Pattern 1: Own Data Only
```
allow read, write: if isOwner(userId);
```

### Pattern 2: Admin Only
```
allow read, write: if isAdmin();
```

### Pattern 3: Public Read, Authenticated Write
```
allow read: if true;
allow write: if isAuthenticated();
```

### Pattern 4: Conditional Update (Block Sensitive Fields)
```
allow update: if isOwner(userId) && 
  !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
```

---

## Troubleshooting

### Issue: "Permission denied" errors in development
**Solution**: Make sure you're using `firestore.rules.dev` locally

### Issue: Rules won't deploy
```bash
# Validate rules syntax
firebase rules:test --project=staging-project-id
```

### Issue: Users can't update their profile
**Check**: Ensure the update doesn't modify blocked fields like `role`

### Issue: Admin checks failing
**Check**: Verify user document has `role: 'admin'` field

---

## Best Practices

1. ✅ Always test rules changes in staging before production
2. ✅ Use development rules only on local emulator
3. ✅ Validate data structure (required fields) on write
4. ✅ Use helper functions for reusable logic
5. ✅ Keep sensitive fields restricted (role, email, etc.)
6. ✅ Document all rule changes
7. ✅ Regularly audit rule access patterns

---

## Deployment Checklist

- [ ] Rules validated locally with emulator
- [ ] Rules tested with automated tests
- [ ] Tested in staging environment
- [ ] Security review completed
- [ ] Backup of current production rules
- [ ] Rollback plan ready
- [ ] Team notified of changes
