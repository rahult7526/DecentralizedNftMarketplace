#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * Automates the deployment process to Vercel with proper environment configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🚀 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function warning(message) {
  console.warn(`⚠️ ${message}`);
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function checkEnvironmentFile() {
  const envProdPath = path.join(__dirname, '.env.production');
  const envProdExamplePath = path.join(__dirname, '.env.production.example');
  
  if (!fs.existsSync(envProdPath)) {
    if (fs.existsSync(envProdExamplePath)) {
      warning('.env.production not found');
      log('Copying .env.production.example to .env.production');
      fs.copyFileSync(envProdExamplePath, envProdPath);
      warning('Please update .env.production with your actual values before deployment');
      return false;
    } else {
      error('Neither .env.production nor .env.production.example found');
      return false;
    }
  }
  return true;
}

function validateEnvironmentVariables() {
  const envPath = path.join(__dirname, '.env.production');
  if (!fs.existsSync(envPath)) {
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_NFT_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_CHAIN_ID',
    'NEXT_PUBLIC_ALCHEMY_API_KEY',
    'NEXT_PUBLIC_PINATA_API_KEY',
    'NEXT_PUBLIC_PINATA_SECRET_API_KEY'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.*)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match) {
      missingVars.push(varName);
    } else {
      const value = match[1].trim().replace(/"/g, '');
      if (!value || value === 'your_' + varName.toLowerCase() + '_here' || value === '0x...') {
        placeholderVars.push(varName);
      }
    }
  });
  
  if (missingVars.length > 0) {
    error('Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  if (placeholderVars.length > 0) {
    error('The following environment variables still have placeholder values:');
    placeholderVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  return true;
}

function runPreDeploymentChecks() {
  log('Running pre-deployment checks...');
  
  // Check if in correct directory
  if (!fs.existsSync('package.json')) {
    error('package.json not found. Make sure you\'re in the app-client directory');
    return false;
  }
  
  // Check if Next.js project
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!packageJson.dependencies?.next) {
    error('This doesn\'t appear to be a Next.js project');
    return false;
  }
  
  // Try to build the project
  log('Testing production build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('Production build successful');
  } catch (e) {
    error('Production build failed. Please fix build issues before deployment');
    return false;
  }
  
  return true;
}

function deployToVercel(preview = false) {
  log(preview ? 'Deploying preview to Vercel...' : 'Deploying to production on Vercel...');
  
  try {
    const deployCmd = preview ? 'vercel' : 'vercel --prod';
    execSync(deployCmd, { stdio: 'inherit' });
    log('Deployment completed successfully!');
    return true;
  } catch (e) {
    error('Deployment failed');
    console.error(e.message);
    return false;
  }
}

function showPostDeploymentInstructions() {
  console.log('\n' + '='.repeat(60));
  log('POST-DEPLOYMENT CHECKLIST');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. 🔍 Test your deployed application thoroughly');
  console.log('2. 🔗 Verify contract interactions work correctly');
  console.log('3. 🎨 Test NFT minting and IPFS uploads');
  console.log('4. 🛒 Test marketplace functionality (list, buy, sell)');
  console.log('5. 🔨 Test auction features if enabled');
  console.log('6. 📱 Test on mobile devices');
  console.log('7. 🔐 Verify wallet connections work properly');
  console.log('8. 📊 Check analytics and monitoring');
  console.log('');
  console.log('If everything works correctly, your marketplace is live! 🎉');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview') || args.includes('-p');
  
  console.log('🚀 DeNft Marketplace Vercel Deployment Script');
  console.log('='.repeat(50));
  console.log('');
  
  if (isPreview) {
    log('Running in PREVIEW mode - deployment will create a preview URL');
  } else {
    log('Running in PRODUCTION mode - deployment will go live');
  }
  console.log('');
  
  // Check if Vercel CLI is installed
  if (!checkVercelCLI()) {
    error('Vercel CLI not found');
    console.log('Install it with: npm install -g vercel');
    process.exit(1);
  }
  log('Vercel CLI found');
  
  // Check environment configuration
  if (!checkEnvironmentFile()) {
    error('Environment configuration incomplete');
    console.log('Please update .env.production with your actual values');
    process.exit(1);
  }
  
  if (!validateEnvironmentVariables()) {
    error('Environment validation failed');
    console.log('Please check your .env.production file');
    process.exit(1);
  }
  log('Environment variables validated');
  
  // Run pre-deployment checks
  if (!runPreDeploymentChecks()) {
    error('Pre-deployment checks failed');
    process.exit(1);
  }
  log('Pre-deployment checks passed');
  
  // Deploy to Vercel
  if (!deployToVercel(isPreview)) {
    process.exit(1);
  }
  
  // Show post-deployment instructions
  if (!isPreview) {
    showPostDeploymentInstructions();
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⏹️ Deployment interrupted');
  process.exit(1);
});

main().catch(console.error);