const { https } = require("firebase-functions/v1");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { defineString } = require("firebase-functions/params");

// Define parameters for configuration
const resendApiKey = defineString("RESEND_API_KEY", { default: "" });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize Resend for email notifications (lazy initialization)
let resendClient = null;
function getResendClient() {
  if (!resendClient) {
    const apiKey = resendApiKey.value() || process.env.RESEND_API_KEY;
    if (apiKey) {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

// Email templates
const emailTemplates = {
  contributionApproved: (name, amount, projectName) => ({
    subject: "✅ Your Contribution Has Been Approved!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Contribution Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Great news! Your contribution has been verified and approved.</p>
              <div class="amount">₦${amount.toLocaleString()}</div>
              ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
              <p>Thank you for being a valued partner in the ZeroUp Initiative. Your generosity is making a real difference in people's lives!</p>
              <a href="https://zeroup-partners-app.vercel.app/contributions" class="button">View Your Contributions</a>
            </div>
            <div class="footer">
              <p>ZeroUp Initiative - Building Dreams Together</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  contributionRejected: (name, amount, reason) => ({
    subject: "Contribution Update Required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .reason { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Contribution Update Required</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We were unable to verify your contribution of <strong>₦${amount.toLocaleString()}</strong>.</p>
              ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ''}
              <p>Please review your submission and try again, or contact our support team if you believe this is an error.</p>
              <a href="https://zeroup-partners-app.vercel.app/contributions" class="button">Review Your Contribution</a>
            </div>
            <div class="footer">
              <p>ZeroUp Initiative - Building Dreams Together</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  contributionReminder: (name, lastContributionDate, streak) => ({
    subject: "💝 It's Time to Make an Impact!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .streak { background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .streak-number { font-size: 36px; font-weight: bold; color: #f59e0b; }
            .button { display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💝 Time to Contribute!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We miss you! It's been a while since your last contribution${lastContributionDate ? ` on ${lastContributionDate}` : ''}.</p>
              ${streak > 0 ? `
                <div class="streak">
                  <p>Your current streak:</p>
                  <div class="streak-number">🔥 ${streak} months</div>
                  <p>Don't let it break!</p>
                </div>
              ` : ''}
              <p>Every contribution, no matter the size, helps create real change in communities. Your support matters!</p>
              <a href="https://zeroup-partners-app.vercel.app/dashboard" class="button">Make a Contribution</a>
            </div>
            <div class="footer">
              <p>ZeroUp Initiative - Building Dreams Together</p>
              <p><small><a href="https://zeroup-partners-app.vercel.app/dashboard/profile">Manage notification preferences</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  achievementUnlocked: (name, achievementName, achievementDescription) => ({
    subject: `🏆 Achievement Unlocked: ${achievementName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .achievement { background: white; border: 2px solid #fbbf24; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .achievement-icon { font-size: 64px; }
            .achievement-name { font-size: 24px; font-weight: bold; color: #f59e0b; margin: 10px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Achievement Unlocked!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Congratulations! You've earned a new achievement!</p>
              <div class="achievement">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-name">${achievementName}</div>
                <p>${achievementDescription}</p>
              </div>
              <p>Keep up the amazing work! Every contribution brings you closer to new achievements.</p>
              <a href="https://zeroup-partners-app.vercel.app/dashboard" class="button">View Your Dashboard</a>
            </div>
            <div class="footer">
              <p>ZeroUp Initiative - Building Dreams Together</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  welcomeEmail: (name) => ({
    subject: "🎉 Welcome to ZeroUp Partners!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { margin: 20px 0; }
            .feature { display: flex; align-items: center; margin: 10px 0; padding: 10px; background: white; border-radius: 8px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ZeroUp Partners! 🌟</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for joining the ZeroUp Initiative! We're thrilled to have you as part of our community of change-makers.</p>
              <div class="features">
                <div class="feature">📊 <strong>&nbsp;Track your impact</strong> - See exactly how your contributions are making a difference</div>
                <div class="feature">🪙 <strong>&nbsp;Earn Dreamers Coins</strong> - Get rewarded for your generosity</div>
                <div class="feature">🏆 <strong>&nbsp;Unlock achievements</strong> - Celebrate milestones in your giving journey</div>
                <div class="feature">👥 <strong>&nbsp;Join the community</strong> - Connect with fellow partners</div>
              </div>
              <p>Ready to make your first contribution?</p>
              <a href="https://zeroup-partners-app.vercel.app/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>ZeroUp Initiative - Building Dreams Together</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

/**
 * Send email notification
 */
async function sendEmail(to, template) {
  const client = getResendClient();
  if (!client) {
    console.warn("Resend API key not configured, skipping email");
    return null;
  }
  
  try {
    const result = await client.emails.send({
      from: "ZeroUp Partners <onboarding@resend.dev>",
      to: [to],
      subject: template.subject,
      html: template.html,
    });
    console.log(`Email sent to ${to}:`, result);
    return result;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
}

/**
 * Send push notification via FCM
 */
async function sendPushNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: data.url || "/dashboard",
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

/**
 * Cloud Function: Triggered when a user is deleted from Firebase Auth
 * Cleans up all user-related data from Firestore
 */
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  const email = user.email;
  
  console.log(`User deleted: ${uid} (${email}). Cleaning up Firestore data...`);
  
  const batch = db.batch();
  
  try {
    // 1. Delete user document from users collection
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      batch.delete(userDocRef);
      console.log(`Queued deletion of user document: ${uid}`);
    }
    
    // 2. Delete user's notifications
    const notificationsSnapshot = await db.collection("notifications")
      .where("userId", "==", uid)
      .get();
    
    notificationsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`Queued deletion of ${notificationsSnapshot.size} notifications`);
    
    // 3. Delete user's coins/gamification data
    const userCoinsRef = db.collection("userCoins").doc(uid);
    const userCoinsDoc = await userCoinsRef.get();
    if (userCoinsDoc.exists) {
      batch.delete(userCoinsRef);
      console.log(`Queued deletion of userCoins document`);
    }
    
    // 4. Delete user's achievements
    const achievementsSnapshot = await db.collection("userAchievements")
      .where("userId", "==", uid)
      .get();
    
    achievementsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`Queued deletion of ${achievementsSnapshot.size} achievements`);
    
    // 5. Optionally: Mark payments as belonging to deleted user (instead of deleting)
    // This preserves contribution history for reporting
    const paymentsSnapshot = await db.collection("payments")
      .where("userId", "==", uid)
      .get();
    
    paymentsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        userDeleted: true,
        userFullName: doc.data().userFullName + " (Deleted)",
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    console.log(`Marked ${paymentsSnapshot.size} payments as belonging to deleted user`);
    
    // Commit all deletions
    await batch.commit();
    console.log(`Successfully cleaned up data for user: ${uid}`);
    
    return { success: true, uid, email };
  } catch (error) {
    console.error(`Error cleaning up user data for ${uid}:`, error);
    throw error;
  }
});

/**
 * Cloud Function: Called when a contribution is approved
 * Sends notification, email, and push notification to the user
 */
exports.onContributionApproved = https.onCall(async (data, context) => {
  // Verify admin is calling this
  if (!context.auth) {
    throw new https.HttpsError("unauthenticated", "Must be logged in");
  }
  
  const { userId, amount, projectName } = data;
  
  // Get user data for email and push notifications
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  
  // Get notification preferences
  const prefsDoc = await db.collection("notificationPreferences").doc(userId).get();
  const prefs = prefsDoc.exists ? prefsDoc.data() : { emailEnabled: true, pushEnabled: false };
  
  // Create in-app notification
  const notification = {
    userId,
    type: "contribution_approved",
    title: "Contribution Approved! ✅",
    message: projectName 
      ? `Your contribution of ₦${amount.toLocaleString()} to "${projectName}" has been verified.`
      : `Your contribution of ₦${amount.toLocaleString()} has been verified.`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    link: "/contributions"
  };
  
  await db.collection("notifications").add(notification);
  
  // Send email notification if enabled
  if (userData && userData.email && prefs.emailEnabled !== false) {
    const userName = userData.firstName || userData.displayName || "Partner";
    try {
      await sendEmail(
        userData.email,
        emailTemplates.contributionApproved(userName, amount, projectName)
      );
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }
  }
  
  // Send push notification if enabled
  if (userData && userData.fcmTokens && userData.fcmTokens.length > 0 && prefs.pushEnabled) {
    try {
      await sendPushNotification(
        userData.fcmTokens,
        "Contribution Approved! ✅",
        projectName 
          ? `Your ₦${amount.toLocaleString()} to "${projectName}" has been verified.`
          : `Your ₦${amount.toLocaleString()} contribution has been verified.`,
        { url: "/contributions" }
      );
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }
  }
  
  return { success: true };
});

/**
 * Cloud Function: Called when a contribution is rejected
 * Sends notification, email, and push notification to the user
 */
exports.onContributionRejected = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError("unauthenticated", "Must be logged in");
  }
  
  const { userId, amount, reason } = data;
  
  // Get user data
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  
  // Get notification preferences
  const prefsDoc = await db.collection("notificationPreferences").doc(userId).get();
  const prefs = prefsDoc.exists ? prefsDoc.data() : { emailEnabled: true, pushEnabled: false };
  
  // Create in-app notification
  const notification = {
    userId,
    type: "contribution_rejected",
    title: "Contribution Update Required",
    message: reason 
      ? `Your contribution of ₦${amount.toLocaleString()} was not approved. Reason: ${reason}`
      : `Your contribution of ₦${amount.toLocaleString()} was not approved.`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    link: "/contributions"
  };
  
  await db.collection("notifications").add(notification);
  
  // Send email if enabled
  if (userData && userData.email && prefs.emailEnabled !== false) {
    const userName = userData.firstName || userData.displayName || "Partner";
    try {
      await sendEmail(
        userData.email,
        emailTemplates.contributionRejected(userName, amount, reason)
      );
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }
  }
  
  // Send push notification if enabled
  if (userData && userData.fcmTokens && userData.fcmTokens.length > 0 && prefs.pushEnabled) {
    try {
      await sendPushNotification(
        userData.fcmTokens,
        "Contribution Update Required",
        `Your ₦${amount.toLocaleString()} contribution needs attention.`,
        { url: "/contributions" }
      );
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }
  }
  
  return { success: true };
});

/**
 * Cloud Function: Send welcome email when a new user signs up
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  
  console.log(`New user created: ${uid} (${email})`);
  
  // Wait a bit for the user document to be created
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get user document for name
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const userName = userData.firstName || displayName || "Partner";
  
  // Send welcome email
  if (email) {
    try {
      await sendEmail(email, emailTemplates.welcomeEmail(userName));
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  }
  
  // Create default notification preferences
  await db.collection("notificationPreferences").doc(uid).set({
    emailEnabled: true,
    pushEnabled: false,
    contributionReminders: true,
    reminderFrequency: "monthly",
    achievementNotifications: true,
    projectUpdates: true,
    communityUpdates: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true };
});

/**
 * Scheduled Cloud Function: Send contribution reminders
 * Runs every day at 9 AM UTC
 */
exports.sendContributionReminders = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("Africa/Lagos")
  .onRun(async (context) => {
    console.log("Running contribution reminder job...");
    
    const now = new Date();
    const today = now.getDate();
    const dayOfWeek = now.getDay();
    
    // Get all users with reminder preferences
    const prefsSnapshot = await db.collection("notificationPreferences")
      .where("contributionReminders", "==", true)
      .get();
    
    let remindersSent = 0;
    
    for (const prefDoc of prefsSnapshot.docs) {
      const userId = prefDoc.id;
      const prefs = prefDoc.data();
      const frequency = prefs.reminderFrequency || "monthly";
      
      // Determine if we should send reminder based on frequency
      let shouldSend = false;
      
      if (frequency === "weekly" && dayOfWeek === 1) {
        // Weekly: Send every Monday
        shouldSend = true;
      } else if (frequency === "biweekly" && dayOfWeek === 1 && (Math.floor(today / 7) % 2 === 0)) {
        // Biweekly: Send every other Monday
        shouldSend = true;
      } else if (frequency === "monthly" && today === 1) {
        // Monthly: Send on 1st of each month
        shouldSend = true;
      }
      
      if (!shouldSend) continue;
      
      try {
        // Get user data
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) continue;
        
        const userData = userDoc.data();
        const userName = userData.firstName || userData.displayName || "Partner";
        const email = userData.email;
        
        // Get last contribution date
        const lastPayment = await db.collection("payments")
          .where("userId", "==", userId)
          .where("status", "==", "approved")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();
        
        let lastContributionDate = null;
        let streak = 0;
        
        if (!lastPayment.empty) {
          const lastPaymentData = lastPayment.docs[0].data();
          if (lastPaymentData.createdAt) {
            const lastDate = lastPaymentData.createdAt.toDate();
            lastContributionDate = lastDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            });
          }
        }
        
        // Get streak from gamification data
        const coinsDoc = await db.collection("userCoins").doc(userId).get();
        if (coinsDoc.exists) {
          streak = coinsDoc.data().currentStreak || 0;
        }
        
        // Send email reminder if enabled
        if (email && prefs.emailEnabled !== false) {
          await sendEmail(
            email,
            emailTemplates.contributionReminder(userName, lastContributionDate, streak)
          );
          remindersSent++;
          console.log(`Reminder sent to ${email}`);
        }
        
        // Send push notification if enabled
        if (userData.fcmTokens && userData.fcmTokens.length > 0 && prefs.pushEnabled) {
          await sendPushNotification(
            userData.fcmTokens,
            "💝 Time to Make an Impact!",
            streak > 0 
              ? `Don't break your ${streak}-month streak! Make a contribution today.`
              : "Your contribution can change lives. Make an impact today!",
            { url: "/dashboard" }
          );
        }
        
        // Create in-app notification
        await db.collection("notifications").add({
          userId,
          type: "contribution_reminder",
          title: "💝 Time to Contribute!",
          message: streak > 0 
            ? `Don't break your ${streak}-month streak! Make a contribution today.`
            : "It's time to make an impact! Your contribution can change lives.",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          link: "/dashboard"
        });
        
      } catch (error) {
        console.error(`Error sending reminder to user ${userId}:`, error);
      }
    }
    
    console.log(`Contribution reminder job complete. ${remindersSent} emails sent.`);
    return null;
  });

/**
 * Cloud Function: Send achievement notification
 */
exports.sendAchievementNotification = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError("unauthenticated", "Must be logged in");
  }
  
  const { userId, achievementName, achievementDescription } = data;
  
  // Get user data
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  
  // Get notification preferences
  const prefsDoc = await db.collection("notificationPreferences").doc(userId).get();
  const prefs = prefsDoc.exists ? prefsDoc.data() : { emailEnabled: true, achievementNotifications: true };
  
  if (prefs.achievementNotifications === false) {
    return { success: true, skipped: true };
  }
  
  // Create in-app notification
  await db.collection("notifications").add({
    userId,
    type: "achievement_unlocked",
    title: `🏆 Achievement Unlocked: ${achievementName}!`,
    message: achievementDescription,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    link: "/dashboard"
  });
  
  // Send email if enabled
  if (userData && userData.email && prefs.emailEnabled !== false) {
    const userName = userData.firstName || userData.displayName || "Partner";
    try {
      await sendEmail(
        userData.email,
        emailTemplates.achievementUnlocked(userName, achievementName, achievementDescription)
      );
    } catch (emailError) {
      console.error("Failed to send achievement email:", emailError);
    }
  }
  
  // Send push notification
  if (userData && userData.fcmTokens && userData.fcmTokens.length > 0 && prefs.pushEnabled) {
    try {
      await sendPushNotification(
        userData.fcmTokens,
        `🏆 Achievement Unlocked!`,
        `You earned: ${achievementName}`,
        { url: "/dashboard" }
      );
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }
  }
  
  return { success: true };
});

/**
 * HTTP Function: Test email sending (for admin use)
 */
exports.testEmail = https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }
  
  const { email, type } = req.body;
  
  if (!email) {
    res.status(400).send("Email is required");
    return;
  }
  
  try {
    let template;
    switch (type) {
      case "welcome":
        template = emailTemplates.welcomeEmail("Test User");
        break;
      case "approved":
        template = emailTemplates.contributionApproved("Test User", 10000, "Test Project");
        break;
      case "rejected":
        template = emailTemplates.contributionRejected("Test User", 5000, "Invalid receipt");
        break;
      case "reminder":
        template = emailTemplates.contributionReminder("Test User", "December 15, 2025", 3);
        break;
      case "achievement":
        template = emailTemplates.achievementUnlocked("Test User", "First Contribution", "Made your first contribution!");
        break;
      default:
        template = emailTemplates.welcomeEmail("Test User");
    }
    
    await sendEmail(email, template);
    res.status(200).json({ success: true, message: `Test email sent to ${email}` });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Function: Check FCM tokens for a user (for debugging)
 */
exports.checkFCMTokens = https.onRequest(async (req, res) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  const { userId, email } = req.query;
  
  try {
    let userDoc;
    
    if (userId) {
      userDoc = await db.collection("users").doc(userId).get();
    } else if (email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
      }
    } else {
      res.status(400).json({ error: "Please provide userId or email query parameter" });
      return;
    }
    
    if (!userDoc || !userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || [];
    const pushEnabled = userData.pushNotificationsEnabled || false;
    
    res.status(200).json({
      success: true,
      userId: userDoc.id,
      email: userData.email,
      pushNotificationsEnabled: pushEnabled,
      fcmTokensCount: fcmTokens.length,
      hasFCMTokens: fcmTokens.length > 0,
      fcmTokenPreview: fcmTokens.length > 0 ? fcmTokens[0].substring(0, 30) + "..." : null
    });
  } catch (error) {
    console.error("Check FCM tokens error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Function: Send test push notification
 */
exports.testPushNotification = https.onRequest(async (req, res) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  const { userId, email } = req.method === 'POST' ? req.body : req.query;
  
  try {
    let userDoc;
    
    if (userId) {
      userDoc = await db.collection("users").doc(userId).get();
    } else if (email) {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
      }
    } else {
      res.status(400).json({ error: "Please provide userId or email" });
      return;
    }
    
    if (!userDoc || !userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || [];
    
    if (fcmTokens.length === 0) {
      res.status(400).json({ 
        error: "No FCM tokens found for user",
        hint: "User needs to enable push notifications in the app first"
      });
      return;
    }
    
    // Send test push notification
    const response = await sendPushNotification(
      fcmTokens,
      "🔔 Test Notification",
      "Push notifications are working! This is a test from ZeroUp Partners.",
      { url: "/dashboard" }
    );
    
    res.status(200).json({
      success: true,
      message: `Test push notification sent to ${userData.email}`,
      successCount: response?.successCount || 0,
      failureCount: response?.failureCount || 0
    });
  } catch (error) {
    console.error("Test push notification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

