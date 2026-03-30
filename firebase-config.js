// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const FIREBASE_CONFIG = {
    apiKey: process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY_HERE',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
    appId: process.env.FIREBASE_APP_ID || 'YOUR_APP_ID',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID'
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
//  The rest of FirestoreService functions

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const FirestoreService = {
  async createAppointment(data) {
    const docRef = await db.collection("appointments").add({
      ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: "pending"
    });
    return docRef.id;
  },
  async getUserAppointments(userId) {
    const snapshot = await db.collection("appointments")
      .where("userId", "==", userId).orderBy("datetime", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async updateStatus(id, status) {
    await db.collection("appointments").doc(id).update({
      status, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
};
