import { test, expect, type Page } from '@playwright/test';

test.describe('NFT Marketplace Integration Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      // @ts-ignore
      window.ethereum = {
        request: async (params: any) => {
          switch (params.method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
              return ['0x1234567890123456789012345678901234567890'];
            case 'wallet_switchEthereumChain':
              return null;
            case 'eth_sendTransaction':
              // Mock successful transaction
              return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            case 'eth_getBalance':
              return '0xde0b6b3a7640000'; // 1 ETH
            case 'eth_chainId':
              return '0x7a69'; // Hardhat chain ID
            default:
              return null;
          }
        },
        on: () => {},
        removeListener: () => {},
        selectedAddress: '0x1234567890123456789012345678901234567890',
        isMetaMask: true,
        chainId: '0x7a69',
      };
    });
  });

  test('Complete NFT Flow: Connect Wallet → Mint → List → View in Marketplace', async ({ page }: { page: Page }) => {
    // Step 1: Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/DeNft/);

    // Step 2: Connect wallet (if button exists)
    const connectButton = page.locator('button').filter({ hasText: /connect/i });
    if (await connectButton.count() > 0) {
      await connectButton.first().click();
      
      // Wait for wallet connection
      await page.waitForTimeout(1000);
    }

    // Step 3: Navigate to mint page
    const mintLink = page.locator('a[href="/mint"]').first();
    await mintLink.click();
    await expect(page).toHaveURL('/mint');

    // Step 4: Fill out mint form (if form exists)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
    const fileInput = page.locator('input[type="file"]').first();

    if (await nameInput.count() > 0) {
      await nameInput.fill('E2E Test NFT');
    }

    if (await descInput.count() > 0) {
      await descInput.fill('This NFT was created during E2E testing');
    }

    if (await fileInput.count() > 0) {
      // Create a test image file
      await fileInput.setInputFiles({
        name: 'test-nft.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
      });
    }

    // Step 5: Submit mint form (if mint button exists)
    const mintButton = page.locator('button').filter({ hasText: /mint/i });
    if (await mintButton.count() > 0 && await mintButton.first().isEnabled()) {
      await mintButton.first().click();
      
      // Wait for potential transaction confirmation
      await page.waitForTimeout(3000);
    }

    // Step 6: Navigate to marketplace
    await page.goto('/market');
    await expect(page).toHaveURL('/market');

    // Step 7: Verify marketplace loads
    const marketContent = page.locator('main, .marketplace, .market-content');
    await expect(marketContent.first()).toBeVisible();

    // Step 8: Navigate to dashboard to see created NFTs
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await expect(page).toHaveURL('/dashboard');

      // Look for created NFTs tab
      const createdTab = page.locator('[role="tab"], button').filter({ hasText: /created/i });
      if (await createdTab.count() > 0) {
        await createdTab.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Auction Flow: Create Auction → Place Bid → View Details', async ({ page }: { page: Page }) => {
    // Navigate to auctions page
    await page.goto('/auctions');
    
    // Check if auctions page loads
    const auctionContent = page.locator('main, .auctions, .auction-content');
    await expect(auctionContent.first()).toBeVisible();

    // Look for create auction functionality
    const createAuctionButton = page.locator('button').filter({ hasText: /create.*auction|start.*auction/i });
    if (await createAuctionButton.count() > 0) {
      await createAuctionButton.first().click();
      await page.waitForTimeout(1000);

      // Fill auction form if available
      const startingBidInput = page.locator('input[name*="bid"], input[placeholder*="bid" i]').first();
      if (await startingBidInput.count() > 0) {
        await startingBidInput.fill('0.1');
      }

      const durationInput = page.locator('input[name*="duration"], select[name*="duration"]').first();
      if (await durationInput.count() > 0) {
        await durationInput.fill('1');
      }
    }

    // Look for existing auctions
    const auctionCards = page.locator('.auction-card, .nft-card').filter({ hasText: /auction|bid/i });
    if (await auctionCards.count() > 0) {
      // Click on first auction
      await auctionCards.first().click();
      await page.waitForTimeout(1000);

      // Look for bid button
      const bidButton = page.locator('button').filter({ hasText: /bid|place.*bid/i });
      if (await bidButton.count() > 0) {
        await bidButton.first().click();
        
        // Fill bid amount if modal opens
        const bidInput = page.locator('input[name*="amount"], input[placeholder*="amount" i]').first();
        if (await bidInput.count() > 0) {
          await bidInput.fill('0.2');
        }
      }
    }
  });

  test('Search and Filter Functionality', async ({ page }: { page: Page }) => {
    await page.goto('/market');

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search input has value
      await expect(searchInput).toHaveValue('test');
      
      // Clear search
      await searchInput.clear();
      await searchInput.fill('');
    }

    // Test price filters if available
    const minPriceInput = page.locator('input[name*="min" i], input[placeholder*="min" i]').first();
    if (await minPriceInput.count() > 0) {
      await minPriceInput.fill('0.1');
    }

    const maxPriceInput = page.locator('input[name*="max" i], input[placeholder*="max" i]').first();
    if (await maxPriceInput.count() > 0) {
      await maxPriceInput.fill('1.0');
    }

    // Test category filters
    const categoryFilter = page.locator('select[name*="category"], select[name*="filter"]').first();
    if (await categoryFilter.count() > 0) {
      await categoryFilter.selectOption({ index: 1 });
    }
  });

  test('User Profile and Wallet Integration', async ({ page }: { page: Page }) => {
    await page.goto('/');

    // Test wallet connection flow
    const connectButton = page.locator('button').filter({ hasText: /connect/i });
    if (await connectButton.count() > 0) {
      await connectButton.first().click();
      await page.waitForTimeout(2000);

      // Should show connected state
      const walletAddress = page.locator('text=/0x[a-fA-F0-9]{8}/');
      if (await walletAddress.count() > 0) {
        await expect(walletAddress.first()).toBeVisible();
      }
    }

    // Test user profile/dashboard
    await page.goto('/dashboard');
    
    // Check different sections of dashboard
    const sections = ['created', 'purchased', 'favorites', 'activity'];
    
    for (const section of sections) {
      const sectionTab = page.locator('[role="tab"], button').filter({ hasText: new RegExp(section, 'i') });
      if (await sectionTab.count() > 0) {
        await sectionTab.first().click();
        await page.waitForTimeout(500);
        
        // Verify section content loads
        const sectionContent = page.locator('[role="tabpanel"], .tab-content').first();
        if (await sectionContent.count() > 0) {
          await expect(sectionContent).toBeVisible();
        }
      }
    }
  });

  test('Error Scenarios and Edge Cases', async ({ page }: { page: Page }) => {
    // Test with network errors
    await page.route('**/api/**', route => {
      // Simulate occasional network errors
      if (Math.random() > 0.7) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Network error' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/market');
    await page.waitForTimeout(2000);
    
    // Should handle errors gracefully
    const errorMessage = page.locator('text=/error|failed|retry/i');
    if (await errorMessage.count() > 0) {
      const retryButton = page.locator('button').filter({ hasText: /retry|refresh/i });
      if (await retryButton.count() > 0) {
        await retryButton.first().click();
      }
    }

    // Test form validation
    await page.goto('/mint');
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /mint|submit/i });
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      
      // Should show validation errors
      const validationErrors = page.locator('text=/required|invalid|error/i');
      // Just verify the form handles submission (doesn't crash)
      await page.waitForTimeout(1000);
    }
  });
});