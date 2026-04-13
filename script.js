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
		knowlagecontainer.style.width = "25%";
		console.log("Landscape Mode Active");
	}
}

// Run on page load
window.addEventListener('load', checkOrientation);

// Run every time the window is resized
window.addEventListener('resize', checkOrientation);