const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
test.beforeEach(async({page})=>{
  await page.goto('/');await expect(page.locator('#scopeStatus')).toContainText('공식 자료');
  await expect(page.locator('#comparisonMessage')).toBeEmpty();
});
test('first visit shows the comparison answer without financial forms or deep tools',async({page})=>{
  await expect(page.getByRole('heading',{level:1})).toHaveText('동아2차, 서울과 비교하면?');
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('#referenceResult .overview-home')).toBeVisible();
  for(const id of ['purchaseFlow','nearbyFlow','trendFlow','advancedFlow','scopePanel'])await expect(page.locator('#'+id)).toHaveJSProperty('open',false);
  await expect(page.locator('#buyOwn')).toBeHidden();await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#comparisonChart')).toBeHidden();
  await expect(page.locator('input:visible')).toHaveCount(0);await expect(page.locator('select:visible')).toHaveCount(1);await expect(page.locator('#nearbyLeader')).toBeHidden();await expect(page.locator('#snapshotNote')).toBeHidden();await page.locator('#heroEvidence > summary').click();await expect(page.locator('#snapshotNote')).toContainText('2026년 07월');await page.locator('#heroEvidence > summary').click();
  await expect(page.locator('#openPurchase')).toBeVisible();await expect(page.locator('#openNearby')).toBeVisible();
  expect(await page.locator('#openPurchase').evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
  await page.locator('#heroPeriod').selectOption('3');
  if(await page.locator('#openSparseTrend').count()){await expect(page.locator('.relative-headline')).toContainText('거래가 적어요');await page.locator('#openSparseTrend').click();await expect(page.locator('#comparisonChart svg')).toBeVisible();}
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(scan.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
test('purchase intent reveals inputs and assumptions while preserving edits when folded',async({page})=>{
  await page.locator('#openPurchase').click();await expect(page.locator('#openPurchase')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#buyOwn')).toBeVisible();await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#fundingSummary')).toContainText('LTV 40%');await expect(page.locator('#buyLtv')).toBeHidden();
  await page.locator('#openFunding').click();await expect(page.locator('#buyLtv')).toBeFocused();await page.locator('#buyLtv').fill('70');
  await expect(page.locator('#fundingSummary')).toContainText('LTV 70%');await page.locator('#fundingDetails > summary').click();
  await page.locator('#buyOwn').fill('3');await page.locator('#buyLoan').fill('6');
  await page.locator('#buyArea').selectOption('all');await page.locator('#purchaseCalculate').click();await expect(page.locator('#purchaseResult')).toContainText('9.00억');
  await page.locator('#purchaseFlow > summary').click();await expect(page.locator('#openPurchase')).toHaveAttribute('aria-expanded','false');
  await page.locator('#openPurchase').click();await expect(page.locator('#buyOwn')).toHaveValue('3');await expect(page.locator('#fundingSummary')).toContainText('70%');await expect(page.locator('#purchaseResult')).toContainText('9.00억');
});
test('nearby intent retains the list and choosing a comparison reveals its graph',async({page})=>{
  await page.locator('#openNearby').click();await expect(page.locator('#results article')).toHaveCount(6);await expect(page.locator('#nearbyHeading')).toContainText('신도림동');await expect(page.locator('.nearby-leader')).toHaveJSProperty('open',false);
  await expect(page.locator('#areaScope')).toBeHidden();await expect(page.locator('#listContext')).toContainText('75~95㎡');
  await page.locator('.list-filters > summary').click();await expect(page.locator('#areaScope')).toBeVisible();
  await page.locator('#results [data-add]:not([disabled])').first().click();await expect(page.locator('#comparisonChart')).toBeVisible();
  await expect(page.locator('#comparisonChart svg')).toHaveCount(1);
  await expect(page.locator('#comparisonBack')).toBeInViewport();
  await page.locator('#comparisonBack').click();await expect(page.locator('#results')).toBeInViewport();
  await expect(page.locator('#results [data-add][aria-pressed="true"]')).toHaveCount(1);
  await page.locator('#scopePanel > summary').click();await page.locator('#dong').selectOption('구로동');
  await expect(page.locator('#listContext')).toContainText('구로동');await expect(page.getByRole('heading',{level:1})).toHaveText('동아2차, 서울과 비교하면?');await expect(page.locator('.selection-dock')).toHaveAttribute('data-active','false');
});

test('controls stay next to answers and supplementary evidence stays optional',async({page})=>{
 await expect(page.locator('#referenceResult > .relative-headline')).toContainText('서울보다');
 await expect(page.locator('#scopePanel')).toBeHidden();
 await page.locator('#heroPeriod').selectOption('5');await page.locator('#openNearby').click();
 await expect(page.locator('#nearbyPeriod')).toHaveValue('5');await page.locator('#nearbyPeriod').selectOption('1');await expect(page.locator('#heroPeriod')).toHaveValue('1');
 await page.locator('.nearby-leader > summary').click();await expect(page.locator('#leaderDetail')).toBeVisible();
 await page.locator('#results [data-detail]').first().click();await expect(page.locator('#priceChart svg')).toBeVisible();await expect(page.locator('#bmChart')).toBeHidden();
 await page.locator('#close').click();await expect(page.locator('#detail')).toBeHidden();await expect(page.locator('#results')).toBeInViewport();
 await page.locator('#results [data-add]:not([disabled])').first().click();await expect(page.locator('#comparisonBack')).toBeInViewport();
 await expect(page.locator('#comparisonReadout')).toBeHidden();await page.locator('.chart-values > summary').click();await expect(page.locator('#comparisonReadout')).toBeVisible();
 await page.locator('#chartPeriod').selectOption('3');await expect(page.locator('#nearbyPeriod')).toHaveValue('3');await expect(page.locator('#heroPeriod')).toHaveValue('3');
});

test('representative comparisons expose analyzed peers without replacing the baseline',async({page})=>{
 const peers=page.locator('[data-peer]');const count=await peers.count();expect(count).toBeLessThanOrEqual(2);expect(count).toBeGreaterThan(0);
 await expect(peers.first()).toContainText('서울');await expect(peers.first()).toContainText('%p');
 await peers.first().click();await expect(page.locator('#comparisonBack')).toBeInViewport();await expect(page.getByRole('heading',{level:1})).toHaveText('동아2차, 서울과 비교하면?');
 await expect(page.locator('#comparisonSelected')).not.toBeEmpty();
});
