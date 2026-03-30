// Using Firebase Realtime Database (Free Tier)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyALbQTwXNpS3LLfQUEV16pLTkATr_zEDYI",
  authDomain: "healthcare-assistant-5f70b.firebaseapp.com",
  databaseURL: "https://healthcare-assistant-5f70b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "healthcare-assistant-5f70b",
  storageBucket: "healthcare-assistant-5f70b.firebasestorage.app",
  messagingSenderId: "221261599350",
  appId: "1:221261599350:web:d124371400ddecdb004557",
  measurementId: "G-XMD9PD35JB"
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);

// Use Realtime Database (NOT Firestore)
const db = firebase.database();

// Realtime Database Service Functions
const DatabaseService = {
    // Create appointment
    async createAppointment(appointmentData) {
        try {
            const newRef = db.ref('appointments').push();
            await newRef.set({
                ...appointmentData,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                status: "pending"
            });
            return newRef.key;
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    // Get all appointments
    async getAllAppointments() {
        try {
            const snapshot = await db.ref('appointments').get();
            return snapshot.val() || {};
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    // Get specific appointment
    async getAppointment(id) {
        try {
            const snapshot = await db.ref(`appointments/${id}`).get();
            return snapshot.val();
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    // Update appointment
    async updateAppointment(id, updates) {
        try {
            await db.ref(`appointments/${id}`).update(updates);
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    // Delete appointment
    async deleteAppointment(id) {
        try {
            await db.ref(`appointments/${id}`).remove();
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    },

    // Check if user exists
    async checkUser(email) {
        try {
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).get();
            return !!(snapshot.val() && Object.keys(snapshot.val()).length > 0);
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        }
    }
};

// Make globals accessible
window.db = db;
window.DatabaseService = DatabaseService;

console.log("✅ Firebase Realtime Database initialized");