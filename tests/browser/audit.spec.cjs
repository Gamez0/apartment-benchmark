const {test,expect}=require('@playwright/test');
const {openTools,visit}=require('./helpers.cjs');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
// All expected prices/returns are computed independently by Python from collector rows.
const oracle=JSON.parse(fs.readFileSync('audit-report/reference.json','utf8'));
const units=code=>oracle.districts[code];
const number=text=>Number(text.replaceAll(',','').match(/[-+]?\d+(?:\.\d+)?/)?.[0]);
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#scopeStatus')).toContainText('공식 자료');await expect(page.locator('#dong')).toBeEnabled();await openTools(page);});

test('rendered prices, returns, BM gaps and badges agree with independent raw-trade oracle',async({page})=>{
  test.setTimeout(120000);
  await page.locator('#areaScope').selectOption('all');
  for(const code of ['11530','11350','11680','11710','11440']){
    await page.locator('#districtScope').selectOption(code);await expect(page.locator('#dong')).toBeEnabled();
    for(const year of ['1','3','5','10']){
      await page.locator('#nearbyPeriod').selectOption(year);
      const all=units(code),bm=oracle.market[year];
      const qualified=all.filter(g=>{const s=g.stats[year];return s[6]>0&&s[6]>bm&&s[1]>=5&&s[4]>=5&&g.latest<=oracle.asOf&&Date.parse(oracle.asOf)-Date.parse(g.latest)<=90*86400000&&!(g.dong==='신도림동'&&g.area===84.908&&['동아2','신도림동아2차','신도림2차동아'].includes(g.name));}).sort((a,b)=>b.stats[year][6]-a.stats[year][6]||a.key.localeCompare(b.key)).slice(0,3).map(g=>g.key);
      for(const card of await page.locator('#results article').all()){
        const key=await card.getAttribute('data-key'),row=all.find(g=>g.key===key),s=row.stats[year];
        if(s[0]==null)await expect(card.locator('.price')).toContainText('—');else expect(Math.abs(number(await card.locator('.price').textContent())-s[0])).toBeLessThanOrEqual(.005001);
        if(s[6]==null){await expect(card.locator('.return')).toHaveText('—');await expect(card.locator('.excess')).toContainText('비교 불가');}
        else{expect(Math.abs(number(await card.locator('.return').textContent())-s[6])).toBeLessThanOrEqual(.050001);expect(Math.abs(number(await card.locator('.excess b').textContent())-(s[6]-bm))).toBeLessThanOrEqual(.050001);}
        expect(await card.locator('.priority-badge').count()).toBe(qualified.includes(key)?1:0);
      }
    }
  }
});

test('composed neighborhood, period, area, price, search and ordering filters match oracle',async({page})=>{
  test.setTimeout(90000);
  const all=units('11530');
  for(let i=0;i<12;i++){
    const year=['1','3','5','10'][i%4],dong=i%3?'구로동':'신도림동',similar=i%2===0,max=i%4===0?10:0,above=i%3===0,search=i===11?'없는단지검증':i===10?'동아':'';
    await page.locator('#dong').selectOption(dong);await page.locator('#nearbyPeriod').selectOption(year);await page.locator('#areaScope').selectOption(similar?'similar':'all');
    await page.locator('#budget').selectOption(String(max));await page.locator('#above').setChecked(above);await page.locator('#search').fill(search);await page.locator('#sort').selectOption('price');
    const expected=all.filter(g=>g.dong===dong&&(!similar||g.area>=75&&g.area<=95)&&(!max||g.stats[year][0]!=null&&g.stats[year][0]<=max)&&g.name.includes(search)&&(!above||g.stats[year][6]!=null&&g.stats[year][6]>=oracle.market[year])).sort((a,b)=>(a.stats[year][0]??Infinity)-(b.stats[year][0]??Infinity));
    await expect(page.locator('#listCount')).toHaveText(`${expected.length}개 중 ${Math.min(6,expected.length)}개 표시`);
    const actual=await page.locator('#results article').evaluateAll(es=>es.map(e=>e.getAttribute('data-key')));
    expect(actual).toHaveLength(Math.min(6,expected.length));
    for(let n=0;n<actual.length;n++){
      // Equal-price ties have no product ordering guarantee.
      const row=all.find(g=>g.key===actual[n]);expect(expected.some(g=>g.key===row.key)).toBe(true);expect(row.stats[year][0]).toBe(expected[n].stats[year][0]);
    }
  }
});

