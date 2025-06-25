import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Scheduled Cleanup Function
export const cleanupOldMessages = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 15); // 15 days ago

  functions.logger.info(`Starting cleanup for messages older than: ${cutoffDate.toISOString()}`);

  const usersSnapshot = await db.collection('users').get();
  const cleanupPromises: Promise<any>[] = [];

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    functions.logger.debug(`Processing user: ${userId}`);

    const oldMessagesSnapshot = await db.collection('users').doc(userId).collection('messages')
      .where('timestamp', '<', cutoffDate)
      .limit(500)
      .get();

    if (oldMessagesSnapshot.empty) {
      functions.logger.debug(`No old messages found for user: ${userId}`);
      continue;
    }

    functions.logger.info(`Found ${oldMessagesSnapshot.size} old messages for user: ${userId}`);
    const batch = db.batch();
    oldMessagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    cleanupPromises.push(batch.commit());
  }

  try {
    await Promise.all(cleanupPromises);
    functions.logger.info('Old messages cleanup completed successfully.');
  } catch (error) {
    functions.logger.error('Error during old messages cleanup:', error);
  }
  return null;
});

// Automatically create Firestore user document on new Firebase Auth user
export const createNewUserDocument = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid; // Firebase Authentication provides a unique User ID
  const email = user.email; // User's email from Google
  const displayName = user.displayName; // User's display name from Google

  console.log(`[Auth Trigger] New Firebase Auth user created: ${userId} (${email || 'No Email'})`);

  const userRef = db.collection('users').doc(userId);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  try {
    await userRef.set({
      email: email,
      displayName: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionPlan: 'free', // Default plan
      geminiUsage: {
        currentMonth: currentMonth,
        messagesSent: 0,
        tokensUsed: 0
      },
      limits: {
        maxMessagesPerMonth: 120 // Default free tier limit
      },
      lastInteractionDate: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[Auth Trigger] Firestore document created successfully for user: ${userId}`);
  } catch (error) {
    console.error(`[Auth Trigger] Error creating user document for ${userId}:`, error);
  }
});