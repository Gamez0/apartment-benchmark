// Browser checks use the generated official build, never synthetic transaction fixtures.
// Only network-failure/race tests intercept requests; their payloads still come from that build.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),E=require('../../site/engine.js');
const manifest=JSON.parse(fs.readFileSync('site/seoul/manifest.json','utf8'));
const catalog=code=>JSON.parse(fs.readFileSync('site/seoul/'+manifest.districts.find(d=>d.code===code).file,'utf8'));
const dongs=code=>[...new Set(catalog(code).units.map(g=>g.dong).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
const errors=new WeakMap();
test.beforeEach(async({page})=>{
  const found=[];errors.set(page,found);page.on('pageerror',e=>found.push(e.message));
  await page.goto('/');await expect(page.locator('#purchaseCalculate')).toBeEnabled();
  await expect(page.locator('#scopeStatus')).toContainText('서울 '+manifest.totalTrades.toLocaleString('ko-KR')+'건');
});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function selectDistrict(page,code){await page.locator('#districtScope').selectOption(code);await expect(page.locator('#dong')).toBeEnabled();await expect(page.locator('#purchaseCalculate')).toBeEnabled();}
async function checkCards(page,dong){
  const cards=page.locator('#results article');
  for(const text of await cards.locator('.meta').allTextContents())expect(text).toContain(' '+dong+' ·');
}
test('Guro: every neighborhood is selectable without clearing text',async({page})=>{
  await expect(page.locator('#dong')).toHaveJSProperty('tagName','SELECT');
  await expect(page.locator('#dong')).toHaveValue('신도림동');
  expect(await page.locator('#dong option').evaluateAll(es=>es.map(e=>e.value))).toEqual(['',...dongs('11530')]);
  for(const dong of dongs('11530')){
    await page.locator('#dong').selectOption(dong);
    await expect(page.locator('#scopeStatus')).toContainText('구로구 '+dong+' ·');
    await checkCards(page,dong);
    expect(await page.locator('#results article').count()).toBe(Math.min(6,catalog('11530').units.filter(g=>g.dong===dong&&g.area>=75&&g.area<=95).length));
  }
  await page.locator('#dong').selectOption('');await expect(page.locator('#scopeStatus')).toContainText('구로구 ·');
});
test('all 25 districts expose only their own available neighborhoods',async({page})=>{
  for(const district of manifest.districts){
    await selectDistrict(page,district.code);
    expect(await page.locator('#dong option').evaluateAll(es=>es.map(e=>e.value))).toEqual(['',...dongs(district.code)]);
    await expect(page.locator('#dong')).toHaveValue('');
    const dong=dongs(district.code)[0];await page.locator('#dong').selectOption(dong);
    await expect(page.locator('#scopeStatus')).toContainText(district.name+' '+dong+' ·');await checkCards(page,dong);
  }
});
test('period/area controls stay synchronized and charts remain available',async({page})=>{
  for(const year of ['1','3','5','10']){
    await page.locator('#buyPeriod').selectOption(year);
    await expect(page.locator('[data-period="'+year+'"]').first()).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#comparisonChart svg')).toHaveCount(1);
    await page.locator('[data-period="'+year+'"]').click();await expect(page.locator('#buyPeriod')).toHaveValue(year);
  }
  await page.locator('#buyArea').selectOption('all');await expect(page.locator('#areaScope')).toHaveValue('all');
  await page.locator('#areaScope').selectOption('similar');await expect(page.locator('#buyArea')).toHaveValue('similar');
  const overflow=await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth);expect(overflow).toBe(false);
});
test('purchase budget filters actual summaries and invalidates when neighborhood changes',async({page})=>{
  await page.locator('#purchaseCalculate').click();await expect(page.locator('#purchaseError')).toContainText('입력');
  await page.locator('#buyOwn').fill('3');await page.locator('#buyPartner').fill('0');await page.locator('#buyLoan').fill('6');
  await page.locator('#buyArea').selectOption('all');await page.locator('#purchaseCalculate').click();
  const scenario=E.purchaseScenario({own:3,partner:0,reserve:0,loan:6,ltv:40,interest:4,years:30,monthly:0});
  const candidates=catalog('11530').units.filter(g=>g.dong==='신도림동'&&g.stats[1][1]>=3&&E.purchaseFit(g.stats[1][0],scenario));
  await expect(page.locator('#purchaseResult')).toContainText('5.00억');
  await expect(page.locator('#purchaseResult .stats')).toContainText(candidates.length+'개');
  // Exercise positive results and progressive disclosure as well as the zero-result budget.
  await page.locator('#buyOwn').fill('20');await page.locator('#purchaseCalculate').click();
  await expect(page.locator('#purchaseResult .purchase-candidate')).toHaveCount(3);
  await page.locator('#purchaseMore').click();await expect(page.locator('#purchaseResult .purchase-candidate')).toHaveCount(6);
  await page.locator('#dong').selectOption('구로동');await expect(page.locator('#purchaseResult')).toBeEmpty();
  await expect(page.locator('#purchaseError')).toContainText('조건이 바뀌었습니다');
});
test('list pagination, comparison selection and real trade details work',async({page})=>{
  const before=await page.locator('#results article').count();await page.locator('#more').click();
  expect(await page.locator('#results article').count()).toBeGreaterThan(before);
  const add=page.locator('#results [data-add]:not([disabled])');await add.first().click();
  await expect(page.locator('#selectionCount')).toContainText('1/3');await expect(page.locator('.selection-dock')).toHaveAttribute('data-active','true');
  await expect(page.locator('#comparisonChart svg')).toHaveCount(1);
  await page.locator('#comparisonSelected [data-remove]').click();
  for(let i=0;i<3;i++)await page.locator('#results [data-add]:not([disabled]):not([aria-pressed="true"])').first().click();
  await expect(page.locator('#selectionCount')).toContainText('3/3');
  await page.locator('#results [data-add]:not([disabled]):not([aria-pressed="true"])').first().click();
  await expect(page.locator('#comparisonMessage')).toContainText('최대 3개');await expect(page.locator('#selectionCount')).toContainText('3/3');
  for(let i=0;i<3;i++)await page.locator('#comparisonSelected [data-remove]').first().click();
  await expect(page.locator('.selection-dock')).toHaveAttribute('data-active','false');
  await page.locator('#results [data-detail]').first().click();await expect(page.locator('#priceChart svg')).toHaveCount(1);
  await expect(page.locator('#trades tr').first()).toBeAttached();await page.locator('#close').click();await expect(page.locator('#detail')).toBeHidden();
});
test('failed district load clears old results and retry restores the same district',async({page})=>{
  await page.route('**/seoul/districts/11350.json',route=>route.fulfill({status:503,body:'temporary test failure'}));
  await page.locator('#districtScope').selectOption('11350');await expect(page.locator('#scopeRetry')).toBeVisible();
  await expect(page.locator('#purchaseCalculate')).toBeDisabled();await expect(page.locator('#dong')).toBeDisabled();
  await expect(page.locator('#comparisonChart svg')).toHaveCount(0);await expect(page.locator('#referenceResult')).toContainText('불러오지 못했습니다');
  await page.unroute('**/seoul/districts/11350.json');await page.locator('#scopeRetry').click();
  await expect(page.locator('#dong')).toBeEnabled();await expect(page.locator('#scopeRetry')).toBeHidden();
  await expect(page.locator('#scopeStatus')).toContainText('노원구 ·');await expect(page.locator('#purchaseCalculate')).toBeEnabled();
});
test('late district response cannot overwrite the most recent selection',async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);let intercepted;
  const arrived=new Promise(resolve=>intercepted=resolve);
  await page.route('**/seoul/districts/11545.json',async route=>{intercepted();await gate;await route.fulfill({json:catalog('11545')});});
  await page.locator('#districtScope').selectOption('11545');await arrived;
  await page.locator('#districtScope').selectOption('11350');await expect(page.locator('#scopeStatus')).toContainText('노원구 ·');
  const finished=page.waitForResponse('**/seoul/districts/11545.json');release();await finished;
  await expect(page.locator('#districtScope')).toHaveValue('11350');await expect(page.locator('#scopeStatus')).toContainText('노원구 ·');
  expect(await page.locator('#dong option').evaluateAll(es=>es.map(e=>e.value))).toEqual(['',...dongs('11350')]);
});

test('changing reference apartment loads its history and updates relative comparisons',async({page})=>{
  const target=catalog('11530').units.find(g=>g.dong==='신도림동'&&g.area>=75&&g.area<=95&&!['동아2','신도림동아2차','신도림2차동아'].includes(g.name)&&g.stats[1][6]!=null);
  expect(target).toBeTruthy();
  await page.locator('.reference-picker summary').click();await page.locator('#referenceSearch').fill(target.name);
  await page.locator('#referenceHome').selectOption(target.key);
  await expect(page.locator('#referenceResult .overview-home')).toContainText(target.name);
  await expect(page.locator('#comparisonLegend')).toContainText(target.name);
  await expect(page.locator('#results .baseline-relative').first()).toContainText(target.name);
  await page.locator('#dong').selectOption('구로동');
  await expect(page.locator('#referenceHome')).toHaveValue(target.key);
  await expect(page.locator('#referenceResult .overview-home')).toContainText(target.name);
});
