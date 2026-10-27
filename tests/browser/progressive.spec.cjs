const {test,expect}=require('@playwright/test');
const manifest=require('../../site/seoul/manifest.json');
test('slow citywide response preserves summary and next-action positions, including failure and retry',async({page})=>{
 const d=manifest.districts.find(d=>d.code==='11110'),path='**/seoul/'+d.file;
 let release;const gate=new Promise(r=>release=r);
 await page.route(path,async route=>{await gate;await route.fulfill({status:503,body:'controlled network failure'});});
 await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();await page.locator('#openMarketRank').click();
 await expect(page.locator('#marketRankTop')).toHaveAttribute('aria-busy','true');await expect(page.locator('.rank-placeholder')).toHaveCount(3);
 await expect(page.locator('[data-rank-preview]')).toHaveCount(0);
 const before=await page.locator('#openPurchase').evaluate(e=>e.getBoundingClientRect().top+scrollY);
 release();await expect(page.locator('#marketRankRetry')).toBeVisible({timeout:30000});
 const failed=await page.locator('#openPurchase').evaluate(e=>e.getBoundingClientRect().top+scrollY);expect(Math.abs(failed-before)).toBeLessThanOrEqual(4);
 await page.unroute(path);await page.locator('#marketRankRetry').click();await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});
 const after=await page.locator('#openPurchase').evaluate(e=>e.getBoundingClientRect().top+scrollY);expect(Math.abs(after-before)).toBeLessThanOrEqual(4);
 await expect(page.locator('[data-rank-preview]')).toHaveCount(3);expect(await page.locator('#marketRankAll').evaluate(e=>e.open)).toBe(false);
 const key=await page.locator('[data-rank-preview]').first().getAttribute('data-rank-preview');await page.locator('[data-rank-preview]').first().click();await expect(page).toHaveURL(/#\/detail$/);await expect(page.locator('#priceChart svg')).toBeVisible();await page.locator('#close').click();await expect(page).toHaveURL(/#\/market$/);await expect(page.locator('[data-rank-preview]').first()).toHaveAttribute('data-rank-preview',key);expect(await page.locator('#marketRankAll').evaluate(e=>e.open)).toBe(false);
 expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
});
