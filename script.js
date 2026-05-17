
// TOP OF script.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// Now you can use auth and db safely
//const app = initializeApp(firebaseConfig);
//const db = getFirestore(app);

//////////////////////////////////////check orientation //////////////////////////

let knowlagecontainer = document.querySelector('.knowledge-container');
let ourser = document.querySelector('.ourserviceheading');
function checkOrientation() {
	const body = document.body;

	// Check if Height is greater than Width (Portrait Mode)
	if (window.innerHeight > window.innerWidth) {
		knowlagecontainer.style.width = "100%";
		ourser.style.width = "58%";
		console.log("Portrait Mode Active");
	} else {
		knowlagecontainer.style.width = "100%";
		console.log("Landscape Mode Active");
	}
}

// Run on page load
window.addEventListener('load', checkOrientation);

// Run every time the window is resized
window.addEventListener('resize', checkOrientation);


////////////////////////////////   payment //////////////////////////////////////////////



// আপনার ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
	apiKey: "AIzaSyAWSP0h6GdY-JZvh0X0hk6Pk6F8ZiFc3kg",
	authDomain: "astrology-8d207.firebaseapp.com",
	projectId: "astrology-8d207",
	storageBucket: "astrology-8d207.firebasestorage.app",
	messagingSenderId: "473083037288",
	appId: "1:473083037288:web:72f71ebeb829da87fe9ddd"
};



// গ্লোবাল ভেরিয়েবলস
let astroFeeAmount = 0;
const adminWhatsAppNumber = "917585960255"; // আপনার হোয়াটসঅ্যাপ নম্বর কান্ট্রি কোডসহ

// ইংরেজী সংখ্যা বাংলায় রূপান্তরের ফাংশন
function toBengaliNum(num) {
	const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
	return num.toString().split('').map(d => digits[d] || d).join('');
}

// ১. ডাটাবেস থেকে অ্যাস্ট্রোলজি ফি লোড করা
// আপনার বিদ্যমান loadAstroPrice ফাংশনটি এভাবে মডিফাই করুন:
async function loadAstroPrice() {
	const priceDisplay = document.getElementById('astroPriceDisplay'); // ফর্মের ডিসপ্লে
	const bannerPriceDisplay = document.getElementById('bannerPriceDisplay'); // ব্যানারের ডিসপ্লে
	const payBtn = document.getElementById('astroPayBtn');

	try {
		const docRef = doc(db, "settings", "booking_config");
		const docSnap = await getDoc(docRef);

		if (docSnap.exists() && docSnap.data().astroPrice) {
			astroFeeAmount = Number(docSnap.data().astroPrice);
		} else {
			astroFeeAmount = 350; // ডিফল্ট ব্যাকআপ ফি হিসেবে ৩৫০ সেট করা হলো
		}

		// ফর্ম এবং ব্যানার ইমেজ দুই জায়গাতেই বাংলা সংখ্যায় আপডেট হবে
		if (priceDisplay) priceDisplay.innerHTML = `বিশ্লেষণ ফি: ₹${toBengaliNum(astroFeeAmount)}/- মাত্র`;
		if (bannerPriceDisplay) bannerPriceDisplay.innerHTML = `₹${toBengaliNum(astroFeeAmount)}/-`;

		if (payBtn) {
			payBtn.innerHTML = `পেমেন্ট করুন ও বিশ্লেষণ শুরু করুন`;
			payBtn.disabled = false;
		}

	} catch (err) {
		console.error("Error loading astro price: ", err);
		// এরর আসলেও ডিফল্ট ৩৫০ দেখাবে
		astroFeeAmount = 350;
		if (priceDisplay) priceDisplay.innerHTML = `বিশ্লেষণ ফি: ₹৩৫০/- মাত্র`;
		if (bannerPriceDisplay) bannerPriceDisplay.innerHTML = `₹৩৫০/-`;
		if (payBtn) {
			payBtn.innerHTML = `পেমেন্ট করুন ও বিশ্লেষণ শুরু করুন`;
			payBtn.disabled = false;
		}
	}
}

// পেজ লোডে রান হবে
loadAstroPrice();

