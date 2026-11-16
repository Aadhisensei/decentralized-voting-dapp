// ╔══════════════════════════════════════════════════════════════╗
// ║  VoteChain - Decentralized Voting DApp                      ║
// ║  Frontend logic using ethers.js v6                          ║
// ╚══════════════════════════════════════════════════════════════╝

const CONTRACT_ADDRESS = "0x5ef786300ADB12516801513885C193e25ec58cDd";
const SEPOLIA_CHAIN_ID = "0xaa36a7";

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

// State
let provider, signer, contract, userAddress;

// DOM
const connectBtn = document.getElementById("connectBtn");
const heroConnectBtn = document.getElementById("heroConnectBtn");
const heroSection = document.getElementById("heroSection");
const mainContent = document.getElementById("mainContent");
const statusBar = document.getElementById("statusBar");
const networkBadge = document.getElementById("networkBadge");
const walletAddressEl = document.getElementById("walletAddress");
const networkNameEl = document.getElementById("networkName");
const voteStatusEl = document.getElementById("voteStatus");
const ownerPanel = document.getElementById("ownerPanel");
const candidateNameInput = document.getElementById("candidateNameInput");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const candidatesList = document.getElementById("candidatesList");
const noCandidates = document.getElementById("noCandidates");
const totalVotesEl = document.getElementById("totalVotes");
const resultsSection = document.getElementById("resultsSection");
const resultsChart = document.getElementById("resultsChart");

// Flow steps
const flowStep1 = document.getElementById("flowStep1");
const flowStep2 = document.getElementById("flowStep2");
const flowStep3 = document.getElementById("flowStep3");
const flowStep4 = document.getElementById("flowStep4");

// Helpers
function showStatus(msg, type = "info") {
  statusBar.textContent = msg;
  statusBar.className = `status-bar ${type}`;
  statusBar.classList.remove("hidden");
}
function hideStatus() { statusBar.classList.add("hidden"); }
function shortenAddress(a) { return a.slice(0, 6) + "..." + a.slice(-4); }

function updateFlowSteps(candidateCount, hasVoted) {
  // Step 1 always completed after connect
  flowStep1.classList.add("completed");

  if (candidateCount > 0) {
    flowStep2.classList.add("completed");
    flowStep2.querySelector(".flow-dot").textContent = "✓";
    flowStep3.classList.add("active");
  } else {
    flowStep2.classList.add("active");
  }

  if (hasVoted) {
    flowStep3.classList.remove("active");
    flowStep3.classList.add("completed");
    flowStep3.querySelector(".flow-dot").textContent = "✓";
    flowStep4.classList.add("completed");
    flowStep4.querySelector(".flow-dot").textContent = "✓";
  }
}

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed!\nPlease install it from metamask.io");
    return;
  }

  try {
    showStatus("Connecting to MetaMask...", "info");

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = accounts[0];

    // Network check
    const network = await provider.getNetwork();
    if ("0x" + network.chainId.toString(16) !== SEPOLIA_CHAIN_ID) {
      showStatus("Switching to Sepolia...", "info");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } catch (e) {
        showStatus("Please switch to Sepolia network in MetaMask.", "error");
        return;
      }
    }

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Switch from hero to main
    heroSection.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Header updates
    connectBtn.textContent = "✅ " + shortenAddress(userAddress);
    connectBtn.disabled = true;
    connectBtn.style.cursor = "default";
    networkBadge.classList.remove("hidden");

    // Wallet info
    walletAddressEl.textContent = shortenAddress(userAddress);
    networkNameEl.textContent = "Sepolia Testnet";

    // Owner check
    const ownerAddr = await contract.owner();
    if (ownerAddr.toLowerCase() === userAddress.toLowerCase()) {
      ownerPanel.classList.remove("hidden");
    }

    // Vote status
    const voted = await contract.hasVoted(userAddress);
    voteStatusEl.textContent = voted ? "✅ You have already voted" : "🗳️ You haven't voted yet";
    voteStatusEl.style.color = voted ? "#10b981" : "#f59e0b";

    showStatus("✅ Wallet connected successfully!", "success");
    setTimeout(hideStatus, 2500);

    await loadCandidates();

    // Listen for events
    contract.on("CandidateAdded", () => loadCandidates());
    contract.on("Voted", () => loadCandidates());
  } catch (err) {
    console.error(err);
    showStatus("Connection failed: " + (err.reason || err.message), "error");
  }
}

