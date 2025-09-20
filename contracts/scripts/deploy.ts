import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DeNftToken
  console.log("\n📦 Deploying DeNftToken...");
  const DeNftTokenFactory = await ethers.getContractFactory("DeNftToken");
  const nftToken = await DeNftTokenFactory.deploy(
    "DeNft Marketplace",
    "DNFT",
    "https://gateway.pinata.cloud/ipfs/"
  );
  await nftToken.waitForDeployment();

  const nftTokenAddress = await nftToken.getAddress();
  console.log("✅ DeNftToken deployed to:", nftTokenAddress);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`DeNftToken: ${nftTokenAddress}`);

  console.log("\n🔧 Environment Variables for Frontend:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="${nftTokenAddress}"`);
  console.log(`NEXT_PUBLIC_CHAIN_ID="${network.chainId}"`);

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });