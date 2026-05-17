import { auth, db } from './firebase-config.js';
import {
	GoogleAuthProvider,
	signInWithPopup,
	onAuthStateChanged,
	signInWithEmailAndPassword // ম্যানুয়াল লগইনের জন্য যোগ করা হলো
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const googleLoginBtn = document.getElementById('google-login-btn');
const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const mainAuthBtn = document.getElementById('main-auth-btn');

let isAuthProcessing = false;

// ১. ডাটাবেস চেক এবং প্রোফাইল তৈরি করার কমন ফাংশন
async function syncUserToFirestore(user) {
	console.log("Syncing user to Firestore:", user.email);

	try {
		const userDocRef = doc(db, "users", user.uid);
		const userDocSnap = await getDoc(userDocRef);

		if (!userDocSnap.exists()) {
			console.log("New clean user detected! Creating Firestore profile...");
			await setDoc(userDocRef, {
				profile: {
					name: user.displayName || user.email.split('@')[0],
					email: user.email,
					phone: user.phoneNumber || ""
				},
				createdAt: Date.now()
			});
		} else {
			console.log("Existing user logged in. Profile preserved.");
		}
	} catch (error) {
		console.error("Firestore Sync Error (Bypassed for redirection):", error);
	}

	console.log("Forcing redirect to index.html...");
	window.location.replace("index.html");
}

// ২. গুগল পপআপ লগইন হ্যান্ডলার ফাংশন
async function handleGoogleAuthPopup() {
	if (isAuthProcessing) return;
	isAuthProcessing = true;

	if (googleLoginBtn) {
		googleLoginBtn.disabled = true;
		googleLoginBtn.innerText = "Opening Google Popup...";
	}

	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });

	try {
		const result = await signInWithPopup(auth, provider);
		if (result && result.user) {
			console.log("Popup Login Success:", result.user.email);
			await syncUserToFirestore(result.user);
		}
	} catch (error) {
		console.error("Google Auth Popup Error:", error);
		isAuthProcessing = false;
		if (googleLoginBtn) {
			googleLoginBtn.disabled = false;
			googleLoginBtn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png" alt="Google"> Google দিয়ে এগিয়ে যান`;
		}
		if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
			alert("গুগল অথেন্টিকেশন ব্যর্থ হয়েছে: " + error.message);
		}
	}
}

if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuthPopup);

// ==========================================
// 🔴 ৩. ম্যানুয়াল লগইন সাবমিট লজিক
// ==========================================
if (emailForm) {
	emailForm.addEventListener('submit', async (e) => {
		e.preventDefault(); // পেজ রিফ্রেশ হওয়া আটকানো

		if (isAuthProcessing) return;

		const email = emailInput.value.trim();
		const password = passwordInput.value.trim();

		if (!email || !password) {
			alert("দয়া করে ইমেল এবং পাসওয়ার্ড প্রদান করুন।");
			return;
		}

		try {
			isAuthProcessing = true;
			mainAuthBtn.disabled = true;
			mainAuthBtn.innerText = "Processing...";

			// ফায়ারবেস লগইন এক্সিকিউশন
			const result = await signInWithEmailAndPassword(auth, email, password);
			console.log("Manual Login Success:", result.user.email);

			await syncUserToFirestore(result.user);

		} catch (error) {
			console.error("Manual Login Error:", error);
			isAuthProcessing = false;
			mainAuthBtn.disabled = false;
			mainAuthBtn.innerText = "Login";

			if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
				alert("ভুল ইমেল অথবা পাসওয়ার্ড দেওয়া হয়েছে।");
			} else if (error.code === 'auth/invalid-email') {
				alert("ইমেল এড্রেসটির ফরম্যাট সঠিক নয়।");
			} else {
				alert("লগইন ব্যর্থ হয়েছে: " + error.message);
			}
		}
	});
}

// ৪. ব্যাকআপ সেশন লিসেনার
onAuthStateChanged(auth, (user) => {
	if (user && !isAuthProcessing) {
		isAuthProcessing = true;
		window.location.replace("index.html");
	}
});