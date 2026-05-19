/**
 * Firestore Rules Testing
 * 
 * Run tests with: npm test -- firestore-rules.test.ts
 * 
 * These tests verify your Firestore security rules work as expected.
 * Must run against Firebase Emulator Suite for accurate results.
 */

import {
  initializeTestEnvironment,
  RulesTestContext,
} from "@firebase/rules-unit-testing";
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ID = "test-project";
const RULES_PATH = path.join(__dirname, "../firestore.rules");

let testEnv: any;
let adminDb: any;
let userDb: any;

describe("Firestore Security Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(RULES_PATH, "utf8"),
        host: "localhost",
        port: 8080,
      },
    });

    adminDb = testEnv.authenticatedContext("admin-user", { uid: "admin-user", email: "admin@test.com" }).firestore();
    userDb = testEnv.authenticatedContext("user-1", { uid: "user-1", email: "user1@test.com" }).firestore();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("Users Collection", () => {
    test("✅ Public can read users", async () => {
      const publicDb = testEnv.unauthenticatedContext().firestore();
      
      // Set up test data (using admin)
      const testUserRef = doc(adminDb, "users", "user-1");
      await setDoc(testUserRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      });

      // Public read should succeed
      const snapshot = await getDoc(doc(publicDb, "users", "user-1"));
      expect(snapshot.exists()).toBe(true);
    });

    test("✅ User can create own profile", async () => {
      const userRef = doc(userDb, "users", "user-1");
      
      await setDoc(userRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      });

      const snapshot = await getDoc(userRef);
      expect(snapshot.exists()).toBe(true);
    });

    test("❌ User cannot create another user profile", async () => {
      const userRef = doc(userDb, "users", "user-999");
      
      await expect(
        setDoc(userRef, {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
        })
      ).rejects.toThrow();
    });

    test("✅ User can update own profile", async () => {
      // Setup: Admin creates user
      const userRef = doc(adminDb, "users", "user-1");
      await setDoc(userRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      });

      // User updates own profile (exclude role)
      const userUpdateRef = doc(userDb, "users", "user-1");
      await setDoc(userUpdateRef, {
        firstName: "John Updated",
        lastName: "Doe Updated",
        email: "john@example.com",
        role: "user",
      }, { merge: true });

      const snapshot = await getDoc(userUpdateRef);
      expect(snapshot.data()?.firstName).toBe("John Updated");
    });

    test("❌ User cannot change own role", async () => {
      // Setup
      const userRef = doc(adminDb, "users", "user-1");
      await setDoc(userRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      });

      // Try to change role
      const userUpdateRef = doc(userDb, "users", "user-1");
      
      await expect(
        setDoc(userUpdateRef, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          role: "admin",
        }, { merge: true })
      ).rejects.toThrow();
    });

    test("✅ Admin can change user role", async () => {
      // Setup: Admin creates user
      const userRef = doc(adminDb, "users", "user-1");
      await setDoc(userRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
      });

      // Admin changes role (requires admin user document first)
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      // Now try to update user role as admin
      await setDoc(userRef, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "moderator",
      }, { merge: true });

      const snapshot = await getDoc(userRef);
      expect(snapshot.data()?.role).toBe("moderator");
    });
  });

  describe("Payments Collection", () => {
    test("✅ Public can read approved payments", async () => {
      const publicDb = testEnv.unauthenticatedContext().firestore();

      // Admin creates approved payment
      const paymentRef = doc(adminDb, "payments", "payment-1");
      await setDoc(paymentRef, {
        userId: "user-1",
        projectId: "project-1",
        amount: 100,
        status: "approved",
        createdAt: new Date(),
      });

      // Public should be able to read approved
      const snapshot = await getDoc(doc(publicDb, "payments", "payment-1"));
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()?.status).toBe("approved");
    });

    test("❌ Public cannot read pending payments", async () => {
      const publicDb = testEnv.unauthenticatedContext().firestore();

      // Admin creates pending payment
      const paymentRef = doc(adminDb, "payments", "payment-1");
      await setDoc(paymentRef, {
        userId: "user-1",
        projectId: "project-1",
        amount: 100,
        status: "pending",
        createdAt: new Date(),
      });

      // Public cannot read pending
      await expect(
        getDoc(doc(publicDb, "payments", "payment-1"))
      ).rejects.toThrow();
    });

    test("✅ User can create own payment", async () => {
      const paymentRef = doc(userDb, "payments", "payment-1");

      await setDoc(paymentRef, {
        userId: "user-1",
        projectId: "project-1",
        amount: 100,
        status: "pending",
        createdAt: new Date(),
      });

      const snapshot = await getDoc(paymentRef);
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()?.status).toBe("pending");
    });

    test("❌ User cannot create payment for another user", async () => {
      const paymentRef = doc(userDb, "payments", "payment-1");

      await expect(
        setDoc(paymentRef, {
          userId: "user-999",
          projectId: "project-1",
          amount: 100,
          status: "pending",
          createdAt: new Date(),
        })
      ).rejects.toThrow();
    });

    test("❌ User cannot approve their own payment", async () => {
      // Setup: Create payment
      const paymentRef = doc(userDb, "payments", "payment-1");
      await setDoc(paymentRef, {
        userId: "user-1",
        projectId: "project-1",
        amount: 100,
        status: "pending",
        createdAt: new Date(),
      });

      // Try to approve as user (should fail)
      await expect(
        setDoc(paymentRef, {
          status: "approved",
        }, { merge: true })
      ).rejects.toThrow();
    });

    test("✅ Admin can approve payments", async () => {
      // Setup: User creates payment
      const paymentRef = doc(userDb, "payments", "payment-1");
      await setDoc(paymentRef, {
        userId: "user-1",
        projectId: "project-1",
        amount: 100,
        status: "pending",
        createdAt: new Date(),
      });

      // Admin setup and approval
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      const adminPaymentRef = doc(adminDb, "payments", "payment-1");
      await setDoc(adminPaymentRef, {
        status: "approved",
      }, { merge: true });

      const snapshot = await getDoc(adminPaymentRef);
      expect(snapshot.data()?.status).toBe("approved");
    });
  });

  describe("Projects Collection", () => {
    test("✅ Public can read projects", async () => {
      const publicDb = testEnv.unauthenticatedContext().firestore();

      // Admin creates project
      const projectRef = doc(adminDb, "projects", "project-1");
      await setDoc(projectRef, {
        title: "Test Project",
        description: "A test project",
        status: "active",
      });

      // Public can read
      const snapshot = await getDoc(doc(publicDb, "projects", "project-1"));
      expect(snapshot.exists()).toBe(true);
    });

    test("❌ User cannot create project directly", async () => {
      const projectRef = doc(userDb, "projects", "project-1");

      await expect(
        setDoc(projectRef, {
          title: "User Project",
          description: "A user project",
          status: "pending",
          submittedBy: "user-1",
        })
      ).rejects.toThrow();
    });

    test("✅ Admin can create projects", async () => {
      // Setup admin user
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      // Admin creates project
      const projectRef = doc(adminDb, "projects", "project-1");
      await setDoc(projectRef, {
        title: "Admin Project",
        description: "An admin project",
        status: "active",
      });

      const snapshot = await getDoc(projectRef);
      expect(snapshot.exists()).toBe(true);
    });
  });

  describe("Notifications Collection", () => {
    test("✅ User can read own notifications", async () => {
      // Setup: Admin creates notification
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      const notifRef = doc(adminDb, "notifications", "notif-1");
      await setDoc(notifRef, {
        userId: "user-1",
        message: "Test notification",
        isRead: false,
      });

      // User can read
      const userNotifRef = doc(userDb, "notifications", "notif-1");
      const snapshot = await getDoc(userNotifRef);
      expect(snapshot.exists()).toBe(true);
    });

    test("❌ User cannot read other user notifications", async () => {
      // Setup
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      const notifRef = doc(adminDb, "notifications", "notif-1");
      await setDoc(notifRef, {
        userId: "user-999",
        message: "Test notification",
        isRead: false,
      });

      // User-1 cannot read user-999's notification
      const userNotifRef = doc(userDb, "notifications", "notif-1");
      await expect(getDoc(userNotifRef)).rejects.toThrow();
    });

    test("✅ User can mark own notification as read", async () => {
      // Setup
      const adminRef = doc(adminDb, "users", "admin-user");
      await setDoc(adminRef, {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin",
      });

      const notifRef = doc(adminDb, "notifications", "notif-1");
      await setDoc(notifRef, {
        userId: "user-1",
        message: "Test notification",
        isRead: false,
      });

      // User marks as read
      const userNotifRef = doc(userDb, "notifications", "notif-1");
      await setDoc(userNotifRef, {
        isRead: true,
        readAt: new Date(),
      }, { merge: true });

      const snapshot = await getDoc(userNotifRef);
      expect(snapshot.data()?.isRead).toBe(true);
    });
  });
});
