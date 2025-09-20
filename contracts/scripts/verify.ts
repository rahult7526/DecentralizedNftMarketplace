import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractName = process.env.CONTRACT_NAME;

  if (!contractAddress || !contractName) {
    console.error("❌ Please set CONTRACT_ADDRESS and CONTRACT_NAME environment variables");
    process.exit(1);
  }

  console.log(`🔍 Verifying ${contractName} at ${contractAddress}...`);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });