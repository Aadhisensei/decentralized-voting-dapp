// ╔══════════════════════════════════════════════════════════════╗
// ║  VoteChain — Decentralized Voting DApp                      ║
// ║  Uses ethers.js v6 (loaded via CDN in index.html)           ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── Configuration ──────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x5ef786300ADB12516801513885C193e25ec58cDd";

// Sepolia chain ID
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

// Minimal ABI
const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function candidateCount() view returns (uint256)",
  "function hasVoted(address) view returns (bool)",
  "function getCandidate(uint256) view returns (uint256 id, string name, uint256 voteCount)",
  "function getCandidateCount() view returns (uint256)",
  "function addCandidate(string) external",
  "function vote(uint256) external",
  "event CandidateAdded(uint256 indexed candidateId, string name)",
  "event Voted(address indexed voter, uint256 indexed candidateId)",
];

// ─── State ──────────────────────────────────────────────────────
let provider, signer, contract, userAddress;

// ─── DOM References ─────────────────────────────────────────────
const connectBtn = document.getElementById("connectBtn");
const heroConnectBtn = document.getElementById("heroConnectBtn");
const heroSection = document.getElementById("heroSection");
const mainContent = document.getElementById("mainContent");
const statusBar = document.getElementById("statusBar");
const networkBadge = document.getElementById("networkBadge");
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
const totalVotesEl = document.getElementById("totalVotes");

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
      "MetaMask is not installed!\nPlease install MetaMask to use this DApp.\n\nhttps://metamask.io/"
    );
    return;
  }

  try {
    showStatus("⏳ Connecting wallet…", "info");

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
      showStatus("⚠️ Switching to Sepolia test network…", "info");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } catch (switchError) {
        showStatus("❌ Please switch to Sepolia network in MetaMask.", "error");
        return;
      }
    }

    // Create contract instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Hide hero, show main content
    heroSection.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Update header
    connectBtn.textContent = `✅ ${shortenAddress(userAddress)}`;
    connectBtn.disabled = true;
    connectBtn.style.cursor = "default";
    networkBadge.classList.remove("hidden");

    // Update wallet info
    walletAddressEl.textContent = shortenAddress(userAddress);
    networkNameEl.textContent = "Sepolia Testnet";

    // Check if user is owner
    const ownerAddr = await contract.owner();
    if (ownerAddr.toLowerCase() === userAddress.toLowerCase()) {
      ownerPanel.classList.remove("hidden");
    }

    // Check vote status
    const voted = await contract.hasVoted(userAddress);
    voteStatusEl.textContent = voted
      ? "✅ You have already voted"
      : "🗳️ You have not voted yet";
    voteStatusEl.style.color = voted ? "#10b981" : "#f59e0b";

    showStatus("✅ Wallet connected successfully!", "success");
    setTimeout(hideStatus, 2500);

    // Load candidates
    await loadCandidates();

    // Listen for events
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

    if (total === 0) {
      noCandidates.classList.remove("hidden");
      totalVotesEl.textContent = "0 total votes";
      return;
    }
    noCandidates.classList.add("hidden");

    const voted = await contract.hasVoted(userAddress);
    let grandTotal = 0;
    let maxVotes = 0;
    const candidates = [];

    // Fetch all candidates first
    for (let i = 1; i <= total; i++) {
      const [id, name, voteCount] = await contract.getCandidate(i);
      const votes = Number(voteCount);
      grandTotal += votes;
      if (votes > maxVotes) maxVotes = votes;
      candidates.push({ id: Number(id), name, votes });
    }

    totalVotesEl.textContent = `${grandTotal} total vote${grandTotal !== 1 ? "s" : ""}`;

    // Render candidate cards
    candidates.forEach((c) => {
      const pct = maxVotes > 0 ? (c.votes / maxVotes) * 100 : 0;

      const card = document.createElement("div");
      card.className = "candidate-card";
      card.innerHTML = `
        <span class="id-badge">#${c.id}</span>
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="votes">🗳️ ${c.votes} vote${c.votes !== 1 ? "s" : ""}</div>
        <div class="vote-bar">
          <div class="vote-fill" style="width: ${pct}%"></div>
        </div>
        <button class="btn btn-vote" data-id="${c.id}" ${voted ? "disabled" : ""}>
          ${voted ? "✅ Already Voted" : "🗳️ Cast Vote"}
        </button>
      `;
      candidatesList.appendChild(card);
    });

    // Attach vote handlers
    document.querySelectorAll(".btn-vote:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => castVote(btn.dataset.id));
    });

    // Refresh vote status
    voteStatusEl.textContent = voted
      ? "✅ You have already voted"
      : "🗳️ You have not voted yet";
    voteStatusEl.style.color = voted ? "#10b981" : "#f59e0b";
  } catch (err) {
    console.error("Error loading candidates:", err);
  }
}

// ─── Cast Vote ──────────────────────────────────────────────────
async function castVote(candidateId) {
  try {
    showStatus("⏳ Submitting your vote… please confirm in MetaMask.", "info");

    const tx = await contract.vote(candidateId);
    showStatus("⛏️ Transaction submitted! Waiting for confirmation…", "info");
    await tx.wait();

    showStatus("✅ Vote cast successfully! 🎉", "success");
    await loadCandidates();
    setTimeout(hideStatus, 4000);
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
    setTimeout(hideStatus, 3000);
    return;
  }

  try {
    showStatus("⏳ Adding candidate… please confirm in MetaMask.", "info");
    addCandidateBtn.disabled = true;

    const tx = await contract.addCandidate(name);
    showStatus("⛏️ Transaction submitted! Waiting for confirmation…", "info");
    await tx.wait();

    candidateNameInput.value = "";
    showStatus("✅ Candidate added successfully! 🎉", "success");
    await loadCandidates();
    setTimeout(hideStatus, 4000);
  } catch (err) {
    console.error(err);
    const msg = err.reason || err.message || "Transaction failed";
    showStatus("❌ " + msg, "error");
  } finally {
    addCandidateBtn.disabled = false;
  }
}

// ─── Escape HTML ────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Event Listeners ────────────────────────────────────────────
connectBtn.addEventListener("click", connectWallet);
heroConnectBtn.addEventListener("click", connectWallet);
addCandidateBtn.addEventListener("click", addCandidate);

// Enter key to add candidate
candidateNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addCandidate();
});

// Handle account / chain changes
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
