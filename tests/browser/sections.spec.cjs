const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#scopeStatus')).toContainText('공식 자료');});
test('nearby cards answer relative performance before price and return from evidence',async({page})=>{
 await page.locator('#openNearby').click();await expect(page.locator('#nearbyHeading')).toContainText('동아2차');
 const card=page.locator('#results article').first();await expect(card.locator('.baseline-relative')).toBeVisible();await expect(card.locator('.excess')).toBeHidden();
 expect(await card.locator('.baseline-relative').evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(await card.locator('.row').evaluate(e=>e.getBoundingClientRect().top));
 await card.locator('[data-add]').click();await expect(page.locator('#comparisonAnswer')).not.toBeEmpty();await expect(page.locator('#comparisonBack')).toBeInViewport();
 await page.locator('#comparisonBack').click();await card.locator('[data-detail]').click();await expect(page.locator('#detailAnswer')).not.toBeEmpty();await expect(page.locator('#stats')).toBeHidden();
 await page.locator('#detailEvidence > summary').click();await expect(page.locator('#stats')).toBeVisible();await page.locator('#close').click();await expect(page.locator('#results')).toBeInViewport();await expect(card.locator('[data-add]')).toHaveAttribute('aria-pressed','true');
});
test('budget keeps funds through region selection, offers empty-state recovery and returns from a candidate',async({page})=>{
 await page.locator('#openPurchase').click();await page.locator('#buyOwn').fill('3');await page.locator('#buyLoan').fill('6');
 await page.locator('#purchaseScope').click();await expect(page.locator('#scopeUseForPurchase')).toBeVisible();await page.locator('#dong').selectOption('구로동');await page.locator('#scopeUseForPurchase').click();await expect(page.locator('#buyOwn')).toBeFocused();await expect(page.locator('#buyOwn')).toHaveValue('3');
 await page.locator('#purchaseCalculate').click();await expect(page.locator('#editPurchase')).toBeVisible();await page.locator('#editPurchase').click();await expect(page.locator('#buyOwn')).toBeFocused();
 await page.locator('#buyOwn').fill('0');await page.locator('#buyLoan').fill('0');await page.locator('#purchaseCalculate').click();await expect(page.locator('#expandPurchaseArea')).toBeVisible();await page.locator('#expandPurchaseArea').click();await expect(page.locator('#buyArea')).toHaveValue('all');
 await page.locator('#editPurchase').click();await page.locator('#buyOwn').fill('20');await page.locator('#purchaseCalculate').click();await expect(page.locator('#purchaseResult .purchase-candidate')).toHaveCount(3);
 await expect(page.locator('.cash-basis')).toHaveJSProperty('open',false);await page.locator('[data-purchase-detail]').first().click();await expect(page.locator('#priceChart svg')).toBeVisible();await page.locator('#close').click();await expect(page.locator('#purchaseResult')).toBeInViewport();await expect(page.locator('#purchaseResult .purchase-candidate')).toHaveCount(3);
});
test('secondary calculations show a relative answer and keep raw statistics and tables optional',async({page})=>{
 await page.locator('#advancedFlow > summary').click();await page.locator('#marketPanel > summary').click();await page.locator('#marketPeriodChoice').selectOption('5');await expect(page.locator('#marketPeriod')).toHaveValue('5');await expect(page.locator('#marketChart svg')).toBeVisible();
 await page.locator('#holdingPanel > summary').click();await expect(page.locator('#holdingStatus')).toBeEmpty();await page.locator('#holdingDate').fill('2016-07-01');await page.locator('#holdingPrice').fill('5');await page.locator('#holdingCalculate').click();await expect(page.locator('#holdingResult > .section-answer')).toContainText('서울 대비');await expect(page.locator('#holdingResult .stats')).toBeHidden();
 await page.locator('[aria-label="갈아타기 예산"] > summary').click();await page.locator('#switchExtra').fill('5');await page.locator('#switchCalculate').click();await expect(page.locator('.switch-preview article')).toHaveCount(3);await expect(page.locator('#switchResult table')).toBeHidden();
});
