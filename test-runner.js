#!/usr/bin/env node

/**
 * Test Runner Script for DeNft Marketplace
 * Demonstrates various testing scenarios and provides easy test execution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 DeNft Marketplace Test Runner\n');

// Check if we're in the right directory
const currentDir = process.cwd();
const isInRoot = fs.existsSync(path.join(currentDir, 'contracts')) && 
                 fs.existsSync(path.join(currentDir, 'app-client'));

if (!isInRoot) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Test execution functions
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: currentDir });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

function runContractTests() {
  console.log('\n📋 Running Contract Tests');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      command: 'cd contracts && npm test',
      description: 'All contract tests'
    },
    {
      command: 'cd contracts && npx hardhat test test/SecurityTests.test.ts',
      description: 'Security tests (reentrancy, edge cases)'
    },
    {
      command: 'cd contracts && npx hardhat test test/NFTMarketplace.test.ts',
      description: 'NFT Marketplace functionality tests'
    }
  ];

  let passed = 0;
  tests.forEach(test => {
    if (runCommand(test.command, test.description)) {
      passed++;
    }
  });

  console.log(`\n📊 Contract Tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

function runFrontendTests() {
  console.log('\n🎭 Running Frontend Tests');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      command: 'cd app-client && npm run lint',
      description: 'ESLint checks'
    },
    {
      command: 'cd app-client && npm run type-check',
      description: 'TypeScript type checking'
    },
    {
      command: 'cd app-client && npm run build',
      description: 'Production build'
    }
  ];

  let passed = 0;
  tests.forEach(test => {
    if (runCommand(test.command, test.description)) {
      passed++;
    }
  });

  console.log(`\n📊 Frontend Tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

function runE2ETests() {
  console.log('\n🌐 Running E2E Tests');
  console.log('=' .repeat(50));
  
  // Check if Playwright is installed
  const playwrightInstalled = fs.existsSync(path.join(currentDir, 'app-client', 'node_modules', '@playwright', 'test'));
  
  if (!playwrightInstalled) {
    console.log('📦 Installing Playwright...');
    if (!runCommand('cd app-client && npm install @playwright/test', 'Playwright installation')) {
      return false;
    }
    
    console.log('🌐 Installing browsers...');
    if (!runCommand('cd app-client && npx playwright install chromium', 'Browser installation')) {
      return false;
    }
  }

  const tests = [
    {
      command: 'cd app-client && npx playwright test tests/e2e/marketplace.spec.ts',
      description: 'Marketplace E2E tests'
    },
    {
      command: 'cd app-client && npx playwright test tests/e2e/integration.spec.ts',
      description: 'Integration flow tests'
    }
  ];

  let passed = 0;
  tests.forEach(test => {
    if (runCommand(test.command, test.description)) {
      passed++;
    }
  });

  console.log(`\n📊 E2E Tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

function runCoverage() {
  console.log('\n📈 Generating Coverage Reports');
  console.log('=' .repeat(50));
  
  const success = runCommand(
    'cd contracts && npx hardhat coverage',
    'Contract coverage analysis'
  );

  if (success) {
    console.log('\n📋 Coverage report generated at: contracts/coverage/index.html');
  }
  
  return success;
}

function showTestSummary(contractsPassed, frontendPassed, e2ePassed, coveragePassed) {
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`🔐 Contract Tests:     ${contractsPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🎨 Frontend Tests:     ${frontendPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🌐 E2E Tests:          ${e2ePassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`📈 Coverage:           ${coveragePassed ? '✅ GENERATED' : '❌ FAILED'}`);
  
  const totalPassed = [contractsPassed, frontendPassed, e2ePassed, coveragePassed].filter(Boolean).length;
  console.log(`\n🏆 Overall: ${totalPassed}/4 test suites passed`);
  
  if (totalPassed === 4) {
    console.log('\n🎉 All tests passed! Your marketplace is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0];

  console.log('Available test options:');
  console.log('  contracts  - Run smart contract tests');
  console.log('  frontend   - Run frontend linting and build');
  console.log('  e2e        - Run end-to-end tests');
  console.log('  coverage   - Generate coverage reports');
  console.log('  all        - Run all tests (default)');
  console.log('');

  let contractsPassed = true;
  let frontendPassed = true;
  let e2ePassed = true;
  let coveragePassed = true;

  switch (testType) {
    case 'contracts':
      contractsPassed = runContractTests();
      frontendPassed = e2ePassed = coveragePassed = null; // Not run
      break;
      
    case 'frontend':
      frontendPassed = runFrontendTests();
      contractsPassed = e2ePassed = coveragePassed = null; // Not run
      break;
      
    case 'e2e':
      e2ePassed = runE2ETests();
      contractsPassed = frontendPassed = coveragePassed = null; // Not run
      break;
      
    case 'coverage':
      coveragePassed = runCoverage();
      contractsPassed = frontendPassed = e2ePassed = null; // Not run
      break;
      
    case 'all':
    default:
      contractsPassed = runContractTests();
      frontendPassed = runFrontendTests();
      e2ePassed = runE2ETests();
      coveragePassed = runCoverage();
      break;
  }

  // Show summary only if running multiple test types
  if (testType === 'all' || !testType) {
    showTestSummary(contractsPassed, frontendPassed, e2ePassed, coveragePassed);
  }

  // Exit with appropriate code
  const anyFailed = [contractsPassed, frontendPassed, e2ePassed, coveragePassed]
    .filter(result => result !== null)
    .some(result => !result);
    
  process.exit(anyFailed ? 1 : 0);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test execution interrupted');
  process.exit(1);
});

main().catch(console.error);