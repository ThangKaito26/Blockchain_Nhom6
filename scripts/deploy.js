// scripts/deploy.js (CommonJS – Hardhat v2)
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploy Certificate Smart Contract ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Admin address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const Factory = await ethers.getContractFactory("Certificate");
  const certificate = await Factory.deploy();
  await certificate.waitForDeployment();

  const contractAddress = await certificate.getAddress();
  console.log("✅ Contract deployed:", contractAddress);

  // Tự động cập nhật frontend/js/config.js
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Certificate.sol/Certificate.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const configPath = path.join(__dirname, "../frontend/js/config.js");
    let content = fs.readFileSync(configPath, "utf8");
    content = content.replace(
      /const CONTRACT_ADDRESS\s*=\s*["'].*["'];/,
      `const CONTRACT_ADDRESS = "${contractAddress}";`
    );
    content = content.replace(
      /const CONTRACT_ABI\s*=\s*\[[\s\S]*?\];/,
      `const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};`
    );
    fs.writeFileSync(configPath, content, "utf8");
    console.log("✅ config.js updated automatically");
  }

  fs.writeFileSync(
    path.join(__dirname, "../deploy-info.json"),
    JSON.stringify({ contractAddress, deployer: deployer.address, deployedAt: new Date().toISOString() }, null, 2)
  );

  console.log("\n🚀 Hướng dẫn tiếp theo:");
  console.log("  1. MetaMask → Add Network: RPC http://127.0.0.1:8545, Chain ID 31337");
  console.log("  2. Import account #0 private key từ hardhat node");
  console.log("  3. Mở frontend/admin.html");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
