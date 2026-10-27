const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...\n");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log(`✅  Voting contract deployed to: ${address}`);
  console.log(`    Network: ${hre.network.name}`);
  console.log(
    `\n👉  Copy this address into frontend/app.js (CONTRACT_ADDRESS constant)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
