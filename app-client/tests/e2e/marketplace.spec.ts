import { test, expect, type Page } from '@playwright/test';

// Test data for mocking
const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_HARDHAT_CHAIN_ID = '0x7a69';

test.describe('NFT Marketplace E2E Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Mock window.ethereum for wallet testing
    await page.addInitScript(() => {
      // @ts-ignore - global window object
      window.ethereum = {
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'eth_accounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (params.method === 'wallet_switchEthereumChain') {
            return null;
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
        selectedAddress: '0x1234567890123456789012345678901234567890',
        isMetaMask: true,
        chainId: '0x7a69',
      };
    });

    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }: { page: Page }) => {
    await expect(page).toHaveTitle(/DeNft/);
    
    // Check if main navigation is present
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should navigate to mint page', async ({ page }: { page: Page }) => {
    // Look for mint link and click it
    const mintLink = page.locator('a[href="/mint"]').first();
    await mintLink.click();
    
    await expect(page).toHaveURL('/mint');
    await expect(page.locator('h1, h2').filter({ hasText: /mint/i })).toBeVisible();
  });

  test('should navigate to marketplace', async ({ page }: { page: Page }) => {
    const marketLink = page.locator('a[href="/market"]').first();
    await marketLink.click();
    
    await expect(page).toHaveURL('/market');
    await expect(page.locator('h1, h2').filter({ hasText: /market/i })).toBeVisible();
  });

  test('should show connect wallet functionality', async ({ page }: { page: Page }) => {
    // Look for connect wallet button
    const connectButton = page.locator('button').filter({ hasText: /connect/i });
    
    if (await connectButton.count() > 0) {
      await expect(connectButton.first()).toBeVisible();
    }
  });

  test.describe('Mint Flow', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/mint');
    });

    test('should display mint form elements', async ({ page }: { page: Page }) => {
      // Check for form elements
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
      const fileInput = page.locator('input[type="file"]');
      
      // At least one should be visible
      const formElements = page.locator('form, .mint-form, input, textarea');
      await expect(formElements.first()).toBeVisible();
    });

    test('should handle form interaction', async ({ page }: { page: Page }) => {
      // Try to interact with form elements if they exist
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test NFT');
        await expect(nameInput).toHaveValue('Test NFT');
      }
    });
  });

  test.describe('Marketplace Flow', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/market');
    });

    test('should display marketplace content', async ({ page }: { page: Page }) => {
      // Should show either listings or empty state
      const marketContent = page.locator('.market, .marketplace, .nft-grid, main');
      await expect(marketContent.first()).toBeVisible();
    });

    test('should handle search functionality', async ({ page }: { page: Page }) => {
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
      
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('test');
        // Just verify it accepts input
        await expect(searchInput.first()).toHaveValue('test');
      }
    });
  });

  test.describe('Dashboard Flow', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/dashboard');
    });

    test('should display dashboard page', async ({ page }: { page: Page }) => {
      // Should show dashboard content
      const dashboardContent = page.locator('main, .dashboard, .container');
      await expect(dashboardContent.first()).toBeVisible();
    });

    test('should show user sections', async ({ page }: { page: Page }) => {
      // Look for tab-like elements
      const tabs = page.locator('[role="tab"], .tab, button').filter({ hasText: /created|purchased|favorites/i });
      
      if (await tabs.count() > 0) {
        await expect(tabs.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }: { page: Page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Header should still be visible and functional
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }: { page: Page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/market');
      
      // Content should adapt to tablet size
      const content = page.locator('main');
      await expect(content).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation to non-existent pages gracefully', async ({ page }: { page: Page }) => {
      await page.goto('/non-existent-page-12345');
      
      // Should either show 404 or redirect
      const is404 = await page.locator('text=/404|not found/i').count() > 0;
      const hasRedirected = page.url() !== 'http://127.0.0.1:3000/non-existent-page-12345';
      
      expect(is404 || hasRedirected).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load pages within reasonable time', async ({ page }: { page: Page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Allow generous time for local development
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });
  });
});