// ২. ফর্ম সাবমিট এবং পেমেন্ট প্রসেস
document.getElementById('astroForm').addEventListener('submit', function (e) {
	e.preventDefault();

	if (!astroFeeAmount || astroFeeAmount <= 0) {
		alert("পেমেন্ট মূল্য সঠিক নয়। দয়া করে পেজটি রিফ্রেশ করুন।");
		return;
	}

	const uName = document.getElementById('userName').value;
	const bDate = document.getElementById('birthDate').value;
	const bTime = document.getElementById('birthTime').value;
	const bPlace = document.getElementById('birthPlace').value;
	const whNum = document.getElementById('whnum').value;
	const payBtn = document.getElementById('astroPayBtn');

	// বাটন ডিসেবল করা
	payBtn.innerText = "Processing...";
	payBtn.disabled = true;

	// Razorpay গেটওয়ে কনফিগারেশন
	const options = {
		"key": "rzp_test_SctD70Wol2OPE6",
		"amount": astroFeeAmount * 100,  // পয়সায় রূপান্তর
		"currency": "INR",
		"name": "Hypno Rishi",
		"description": "Vedic Astrology Consultation",
		"prefill": {
			"name": uName,
			"contact": whNum
		},
		"handler": async function (response) {
			try {
				// ফায়ারস্টোরের 'astro_consultations' কালেকশনে ডেটা সেভ
				await addDoc(collection(db, "astro_consultations"), {
					name: uName,
					birthDate: bDate,
					birthTime: bTime,
					birthPlace: bPlace,
					whatsApp: whNum,
					paymentId: response.razorpay_payment_id,
					amountPaid: astroFeeAmount,
					status: "Confirmed",
					timestamp: Date.now()
				});

				// সফল হলে মডাল ওপেন করা
				const modal = document.getElementById('successModal');
				if (modal) modal.style.display = 'flex';

				// হোয়াটসঅ্যাপ মেসেজ টেমপ্লেট
				const message = `নমস্কার Hypno Rishi, আমি কোষ্ঠী বিচারের জন্য পেমেন্ট সম্পূর্ণ করেছি।\n\n*আমার বিবরণ:*\n📝 নাম: ${uName}\n📅 জন্ম তারিখ: ${bDate}\n⏰ জন্ম সময়: ${bTime}\n📍 জন্মস্থান: ${bPlace}\n📞 হোয়াটসঅ্যাপ: ${whNum}\n💳 পেমেন্ট আইডি: ${response.razorpay_payment_id}\n💰 পরিশোধিত ফি: ₹${astroFeeAmount}`;
				const encodedMessage = encodeURIComponent(message);
				const whatsappURL = `https://wa.me/${adminWhatsAppNumber}?text=${encodedMessage}`;

				// ৩ সেকেন্ড মডাল দেখিয়ে হোয়াটসঅ্যাপে রিডাইরেক্ট করা
				setTimeout(() => {
					window.location.href = whatsappURL;
				}, 3000);

			} catch (error) {
				console.error("Error saving astro data: ", error);
				alert("পেমেন্ট সফল হলেও ডাটা সেভ করা যায়নি: " + error.message);
				payBtn.innerHTML = `পেমেন্ট করুন ও বিশ্লেষণ শুরু করুন`;
				payBtn.disabled = false;
			}
		},
		"modal": {
			"ondismiss": function () {
				payBtn.innerHTML = `পেমেন্ট করুন ও বিশ্লেষণ শুরু করুন`;
				payBtn.disabled = false;
			}
		},
		"theme": { "color": "#0d0d21" }
	};

	const rzp = new Razorpay(options);
	rzp.open();
});

//////////////////////////////    client creadentional ////////////////////////////////////////




// 1. Check Authentication State
onAuthStateChanged(auth, (user) => {
	if (user) {
		// User is signed in
		const userName = user.displayName || user.email.split('@')[0];
		// Inside script.js -> onAuthStateChanged(auth, (user) => { ... })

		// Create a built-in SVG placeholder string
		const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffd700'><path d='M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z'/></svg>";


		// Use the genuine Google photo, if it fails or doesn't exist, use our local SVG
		const userPhoto = user.photoURL || defaultAvatar;

		authSection.innerHTML = `
    <div class="user-profile-menu" onclick="window.toggleDropdown()">
        <!-- Updated the onerror fallback to use defaultAvatar too -->
        <img src="${userPhoto}" alt="${userName}" class="nav-avatar" onerror="this.src='${defaultAvatar}'">
        <span class="nav-username">${userName}</span>
        <i class="fas fa-chevron-down dropdown-arrow"></i>
    </div>
    ...
`;




	} else {
		// User is signed out
		authSection.innerHTML = `<a href="login.html" class="login-link">Login / Signup</a>`;
	}
});

