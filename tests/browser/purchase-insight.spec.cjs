const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
test('purchase candidates explain the budget difference before evidence and preserve the decision flow',async({page},testInfo)=>{
 await page.goto('/#/budget');await expect(page.locator('#scopeStatus')).toContainText('공식 자료');
 // Synthetic QA funds only. The candidate transactions remain the unchanged official data.
 await page.locator('#buyOwn').fill('20');await page.locator('#buyLoan').fill('0');await page.locator('#purchaseCalculate').click();
 const cards=page.locator('#purchaseResult .purchase-candidate');await expect(cards).toHaveCount(3);
 const budget=Number((await page.locator('.budget-answer strong').textContent()).replace('억',''));
 for(const card of await cards.all()){
  await expect(card.locator('h3')).toHaveText('구로구 신도림동');await expect(card.locator('.purchase-apartment')).toContainText('전용');
  const price=Number((await card.locator('.purchase-price strong').textContent()).replace('억',''));const left=Number((await card.locator('.purchase-headroom strong').textContent()).replace('억',''));
  expect(Math.round(left*100)).toBe(Math.round(budget*100)-Math.round(price*100));
  await expect(card.locator('.purchase-evidence')).toHaveJSProperty('open',false);await expect(card.locator('.purchase-performance')).toContainText('1년 서울 대비');
 }
 await cards.first().locator('.purchase-evidence > summary').click();await expect(cards.first().locator('.purchase-evidence')).toContainText('필요 대출');await cards.first().locator('.purchase-evidence > summary').click();
 await cards.first().locator('[data-review]').click();await expect(cards.first().locator('[data-review]')).toHaveAttribute('aria-pressed','true');
 await cards.first().locator('[data-purchase-detail]').click();await expect(page).toHaveURL(/#\/detail$/);await expect(page.locator('#priceChart svg')).toBeVisible();await page.locator('#close').click();await expect(page).toHaveURL(/#\/budget$/);await expect(cards.first().locator('[data-review]')).toHaveAttribute('aria-pressed','true');await expect(cards.first().locator('[data-purchase-detail]')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.screenshot({path:'test-results/purchase-insight-'+testInfo.project.name+'.png',fullPage:true});
 await page.locator('#editPurchase').click();await page.locator('#buyOwn').fill('19');await expect(page.locator('#purchaseResult')).toBeEmpty();
});
