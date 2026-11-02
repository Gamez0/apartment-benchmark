const {test,expect}=require('@playwright/test');
test('every route has a readable visual review capture and the main journey keeps its context',async({page},info)=>{
 test.setTimeout(120000);
 const shot=async name=>{
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/visual-${info.project.name}-${name}.png`,fullPage:true});
 };
 await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();
 await expect(page.locator('#referenceVisual')).toHaveAttribute('data-state','photo');
 const hero=await page.evaluate(()=>{const box=id=>document.getElementById(id).getBoundingClientRect();return {period:box('heroPeriod').bottom,answer:box('referenceResult').top,card:document.querySelector('.market-overview').getBoundingClientRect().bottom,result:box('referenceResult').bottom};});
 expect(hero.answer-hero.period).toBeGreaterThanOrEqual(0);expect(hero.answer-hero.period).toBeLessThan(20);expect(hero.card-hero.result).toBeLessThanOrEqual(36);
 await shot('home');await page.locator('#openMarketRank').click();await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});await shot('market');
 await page.locator('#openPurchase').click();await shot('budget-input');
 await page.locator('#buyOwn').fill('20');await page.locator('#buyLoan').fill('0');await page.locator('#purchaseCalculate').click();await expect(page.locator('.purchase-candidate')).toHaveCount(3);await shot('budget-result');
 await page.locator('#purchaseScope').click();await shot('location');await page.locator('#scopeUseForPurchase').click();await expect(page.locator('#buyOwn')).toHaveValue('20');
 await page.locator('.budget-mode a[data-route="move"]').first().click();await shot('move-input');await page.locator('#switchExtra').fill('5');await page.locator('#switchCalculate').click();await expect(page.locator('.switch-preview article')).toHaveCount(3);await shot('move-result');
 await page.locator('[data-review-origin="move"]').first().click();await page.locator('#switchPanel [data-review-open]').click();await shot('shortlist');
 await page.locator('[data-review-detail]').click();await expect(page.locator('#priceChart svg')).toBeVisible();await shot('detail');await page.locator('#close').click();await expect(page).toHaveURL(/#\/shortlist$/);await expect(page.locator('[data-review-detail]')).toBeFocused();
 for(const name of ['candidates','compare','advanced','evidence']){
  await page.goto('/#/'+name);await expect(page.locator('#openMarketRank')).toBeEnabled();await shot(name);
 }
 await page.locator('#heroEvidence > summary').click();await shot('evidence-settings');
 await page.goto('/#/advanced');await expect(page.locator('#openMarketRank')).toBeEnabled();await page.locator('#holdingPanel > summary').click();await shot('advanced-input');
 if(info.project.name==='mobile-webkit-390'){await page.setViewportSize({width:440,height:956});await page.goto('/');await expect(page.locator('#referenceVisual')).toHaveAttribute('data-state','photo');await shot('home-440');}
});