// Load Candidates
async function loadCandidates() {
  try {
    const count = Number(await contract.getCandidateCount());
    candidatesList.innerHTML = "";
    resultsChart.innerHTML = "";

    if (count === 0) {
      noCandidates.classList.remove("hidden");
      resultsSection.classList.add("hidden");
      totalVotesEl.textContent = "0 total votes";
      updateFlowSteps(0, false);
      return;
    }
    noCandidates.classList.add("hidden");

    const voted = await contract.hasVoted(userAddress);
    let grandTotal = 0;
    let maxVotes = 0;
    const candidates = [];

    for (let i = 1; i <= count; i++) {
      const [id, name, voteCount] = await contract.getCandidate(i);
      const votes = Number(voteCount);
      grandTotal += votes;
      if (votes > maxVotes) maxVotes = votes;
      candidates.push({ id: Number(id), name, votes });
    }

    totalVotesEl.textContent = grandTotal + " total vote" + (grandTotal !== 1 ? "s" : "");

    // Update flow
    updateFlowSteps(count, voted);

    // Candidate cards
    candidates.forEach((c) => {
      const pct = maxVotes > 0 ? (c.votes / maxVotes) * 100 : 0;
      const card = document.createElement("div");
      card.className = "candidate-card";
      card.innerHTML = `
        <span class="id-badge">#${c.id}</span>
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="votes">🗳️ ${c.votes} vote${c.votes !== 1 ? "s" : ""}</div>
        <div class="vote-bar"><div class="vote-fill" style="width:${pct}%"></div></div>
        <button class="btn btn-vote" data-id="${c.id}" ${voted ? "disabled" : ""}>
          ${voted ? "✅ Already Voted" : "🗳️ Cast Vote"}
        </button>
      `;
      candidatesList.appendChild(card);
    });

    // Results chart
    if (grandTotal > 0) {
      resultsSection.classList.remove("hidden");
      candidates.forEach((c) => {
        const pct = grandTotal > 0 ? (c.votes / grandTotal) * 100 : 0;
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
          <div class="result-name">${escapeHtml(c.name)}</div>
          <div class="result-bar-bg"><div class="result-bar-fill" style="width:${pct}%"></div></div>
          <div class="result-count">${c.votes} (${Math.round(pct)}%)</div>
        `;
        resultsChart.appendChild(row);
      });
    }

    // Vote handlers
    document.querySelectorAll(".btn-vote:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => castVote(btn.dataset.id));
    });

    // Vote status
    voteStatusEl.textContent = voted ? "✅ You have already voted" : "🗳️ You haven't voted yet";
    voteStatusEl.style.color = voted ? "#10b981" : "#f59e0b";
  } catch (err) {
    console.error("Error loading candidates:", err);
  }
}

// Cast Vote
async function castVote(candidateId) {
  try {
    showStatus("Submitting your vote... please confirm in MetaMask.", "info");
    const tx = await contract.vote(candidateId);
    showStatus("Transaction submitted! Waiting for blockchain confirmation...", "info");
    await tx.wait();
    showStatus("✅ Vote recorded on the blockchain!", "success");
    await loadCandidates();
    setTimeout(hideStatus, 4000);
  } catch (err) {
    console.error(err);
    showStatus(err.reason || err.message || "Transaction failed", "error");
  }
}

// Add Candidate
async function addCandidate() {
  const name = candidateNameInput.value.trim();
  if (!name) {
    showStatus("Please enter a candidate name.", "error");
    setTimeout(hideStatus, 3000);
    return;
  }
  try {
    showStatus("Adding candidate... please confirm in MetaMask.", "info");
    addCandidateBtn.disabled = true;
    const tx = await contract.addCandidate(name);
    showStatus("Transaction submitted! Waiting for blockchain confirmation...", "info");
    await tx.wait();
    candidateNameInput.value = "";
    showStatus("✅ Candidate added to the blockchain!", "success");
    await loadCandidates();
    setTimeout(hideStatus, 4000);
  } catch (err) {
    console.error(err);
    showStatus(err.reason || err.message || "Transaction failed", "error");
  } finally {
    addCandidateBtn.disabled = false;
  }
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Event listeners
connectBtn.addEventListener("click", connectWallet);
heroConnectBtn.addEventListener("click", connectWallet);
addCandidateBtn.addEventListener("click", addCandidate);
candidateNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addCandidate();
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
