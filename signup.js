import { auth, db } from './firebase-config.js';
import {
	GoogleAuthProvider,
	signInWithPopup,
	createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM এলিমেন্টস (signup.html এর সঠিক আইডি অনুযায়ী মেলানো)
const googleSignupBtn = document.getElementById('google-signup-btn');
const signupForm = document.getElementById('signup-form');
const nameInput = document.getElementById('signup-name');
const phoneInput = document.getElementById('signup-phone');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const signupBtn = document.getElementById('signup-btn');

let isAuthProcessing = false;

// ১. ফায়ারস্টোরে প্রোফাইল তৈরি ও রিডাইরেক্ট করার ফাংশন
async function syncUserToFirestore(user, manualData = null) {
	console.log("Syncing user to Firestore:", user.email);

	try {
		const userDocRef = doc(db, "users", user.uid);
		const userDocSnap = await getDoc(userDocRef);

		if (!userDocSnap.exists()) {
			console.log("Creating new profile in Firestore...");

			// ম্যানুয়াল সাইন আপ হলে ফর্মের নাম ও ফোন নেবে, গুগলের ক্ষেত্রে গুগল প্রোফাইলের ডাটা নেবে
			await setDoc(userDocRef, {
				profile: {
					name: manualData ? manualData.name : (user.displayName || user.email.split('@')[0]),
					email: user.email,
					phone: manualData ? manualData.phone : (user.phoneNumber || "")
				},
				createdAt: Date.now()
			});
		}
	} catch (error) {
		console.error("Firestore Sync Error:", error);
	}

	console.log("Forcing redirect to index.html...");
	window.location.replace("index.html");
}

// ২. গুগল পপআপ সাইন-আপ হ্যান্ডলার
async function handleGoogleAuth() {
	if (isAuthProcessing) return;
	isAuthProcessing = true;

	if (googleSignupBtn) {
		googleSignupBtn.disabled = true;
		googleSignupBtn.innerText = "Opening Google Popup...";
	}

	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });

	try {
		const result = await signInWithPopup(auth, provider);
		alert("গুগল অ্যাকাউন্ট দিয়ে সফলভাবে সাইন-ইন হয়েছে!");
		await syncUserToFirestore(result.user);
	} catch (error) {
		console.error("Google Auth Error:", error);
		isAuthProcessing = false;
		if (googleSignupBtn) {
			googleSignupBtn.disabled = false;
			googleSignupBtn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo"> Sign up with Google`;
		}
		if (error.code !== 'auth/popup-closed-by-user') {
			alert("গুগল অথেন্টিকেশন ব্যর্থ হয়েছে: " + error.message);
		}
	}
}

if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleAuth);


// ==========================================
// 🔴 ৩. কাস্টম ম্যানুয়াল সাইন-আপ সাবমিট লজিক
// ==========================================
if (signupForm) {
	signupForm.addEventListener('submit', async (e) => {
		e.preventDefault(); // পেজ রিফ্রেশ হওয়া আটকানো

		if (isAuthProcessing) return;

		const name = nameInput.value.trim();
		const phone = phoneInput.value.trim();
		const email = emailInput.value.trim();
		const password = passwordInput.value.trim();

		if (!name || !phone || !email || !password) {
			alert("দয়া করে সমস্ত ফিল্ড সঠিকভাবে পূরণ করুন।");
			return;
		}

		if (password.length < 6) {
			alert("নিরাপত্তার জন্য পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে।");
			return;
		}

		try {
			isAuthProcessing = true;
			signupBtn.disabled = true;
			signupBtn.innerText = "Creating Account...";

			// ফায়ারবেস দিয়ে নতুন ইউজার তৈরি
			const result = await createUserWithEmailAndPassword(auth, email, password);
			console.log("Manual Signup Success:", result.user.email);

			alert("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");

			// ডাটাবেসে নাম এবং ফোন নম্বর সহ প্রোফাইল সেভ করা
			await syncUserToFirestore(result.user, { name: name, phone: phone });

		} catch (error) {
			console.error("Manual Signup Error:", error);
			isAuthProcessing = false;
			signupBtn.disabled = false;
			signupBtn.innerText = "Sign Up";

			if (error.code === 'auth/email-already-in-use') {
				alert("এই ইমেলটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।");
			} else if (error.code === 'auth/invalid-email') {
				alert("প্রদত্ত ইমেল এড্রেসটির ফরম্যাট সঠিক নয়।");
			} else if (error.code === 'auth/weak-password') {
				alert("পাসওয়ার্ডটি দুর্বল, দয়া করে শক্তিশালী পাসওয়ার্ড দিন।");
			} else {
				alert("সাইন-আপ ব্যর্থ হয়েছে: " + error.message);
			}
		}
	});
}