const {test,expect}=require('@playwright/test');
async function start(page,path='/'){await page.goto(path);await expect(page.locator('#openMarketRank')).toBeEnabled();}
async function market(page){await page.locator('#openMarketRank').click();await expect(page).toHaveURL(/#\/market$/);await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});}
test('CTA changes URL and visible screen; browser back and forward restore the route',async({page})=>{
 await start(page);await market(page);await expect(page.locator('.landing-screen')).toBeHidden();await expect(page.locator('#marketRankFlow')).toBeVisible();await expect(page.locator('#buyOwn')).toBeHidden();
 await expect(page.locator('#flowTitle')).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
 await page.goBack();await expect(page).toHaveURL(/#\/home$/);await expect(page.locator('#marketRankFlow')).toBeHidden();await expect(page.locator('#openMarketRank')).toBeVisible();
 await page.goForward();await expect(page).toHaveURL(/#\/market$/);await expect(page.locator('#marketRankFlow')).toBeVisible();
});
test('detail history preserves low side, selected candidate, source focus and list position',async({page})=>{
 await start(page);await market(page);await page.locator('[data-rank-side="low"]').click();const button=page.locator('[data-rank-detail]').nth(2);const key=await button.getAttribute('data-rank-detail');await button.scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);await button.click();await expect(page).toHaveURL(/#\/detail$/);await expect(page.locator('#marketRankFlow')).toBeHidden();await expect(page.locator('#priceChart svg')).toBeVisible();await expect(page).not.toHaveTitle(/거래 불러오는 중/);await expect(page.locator('#flowTitle')).toHaveText(await page.locator('#detailTitle').textContent());
 await page.locator('#close').click();await expect(page).toHaveURL(/#\/market$/);await expect(page.locator('[data-rank-side="low"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-rank-detail="'+key+'"]')).toBeFocused();await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(16);
 await page.goForward();await expect(page).toHaveURL(/#\/detail$/);await expect(page.locator('#detailTitle')).not.toBeEmpty();
});
test('sequential budget navigation keeps funds through region edit and never puts money in URL/history',async({page})=>{
 await start(page);await market(page);await page.locator('#openPurchase').click();await expect(page.locator('#marketRankFlow')).toBeHidden();await expect(page).toHaveURL(/#\/budget$/);await expect(page.locator('#results')).toBeHidden();
 await page.locator('#buyOwn').fill('987.6543');await page.locator('#buyLoan').fill('0');await page.locator('#purchaseScope').click();await expect(page).toHaveURL(/#\/location$/);await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#switchPanel')).toBeHidden();await expect(page.locator('#purchaseFlow')).toBeHidden();await page.locator('#dong').selectOption('구로동');await page.locator('#scopeUseForPurchase').click();await expect(page).toHaveURL(/#\/budget$/);await expect(page.locator('#buyOwn')).toHaveValue('987.6543');await page.goBack();await expect(page).toHaveURL(/#\/location$/);await expect(page.locator('#dong')).toHaveValue('구로동');await expect(page.locator('#results')).toBeHidden();await page.goForward();await expect(page).toHaveURL(/#\/budget$/);await expect(page.locator('#buyOwn')).toHaveValue('987.6543');expect(page.url()).not.toContain('987.6543');expect(await page.evaluate(()=>JSON.stringify(history.state))).not.toContain('987.6543');
 await page.reload();await expect(page).toHaveURL(/#\/budget$/);await expect(page.locator('#buyOwn')).toHaveValue('');await expect(page.locator('#purchaseResult')).toBeEmpty();
});
test('direct market URL loads data and invalid or unselected detail URLs recover visibly',async({page})=>{
 await start(page,'/#/market');await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});await expect(page.locator('#marketRankResults article')).toHaveCount(6);await expect(page.locator('.landing-screen')).toBeHidden();
 await page.goto('/#/detail');await expect(page).toHaveURL(/#\/home$/);await expect(page.locator('#routeStatus')).toContainText('단지를 먼저');
 await page.goto('/#/missing');await expect(page).toHaveURL(/#\/home$/);await expect(page.locator('#routeStatus')).toContainText('찾을 수 없는');
});
test('secondary pages and keyboard CTA have isolated focus and a return path',async({page})=>{
 await start(page);await page.locator('#openMarketRank').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/#\/market$/);await expect(page.locator('#flowTitle')).toBeFocused();expect(await page.locator('.landing-screen').evaluate(e=>e.inert)).toBe(true);
 await page.locator('#flowBack').click();await expect(page).toHaveURL(/#\/home$/);await page.locator('a[data-route="evidence"]').click();await expect(page).toHaveURL(/#\/evidence$/);await expect(page.locator('.landing-screen')).toBeHidden();await page.locator('#heroEvidence > summary').click();await expect(page.locator('#referenceSearch')).toBeVisible();await page.locator('#flowBack').click();await expect(page).toHaveURL(/#\/home$/);
 await page.locator('a[data-route="advanced"]').click();await expect(page).toHaveURL(/#\/advanced$/);await expect(page.locator('#advancedFlow')).toBeVisible();expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
});
