import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Ensure collection and addDoc are added to your Firestore imports at the top
import { doc, getDoc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const cartList = document.getElementById('cart-list');
const totalCountDisplay = document.getElementById('total-count');
const totalPriceDisplay = document.getElementById('total-price');

let currentUser = null;
let isAddressAvailableInDB = false; // ডাটাবেসে অ্যাড্রেস আছে কিনা ট্র্যাক রাখার ফ্ল্যাগ

// 1. Check if user is logged in & Fetch saved address from Firestore
onAuthStateChanged(auth, async (user) => {
	if (user) {
		currentUser = user;

		const nameField = document.getElementById('ship-name');
		if (nameField && !nameField.value) nameField.value = user.displayName || "";

		try {
			const docRef = doc(db, "users", user.uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists() && docSnap.data().address) {
				const savedData = docSnap.data().address;

				document.getElementById('ship-name').value = savedData.name || "";
				document.getElementById('ship-phone').value = savedData.phone || "";
				document.getElementById('ship-address').value = savedData.line1 || "";
				document.getElementById('ship-city').value = savedData.city || "";
				document.getElementById('ship-state').value = savedData.state || "";
				document.getElementById('ship-pin').value = savedData.pin || "";

				isAddressAvailableInDB = true; // অ্যাড্রেস ভেরিফাইড
				console.log("Saved address loaded successfully.");
			}
		} catch (error) {
			console.error("Error loading address from Firestore:", error);
		}
	} else {
		currentUser = null;
		isAddressAvailableInDB = false;
	}
});

function displayCart() {
	const cart = JSON.parse(localStorage.getItem('hypnoCart')) || [];
	cartList.innerHTML = "";

	if (cart.length === 0) {
		cartList.innerHTML = "<p>আপনার ঝুলি বর্তমানে খালি।</p>";
		totalCountDisplay.innerText = "0";
		totalPriceDisplay.innerText = "₹0";
		return;
	}

	let total = 0;
	cart.forEach((item, index) => {
		total += Number(item.price);
		cartList.innerHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span>₹${item.price}</span>
                </div>
                <button class="remove-btn" onclick="window.removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
	});

	totalCountDisplay.innerText = cart.length;
	totalPriceDisplay.innerText = `₹${total}`;
}

window.removeFromCart = (index) => {
	let cart = JSON.parse(localStorage.getItem('hypnoCart')) || [];
	cart.splice(index, 1);
	localStorage.setItem('hypnoCart', JSON.stringify(cart));
	displayCart();
};

// 2. Modified Checkout Function
window.processCartCheckout = async () => {
	const cart = JSON.parse(localStorage.getItem('hypnoCart')) || [];
	if (cart.length === 0) return alert("আপনার ঝুলি খালি!");

	// কন্ডিশন ১: ইউজার লগইন আছে কিনা চেক করা
	if (!currentUser) {
		alert("চেকআউট করতে প্রথমে লগইন করুন।");
		window.location.href = "login.html";
		return;
	}

	const line1Val = document.getElementById('ship-address').value.trim();
	const phoneVal = document.getElementById('ship-phone').value.trim();

	// কন্ডিশন ২: ডাটাবেসেও নেই এবং ফর্মেও ইনপুট দেয়নি (Focus Functionality)
	if (!isAddressAvailableInDB && (!line1Val || !phoneVal)) {
		alert("দয়া করে চেকআউট করার আগে আপনার ঠিকানা প্রদান করে 'ঠিকানা সংরক্ষণ করুন' বাটনে ক্লিক করুন।");

		const addressField = document.getElementById('ship-address');
		const saveBtn = document.querySelector('.save-address-btn');

		if (addressField) {
			addressField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			addressField.focus();
			addressField.style.borderColor = "#ffd700"; // ভিজ্যুয়াল হাইলাইট
		} else if (saveBtn) {
			saveBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
			saveBtn.focus();
		}
		return; // পেমেন্ট গেটওয়ে ওপেন হওয়া ব্লক করা হলো
	}

	const shippingForm = document.getElementById('shipping-form');
	if (!shippingForm.checkValidity()) {
		shippingForm.reportValidity();
		return;
	}

	const nameVal = document.getElementById('ship-name').value;
	const cityVal = document.getElementById('ship-city').value;
	const stateVal = document.getElementById('ship-state').value;
	const pinVal = document.getElementById('ship-pin').value;

	const deliveryAddressString = `${line1Val}, ${cityVal}, ${stateVal} - ${pinVal}`;
	const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0);

	const options = {
		"key": "rzp_test_SctD70Wol2OPE6",
		"amount": totalAmount * 100,
		"currency": "INR",
		"name": "Hypno Rishi Checkout",
		"description": "Sadhana Kit Purchase",
		"prefill": {
			"name": nameVal,
			"contact": phoneVal
		},
		"notes": {
			"shipping_address": deliveryAddressString
		},
		"handler": async function (response) {
			alert("পেমেন্ট সফল হয়েছে! অর্ডার ট্র্যাকিং আইডি: " + response.razorpay_payment_id);

			const activeUser = auth.currentUser;

			if (activeUser) {
				try {
					await setDoc(doc(db, "users", activeUser.uid), {
						address: {
							name: nameVal,
							phone: phoneVal,
							line1: line1Val,
							city: cityVal,
							state: stateVal,
							pin: pinVal
						},
						updatedAt: Date.now()
					}, { merge: true });

					const userOrdersRef = collection(db, "users", activeUser.uid, "orders");
					await addDoc(userOrdersRef, {
						paymentId: response.razorpay_payment_id,
						items: cart,
						totalPaid: totalAmount,
						shippingDetails: {
							name: nameVal,
							phone: phoneVal,
							address: deliveryAddressString
						},
						orderDate: Date.now(),
						status: "Processing"
					});

					console.log("Order saved to Firestore successfully!");

				} catch (error) {
					console.error("Firestore Save Error:", error);
					alert("ডাটাবেসে অর্ডার সেভ করতে সমস্যা হয়েছে: " + error.message);
				}
			} else {
				console.error("No active user found at the time of purchase!");
				alert("অর্ডার সেভ করা যায়নি কারণ আপনার লগইন সেশনটি পাওয়া যায়নি।");
			}

			localStorage.removeItem('hypnoCart');
			shippingForm.reset();
			window.location.href = "index.html";
		},
		"theme": { "color": "#0d0d21" }
	};

	const rzp = new Razorpay(options);
	rzp.open();
};

