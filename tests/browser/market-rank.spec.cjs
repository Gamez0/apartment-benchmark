const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync('site/seoul/manifest.json','utf8'));
const AxeBuilder=require('@axe-core/playwright').default;
const oracle=JSON.parse(fs.readFileSync('audit-report/reference.json','utf8'));
const all=Object.values(oracle.districts).flat();
function expected(year,side,area='similar'){
 const bm=oracle.market[year],end=Date.parse(oracle.asOf);
 return all.filter(g=>{const s=g.stats[year],age=end-Date.parse(g.latest);return (area==='all'||g.area>=75&&g.area<=95)&&s[6]!=null&&s[1]>=5&&s[4]>=5&&age>=0&&age<=90*86400000&&(side==='decline'?s[6]<0:side==='high'?s[6]>0&&s[6]>bm:s[6]>=0&&s[6]<bm);}).sort((a,b)=>(side==='high'?b.stats[year][6]-a.stats[year][6]:a.stats[year][6]-b.stats[year][6])||(a.key<b.key?-1:a.key>b.key?1:0));
}
async function start(page){await page.goto('/');await expect(page.locator('#openMarketRank')).toBeEnabled();}
async function open(page){await page.locator('#openMarketRank').click();await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});}
test('citywide high and low performance match an independent oracle and keep neighborhood scope',async({page})=>{
 test.setTimeout(90000);await start(page);await open(page);await expect(page.locator('#districtScope')).toHaveValue('11530');await expect(page.locator('#dong')).toHaveValue('신도림동');
 for(const year of ['1','3','5','10'])for(const side of ['high','low','decline']){
  await page.locator('#marketRankPeriod').selectOption(year);await page.locator('[data-rank-side="'+side+'"]').click();const rows=expected(year,side);const cards=page.locator('#marketRankResults article');
  expect(await cards.evaluateAll(es=>es.map(e=>e.getAttribute('data-rank-key')))).toEqual(rows.slice(0,6).map(g=>g.key));
  if(rows.length){const gap=rows[0].stats[year][6]-oracle.market[year];await expect(cards.first().locator('.rank-gap')).toContainText((gap>=0?'+':'')+gap.toFixed(1)+'%p');}
 }
 await page.locator('#marketRankSettings > summary').click();await page.locator('#marketRankArea').selectOption('all');const rows=expected('10','low','all');expect(await page.locator('#marketRankResults article').evaluateAll(es=>es.map(e=>e.getAttribute('data-rank-key')))).toEqual(rows.slice(0,6).map(g=>g.key));
 if(rows.length>6){await page.locator('#marketRankMore').click();await expect(page.locator('#marketRankResults article')).toHaveCount(Math.min(12,rows.length));}
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(scan.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
test('citywide candidate detail and graph return to the same side and selection',async({page})=>{
 await start(page);await open(page);await page.locator('[data-rank-side="low"]').click();const first=page.locator('#marketRankResults article').first();const key=await first.getAttribute('data-rank-key');
 await first.locator('[data-rank-detail]').click();await expect(page.locator('#priceChart svg')).toBeVisible();await expect(page.locator('#detailAnswer')).toContainText('서울 대비');await page.locator('#close').click();await expect(page.locator('#marketRankResults')).toBeInViewport();await expect(page.locator('[data-rank-side="low"]')).toHaveAttribute('aria-pressed','true');
 await first.locator('[data-rank-compare]').click();await expect(page.locator('#comparisonHeading')).toHaveText('서울 시장과 얼마나 차이 났을까?');await expect(page.locator('#comparisonBack')).toBeInViewport();await page.locator('#comparisonBack').click();await expect(page.locator('#marketRankResults')).toBeInViewport();await expect(page.locator('[data-rank-key="'+key+'"] [data-rank-compare]')).toHaveAttribute('aria-pressed','true');
});
test('incomplete citywide catalogs never produce a partial ranking and retry can recover',async({page})=>{
 const d=manifest.districts.find(d=>d.code==='11110'),route='**/seoul/'+d.file;await page.route(route,r=>r.fulfill({status:503,body:'test failure'}));await start(page);await page.locator('#openMarketRank').click();await expect(page.locator('#marketRankRetry')).toBeVisible({timeout:30000});await expect(page.locator('#marketRankResults article')).toHaveCount(0);await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','false');await expect(page.locator('#referenceResult .relative-headline')).not.toBeEmpty();
 await page.unroute(route);await page.locator('#marketRankRetry').click();await expect(page.locator('#marketRankStatus')).toHaveAttribute('data-ready','true',{timeout:30000});await expect(page.locator('#marketRankResults article')).toHaveCount(6);
});

