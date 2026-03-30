// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALbQTwXNpS3LLfQUEV16pLTkATr_zEDYI",
  authDomain: "healthcare-assistant-5f70b.firebaseapp.com",
  projectId: "healthcare-assistant-5f70b",
  storageBucket: "healthcare-assistant-5f70b.firebasestorage.app",
  messagingSenderId: "221261599350",
  appId: "1:221261599350:web:d124371400ddecdb004557",
  measurementId: "G-XMD9PD35JB"
};

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