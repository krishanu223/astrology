import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyAWSP0h6GdY-JZvh0X0hk6Pk6F8ZiFc3kg",
	authDomain: "astrology-8d207.firebaseapp.com",
	projectId: "astrology-8d207",
	storageBucket: "astrology-8d207.firebasestorage.app",
	messagingSenderId: "473083037288",
	appId: "1:473083037288:web:72f71ebeb829da87fe9ddd",
	measurementId: "G-S48PVV3H7N"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Export the services so other files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);