# Firestore Rules Deployment Checklist

## Quick Start

### 1. Development (Local Testing)
```bash
# Copy dev rules
cp firestore.rules.dev firestore.rules

# Start emulator
firebase emulator:start

# Run tests
npm test -- firestore-rules.test.ts
```

### 2. Deploy to Staging
```bash
firebase use staging
firebase deploy --only firestore:rules
```

### 3. Deploy to Production
```bash
firebase use production
cp firestore.rules.prod firestore.rules
firebase deploy --only firestore:rules
```

---

## Pre-Deployment Checklist

### Code Review
- [ ] Rules reviewed for security vulnerabilities
- [ ] All helper functions are correct
- [ ] Admin role checks are implemented
- [ ] Owner/user checks are implemented
- [ ] No hardcoded data paths or UIDs

### Testing
- [ ] Rules syntax validated (no compile errors)
- [ ] All rule tests pass locally (`npm test`)
- [ ] Tested against Firebase Emulator Suite
- [ ] Edge cases tested (missing fields, invalid data)
- [ ] Cross-user access tests pass (user cannot read others' data)

### Environment Configuration
- [ ] Firebase projects configured in `.firebaserc`
  ```bash
  # View current config
  firebase projects:list
  ```
- [ ] Correct project selected
  ```bash
  # Check active project
  firebase use
  ```

### Staging Deployment
- [ ] Rules deployed to staging environment
- [ ] Staging tested with real Firebase services (not emulator)
- [ ] No production data affected
- [ ] Team notified of staging deployment
- [ ] Issues tracked and resolved

### Production Preparation
- [ ] Rollback plan documented
- [ ] Backup of current rules saved
  ```bash
  firebase firestore:indexes --project=production > backup-indexes.json
  # Copy current rules
  cp firestore.rules firestore.rules.backup
  ```
- [ ] Communications sent to stakeholders
- [ ] All team members notified of deployment window
- [ ] Monitoring configured for deployment

### Production Deployment
- [ ] Production rules file ready (`firestore.rules`)
- [ ] Rules deployment command verified
  ```bash
  firebase deploy --only firestore:rules --project=production-project-id
  ```
- [ ] Post-deployment verification plan ready
- [ ] Team standing by for issues

### Post-Deployment Verification
- [ ] Rules deployed successfully
  ```bash
  firebase firestore:describe --project=production-project-id
  ```
- [ ] No immediate errors in logs
- [ ] Key operations tested:
  - [ ] User can login/signup
  - [ ] User can read projects
  - [ ] User can create payment
  - [ ] User can update profile
  - [ ] Admin can approve payment
  - [ ] Public can see approved payments
- [ ] Monitoring dashboard active
- [ ] Support team on alert

### Rollback Plan
If critical issues arise:
```bash
# Rollback to previous rules
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules --project=production-project-id

# Verify rollback
firebase firestore:describe --project=production-project-id
```

---

## Common Issues & Solutions

### Issue: "Permission denied" in production
**Check**:
1. Are you testing with correct user ID?
2. Is the user document created?
3. For admins, does user have `role: "admin"` field?
4. Check Firestore logs for denied rules

**Solution**:
```javascript
// Debug: Check if user document exists
const userDoc = await db.collection('users').doc(userId).get();
console.log('User exists:', userDoc.exists);
console.log('User data:', userDoc.data());
```

### Issue: Admin checks failing
**Check**:
1. Admin user document exists
2. Has `role: 'admin'` field
3. Field name is exactly 'role' (case-sensitive)

**Solution**:
```bash
# Verify in Firebase Console
firebase firestore -project=production-project-id
# Navigate to 'users' collection, find admin user, verify 'role' field = 'admin'
```

### Issue: Rules won't validate
**Check**:
```bash
firebase rules:test firestore.rules
```

**Common errors**:
- Syntax errors: Check brackets, colons, semicolons
- Invalid functions: Ensure all functions are properly defined
- Undefined variables: Check variable names match

---

## Monitoring Post-Deployment

### View Firestore Logs
```bash
# Monitor rules denials in real-time
firebase functions:log --only firestore --tail --project=production-project-id
```

### Check for Errors
1. Firebase Console → Firestore → Rules
2. Monitor tab for denied operations
3. Analytics tab for usage patterns

### Alert Rules (Setup in Firebase Console)
- Alert on multiple permission denied errors
- Alert on unusual read/write patterns
- Alert on admin operation failures

---

## Rules Versioning

Keep a git history of rules changes:

```bash
# Tag production rules versions
git tag -a "firestore-rules-v1.0" -m "Production rules deployed"

# View history
git log --all --decorate --oneline
```

---

## Team Communication

### Deployment Notification Template
```
📋 Firestore Rules Deployment

🚀 Environment: [staging/production]
⏰ Time: [date/time]
📝 Changes:
  - [Change 1]
  - [Change 2]

⚠️ Impact:
  - [Affected feature 1]
  - [Affected feature 2]

✅ Testing Status: [Complete/In Progress]
🔔 Rollback Plan: [Ready/Not needed]

Questions? Contact: [slack/email]
```

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Rules Unit Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Rules Examples](https://firebase.google.com/docs/firestore/security/rules-examples)