// 3. Save Address Function
window.saveAddressOnly = async () => {
	if (!currentUser) {
		alert("ঠিকানা সংরক্ষণ করার জন্য দয়া করে প্রথমে লগইন করুন।");
		return;
	}

	const shippingForm = document.getElementById('shipping-form');
	if (!shippingForm.checkValidity()) {
		shippingForm.reportValidity();
		return;
	}

	const nameVal = document.getElementById('ship-name').value;
	const phoneVal = document.getElementById('ship-phone').value;
	const line1Val = document.getElementById('ship-address').value;
	const cityVal = document.getElementById('ship-city').value;
	const stateVal = document.getElementById('ship-state').value;
	const pinVal = document.getElementById('ship-pin').value;

	try {
		const btn = document.querySelector('.save-address-btn');
		if (btn) {
			btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> সংরক্ষণ করা হচ্ছে...`;
			btn.disabled = true;
		}

		await setDoc(doc(db, "users", currentUser.uid), {
			address: {
				name: nameVal,
				phone: phoneVal,
				line1: line1Val,
				city: cityVal,
				state: stateVal,
				pin: pinVal
			},
			updatedAt: Date.now()
		}, { merge: true });

		isAddressAvailableInDB = true; // সেভ করার পর ফ্ল্যাগ ট্রু করা হলো

		const addressField = document.getElementById('ship-address');
		if (addressField) addressField.style.borderColor = ""; // বর্ডার রিসেট

		alert("ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে! (Address Saved)");

		if (btn) {
			btn.innerHTML = `<i class="fas fa-save"></i> ঠিকানা সংরক্ষণ করুন (Save Address)`;
			btn.disabled = false;
		}

	} catch (error) {
		console.error("Firestore Save Error:", error);
		alert("ঠিকানা সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।");

		const btn = document.querySelector('.save-address-btn');
		if (btn) {
			btn.innerHTML = `<i class="fas fa-save"></i> ঠিকানা সংরক্ষণ করুন (Save Address)`;
			btn.disabled = false;
		}
	}
};

displayCart();