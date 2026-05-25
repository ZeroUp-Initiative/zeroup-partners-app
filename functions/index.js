const { https } = require("firebase-functions/v1");
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { sendEmail: sendEmailWithNodemailer } = require("./mailer");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

  projectSubmitted: (name, title) => ({
    subject: `📋 Project Received: "${title}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #f5ecff; border-left: 4px solid #8d44d1; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>📋 Submission Received!</h1></div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We've received your project submission and it's now pending review by our team.</p>
              <div class="highlight"><strong>${title}</strong></div>
              <p>Our team will review your submission within <strong>3–5 business days</strong>. You'll receive an email as soon as a decision is made.</p>
              <a href="https://zeroup-partners-app.vercel.app/projects" class="button">View Live Projects</a>
            </div>
            <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
          </div>
        </body>
      </html>
    `,
  }),

  projectApproved: (name, title, notes) => ({
    subject: `🎉 Your Project Has Been Approved — "${title}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #f5ecff; border-left: 4px solid #8d44d1; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎉 Project Approved!</h1></div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Your project has been reviewed and <strong>approved</strong>. It's now publicly visible and open for contributions.</p>
              <div class="highlight"><strong>${title}</strong></div>
              ${notes ? `<div class="highlight"><strong>Note from our team:</strong><br>${notes}</div>` : ''}
              <p>Partners can now discover and contribute to your project. Share the link to spread the word!</p>
              <a href="https://zeroup-partners-app.vercel.app/projects" class="button">View Your Project</a>
            </div>
            <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
          </div>
        </body>
      </html>
    `,
  }),

  projectRejected: (name, title, notes) => ({
    subject: `Update on Your Project Submission — "${title}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #64748b, #475569); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #f1f5f9; border-left: 4px solid #64748b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Project Submission Update</h1></div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for submitting your project. After careful review, we were unable to approve it at this time.</p>
              <div class="highlight"><strong>${title}</strong></div>
              ${notes ? `<div class="highlight"><strong>Feedback from our team:</strong><br>${notes}</div>` : "<p>If you'd like more information, please reach out to our team directly.</p>"}
              <p>You're welcome to address any concerns and resubmit your project in the future.</p>
              <a href="https://zeroup-partners-app.vercel.app/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
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
function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendEmail(to, template) {
  if (!to) {
    console.warn("Email destination missing, skipping email");
    return null;
  }

  try {
    const result = await sendEmailWithNodemailer({
      from: "ZeroUp Partners <onboarding@zeroup.dev>",
      to,
      subject: template.subject,
      html: template.html,
      text: htmlToText(template.html),
    });
    console.log(`Email sent to ${to}:`, result.messageId || result);
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

/**
 * Scheduled Cloud Function: Send project deadline reminder emails
 * Runs daily at 9 AM Lagos time.
 * Notifies contributors and project owners whose projects have a deadline
 * within the next 14 days — only for users with emailEnabled.
 */
exports.sendProjectDeadlineReminders = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("Africa/Lagos")
  .onRun(async (_context) => {
    console.log("Running project deadline reminder job...");

    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Fetch open/approved projects with a dueDate within the next 14 days
    const projectsSnap = await db
      .collection("projects")
      .where("status", "in", ["open", "approved"])
      .get();

    const approachingProjects = [];
    projectsSnap.forEach((doc) => {
      const data = doc.data();
      if (!data.dueDate) return;
      let dueDate;
      if (typeof data.dueDate.toDate === "function") {
        dueDate = data.dueDate.toDate();
      } else {
        dueDate = new Date(data.dueDate);
      }
      if (isNaN(dueDate.getTime())) return;
      if (dueDate > now && dueDate <= in14Days) {
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        approachingProjects.push({
          id: doc.id,
          title: data.title || "Untitled Project",
          dueDate,
          daysLeft,
          submittedBy: data.submittedBy || null,
          submittedByEmail: data.submittedByEmail || null,
          submittedByName: data.submittedByName || null,
          currentFunding: data.currentFunding || 0,
          fundingGoal: data.fundingGoal || 0,
        });
      }
    });

    if (approachingProjects.length === 0) {
      console.log("No approaching project deadlines found.");
      return null;
    }

    console.log(`Found ${approachingProjects.length} approaching project(s).`);

    // Collect unique user IDs that need to be notified:
    // project owners + contributors (approved payments) for each project
    const projectIds = approachingProjects.map((p) => p.id);
    const notifyUsers = new Map(); // userId -> { email, name, projects: [] }

    // Add project owners
    for (const project of approachingProjects) {
      if (project.submittedBy && project.submittedByEmail) {
        if (!notifyUsers.has(project.submittedBy)) {
          notifyUsers.set(project.submittedBy, {
            email: project.submittedByEmail,
            name: project.submittedByName || "Partner",
            projects: [],
          });
        }
        notifyUsers.get(project.submittedBy).projects.push(project);
      }
    }

    // Add contributors — query payments in batches of 10 (Firestore 'in' limit)
    for (let i = 0; i < projectIds.length; i += 10) {
      const batch = projectIds.slice(i, i + 10);
      const paymentsSnap = await db
        .collection("payments")
        .where("projectId", "in", batch)
        .where("status", "==", "approved")
        .get();

      for (const payDoc of paymentsSnap.docs) {
        const pay = payDoc.data();
        if (!pay.userId || !pay.userEmail) continue;
        const project = approachingProjects.find((p) => p.id === pay.projectId);
        if (!project) continue;
        if (!notifyUsers.has(pay.userId)) {
          notifyUsers.set(pay.userId, {
            email: pay.userEmail,
            name: pay.userFullName || "Partner",
            projects: [],
          });
        }
        const existing = notifyUsers.get(pay.userId);
        if (!existing.projects.find((p) => p.id === project.id)) {
          existing.projects.push(project);
        }
      }
    }

    let emailsSent = 0;

    for (const [userId, info] of notifyUsers.entries()) {
      // Check email preferences
      const prefsDoc = await db.collection("notificationPreferences").doc(userId).get();
      const prefs = prefsDoc.exists ? prefsDoc.data() : { emailEnabled: true };
      if (prefs.emailEnabled === false) continue;

      for (const project of info.projects) {
        const dueDateStr = project.dueDate.toLocaleDateString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const fundedPct = project.fundingGoal > 0
          ? Math.round((project.currentFunding / project.fundingGoal) * 100)
          : 0;
        const urgencyLabel = project.daysLeft <= 3 ? "⚠️ URGENT" : "⏰ Reminder";

        const subject = `${urgencyLabel}: "${project.title}" closes in ${project.daysLeft} day${project.daysLeft === 1 ? "" : "s"}`;
        const html = `
          <!DOCTYPE html><html>
          <head><style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f5; }
            .wrapper { padding: 32px 16px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 36px 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 8px 0 0; opacity: 0.9; font-size: 15px; }
            .body { padding: 32px; }
            .body p { margin: 0 0 16px; color: #444; }
            .highlight { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin: 20px 0; }
            .highlight strong { color: #92400e; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge { display: inline-block; background: ${project.daysLeft <= 3 ? "#fee2e2" : "#fef3c7"}; color: ${project.daysLeft <= 3 ? "#b91c1c" : "#92400e"}; font-weight: 700; font-size: 20px; padding: 12px 24px; border-radius: 8px; margin: 8px 0 16px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
            .footer { text-align: center; padding: 24px 32px; color: #888; font-size: 13px; border-top: 1px solid #f0f0f0; }
          </style></head>
          <body><div class="wrapper"><div class="container">
            <div class="header">
              <h1>${project.daysLeft <= 3 ? "⚠️ Urgent Deadline Alert" : "⏰ Project Deadline Approaching"}</h1>
              <p>A project you're involved with is closing soon</p>
            </div>
            <div class="body">
              <p>Hi ${info.name},</p>
              <p>This is a reminder that the following project is closing soon:</p>
              <div class="highlight">
                <strong>Project</strong>
                ${project.title}
              </div>
              <div class="highlight">
                <strong>Deadline</strong>
                ${dueDateStr}
              </div>
              <div class="badge">${project.daysLeft} day${project.daysLeft === 1 ? "" : "s"} remaining</div>
              ${project.fundingGoal > 0 ? `<div class="highlight"><strong>Funding Progress</strong>${fundedPct}% funded (₦${project.currentFunding.toLocaleString()} of ₦${project.fundingGoal.toLocaleString()})</div>` : ""}
              <p>Make sure to check on this project before the deadline passes!</p>
              <a href="https://zeroup-partners-app.vercel.app/projects" class="btn">View Project</a>
            </div>
            <div class="footer">
              <p>ZeroUp Partners · Building Dreams Together</p>
              <p><small><a href="https://zeroup-partners-app.vercel.app/dashboard/profile">Manage notification preferences</a></small></p>
            </div>
          </div></div></body></html>
        `;

        try {
          await sendEmailWithNodemailer({
            from: "ZeroUp Partners <onboarding@zeroup.dev>",
            to: info.email,
            subject,
            html,
          });
          emailsSent++;

          // Create in-app notification
          await db.collection("notifications").add({
            userId,
            type: "project_deadline_approaching",
            title: `⏰ "${project.title}" closes in ${project.daysLeft} day${project.daysLeft === 1 ? "" : "s"}`,
            message: `The project "${project.title}" has a deadline on ${dueDateStr}. Don't miss it!`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            link: "/projects",
          });
        } catch (err) {
          console.error(`Failed to send deadline reminder to ${info.email}:`, err);
        }
      }
    }

    console.log(`Project deadline reminder job complete. ${emailsSent} emails sent.`);
    return null;
  });

