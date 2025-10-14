const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// This function triggers when a payment document is updated.
exports.onContributionApproved = onDocumentUpdated("payments/{paymentId}", async (event) => {
    if (!event.data) {
        console.log("No data associated with the event. Exiting function.");
        return;
    }
    // Get the new and old data of the payment
    const afterData = event.data.after.data();
    const beforeData = event.data.before.data();

    // Check if the status was changed from something other than 'approved' to 'approved'.
    // This ensures we only run the logic once when the admin approves the contribution.
    if (beforeData.status !== 'approved' && afterData.status === 'approved') {
      const userId = afterData.userId;
      const amount = afterData.amount;

      // If there's no userId or amount, we can't proceed.
      if (!userId || typeof amount !== 'number') {
        console.log("User ID or amount is missing or invalid.");
        return null;
      }

      try {
        // Get a reference to the user's document in the 'users' collection.
        const userRef = admin.firestore().collection("users").doc(userId);

        // Atomically increment the user's totalContributions.
        // This is a secure way to update the balance and prevents race conditions.
        await userRef.update({
          totalContributions: admin.firestore.FieldValue.increment(amount)
        });

        console.log(`Successfully updated totalContributions for user ${userId} by ${amount}.`);

      } catch (error) {
        console.error(`Error updating totalContributions for user ${userId}:`, error);
      }
    }

    return null; // The function must return null or a promise.
  });
