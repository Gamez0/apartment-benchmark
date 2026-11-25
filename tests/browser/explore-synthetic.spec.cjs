const {test,expect}=require('@playwright/test');
// Intercepted synthetic QA responses only; never official/public source data.
async function fixture(page,{sparse=false}={}){
 const asOf='2026-07-31';const transactions=[['base','동아2',84.908,8,10],['lower','QA탐색후보',84,6,9],['higher','QA상한초과',84,10,12]].flatMap(([id,name,area,old,now])=>['2025','2026'].flatMap((year,i)=>[1,2,3,4,5].filter(day=>!sparse||id!=='base'||i===0).map(day=>({id,name,area,region:'서울',district:'구로구',dong:'신도림동',date:year+'-07-0'+day,price:i?now:old,floor:day}))));
 const data={asOf,source:'합성 QA · 공식 거래 아님',transactions,benchmark:[{region:'서울',month:'2025-07',value:100},{region:'서울',month:'2026-07',value:110}],rates:[]};
 const districts=[{code:'11530',name:'구로구',file:'districts/11530.json'},...Array.from({length:24},(_,i)=>({code:String(11000+i),name:'합성구'+i,file:'districts/'+String(11000+i)+'.json'}))];
 // Match the pathname, including the production data.json?v=... request.
 // Unknown JSON is blocked instead of silently mixing official and synthetic rows.
 const hits={data:0,manifest:0},unexpected=[];
 await page.route(url=>url.pathname.endsWith('.json'),async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/data.json')){hits.data++;return route.fulfill({json:data});}
  if(path.endsWith('/seoul/manifest.json')){hits.manifest++;return route.fulfill({json:{schema:1,asOf,totalTrades:transactions.length,fromMonth:'202501',throughMonth:'202607',districts}});}
  if(/\/seoul\/districts\/[0-9]+\.json$/.test(path))return route.fulfill({json:{asOf,code:path.split('/').pop().replace('.json',''),units:[]}});
  unexpected.push(path);return route.abort('blockedbyclient');
 });
 return async()=>{
  expect(hits.data).toBeGreaterThan(0);await expect.poll(()=>hits.manifest).toBeGreaterThan(0);expect(unexpected).toEqual([]);
  const loaded=await page.evaluate(()=>({source:data.source,ids:[...new Set(data.transactions.map(r=>r.id))].sort()}));
  expect(loaded).toEqual({source:data.source,ids:[...new Set(transactions.map(r=>r.id))].sort()});
 };
}
test('SYNTHETIC: CTA-only discovery keeps price exploration separate from cash',async({page},info)=>{
 const assertIsolated=await fixture(page);await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();await page.locator('#openMarketRank').click();await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true');await assertIsolated();await page.locator('#openPurchase').click();await expect(page).toHaveURL(/#\/explore$/);await expect(page.locator('#explorePrice')).toHaveValue('10.00');await expect(page.locator('#buyOwn')).toHaveValue('');await expect(page.locator('#buyLoan')).toHaveValue('');await page.locator('#exploreCalculate').click();await expect(page.locator('#exploreResult')).toContainText('QA탐색후보');await expect(page.locator('#exploreResult')).not.toContainText('QA상한초과');await expect(page.locator('#exploreResult')).toContainText('개인 구매력이나 현재 매물 가격을 뜻하지');
 await page.locator('#exploreResult [data-review]').first().click();await page.locator('#exploreFlow [data-review-open]').click();await expect(page).toHaveURL(/#\/shortlist$/);await expect(page.locator('#reviewCards')).toContainText('탐색 상한보다');await expect(page.locator('#reviewCards')).not.toContainText('계산 예산에서');await page.locator('#flowBack').click();await expect(page).toHaveURL(/#\/explore$/);await expect(page.locator('#explorePrice')).toHaveValue('10.00');
 await page.locator('#explorePrice').fill('9.5');await expect(page.locator('#exploreResult')).toBeEmpty();await page.locator('#exploreCalculate').click();await page.locator('#exploreResult [data-explore-detail]').first().click();await expect(page).toHaveURL(/#\/detail$/);await page.locator('#close').click();await expect(page).toHaveURL(/#\/explore$/);await expect(page.locator('#explorePrice')).toHaveValue('9.5');await expect(page.locator('#exploreResult [data-explore-detail]').first()).toBeFocused();
 await page.screenshot({path:'test-results/SYNTHETIC-explore-'+info.project.name+'.png',fullPage:true});expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
 await assertIsolated();await page.locator('#exploreActualBudget').click();await expect(page).toHaveURL(/#\/budget$/);await expect(page.locator('#buyOwn')).toHaveValue('');await expect(page.locator('#buyLoan')).toHaveValue('');
});
test('SYNTHETIC: sparse baseline never invents a default price',async({page})=>{const assertIsolated=await fixture(page,{sparse:true});await page.goto('/#/explore');await expect(page.locator('#exploreCalculate')).toBeEnabled();await assertIsolated();await expect(page.locator('#explorePrice')).toHaveValue('');await expect(page.locator('#explorePriceBasis')).toContainText('거래가 부족');await page.locator('#exploreCalculate').click();await expect(page.locator('#exploreError')).toContainText('0보다 크게');await expect(page.locator('#exploreResult')).toBeEmpty();});



test('SYNTHETIC: mobile shortlist dock removes and restores the replaced calculation slot',async({page},info)=>{
 const assertIsolated=await fixture(page);await page.goto('/#/explore');await expect(page.locator('#exploreCalculate')).toBeEnabled();await assertIsolated();await page.locator('#exploreCalculate').click();
 const calculate=page.locator('#exploreCalculate'),pick=page.locator('#exploreResult [data-review]').first();await expect(pick).toBeVisible();
 const before=await page.evaluate(()=>({height:document.querySelector('#exploreCalculate').getBoundingClientRect().height,resultY:document.querySelector('#exploreResult').getBoundingClientRect().top+scrollY}));
 await pick.click();await expect(page.locator('body')).toHaveAttribute('data-review-dock','true');
 if(page.viewportSize().width<=700){
  // visibility:hidden used to retain the button's entire layout slot above the result.
  await expect(calculate).toHaveCSS('display','none');
  const after=await page.locator('#exploreResult').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  expect(before.resultY-after).toBeGreaterThanOrEqual(before.height-2);
  await expect(page.locator('#exploreFlow [data-review-open]')).toBeInViewport();
 }else await expect(calculate).toBeVisible();
 await page.screenshot({path:'test-results/SYNTHETIC-explore-dock-spacing-'+info.project.name+'.png',fullPage:true});
 await pick.click();await expect(page.locator('body')).toHaveAttribute('data-review-dock','false');await expect(calculate).toBeVisible();
 const restored=await page.locator('#exploreResult').evaluate(e=>e.getBoundingClientRect().top+scrollY);expect(Math.abs(restored-before.resultY)).toBeLessThanOrEqual(2);
 expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
});



test('SYNTHETIC: price discovery uses two desktop columns and a focused mobile column',async({page},info)=>{
 const assertIsolated=await fixture(page);
 const desktop=info.project.name==='desktop-chromium',widths=desktop?[1280,1440]:[page.viewportSize().width];
 for(const width of widths){
  if(desktop)await page.setViewportSize({width,height:900});
  // Each width checks a fresh initial state; a same-hash visit may preserve prior results.
  await page.goto('/#/explore');await page.reload();await expect(page.locator('#exploreCalculate')).toBeEnabled();await assertIsolated();await expect(page.locator('#exploreResult')).toBeEmpty();
  const main=page.locator('.explore-main'),aside=page.locator('.explore-next'),calculate=page.locator('#exploreCalculate');
  await expect(page.locator('#exploreFlow button:visible')).toHaveCount(1);
  expect(await page.locator('#exploreActualBudget').evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('#exploreCalculate'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const left=await main.boundingBox();
  if(desktop){
   await expect(aside).toBeVisible();const right=await aside.boundingBox();expect(right.x-(left.x+left.width)).toBeGreaterThanOrEqual(32);
   const heading=await page.locator('#exploreHeading').boundingBox(),input=await page.locator('#explorePrice').boundingBox(),cta=await calculate.boundingBox();
   expect(Math.abs(heading.x-left.x)).toBeLessThanOrEqual(2);expect(Math.abs(input.x-left.x)).toBeLessThanOrEqual(2);expect(Math.abs(cta.x-left.x)).toBeLessThanOrEqual(2);
   expect(heading.y+heading.height).toBeLessThan(input.y);expect(input.y+input.height).toBeLessThan(cta.y);
  }else{
   await expect(aside).toBeHidden();await expect(page.getByRole('heading',{name:'다음은, 이 가격 안의 후보예요',exact:true})).toHaveCount(0);
   const layout=await page.locator('.explore-layout').boundingBox();expect(Math.abs(left.width-layout.width)).toBeLessThanOrEqual(2);
  }
  await page.screenshot({path:'test-results/SYNTHETIC-explore-layout-'+info.project.name+'-'+width+'.png',fullPage:true});
  await calculate.click();await expect(page.locator('#exploreResult [data-review]')).not.toHaveCount(0);
  // One synchronous snapshot prevents smooth scrolling between two geometry reads.
  const {layout,result}=await page.evaluate(()=>{
   const bounds=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   return {layout:bounds('.explore-layout'),result:bounds('#exploreResult')};
  });
  expect(Math.abs(result.x-layout.x)).toBeLessThanOrEqual(2);expect(Math.abs(result.width-layout.width)).toBeLessThanOrEqual(2);expect(result.y).toBeGreaterThanOrEqual(layout.y+layout.height);
  expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
 }
});
