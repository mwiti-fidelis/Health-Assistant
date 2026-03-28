const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
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