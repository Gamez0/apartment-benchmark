const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
test.beforeEach(async({page})=>{
  await page.goto('/');await expect(page.locator('#scopeStatus')).toContainText('공식 자료');
  await expect(page.locator('#comparisonMessage')).toBeEmpty();
});
test('first visit shows the comparison answer without financial forms or deep tools',async({page})=>{
  await expect(page.locator('#referenceResult .overview-home')).toBeVisible();
  for(const id of ['purchaseFlow','nearbyFlow','trendFlow','advancedFlow','scopePanel'])await expect(page.locator('#'+id)).toHaveJSProperty('open',false);
  await expect(page.locator('#buyOwn')).toBeHidden();await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#comparisonChart')).toBeHidden();
  await expect(page.locator('input:visible')).toHaveCount(0);
  await expect(page.locator('#openPurchase')).toBeVisible();await expect(page.locator('#openNearby')).toBeVisible();
  expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(scan.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
test('purchase intent reveals inputs and assumptions while preserving edits when folded',async({page})=>{
  await page.locator('#openPurchase').click();await expect(page.locator('#openPurchase')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#buyOwn')).toBeVisible();await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#fundingSummary')).toContainText('LTV 40%');await expect(page.locator('#buyLtv')).toBeHidden();
  await page.locator('#openFunding').click();await expect(page.locator('#buyLtv')).toBeFocused();await page.locator('#buyLtv').fill('70');
  await expect(page.locator('#fundingSummary')).toContainText('LTV 70%');await page.locator('#fundingDetails > summary').click();
  await page.locator('#buyOwn').fill('3');await page.locator('#buyPartner').fill('0');await page.locator('#buyLoan').fill('6');
  await page.locator('#buyArea').selectOption('all');await page.locator('#purchaseCalculate').click();await expect(page.locator('#purchaseResult')).toContainText('9.00억');
  await page.locator('#purchaseFlow > summary').click();await expect(page.locator('#openPurchase')).toHaveAttribute('aria-expanded','false');
  await page.locator('#openPurchase').click();await expect(page.locator('#buyOwn')).toHaveValue('3');await expect(page.locator('#fundingSummary')).toContainText('70%');await expect(page.locator('#purchaseResult')).toContainText('9.00억');
});
test('nearby intent retains the list and choosing a comparison reveals its graph',async({page})=>{
  await page.locator('#openNearby').click();await expect(page.locator('#results article')).toHaveCount(6);
  await expect(page.locator('#areaScope')).toBeHidden();await expect(page.locator('#listContext')).toContainText('75~95㎡');
  await page.locator('.list-filters > summary').click();await expect(page.locator('#areaScope')).toBeVisible();
  await page.locator('#results [data-add]:not([disabled])').first().click();await expect(page.locator('#comparisonChart')).toBeVisible();
  await expect(page.locator('#comparisonChart svg')).toHaveCount(1);
  await page.locator('#scopePanel > summary').click();await page.locator('#dong').selectOption('구로동');
  await expect(page.locator('#listContext')).toContainText('구로동');await expect(page.locator('.selection-dock')).toHaveAttribute('data-active','false');
});
