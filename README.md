# 🗳️ Decentralized Voting DApp

A fully decentralized voting application built on the Ethereum blockchain. Users can connect their MetaMask wallet, view candidates, and cast a vote — all transparently recorded on-chain.

![Voting DApp Screenshot](screenshots/dapp-ui.png)

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Steps to Deploy the Smart Contract](#-steps-to-deploy-the-smart-contract)
- [Steps to Run the Frontend](#-steps-to-run-the-frontend)
- [Contract Details](#-contract-details)
- [Smart Contract Functions](#-smart-contract-functions)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## 📖 Project Description

This Decentralized Voting DApp allows an owner to add candidates and lets users vote for their preferred candidate. Each wallet address can vote only once, ensuring fairness. All data is stored on the Ethereum Sepolia testnet, making it transparent, immutable, and tamper-proof.

**Use Case:** Community elections, club polls, DAO governance proposals, or any scenario requiring a transparent and trustless voting mechanism.

---

## ✨ Features

- 🔗 **MetaMask Wallet Connection** — Seamless one-click wallet integration
- 🗳️ **On-chain Voting** — Votes are stored immutably on the Ethereum blockchain
- 🛡️ **One Vote Per Address** — Smart contract enforces single-vote-per-wallet rule
- 👑 **Owner Panel** — Contract deployer can add new candidates
- 📊 **Live Vote Count** — Real-time vote tallies displayed on the UI
- 🔄 **Auto-refresh** — UI updates automatically when new votes/candidates are added
- ⚡ **Event Driven** — Listens to smart contract events for instant UI updates

---

## 🛠️ Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Smart Contract | Solidity ^0.8.19        |
| Blockchain     | Ethereum Sepolia Testnet|
| Dev Framework  | Hardhat                 |
| Frontend       | HTML / CSS / JavaScript |
| Web3 Library   | ethers.js v6            |
| Wallet         | MetaMask                |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18+ recommended) — [Download](https://nodejs.org/)
2. **MetaMask** browser extension — [Install](https://metamask.io/)
3. **Sepolia Test ETH** — Get from a faucet:
   - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
4. **Alchemy or Infura Account** (for RPC URL) — [Alchemy](https://www.alchemy.com/) | [Infura](https://www.infura.io/)

---

## 🚀 Steps to Deploy the Smart Contract

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/decentralized-voting-dapp.git
cd decentralized-voting-dapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and fill in:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY
```

> ⚠️ **IMPORTANT:** Never commit your `.env` file or share your private key!

### 4. Compile the Smart Contract

```bash
npx hardhat compile
```

### 5. Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

You'll see output like:

```
Deploying Voting contract...

✅  Voting contract deployed to: 0xABC123...
    Network: sepolia

👉  Copy this address into frontend/app.js (CONTRACT_ADDRESS constant)
```

### 6. Update Frontend with Contract Address

Open `frontend/app.js` and replace:

```js
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```

with your deployed contract address:

```js
const CONTRACT_ADDRESS = "0xABC123..."; // your actual address
```

---

## 🖥️ Steps to Run the Frontend

The frontend is a static HTML/CSS/JS application — no build step required!

### Option A: Open Directly

Simply open `frontend/index.html` in your browser.

### Option B: Use a Local Server (recommended)

Using VS Code Live Server extension, or:

```bash
# Using Python
cd frontend
python -m http.server 5500

# Or using Node.js
npx serve frontend
```

Then open `http://localhost:5500` in your browser.

### Using the DApp

1. Click **"🔗 Connect Wallet"** to connect MetaMask
2. Switch to **Sepolia** testnet if prompted
3. If you're the contract owner, use the **Owner Panel** to add candidates
4. Click **"Vote"** on your preferred candidate
5. Confirm the transaction in MetaMask
6. Watch the vote count update in real-time!

---

## 📝 Contract Details

| Property          | Value                                            |
| ----------------- | ------------------------------------------------ |
| **Contract Name** | Voting                                           |
| **Solidity**      | ^0.8.19                                          |
| **Network**       | Sepolia Testnet                                  |
| **Contract Address** | `0x5ef786300ADB12516801513885C193e25ec58cDd` |
| **Block Explorer**| [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x5ef786300ADB12516801513885C193e25ec58cDd) |

---

## 📜 Smart Contract Functions

| Function                  | Access   | Description                              |
| ------------------------- | -------- | ---------------------------------------- |
| `addCandidate(name)`      | Owner    | Add a new candidate to the ballot        |
| `vote(candidateId)`       | Public   | Cast a vote for a candidate              |
| `getCandidate(id)`        | Public   | Get candidate details (id, name, votes)  |
| `getCandidateCount()`     | Public   | Get total number of candidates           |
| `hasVoted(address)`       | Public   | Check if an address has already voted    |
| `owner()`                 | Public   | Get the contract owner's address         |

---

## 📁 Project Structure

```
decentralized-voting-dapp/
├── contracts/
│   └── Voting.sol            # Solidity smart contract
├── scripts/
│   └── deploy.js             # Hardhat deployment script
├── frontend/
│   ├── index.html            # Main UI page
│   ├── app.js                # Frontend logic (ethers.js)
│   └── style.css             # Styles (dark theme)
├── screenshots/
│   └── dapp-ui.png           # UI screenshot
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Node dependencies
├── .env.example              # Environment variables template
├── .gitignore                # Files to ignore in git
└── README.md                 # This file
```

---

## 📸 Screenshots

### Main Voting Interface

![DApp UI](screenshots/dapp-ui.png)

*The main interface showing connected wallet, candidate list with vote counts, and the owner panel for adding candidates.*

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ for Blockchain Development**
