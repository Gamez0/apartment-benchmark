async function openTools(page){
  if(!await page.locator('#scopePanel').evaluate(e=>e.open))await page.locator('#scopePanel > summary').click();
  await page.locator('#openPurchase').click();await page.locator('#openNearby').click();
  for(const selector of ['#trendFlow','.list-filters']){
    const panel=page.locator(selector);if(!await panel.evaluate(e=>e.open))await panel.locator(':scope > summary').click();
  }
}
module.exports={openTools};
