let selectedAmount = 0;
let selectedWallet = null;
const MAX_RECENT_TRANSACTIONS = 3;

// Routes data for transaction simulation
const ROUTES_LIPA_TO_MK = [
  'SM Lipa', 'Balintawak', 'Bigben', 'Robinsons Lipa',
  'De La Salle Lipa', 'Tambo', 'Brgy. Sico', 'Banaybanay', 'Mataas na Kahoy'
];
const ROUTES_MK_TO_LIPA = [
  'Mataas na Kahoy', 'Banaybanay', 'Brgy. Sico', 'Tambo',
  'De La Salle Lipa', 'Robinsons Lipa', 'Bigben', 'Balintawak', 'SM Lipa'
];

/**
 * Helper function to format the date string.
 * TARGET format: Nov 01, 2025 - 06:30 PM
 */
const formatTransactionDate = (date) => {
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart} - ${timePart}`;
};

// Helper function to generate a random trip detail
const generateTripDetail = () => {
  const isLipaToMK = Math.random() > 0.5;
  const routes = isLipaToMK ? ROUTES_LIPA_TO_MK : ROUTES_MK_TO_LIPA;

  const start = routes[0];
  const end = routes[Math.floor(Math.random() * (routes.length - 2)) + 2];

  return `Trip: ${start} → ${end}`;
};


// Central Transaction Data Store (Mock Data)
let transactionHistory = [
  { type: 'deduction', details: generateTripDetail(), amount: -25.00, date: 'Nov 01, 2025 - 06:30 PM', balance: 350.25 },
  { type: 'topup', details: 'Top-Up via GCash', amount: 100.00, date: 'Oct 30, 2025 - 08:45 AM' },
  { type: 'deduction', details: generateTripDetail(), amount: -30.00, date: 'Oct 29, 2025 - 05:15 PM', balance: 280.25 },
  { type: 'deduction', details: generateTripDetail(), amount: -20.00, date: 'Oct 29, 2025 - 07:00 AM', balance: 310.25 },
  { type: 'topup', details: 'Top-Up via Bank', amount: 50.00, date: 'Oct 28, 2025 - 09:00 PM' },
  { type: 'deduction', details: generateTripDetail(), amount: -45.00, date: 'Oct 28, 2025 - 11:00 AM', balance: 290.25 },
];

// Helper function to render the transaction list
const renderTransactions = (containerId, limit = Infinity) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const displayLimit = (containerId === 'transactionContainer') ? MAX_RECENT_TRANSACTIONS : limit;

  transactionHistory.slice(0, displayLimit).forEach(tx => {
    const newItem = document.createElement("p");
    newItem.classList.add('transaction-item', 'transactions', tx.type);

    let amountText = '';
    if (tx.type === 'topup') {
      amountText = `<span>Amount Added: ₱${tx.amount.toFixed(2)}</span>`;
    } else if (tx.type === 'deduction') {
      const balanceDetail = tx.balance ? `<br><span>Remaining Balance: ₱${tx.balance.toFixed(2)}</span>` : '';
      amountText = `<span>Fare Deducted: ₱${Math.abs(tx.amount).toFixed(2)}</span>${balanceDetail}`;
    }

    newItem.innerHTML = `<b>${tx.date}</b><br>${tx.details}<br>${amountText}`;
    container.appendChild(newItem);
  });

  if (transactionHistory.length === 0) {
    container.innerHTML = '<p class="text-center text-muted small">No transactions found.</p>';
  }
};

// Scroll to Top-Up section
const scrollToTopup = () => {
  document.querySelector('#topup').scrollIntoView({ behavior: 'smooth' });
};

// Logic to check if payment can proceed
const checkPaymentStatus = () => {
  const proceedBtn = document.getElementById("proceedPayment");
  const customAmount = parseFloat(document.getElementById("customAmount").value) || 0;
  const amountIsSet = selectedAmount > 0 || customAmount > 0;

  if (amountIsSet && selectedWallet) {
    proceedBtn.disabled = false;
    proceedBtn.textContent = `Proceed to Pay ₱${(selectedAmount || customAmount).toFixed(2)}`;
  } else {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Proceed to Payment";
  }
};


// Initialize events
document.addEventListener("DOMContentLoaded", () => {
  const amountButtons = document.querySelectorAll(".amount-buttons button");
  const ewalletButtons = document.querySelectorAll(".ewallet-buttons button");
  const customAmountInput = document.getElementById("customAmount");
  const historyModalEl = document.getElementById('historyModal');

  // Initial render of recent transactions (Limited to 3)
  renderTransactions('transactionContainer', MAX_RECENT_TRANSACTIONS);

  // Load full history when the modal is shown
  if (historyModalEl) {
    historyModalEl.addEventListener('show.bs.modal', function () {
      renderTransactions('fullTransactionList');
    });
  }

  // --- TOP-UP LOGIC ---

  // Amount Button Clicks
  amountButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedAmount = parseFloat(btn.dataset.amount);
      customAmountInput.value = "";
      amountButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // #1: Check status immediately after amount is set
      checkPaymentStatus();
    });
  });

  // Custom Amount Input
  customAmountInput.addEventListener("input", () => {
    selectedAmount = 0;
    amountButtons.forEach(b => b.classList.remove("active"));
    // #2: Check status immediately after custom input is changed
    checkPaymentStatus();
  });

  // E-Wallet Button Clicks
  ewalletButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedWallet = btn.dataset.wallet;
      ewalletButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // #3: Check status immediately after wallet is set
      checkPaymentStatus();
    });
  });

  // Initial check when the page loads
  checkPaymentStatus();

  // Handle Payment
  document.getElementById("proceedPayment").addEventListener("click", () => {
    const amt = parseFloat(customAmountInput.value) || selectedAmount;
    const toastEl = document.getElementById("paymentToast");
    const toast = new bootstrap.Toast(toastEl);

    // 1. Get current balance and calculate new balance
    const balanceEl = document.getElementById("balanceDisplay");
    let currentBalance = parseFloat(balanceEl.textContent.replace("₱", ""));
    const newBalance = (currentBalance + amt);

    // 2. Add new transaction to the central data store
    const newTransaction = {
      type: 'topup',
      details: `Top-Up via ${selectedWallet.toUpperCase()}`,
      amount: amt,
      date: formatTransactionDate(new Date())
    };
    transactionHistory.unshift(newTransaction);

    // 3. Update the balance display
    balanceEl.textContent = `₱${newBalance.toFixed(2)}`;

    // 4. Re-render the recent list
    renderTransactions('transactionContainer', MAX_RECENT_TRANSACTIONS);

    // 5. Show success message
    toast.show();

    // 6. Reset selections
    selectedAmount = 0;
    selectedWallet = null;
    customAmountInput.value = "";
    amountButtons.forEach(b => b.classList.remove("active"));
    ewalletButtons.forEach(b => b.classList.remove("active"));
    checkPaymentStatus();
  });
});

// Chatbot Logic
document.addEventListener("DOMContentLoaded", () => {
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotBox = document.getElementById("chatbotBox");
  const closeChatbot = document.getElementById("closeChatbot");
  const sendMessage = document.getElementById("sendMessage");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");

  chatbotToggle.addEventListener("click", () => {
    chatbotBox.classList.toggle("d-none");
  });

  closeChatbot.addEventListener("click", () => {
    chatbotBox.classList.add("d-none");
  });

  function addMessage(text, sender = "user") {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.style.margin = "8px 0";
    msg.style.padding = "8px 12px";
    msg.style.borderRadius = "10px";
    msg.style.maxWidth = "80%";
    msg.style.background = sender === "user" ? "var(--orange)" : "var(--light)";
    msg.style.alignSelf = sender === "user" ? "flex-end" : "flex-start";
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function chatbotReply(userText) {
    const responses = [
      "Hi there! How can I assist you today?",
      "You can check your balance or top-up below.",
      "For service announcements, check the section above.",
      "I'm your BATRASCO Assistant — here to help you travel smoothly!"
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => addMessage(reply, "bot"), 600);
  }

  sendMessage.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, "user");
    chatInput.value = "";
    chatbotReply(text);
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage.click();
  });
});
