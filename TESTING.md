# Testing Documentation

This document provides a comprehensive overview of the testing strategy and implementation for the DeNft Marketplace project.

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** - Individual contract functions and components
2. **Integration Tests** - Contract interactions and API endpoints
3. **Security Tests** - Reentrancy, access control, and edge cases
4. **End-to-End Tests** - Complete user flows with browser automation
5. **Performance Tests** - Gas usage and load testing

## 🔐 Contract Security Tests

### Coverage Areas

#### Reentrancy Protection
- **Malicious buyer contracts** attempting to exploit `buyNow` function
- **Malicious bidders** trying to exploit auction bid refunds
- **Malicious withdrawers** attempting multiple proceeds withdrawals
- **Test file**: `contracts/test/SecurityTests.test.ts`

#### Access Control
- **Owner-only functions** (pause, fee changes)
- **Seller verification** for listing operations
- **Bidder restrictions** (seller cannot bid on own auction)

#### Edge Cases
- **Double bid prevention** in same block
- **Buy after cancel** scenarios
- **Multiple cancellation attempts**
- **Auction finalization edge cases**
- **Integer overflow/underflow protection**

#### Gas Limit Testing
- **Maximum active listings** handling
- **Large auction scenarios**
- **Batch operation limits**

### Security Test Examples

```typescript
// Reentrancy attack test
it("Should prevent reentrancy during buyNow", async function () {
  const MaliciousContract = await ethers.getContractFactory("MaliciousBuyer");
  const maliciousContract = await MaliciousContract.deploy();
  
  await expect(
    maliciousContract.attack()
  ).to.be.revertedWithCustomError(marketplace, "ReentrancyGuardReentrantCall");
});

// Double bid prevention
it("Should prevent same user from bidding twice in same block", async function () {
  await ethers.provider.send("evm_setAutomine", [false]);
  
  const tx1 = marketplace.connect(buyer).placeBid(auctionId, { value: ethers.parseEther("1.0") });
  const tx2 = marketplace.connect(buyer).placeBid(auctionId, { value: ethers.parseEther("1.5") });
  
  await ethers.provider.send("evm_mine", []);
  
  await expect(tx1).not.to.be.reverted;
  await expect(tx2).to.be.revertedWithCustomError(marketplace, "BidAlreadyPlaced");
});
```

## 🎭 E2E Testing with Playwright

### Test Scenarios

#### Complete User Flows
1. **Wallet Connection Flow**
   - Connect MetaMask
   - Network switching
   - Account switching

2. **NFT Minting Flow**
   - Form validation
   - File upload
   - Metadata creation
   - Transaction confirmation

3. **Marketplace Flow**
   - Browse listings
   - Search and filter
   - Purchase NFTs
   - View transaction history

4. **Auction Flow**
   - Create auctions
   - Place bids
   - Monitor countdowns
   - Finalize auctions

5. **Dashboard Flow**
   - View owned NFTs
   - Manage listings
   - Track activity

### E2E Test Configuration

```typescript
// Playwright config for local Hardhat testing
export default defineConfig({
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../contracts && npm run node',
      url: 'http://127.0.0.1:8545',
      reuseExistingServer: !process.env.CI,
    }
  ],
});
```

### Mock Wallet Setup

```typescript
// Mock wallet for testing without real MetaMask
await page.addInitScript(() => {
  window.ethereum = {
    request: async (params) => {
      switch (params.method) {
        case 'eth_requestAccounts':
          return ['0x1234567890123456789012345678901234567890'];
        case 'eth_sendTransaction':
          return '0xabcdef...'; // Mock transaction hash
        default:
          return null;
      }
    },
    // ... other wallet methods
  };
});
```

## 📊 Test Coverage Goals

### Contract Coverage Targets
- **Line Coverage**: >95%
- **Branch Coverage**: >90%
- **Function Coverage**: 100%
- **Statement Coverage**: >95%

### Frontend Coverage Targets
- **Component Testing**: All critical UI components
- **Integration Testing**: All user flows
- **Error Handling**: All error scenarios
- **Responsive Testing**: Mobile, tablet, desktop

### Current Coverage Areas

#### Smart Contracts ✅
- [x] NFT minting and transfers
- [x] Fixed price listings
- [x] Auction creation and bidding
- [x] Proceeds withdrawal
- [x] Fee management
- [x] Pausing/unpausing
- [x] Reentrancy protection
- [x] Access control
- [x] Edge cases

