const {expect}=require('@playwright/test');
async function visit(page,screen){
  // Exercise the public URL surface without reloading private in-memory inputs.
  await page.evaluate(screen=>{location.hash='/'+screen;},screen);
  await expect(page.locator('body')).toHaveAttribute('data-route',screen);
}
async function openTools(page){
  await visit(page,'candidates');
  if(!await page.locator('#scopePanel').evaluate(e=>e.open))await page.locator('#scopePanel > summary').click();
  if(!await page.locator('.list-filters').evaluate(e=>e.open))await page.locator('.list-filters > summary').click();
}
module.exports={openTools,visit};
