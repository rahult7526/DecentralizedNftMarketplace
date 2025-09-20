import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

const { ethers } = hre;

interface DeploymentConfig {
  network: string;
  chainId: string;
  deployer: string;
  contracts: {
    DeNftToken: {
      address: string;
      transactionHash: string;
      constructorArgs: any[];
    };
    NFTMarketplace: {
      address: string;
      transactionHash: string;
      constructorArgs: any[];
    };
  };
  gasUsed: {
    DeNftToken: string;
    NFTMarketplace: string;
    total: string;
  };
  timestamp: string;
  blockNumbers: {
    DeNftToken: number;
    NFTMarketplace: number;
  };
}

async function main() {
  console.log("🚀 Starting production deployment to Sepolia...");
  console.log("================================================\n");

  // Environment validation
  console.log("🔍 Validating environment variables...");
  const requiredEnvVars = ['PRIVATE_KEY', 'ALCHEMY_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error("\nPlease set these variables in your .env file or environment.");
    process.exit(1);
  }

  // Get network and deployer info
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  
  console.log("✅ Environment validation passed");
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceETH = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceETH} ETH`);
  
  // Check if we have enough ETH for deployment
  const minBalance = ethers.parseEther("0.05"); // Minimum 0.05 ETH for deployment
  if (balance < minBalance) {
    console.error("❌ Insufficient ETH balance for deployment");
    console.error(`   Required: at least 0.05 ETH`);
    console.error(`   Current: ${balanceETH} ETH`);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));

  // Track gas usage
  let totalGasUsed = 0n;
  
  // Deploy DeNftToken
  console.log("\n📦 Deploying DeNftToken...");
  const DeNftTokenFactory = await ethers.getContractFactory("DeNftToken");
  
  // Constructor arguments
  const nftName = "DeNft Marketplace";
  const nftSymbol = "DNFT";
  const baseURI = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
  const nftConstructorArgs = [nftName, nftSymbol, baseURI];
  
  console.log(`   Name: ${nftName}`);
  console.log(`   Symbol: ${nftSymbol}`);
  console.log(`   Base URI: ${baseURI}`);
  
  const nftToken = await DeNftTokenFactory.deploy(...nftConstructorArgs);
  const nftDeployTx = await nftToken.waitForDeployment();
  const nftReceipt = await nftToken.deploymentTransaction()?.wait();
  
  const nftTokenAddress = await nftToken.getAddress();
  const nftGasUsed = nftReceipt?.gasUsed || 0n;
  totalGasUsed += nftGasUsed;
  
  console.log("✅ DeNftToken deployed successfully!");
  console.log(`   Address: ${nftTokenAddress}`);
  console.log(`   Gas used: ${nftGasUsed.toString()}`);
  console.log(`   Block: ${nftReceipt?.blockNumber}`);

  // Deploy NFTMarketplace
  console.log("\n🏪 Deploying NFTMarketplace...");
  const MarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
  
  // Constructor arguments
  const marketplaceFee = 250; // 2.5% marketplace fee
  const marketplaceConstructorArgs = [marketplaceFee];
  
  console.log(`   Marketplace Fee: ${marketplaceFee / 100}%`);
  
  const marketplace = await MarketplaceFactory.deploy(marketplaceFee);
  const marketplaceDeployTx = await marketplace.waitForDeployment();
  const marketplaceReceipt = await marketplace.deploymentTransaction()?.wait();
  
  const marketplaceAddress = await marketplace.getAddress();
  const marketplaceGasUsed = marketplaceReceipt?.gasUsed || 0n;
  totalGasUsed += marketplaceGasUsed;
  
  console.log("✅ NFTMarketplace deployed successfully!");
  console.log(`   Address: ${marketplaceAddress}`);
  console.log(`   Gas used: ${marketplaceGasUsed.toString()}`);
  console.log(`   Block: ${marketplaceReceipt?.blockNumber}`);

  // Calculate deployment costs
  const gasPrice = await ethers.provider.getGasPrice();
  const totalCostWei = totalGasUsed * gasPrice;
  const totalCostETH = ethers.formatEther(totalCostWei);
  
  console.log(`\n💰 Total deployment cost: ${totalCostETH} ETH`);

  // Create deployment info
  const deploymentInfo: DeploymentConfig = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      DeNftToken: {
        address: nftTokenAddress,
        transactionHash: nftToken.deploymentTransaction()?.hash || "",
        constructorArgs: nftConstructorArgs,
      },
      NFTMarketplace: {
        address: marketplaceAddress,
        transactionHash: marketplace.deploymentTransaction()?.hash || "",
        constructorArgs: marketplaceConstructorArgs,
      },
    },
    gasUsed: {
      DeNftToken: nftGasUsed.toString(),
      NFTMarketplace: marketplaceGasUsed.toString(),
      total: totalGasUsed.toString(),
    },
    timestamp: new Date().toISOString(),
    blockNumbers: {
      DeNftToken: nftReceipt?.blockNumber || 0,
      NFTMarketplace: marketplaceReceipt?.blockNumber || 0,
    },
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `sepolia-deployment-${timestamp}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Contract verification
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    console.log("⏰ Waiting 60 seconds for contracts to propagate...");
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    try {
      console.log("   Verifying DeNftToken...");
      await hre.run("verify:verify", {
        address: nftTokenAddress,
        constructorArguments: nftConstructorArgs,
      });
      console.log("   ✅ DeNftToken verified");

      console.log("   Verifying NFTMarketplace...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: marketplaceConstructorArgs,
      });
      console.log("   ✅ NFTMarketplace verified");

      console.log("🎉 All contracts verified successfully!");
    } catch (error) {
      console.log("⚠️ Verification failed (this is optional):");
      console.log(`   ${error}`);
      console.log("   You can verify manually later using the provided info.");
    }
  } else {
    console.log("\n⚠️ ETHERSCAN_API_KEY not set - skipping contract verification");
    console.log("   Add ETHERSCAN_API_KEY to your environment to enable auto-verification");
  }

  // Run basic tests to ensure deployment is functional
  console.log("\n🧪 Running deployment verification tests...");
  
  try {
    // Test NFT contract
    const tokenName = await nftToken.name();
    const tokenSymbol = await nftToken.symbol();
    console.log(`   ✅ NFT contract functional: ${tokenName} (${tokenSymbol})`);
    
    // Test marketplace contract
    const marketplaceFeeResult = await marketplace.marketplaceFeePercentage();
    console.log(`   ✅ Marketplace contract functional: ${marketplaceFeeResult / 100}% fee`);
    
    // Test basic functionality (if deployer wants to mint a test NFT)
    if (process.env.DEPLOY_TEST_NFT === "true") {
      console.log("   🎨 Minting test NFT...");
      const testTokenURI = "https://gateway.pinata.cloud/ipfs/QmTestDeployment";
      const mintTx = await nftToken.mint(deployer.address, testTokenURI);
      await mintTx.wait();
      console.log(`   ✅ Test NFT minted with URI: ${testTokenURI}`);
      
      // Test marketplace approval
      console.log("   🔐 Testing marketplace approval...");
      const approveTx = await nftToken.approve(marketplaceAddress, 0);
      await approveTx.wait();
      console.log("   ✅ Marketplace approval successful");
    }
    
  } catch (error) {
    console.log("⚠️ Deployment verification tests failed:");
    console.log(`   ${error}`);
    console.log("   Please check the contracts manually");
  }

  // Generate environment variables
  console.log("\n" + "=".repeat(80));
  console.log("🔧 ENVIRONMENT VARIABLES FOR FRONTEND DEPLOYMENT");
  console.log("=".repeat(80));
  console.log("");
  console.log("Copy these variables to your frontend .env.production or Vercel deployment:");
  console.log("");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="${nftTokenAddress}"`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="${marketplaceAddress}"`);
  console.log(`NEXT_PUBLIC_CHAIN_ID="${network.chainId}"`);
  console.log(`NEXT_PUBLIC_NETWORK_NAME="${network.name}"`);
  console.log(`NEXT_PUBLIC_ALCHEMY_API_KEY="your_alchemy_api_key_here"`);
  console.log(`NEXT_PUBLIC_PINATA_API_KEY="your_pinata_api_key_here"`);
  console.log(`NEXT_PUBLIC_PINATA_SECRET_API_KEY="your_pinata_secret_key_here"`);
  console.log(`NEXT_PUBLIC_PINATA_GATEWAY="${baseURI}"`);
  console.log("");

  // Generate contract addresses for wagmi config
  console.log("📋 FOR WAGMI CONFIGURATION (lib/contracts.ts):");
  console.log("=".repeat(50));
  console.log("");
  console.log("Update your contracts configuration:");
  console.log("");
  console.log(`export const NFT_CONTRACT_ADDRESS = "${nftTokenAddress}" as const;`);
  console.log(`export const MARKETPLACE_CONTRACT_ADDRESS = "${marketplaceAddress}" as const;`);
  console.log("");

  // Etherscan links
  const etherscanBase = network.chainId === 11155111n ? "https://sepolia.etherscan.io" : "https://etherscan.io";
  console.log("🔗 ETHERSCAN LINKS:");
  console.log("=".repeat(20));
  console.log(`DeNftToken: ${etherscanBase}/address/${nftTokenAddress}`);
  console.log(`NFTMarketplace: ${etherscanBase}/address/${marketplaceAddress}`);
  console.log("");

  // Deployment summary
  console.log("📋 DEPLOYMENT SUMMARY:");
  console.log("=".repeat(22));
  console.log(`✅ Network: ${network.name} (${network.chainId})`);
  console.log(`✅ Deployer: ${deployer.address}`);
  console.log(`✅ DeNftToken: ${nftTokenAddress}`);
  console.log(`✅ NFTMarketplace: ${marketplaceAddress}`);
  console.log(`✅ Total Gas Used: ${totalGasUsed.toString()}`);
  console.log(`✅ Total Cost: ${totalCostETH} ETH`);
  console.log(`✅ Deployment file: ${filename}`);
  console.log("");
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Copy the environment variables above to your frontend");
  console.log("2. Update your frontend contract configuration");
  console.log("3. Deploy your frontend to Vercel or your preferred platform");
  console.log("4. Test the complete marketplace functionality");
  console.log("");
}

// Enhanced error handling
main()
  .then(() => {
    console.log("✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error("=====================");
    console.error(error);
    console.error("\nPlease check:");
    console.error("1. Your environment variables are set correctly");
    console.error("2. You have sufficient ETH balance");
    console.error("3. Your private key has the necessary permissions");
    console.error("4. The network connection is stable");
    process.exit(1);
  });