#### Frontend E2E ✅
- [x] Navigation between pages
- [x] Responsive design testing
- [x] Form validation
- [x] Wallet connection simulation
- [x] Error state handling
- [x] Performance testing

## 🚀 Running Tests

### Contract Tests

```bash
# Run all contract tests
pnpm test:contracts

# Run specific test file
cd contracts && npx hardhat test test/SecurityTests.test.ts

# Run with coverage
cd contracts && npx hardhat coverage

# Run with gas reporting
cd contracts && REPORT_GAS=true npx hardhat test
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
cd app-client && npx playwright test --headed

# Run specific test file
cd app-client && npx playwright test tests/e2e/marketplace.spec.ts

# Run with UI mode
cd app-client && npx playwright test --ui

# Run on specific browser
cd app-client && npx playwright test --project=chromium
```

### Test Reports

```bash
# View Playwright report
cd app-client && npx playwright show-report

# View contract coverage
cd contracts && open coverage/index.html
```

## 🐛 Debugging Tests

### Contract Test Debugging

```bash
# Enable detailed logs
DEBUG=* npx hardhat test

# Use console.log in tests
console.log("Debug info:", await contract.someFunction());

# Use hardhat console
npx hardhat console --network localhost
```

### E2E Test Debugging

```bash
# Run with debug mode
cd app-client && PWDEBUG=1 npx playwright test

# Record video on failure
# (already configured in playwright.config.ts)

# Take screenshots
await page.screenshot({ path: 'debug.png' });

# Pause execution
await page.pause();
```

## 📈 Continuous Integration

### GitHub Actions Workflow

The CI pipeline runs tests in this order:

1. **Setup** - Install dependencies
2. **Contract Tests** - Security and functionality tests
3. **Frontend Lint** - Code quality checks
4. **Frontend Build** - Build verification
5. **E2E Tests** - End-to-end flow validation
6. **Security Audit** - Dependency vulnerability checks

### Test Environment

- **Node.js**: 18.x
- **Package Manager**: pnpm 8.x
- **Browser**: Chromium (for E2E tests)
- **Network**: Local Hardhat node

### Artifacts

The CI pipeline generates:
- Test coverage reports
- Playwright HTML reports
- Build artifacts
- Gas usage reports

## 🔧 Test Maintenance

### Adding New Tests

1. **For new contract features**:
   ```bash
   # Create test file
   touch contracts/test/NewFeature.test.ts
   
   # Follow existing patterns
   describe("NewFeature", function () {
     // ... test cases
   });
   ```

2. **For new frontend features**:
   ```bash
   # Create E2E test
   touch app-client/tests/e2e/new-feature.spec.ts
   
   # Add to test suite
   test.describe('New Feature', () => {
     // ... test cases
   });
   ```

### Test Data Management

- Use **deterministic test data** for reproducible results
- **Mock external services** (Pinata, Alchemy) in tests
- **Reset state** between tests using beforeEach hooks
- **Use test-specific accounts** for isolation

### Performance Considerations

- **Parallel test execution** for faster CI
- **Cached dependencies** for quicker setup
- **Selective test running** for development
- **Timeout management** for reliable tests

## 📚 Best Practices

### Contract Testing
1. **Test all paths** including error conditions
2. **Use specific error messages** for better debugging
3. **Test with different user roles** (owner, seller, buyer)
4. **Verify state changes** and event emissions
5. **Test gas optimization** scenarios

### E2E Testing
1. **Test critical user journeys** end-to-end
2. **Use page object models** for maintainability
3. **Mock external dependencies** for reliability
4. **Test on multiple browsers** and devices
5. **Handle async operations** properly

### General Testing
1. **Write descriptive test names** explaining what's being tested
2. **Keep tests independent** - no shared state
3. **Use setup/teardown** hooks appropriately
4. **Document complex test scenarios**
5. **Regular test maintenance** and updates

## 🎯 Future Enhancements

### Planned Test Additions
- [ ] Load testing for high-traffic scenarios
- [ ] Multi-user concurrent testing
- [ ] Advanced smart contract fuzzing
- [ ] Visual regression testing
- [ ] Accessibility testing (a11y)
- [ ] Mobile app testing (if mobile app is developed)

### Tool Integrations
- [ ] Codecov for coverage tracking
- [ ] Sentry for error monitoring
- [ ] Lighthouse for performance audits
- [ ] Dependabot for security updates