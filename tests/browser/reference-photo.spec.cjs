const {test,expect}=require('@playwright/test');
test('local apartment photo replaces the illustration without moving the answer or CTA',async({page})=>{
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/assets/apartments/donga-2.jpg',async route=>{await gate;await route.continue();});
 await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();
 await expect(page.locator('#referenceVisual')).toHaveAttribute('data-state','loading');
 await expect(page.locator('#referenceIllustration')).toBeVisible();
 const positions=()=>page.evaluate(()=>['referenceResult','openMarketRank'].map(id=>document.getElementById(id).getBoundingClientRect().top+scrollY));
 const before=await positions();release();
 await expect(page.locator('#referenceVisual')).toHaveAttribute('data-state','photo');
 await expect(page.locator('#referencePhoto')).toBeVisible();
 await expect(page.locator('#referenceIllustration')).toBeHidden();
 await expect(page.locator('#referencePhotoCredit')).toBeVisible();
 expect(await page.locator('#referencePhoto').evaluate(e=>e.complete&&e.naturalWidth===1024&&new URL(e.currentSrc).origin===location.origin)).toBe(true);
 const after=await positions();after.forEach((y,i)=>expect(Math.abs(y-before[i])).toBeLessThanOrEqual(1));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/reference-photo-'+test.info().project.name+'.png',fullPage:true});
});
test('missing photo keeps the illustration and the main flow usable',async({page})=>{
 await page.route('**/assets/apartments/donga-2.jpg',route=>route.fulfill({status:404,body:'missing photo'}));
 await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();
 await expect(page.locator('#referenceVisual')).toHaveAttribute('data-state','fallback');
 await expect(page.locator('#referenceIllustration')).toBeVisible();
 await expect(page.locator('#referencePhoto')).toBeHidden();
 await expect(page.locator('#referencePhotoCredit')).toBeHidden();
 await page.locator('#openMarketRank').click();await expect(page).toHaveURL(/#\/market$/);
});
