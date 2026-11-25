import { db } from '@/lib/firebase/client';
import {
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'contribution_approved'
    | 'contribution_rejected'
    | 'new_project'
    | 'badge_earned'
    | 'system'
    | 'school_approved'
    | 'school_rejected'
    | 'case_needs_info'
    | 'case_verified'
    | 'case_rejected'
    | 'case_published'
    | 'case_outcome_published'
    | 'almost_funded';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const notificationsRef = collection(db, 'notifications');
  const docRef = await addDoc(notificationsRef, {
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: serverTimestamp(),
    link: link || null,
    metadata: metadata || null
  });
  return docRef.id;
}

/**
 * Subscribe to user's notifications (real-time)
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(notificationsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const notifications: Notification[] = [];
    snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      notifications.push({
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        read: data.read,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(),
        link: data.link,
        metadata: data.metadata
      });
    });
    callback(notifications);
  });

  return unsubscribe;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(notificationsQuery);
  const batch = writeBatch(db);
  
  snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    batch.update(docSnap.ref, { read: true });
  });
  
  await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

/**
 * Get unread notification count
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const unsubscribe = onSnapshot(notificationsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    callback(snapshot.size);
  });

  return unsubscribe;
}

// Helper functions to create specific notification types
export const NotificationHelpers = {
  contributionApproved: async (userId: string, amount: number, projectName?: string) => {
    const title = 'Contribution Approved! ✅';
    const message = projectName 
      ? `Your contribution of ₦${amount.toLocaleString()} to "${projectName}" has been verified.`
      : `Your contribution of ₦${amount.toLocaleString()} has been verified.`;
    
    // In-app notification only. The confirmation email is sent separately via
    // /api/email (see the admin transactions page). The legacy
    // onContributionApproved Cloud Function is intentionally NOT called — it
    // would send a second, duplicate email and in-app notification.
    return createNotification(userId, 'contribution_approved', title, message, '/contributions');
  },

  contributionRejected: async (userId: string, amount: number, reason?: string) => {
    const title = 'Contribution Not Approved';
    const message = reason 
      ? `Your contribution of ₦${amount.toLocaleString()} was not approved. Reason: ${reason}`
      : `Your contribution of ₦${amount.toLocaleString()} was not approved. Please contact support.`;
    
    // In-app notification only. The rejection email is sent separately via
    // /api/email (see the admin transactions page). The legacy
    // onContributionRejected Cloud Function is intentionally NOT called — it
    // would send a second, duplicate email and in-app notification.
    return createNotification(userId, 'contribution_rejected', title, message, '/contributions');
  },

  newProject: (userId: string, projectTitle: string) => {
    const title = 'New Project Available! 🎉';
    const message = `Check out our new project: "${projectTitle}". Your contribution can make a difference!`;
    return createNotification(userId, 'new_project', title, message, '/projects');
  },

  badgeEarned: (userId: string, badgeName: string) => {
    const title = 'Badge Earned! 🏆';
    const message = `Congratulations! You've earned the "${badgeName}" badge.`;
    return createNotification(userId, 'badge_earned', title, message, '/dashboard');
  },

  systemMessage: (userId: string, title: string, message: string) => {
    return createNotification(userId, 'system', title, message);
  },

  schoolApplicationApproved: (userId: string, schoolName: string) => {
    const title = 'School Application Approved! 🎉';
    const message = `${schoolName} is now a ZeroUp partner school. You can submit Education Cases from your dashboard.`;
    return createNotification(userId, 'school_approved', title, message, '/dashboard/my-cases');
  },

  schoolApplicationRejected: (userId: string, schoolName: string, reason?: string) => {
    const title = 'School Application Not Approved';
    const message = reason
      ? `${schoolName}'s application was not approved. Reason: ${reason}`
      : `${schoolName}'s application was not approved this time.`;
    return createNotification(userId, 'school_rejected', title, message, '/dashboard');
  },

  caseNeedsInfo: (userId: string, caseTitle: string, notes?: string) => {
    const title = 'More Info Needed on Your Case';
    const message = notes
      ? `We need more info on "${caseTitle}": ${notes}`
      : `We need more info on "${caseTitle}" before we can verify it.`;
    return createNotification(userId, 'case_needs_info', title, message, '/dashboard/my-cases');
  },

  caseVerified: (userId: string, caseTitle: string) => {
    const title = 'Case Verified ✅';
    const message = `"${caseTitle}" has been verified and is being prepared for partnership.`;
    return createNotification(userId, 'case_verified', title, message, '/dashboard/my-cases');
  },

  caseRejected: (userId: string, caseTitle: string, reason?: string) => {
    const title = 'Case Not Approved';
    const message = reason
      ? `"${caseTitle}" was not approved. Reason: ${reason}`
      : `"${caseTitle}" was not approved this time.`;
    return createNotification(userId, 'case_rejected', title, message, '/dashboard/my-cases');
  },

  caseConvertedToProject: (userId: string, caseTitle: string) => {
    const title = 'Your Case is Live! 🎉';
    const message = `"${caseTitle}" has been published as a project and is now open for partner funding.`;
    return createNotification(userId, 'case_published', title, message, '/dashboard/my-cases');
  },

  caseOutcomePublished: (userId: string, caseTitle: string) => {
    const title = 'Your Outcome Update is Live ✅';
    const message = `Partners can now see what happened with "${caseTitle}".`;
    return createNotification(userId, 'case_outcome_published', title, message, '/dashboard/my-cases');
  }
  // Note: the "almost funded" nudge is targeted (past contributors to one
  // project only), not a per-user helper call — it's generated server-side
  // in /api/email/notify-project, which already resolves that recipient list.
};