// 2. Handle Logout
window.handleLogout = function () {
	signOut(auth).then(() => {
		window.location.reload();
	});
}

// 3. Update Cart Count from LocalStorage
function updateCartBadge() {
	const cart = JSON.parse(localStorage.getItem('hypnoCart')) || [];
	document.getElementById('cart-count').innerText = cart.length;
}

// Run on load
updateCartBadge();




///////////////////////////////  cart  //////////////////////////////
let cart = JSON.parse(localStorage.getItem('hypnoCart'));
console.log("cart item is", cart)


//////////////////////////////////////  login data retrive  /////////////////////////////



const authSection = document.getElementById('auth-section');

// 15 days in milliseconds (15 days * 24 hours * 60 mins * 60 secs * 1000 ms)
const INACTIVITY_LIMIT = 15 * 24 * 60 * 60 * 1000;
const fallbackUrl = "https://ui-avatars.com/api/?name=User&background=222&color=fff";
onAuthStateChanged(auth, (user) => {
	if (user) {
		const currentTime = Date.now();
		const lastVisit = localStorage.getItem('hypno_last_visit');

		// Check if the user hasn't visited in over 15 days
		if (lastVisit && (currentTime - Number(lastVisit) > INACTIVITY_LIMIT)) {
			console.log("Inactivity limit reached. Logging out...");

			// Clear activity storage data
			localStorage.removeItem('hypno_last_visit');

			// Force Sign out
			signOut(auth).then(() => {
				window.location.reload();
			});
			return; // Stop execution here
		}

		// If they are within 15 days, update the timestamp to TODAY
		localStorage.setItem('hypno_last_visit', currentTime.toString());

		// Process showing their user profile data normally
		const userName = user.displayName || user.email.split('@')[0];
		const userPhoto = user.photoURL || fallbackUrl;

		// Inside your script.js -> onAuthStateChanged(auth, (user) => { ... })
		// Replace the dropdown HTML section with this updated one:

		authSection.innerHTML = `
<div class="user-profile-menu" onclick="window.toggleDropdown()">
		<img src="${userPhoto}" alt="${userName}" class="nav-avatar" onerror="this.src='https://via.placeholder.com/150'">
		<span class="nav-username">${userName}</span>
		<i class="fas fa-chevron-down dropdown-arrow"></i>
</div>

<!-- Hidden Dropdown Menu -->
<div id="profile-dropdown" class="profile-dropdown-content">
		<div class="dropdown-user-info">
				<p class="user-name-title">${userName}</p>
				<p class="user-email-subtitle">${user.email}</p>
		</div>
		<hr class="dropdown-divider">
		
		<!-- Existing My Orders Link -->
		<a  onclick="displayorders()" class="dropdown-item"><i class="fas fa-box"></i> My Orders</a>
		
		<!-- NEW MY ADDRESS LINK -->
		<a href="cart.html" class="dropdown-item"><i class="fas fa-map-marker-alt"></i> My Address</a>
		
		<a href="#" class="dropdown-item logout-item" onclick="window.handleLogout(event)">
				<i class="fas fa-sign-out-alt"></i> Logout
		</a>
</div>
`;
	} else {
		// No user logged in - clean up tracking timestamp and show login button
		localStorage.removeItem('hypno_last_visit');
		authSection.innerHTML = `<a href="login.html" class="login-link">Login / Signup</a>`;
	}
});
// 2. Dropdown Toggle Control
window.toggleDropdown = function () {
	const dropdown = document.getElementById('profile-dropdown');
	if (dropdown) {
		dropdown.classList.toggle('show-menu');
	}
};

// 3. Close the dropdown if the user clicks anywhere outside of it
window.addEventListener('click', function (e) {
	const profileMenu = document.querySelector('.user-profile-menu');
	const dropdown = document.getElementById('profile-dropdown');
	if (dropdown && !profileMenu.contains(e.target)) {
		dropdown.classList.remove('show-menu');
	}
});

