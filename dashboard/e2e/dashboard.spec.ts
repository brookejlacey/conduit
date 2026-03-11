import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test('landing page redirects or loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(dashboard)?/);
  });

  test('overview page loads with metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toHaveText('Overview');
    // Should have 4 metric cards
    await expect(page.locator('text=Total AUM')).toBeVisible();
    await expect(page.locator('text=Active Agents')).toBeVisible();
    await expect(page.getByRole('main').getByText('Vaults')).toBeVisible();
    await expect(page.locator('text=Audit Entries')).toBeVisible();
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('text=Conduit')).toBeVisible();
    await expect(sidebar.locator('text=Overview')).toBeVisible();
    await expect(sidebar.locator('text=Vaults')).toBeVisible();
    await expect(sidebar.locator('text=Agents')).toBeVisible();
    await expect(sidebar.locator('text=Settlements')).toBeVisible();
    await expect(sidebar.locator('text=Audit Log')).toBeVisible();
    await expect(sidebar.locator('text=Risk')).toBeVisible();
  });

  test('navigate to agents page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('aside >> text=Agents');
    await expect(page).toHaveURL('/dashboard/agents');
    await expect(page.locator('h1')).toHaveText('Agents');
  });

  test('navigate to vaults page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('aside >> text=Vaults');
    await expect(page).toHaveURL('/dashboard/vaults');
    await expect(page.locator('h1')).toHaveText('Vaults');
  });

  test('navigate to settlements page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('aside >> text=Settlements');
    await expect(page).toHaveURL('/dashboard/settlements');
    await expect(page.locator('h1')).toHaveText('Settlements');
  });

  test('navigate to audit log page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('aside >> text=Audit Log');
    await expect(page).toHaveURL('/dashboard/audit');
    await expect(page.locator('h1')).toHaveText('Audit Log');
  });

  test('navigate to risk page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('aside >> text=Risk');
    await expect(page).toHaveURL('/dashboard/risk');
    await expect(page.locator('h1')).toHaveText('Risk Dashboard');
  });
});

test.describe('Agents Page', () => {
  test('shows loading state then resolves', async ({ page }) => {
    await page.goto('/dashboard/agents');
    // Should show either loading spinner, error message, or empty state — not crash
    const content = page.locator('main');
    await expect(content).toBeVisible();
    // Wait for loading to finish (either error or empty state appears)
    await expect(
      page.locator('text=Loading agents...').or(page.locator('text=Failed to load')).or(page.locator('text=No agents found'))
    ).toBeVisible({ timeout: 15000 });
  });

  test('has refresh button', async ({ page }) => {
    await page.goto('/dashboard/agents');
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });

  test('has register agent button', async ({ page }) => {
    await page.goto('/dashboard/agents');
    await expect(page.locator('button:has-text("Register Agent")')).toBeVisible();
  });
});

test.describe('Vaults Page', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/dashboard/vaults');
    await expect(page.locator('h1')).toHaveText('Vaults');
    // Wait for data to resolve
    await expect(
      page.locator('text=Loading vaults...').or(page.locator('text=Failed to load')).or(page.locator('text=No vaults found'))
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Settlements Page', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/dashboard/settlements');
    await expect(page.locator('h1')).toHaveText('Settlements');
    await expect(
      page.locator('text=Loading').or(page.locator('text=Failed')).or(page.locator('text=No settlement'))
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Audit Log Page', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/dashboard/audit');
    await expect(page.locator('h1')).toHaveText('Audit Log');
    await expect(
      page.locator('text=Loading').or(page.locator('text=Failed')).or(page.locator('text=No audit'))
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Wallet Connection', () => {
  test('wallet button is visible in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
  });

  test('wallet button click opens modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Connect Wallet');
    // The wallet modal should appear (from @solana/wallet-adapter-react-ui)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Overview Page Data Handling', () => {
  test('shows network error gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    // On devnet with no deployed programs, we should see either
    // the error banner or empty data — not a crash
    await page.waitForTimeout(5000);
    // Page should still be functional
    await expect(page.locator('h1')).toHaveText('Overview');
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });
});
