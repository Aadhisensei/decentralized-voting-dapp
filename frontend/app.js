// ╔══════════════════════════════════════════════════════════════╗
// ║  Decentralized Voting DApp — Frontend Logic                 ║
// ║  Uses ethers.js v6 (loaded via CDN in index.html)           ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── Configuration ──────────────────────────────────────────────
// 🔴  REPLACE this with your deployed contract address
const CONTRACT_ADDRESS = "0x5ef786300ADB12516801513885C193e25ec58cDd";

// Sepolia chain ID (decimal)
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

// Minimal ABI — only the functions we call from the frontend
const CONTRACT_ABI = [
  // Read
  "function owner() view returns (address)",
  "function candidateCount() view returns (uint256)",
  "function hasVoted(address) view returns (bool)",
  "function getCandidate(uint256) view returns (uint256 id, string name, uint256 voteCount)",
  "function getCandidateCount() view returns (uint256)",
  // Write
  "function addCandidate(string) external",
  "function vote(uint256) external",
  // Events
  "event CandidateAdded(uint256 indexed candidateId, string name)",
  "event Voted(address indexed voter, uint256 indexed candidateId)",
];

// ─── State ──────────────────────────────────────────────────────
let provider, signer, contract, userAddress;

// ─── DOM References ─────────────────────────────────────────────
const connectBtn = document.getElementById("connectBtn");
const statusBar = document.getElementById("statusBar");
const walletInfo = document.getElementById("walletInfo");
const walletAddressEl = document.getElementById("walletAddress");
const networkNameEl = document.getElementById("networkName");
const voteStatusEl = document.getElementById("voteStatus");
const ownerPanel = document.getElementById("ownerPanel");
const candidateNameInput = document.getElementById("candidateNameInput");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const candidatesSection = document.getElementById("candidatesSection");
const candidatesList = document.getElementById("candidatesList");
const noCandidates = document.getElementById("noCandidates");

// ─── Helpers ────────────────────────────────────────────────────
function showStatus(message, type = "info") {
  statusBar.textContent = message;
  statusBar.className = `status-bar ${type}`;
  statusBar.classList.remove("hidden");
}

function hideStatus() {
  statusBar.classList.add("hidden");
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// ─── Wallet Connection ──────────────────────────────────────────
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert(
      "MetaMask is not installed!\nPlease install MetaMask to use this DApp."
    );
    return;
  }

  try {
    showStatus("⏳ Connecting wallet…", "info");

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = accounts[0];

    // Check network
    const network = await provider.getNetwork();
    const chainIdHex = "0x" + network.chainId.toString(16);

    if (chainIdHex !== SEPOLIA_CHAIN_ID) {
      showStatus("⚠️  Please switch to the Sepolia test network in MetaMask.", "error");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        // Refresh provider after switch
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } catch (switchError) {
        console.error("Network switch failed:", switchError);
        return;
      }
    }

    // Create contract instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Update UI
    connectBtn.textContent = `✅ ${shortenAddress(userAddress)}`;
    connectBtn.disabled = true;
    walletAddressEl.textContent = shortenAddress(userAddress);
    networkNameEl.textContent = "Sepolia";
    walletInfo.classList.remove("hidden");

    showStatus("✅ Wallet connected!", "success");
    setTimeout(hideStatus, 2500);

    // Check if user is owner → show owner panel
    const ownerAddr = await contract.owner();
    if (ownerAddr.toLowerCase() === userAddress.toLowerCase()) {
      ownerPanel.classList.remove("hidden");
    }

    // Check vote status
    const voted = await contract.hasVoted(userAddress);
    voteStatusEl.textContent = voted ? "✅ You have already voted" : "🗳️ You have not voted yet";

    // Load candidates
    await loadCandidates();

    // Listen for events to auto-refresh
    contract.on("CandidateAdded", () => loadCandidates());
    contract.on("Voted", () => loadCandidates());
  } catch (err) {
    console.error(err);
    showStatus("❌ Connection failed: " + (err.reason || err.message), "error");
  }
}

// ─── Load Candidates ────────────────────────────────────────────
async function loadCandidates() {
  try {
    const count = await contract.getCandidateCount();
    const total = Number(count);

    candidatesList.innerHTML = "";
    candidatesSection.classList.remove("hidden");

    if (total === 0) {
      noCandidates.classList.remove("hidden");
      return;
    }
    noCandidates.classList.add("hidden");

    const voted = await contract.hasVoted(userAddress);

    for (let i = 1; i <= total; i++) {
      const [id, name, voteCount] = await contract.getCandidate(i);

      const card = document.createElement("div");
      card.className = "candidate-card";
      card.innerHTML = `
        <span class="id-badge">#${Number(id)}</span>
        <div class="name">${escapeHtml(name)}</div>
        <div class="votes">🗳️ ${Number(voteCount)} vote${Number(voteCount) !== 1 ? "s" : ""}</div>
        <button class="btn btn-vote" data-id="${Number(id)}" ${voted ? "disabled" : ""}>
          ${voted ? "Already Voted" : "Vote"}
        </button>
      `;
      candidatesList.appendChild(card);
    }

    // Attach vote handlers
    document.querySelectorAll(".btn-vote:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => castVote(btn.dataset.id));
    });

    // Refresh vote status
    voteStatusEl.textContent = voted
      ? "✅ You have already voted"
      : "🗳️ You have not voted yet";
  } catch (err) {
    console.error("Error loading candidates:", err);
  }
}

// ─── Cast Vote ──────────────────────────────────────────────────
async function castVote(candidateId) {
  try {
    showStatus("⏳ Submitting your vote… please confirm in MetaMask.", "info");

    const tx = await contract.vote(candidateId);
    showStatus("⛏️ Transaction submitted. Waiting for confirmation…", "info");
    await tx.wait();

    showStatus("✅ Vote cast successfully!", "success");
    await loadCandidates();
    setTimeout(hideStatus, 3000);
  } catch (err) {
    console.error(err);
    const msg = err.reason || err.message || "Transaction failed";
    showStatus("❌ " + msg, "error");
  }
}

// ─── Add Candidate (Owner) ─────────────────────────────────────
async function addCandidate() {
  const name = candidateNameInput.value.trim();
  if (!name) {
    showStatus("⚠️ Please enter a candidate name.", "error");
    return;
  }

  try {
    showStatus("⏳ Adding candidate… please confirm in MetaMask.", "info");
    addCandidateBtn.disabled = true;

    const tx = await contract.addCandidate(name);
    showStatus("⛏️ Transaction submitted. Waiting for confirmation…", "info");
    await tx.wait();

    candidateNameInput.value = "";
    showStatus("✅ Candidate added!", "success");
    await loadCandidates();
    setTimeout(hideStatus, 3000);
  } catch (err) {
    console.error(err);
    const msg = err.reason || err.message || "Transaction failed";
    showStatus("❌ " + msg, "error");
  } finally {
    addCandidateBtn.disabled = false;
  }
}

// ─── Security: escape HTML in candidate names ──────────────────
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Event Listeners ────────────────────────────────────────────
connectBtn.addEventListener("click", connectWallet);
addCandidateBtn.addEventListener("click", addCandidate);

// Handle account / chain changes
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