// 4. Handle Safe Logout Routine
window.handleLogout = function (e) {
	e.preventDefault();
	signOut(auth).then(() => {
		window.location.reload();
	}).catch((error) => {
		console.error("Sign out transaction aborted:", error);
	});
};

///////////////////////////////  My orders   /////////////////////////////////
window.displayorders = async () => {
	document.querySelector(".my-orders-section").style.display = "block";
}
window.closeMyOrders = async () => {
	document.querySelector(".my-orders-section").style.display = "none";
}
// DOM Element যেখানে অর্ডারগুলো দেখাবে
const ordersContainer = document.getElementById('my-orders-container');

// ইউজার লগইন অবস্থায় থাকলে অর্ডার ফেচ করার মেইন ফাংশন
async function fetchUserOrders(user) {
	if (!ordersContainer) return; // যদি এই পেজে কন্টেইনারটি না থাকে

	ordersContainer.innerHTML = `<p class="loading"><i class="fas fa-spinner fa-spin"></i> আপনার অর্ডার তালিকা লোড হচ্ছে...</p>`;

	try {
		// ফায়ারস্টোর থেকে ওই ইউজারের orders সাব-কালেকশনটি তারিখ অনুযায়ী সাজিয়ে আনা
		const ordersRef = collection(db, "users", user.uid, "orders");
		const q = query(ordersRef, orderBy("orderDate", "desc"));
		const querySnapshot = await getDocs(q);

		// যদি কোনো অর্ডার না থাকে
		if (querySnapshot.empty) {
			ordersContainer.innerHTML = `<p class="no-orders">আপনার কোনো অর্ডার ইতিহাস পাওয়া যায়নি।</p>`;
			return;
		}

		let ordersHTML = '';

		// প্রতিটি অর্ডার লুপ করে ডিজাইন তৈরি করা
		querySnapshot.forEach((doc) => {
			const order = doc.data();

			// তারিখ ফরম্যাট করা (বাঙালি ইউজারদের জন্য সহজ বাংলায়)
			const orderDate = new Date(order.orderDate).toLocaleDateString('bn-BD', {
				year: 'numeric', month: 'long', day: 'numeric'
			});

			// অর্ডারের ভেতরের আইটেমগুলোর লিস্ট তৈরি করা
			let itemsHTML = '';
			order.items.forEach(item => {
				itemsHTML += `
                    <div class="order-item">
                        <span class="item-name">• ${item.name}</span>
                        <span class="item-price">₹${item.price}</span>
                    </div>
                `;
			});

			// মূল অর্ডারের কার্ড ডিজাইন
			ordersHTML += `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-date">তারিখ: ${orderDate}</span>
                        <span class="order-status badge-${(order.status || 'Processing').toLowerCase()}">
                            ${order.status || 'Processing'}
                        </span>
                    </div>
                    <div class="order-items-list">
                        ${itemsHTML}
                    </div>
                    <div class="order-footer">
                        <span>মোট মূল্য: <strong class="gold-text">₹${order.totalPaid}</strong></span>
                        <span class="payment-id">ID: ${order.paymentId}</span>
                    </div>
                </div>
            `;
		});

		ordersContainer.innerHTML = ordersHTML;

	} catch (error) {
		console.error("Error fetching orders:", error);
		ordersContainer.innerHTML = `<p class="error-text">অর্ডার লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>`;
	}
}

// ইউজার লগইন বা লগআউট হওয়া পর্যবেক্ষণ করা
onAuthStateChanged(auth, (user) => {
	if (user) {
		// ইউজার লগইন থাকলে অর্ডার ডাটা নিয়ে আসা শুরু হবে
		fetchUserOrders(user);
	} else {
		if (ordersContainer) {
			ordersContainer.innerHTML = `<p class="login-prompt">অর্ডার দেখতে অনুগ্রহ করে <a href="login.html">লগইন করুন</a>।</p>`;
		}
	}
});

///////////////////////////////   slider ////////////////////////////////////

window.scroll_to_slider = () => {
	window.scrollTo({
		top: 2500,
		behavior: "smooth"
	});
}


// আপনার বিদ্যমান loadAstroPrice ফাংশনটি এভাবে মডিফাই করুন:
