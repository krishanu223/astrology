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

function processAstroPayment() {
	const name = document.getElementById('userName').value;
	const date = document.getElementById('birthDate').value;
	const time = document.getElementById('birthTime').value;
	const place = document.getElementById('birthPlace').value;
	const whatnum = document.getElementById('whnum').value;
	if (!name || !date || !time || !place || !whatnum) {
		alert("দয়া করে সবকটি তথ্য প্রদান করুন।");
		return;
	}

	var options = {
		"key": "rzp_test_SctD70Wol2OPE6",
		"amount": "50100",
		"currency": "INR",
		"name": "Hypno Rishi",
		"handler": function (response) {
			const paymentId = response.razorpay_payment_id;

			// --- AUTOMATIC EMAIL LOGIC ---
			const templateParams = {
				name: name,
				dob: date,
				time: time,
				place: place,
				whatnum: whatnum,
				payment_id: paymentId
			};

			emailjs.send('service_129c189', 'template_9wnnsjl', templateParams)
				.then(function () {
					console.log('Email sent successfully to owner!');
				}, function (error) {
					console.log('Email failed...', error);
				});

			// --- SHOW SUCCESS UI ---
			const fullMessage = `*Payment Successful*%0A*Name:* ${name}%0A*DOB:* ${date}%0A*ID:* ${paymentId}`;
			//const whatsappUrl = `https://wa.me/91YOURNUMBER?text=${fullMessage}`;

			//document.getElementById('whatsappFinalLink').href = whatsappUrl;
			document.getElementById('successModal').style.display = 'flex';
		},
		"theme": { "color": "#673ab7" }
	};

	var rzp1 = new Razorpay(options);
	rzp1.open();
}