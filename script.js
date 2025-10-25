// Global state variables
let selectedAmount = 0;
let selectedWallet = null;

// Helper function for Throttling scroll events
const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

// Array of all section IDs
const sections = document.querySelectorAll('main section[id], header[id]');
const removeActive = (container) => {
    container.forEach(link => link.classList.remove('active'));
};

// Logic to check if payment can proceed
const checkPaymentStatus = () => {
    const proceedBtn = document.getElementById('proceedPayment');
    const customAmountInput = document.getElementById('customAmount');
    
    // Get amount from input, default to 0 if not a valid number
    const customAmount = parseFloat(customAmountInput.value) || 0;
    
    // Determine if a valid amount is set
    const amountIsSet = selectedAmount > 0 || customAmount > 0;
    
    if (amountIsSet && selectedWallet) {
        proceedBtn.disabled = false;
        proceedBtn.textContent = `Proceed to Pay ₱${(selectedAmount || customAmount).toFixed(2)}`;
    } else {
        proceedBtn.disabled = true;
        proceedBtn.textContent = 'Proceed to Payment';
    }
};

// --- SCROLL AND NAVIGATION LOGIC (FIXED) ---
const updateActiveLink = () => {
    let currentActive = 'home';
    const navHeight = document.querySelector('.navbar').offsetHeight;
    const buffer = 50; 
    
    // 1. Determine the current active section based on scroll position
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navHeight - buffer;
        
        if (window.scrollY >= sectionTop) {
            currentActive = section.id;
        }
    });

    // If scrolled to the very bottom, ensure the last section is active (e.g., Profile)
    const bodyHeight = document.body.offsetHeight;
    const windowHeight = window.innerHeight;
    if (window.scrollY + windowHeight >= bodyHeight - 10) { 
        if (sections.length > 0) {
            currentActive = sections[sections.length - 1].id; 
        }
    }

    // --- 2. Update Top Navbar Links (Desktop) ---
    const topLinks = document.querySelectorAll('.navbar .nav-link');
    const isDesktop = window.matchMedia("(min-width: 992px)").matches;

    removeActive(topLinks); 

    if (isDesktop) {
        // Only highlight Top Nav on desktop
        const targetLink = document.querySelector(`.navbar .nav-link[data-section="${currentActive}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    } 

    // --- 3. Update Bottom Navbar Links (Mobile) ---
    const bottomLinks = document.querySelectorAll('.bottom-nav a');
    removeActive(bottomLinks);
    
    const targetBottomLink = document.querySelector(`.bottom-nav a[data-section="${currentActive}"]`);
    if (targetBottomLink) {
        targetBottomLink.classList.add('active');
    }
};

// Smooth in-page scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if(target){
            e.preventDefault();
            
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            // Immediate visual feedback
            const sectionName = this.getAttribute('data-section');
            removeActive(document.querySelectorAll('.navbar .nav-link'));
            removeActive(document.querySelectorAll('.bottom-nav a'));
            document.querySelector(`.navbar .nav-link[data-section="${sectionName}"]`)?.classList.add('active');
            document.querySelector(`.bottom-nav a[data-section="${sectionName}"]`)?.classList.add('active');
            
            // Close mobile nav on click
            const navMenu = document.getElementById('navMenu');
            if(navMenu && navMenu.classList.contains('show')){
                document.querySelector('.navbar-toggler')?.click();
            }

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Update active link again once scroll settles
            setTimeout(updateActiveLink, 500); 
        }
    });
});
// End Scroll and Navigation Logic


// --- TOP-UP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const amountButtons = document.querySelectorAll('.amount-buttons button');
    const customAmountInput = document.getElementById('customAmount');
    const ewalletButtons = document.querySelectorAll('.ewallet-buttons button');

    // Handle predefined amount selection
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAmount = parseFloat(btn.dataset.amount);
            customAmountInput.value = ''; // Clear custom input
            amountButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            checkPaymentStatus();
        });
    });

    // Handle custom amount input
    customAmountInput.addEventListener('input', () => {
        selectedAmount = 0; // Reset predefined amount
        amountButtons.forEach(b => b.classList.remove('active'));
        checkPaymentStatus();
    });

    // Handle E-Wallet selection
    ewalletButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedWallet = btn.dataset.wallet;
            ewalletButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            checkPaymentStatus();
        });
    });

    // Proceed to payment (placeholder)
    document.getElementById('proceedPayment').addEventListener('click', () => {
        const amt = parseFloat(document.getElementById('customAmount').value) || selectedAmount;
        alert(`Proceeding to pay ₱${amt.toFixed(2)} via ${selectedWallet}. (Demo action)`);
    });
});
// End Top-Up Logic


// --- FARE PLANNER LOGIC ---
const checkPlannerStatus = () => {
    const origin = document.getElementById('origin').value;
    const dest = document.getElementById('destination').value;
    const estimateBtn = document.getElementById('estimateFare');
    
    if (origin && dest && origin !== dest) {
        estimateBtn.disabled = false;
    } else {
        estimateBtn.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Passenger type toggle
    document.querySelectorAll('.passenger-type button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            document.querySelectorAll('.passenger-type button').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Attach listener to dropdowns
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    originSelect.addEventListener('change', checkPlannerStatus);
    destinationSelect.addEventListener('change', checkPlannerStatus);

    // Fare estimate (simple demo logic)
    document.getElementById('estimateFare').addEventListener('click', ()=>{
        const origin = originSelect.value;
        const dest = destinationSelect.value;
        const passengerType = document.querySelector('.passenger-type button.active')?.dataset.type || 'regular';

        // Sample logic: base fare + distance factor
        let baseFare = 18;
        let distanceFactor = 7; 
        let fare = baseFare + distanceFactor;

        if(passengerType === 'student') fare *= 0.8;
        if(passengerType === 'senior' || passengerType === 'pwd') fare *= 0.6;

        fare = Math.round(fare * 100) / 100;
        document.getElementById('fareResult').querySelector('h5').textContent = 'Estimated Fare: ₱' + fare.toFixed(2);
    });
});
// End Fare Planner Logic


// --- MAP INITIALIZATION ---
let mapInitialized = false;
let map;
const coords = {
    'SM Lipa': [13.9410,121.1630],
    'Mcdo La Salle': [13.9480,121.1500],
    'Mataas na Kahoy proper': [13.9625,121.1137],
    'Banaybanay':[13.953,121.130],
    'Robinsons Lipa':[13.938,121.162],
    'Tambo':[13.945,121.100],
    'Airbase':[13.958,121.175],
    'Balintawak':[13.965,121.130],
    'Big Ben':[13.949,121.120]
};

const initMap = () => {
    if(mapInitialized) return;

    map = L.map('map', {zoomControl:false}).setView([13.955,121.138], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:18, attribution:'© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers
    Object.keys(coords).forEach(name=>{
        L.marker(coords[name],{title:name}).addTo(map).bindPopup('<b>'+name+'</b>');
    });

    // Demo route polyline
    const routePath = [
        coords['SM Lipa'],
        [13.9450,121.1500],
        [13.9500,121.1300],
        [13.9600,121.1200],
        coords['Mataas na Kahoy proper']
    ];
    L.polyline(routePath,{color: '#D74B2A', weight:5, opacity:0.85}).addTo(map);

    mapInitialized = true;
};

// Initialize Map when Fare Planner section is entered (Optional Performance Improvement)
document.addEventListener('scroll', throttle(() => {
    const plannerSection = document.getElementById('planner');
    if (plannerSection && window.scrollY + window.innerHeight > plannerSection.offsetTop + 100 && !mapInitialized) {
        initMap();
    }
}, 500));


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Call initial scroll update (un-throttled)
    updateActiveLink(); 
    
    // Attach throttled scroll listener
    window.addEventListener('scroll', throttle(updateActiveLink, 100));
});