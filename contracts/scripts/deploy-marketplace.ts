import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting marketplace deployment...");

  // Get the deployer account
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

  // Deploy NFTMarketplace
  console.log("\n🏪 Deploying NFTMarketplace...");
  const MarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await MarketplaceFactory.deploy(250); // 2.5% marketplace fee
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);

  // Verify contracts on Etherscan (if not on localhost)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337n) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      console.log("Verifying DeNftToken...");
      await hre.run("verify:verify", {
        address: nftTokenAddress,
        constructorArguments: [
          "DeNft Marketplace",
          "DNFT",
          "https://gateway.pinata.cloud/ipfs/"
        ],
      });

      console.log("Verifying NFTMarketplace...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [250],
      });

      console.log("✅ Contracts verified successfully!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      DeNftToken: {
        address: nftTokenAddress,
        transactionHash: nftToken.deploymentTransaction()?.hash,
      },
      NFTMarketplace: {
        address: marketplaceAddress,
        transactionHash: marketplace.deploymentTransaction()?.hash,
      },
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`DeNftToken: ${deploymentInfo.contracts.DeNftToken.address}`);
  console.log(`NFTMarketplace: ${deploymentInfo.contracts.NFTMarketplace.address}`);

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `marketplace-deployment-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Environment variables for frontend
  console.log("\n🔧 Environment Variables for Frontend:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="${nftTokenAddress}"`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="${marketplaceAddress}"`);
  console.log(`NEXT_PUBLIC_CHAIN_ID="${network.chainId}"`);

  // Test the deployment
  console.log("\n🧪 Testing deployment...");
  
  // Mint a test NFT
  const mintTx = await nftToken.mint(
    deployer.address,
    "https://gateway.pinata.cloud/ipfs/QmTestToken"
  );
  await mintTx.wait();
  console.log("✅ Test NFT minted");

  // Approve marketplace
  const approveTx = await nftToken.approve(marketplaceAddress, 0);
  await approveTx.wait();
  console.log("✅ Marketplace approved for NFT");

  // Create a test listing
  const listTx = await marketplace.listItem(
    nftTokenAddress,
    0,
    ethers.parseEther("1.0")
  );
  await listTx.wait();
  console.log("✅ Test listing created");

  // Check active listings
  const activeListings = await marketplace.getActiveListings();
  console.log(`✅ Active listings: ${activeListings.length}`);

  console.log("\n🎉 Marketplace deployment and testing completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