test('financial input stays in browser and is cleared on reload',async({page,context})=>{
  const requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
  await visit(page,'budget');await page.locator('#buyOwn').fill('987.6543');await page.locator('#buyLoan').fill('0');await page.locator('#purchaseCalculate').click();
  expect(requests.every(r=>r.method==='GET'&&new URL(r.url).origin==='http://127.0.0.1:4173'&&!r.url.includes('987.6543')&&!r.body)).toBe(true);
  const state=await context.storageState();expect(JSON.stringify(state)).not.toContain('987.6543');
  expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
  await page.reload();await expect(page.locator('#buyOwn')).toHaveValue('');await expect(page.locator('#purchaseResult')).toBeEmpty();
});

test('WCAG automated checks cover initial and expanded budget/reference controls',async({page},testInfo)=>{
  test.setTimeout(90000);
  for(const expanded of ['candidates','budget','evidence']){
    await visit(page,expanded);if(expanded==='budget')await page.locator('#openFunding').click();if(expanded==='evidence')await page.locator('#heroEvidence > summary').click();}
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    await testInfo.attach(`accessibility-${expanded?'expanded':'initial'}`,{body:JSON.stringify(result.violations,null,2),contentType:'application/json'});
    expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  }
});

test('keyboard focus, chart scrubbing and landscape layout remain usable',async({page})=>{
  await page.locator('#districtScope').focus();await page.keyboard.press('Tab');await expect(page.locator('#dong')).toBeFocused();
  await visit(page,'compare');await page.locator('.chart-values > summary').click();const slider=page.locator('#comparisonReadout');await slider.focus();await slider.press('Home');await expect(slider).toHaveValue('0');await slider.press('ArrowRight');await expect(slider).toHaveValue('1');await expect(page.locator('#comparisonPoint')).not.toBeEmpty();
  await page.setViewportSize({width:844,height:390});
  expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
});

test('initial mobile data loading is bounded and histories stay lazy',async({context})=>{
  const fresh=await context.newPage(),paths=[],sizes=[];
  fresh.on('request',r=>paths.push(new URL(r.url()).pathname));
  fresh.on('response',r=>{if(new URL(r.url()).pathname.endsWith('.json'))sizes.push(r.body().then(b=>b.length));});
  await fresh.goto('/');await expect(fresh.locator('#scopeStatus')).toContainText('공식 자료');await expect(fresh.locator('#dong')).toBeEnabled();
  expect(paths.filter(p=>p.includes('/seoul/districts/'))).toHaveLength(1);expect(paths.filter(p=>p.includes('/seoul/units/'))).toHaveLength(0);
  const bytes=(await Promise.all(sizes)).reduce((n,x)=>n+x,0);expect(bytes).toBeLessThan(2*1024*1024);await fresh.close();
});

test('stale bootstrap is replaced by the manifest-pinned coherent build',async({page})=>{
  const old=JSON.parse(fs.readFileSync('site/data.json','utf8'));old.revision='previous-build';old.transactions=[];
  await page.route(/\/data\.json\?/,route=>route.fulfill({json:old}));
  const pinned=page.waitForResponse(r=>new URL(r.url()).pathname.includes('/seoul/bootstrap-'));await page.goto('/');await pinned;
  await expect(page.locator('#scopeStatus')).toContainText('공식 자료');await expect(page.locator('#purchaseCalculate')).toBeEnabled();
  const base=units('11530').find(g=>g.dong==='신도림동'&&g.area===84.908&&['동아2','신도림동아2차','신도림2차동아'].includes(g.name));
  const text=await page.locator('#overviewSources .overview-home .overview-rate').textContent();expect(Math.abs(number(text)-base.stats[1][6])).toBeLessThan(.051);
});

test('incoherent pinned bootstrap blocks calculations and can recover by retry',async({page})=>{
  const old=JSON.parse(fs.readFileSync('site/data.json','utf8'));old.revision='previous-build';
  await page.route(/\/data\.json\?/,route=>route.fulfill({json:old}));
  await page.route('**/seoul/bootstrap-*.json',route=>route.fulfill({json:{...old,revision:'wrong-build'}}));
  await page.goto('/');await expect(page.locator('#scopeRetry')).toBeVisible();await expect(page.locator('#scopeStatus')).toContainText('버전이 다릅니다');
  await expect(page.locator('#purchaseCalculate')).toBeDisabled();await expect(page.locator('#comparisonChart svg')).toHaveCount(0);
  await page.unroute('**/seoul/bootstrap-*.json');await page.locator('#scopeRetry').click();
  await expect(page.locator('#scopeStatus')).toContainText('공식 자료');await expect(page.locator('#purchaseCalculate')).toBeEnabled();
});

