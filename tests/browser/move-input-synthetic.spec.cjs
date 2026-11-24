const {test,expect}=require('@playwright/test');
// Test-only synthetic responses. Never used by the published service or official-data audit.
async function installMoveFixture(page){
 const asOf='2026-07-31';
 const transactions=['2025','2026'].flatMap((year,i)=>[1,2,3,4,5].map(day=>({id:'qa-base',name:'동아2',area:84.908,region:'서울',district:'구로구',dong:'신도림동',date:year+'-07-0'+day,price:8+i*2,floor:day})));
 const data={asOf,source:'합성 QA · 공식 거래 아님',transactions,benchmark:[{region:'서울',month:'2025-07',value:100},{region:'서울',month:'2026-07',value:110}],rates:[]};
 const districts=[{code:'11530',name:'구로구',file:'districts/11530.json'},...Array.from({length:24},(_,i)=>({code:String(11000+i),name:'합성구'+i,file:'districts/'+String(11000+i)+'.json'}))];
 const manifest={schema:1,asOf,totalTrades:transactions.length,fromMonth:'202501',throughMonth:'202607',districts};
 await page.route('**/data.json',r=>r.fulfill({json:data}));
 await page.route('**/seoul/manifest.json',r=>r.fulfill({json:manifest}));
 await page.route('**/seoul/districts/*.json',r=>r.fulfill({json:{asOf,code:new URL(r.request().url()).pathname.split('/').pop().replace('.json',''),units:[]}}));
}
test('SYNTHETIC QA: visible mortgage and sale-proceeds arithmetic',async({page},info)=>{
 await installMoveFixture(page);
 await page.goto('/#/move');
 await expect(page.locator('#switchCalculate')).toBeEnabled();
 await expect(page.locator('#switchDebt')).toBeVisible();
 await expect(page.locator('#switchSaleCost')).toBeHidden();
 await expect(page.getByLabel('갚아야 할 대출 · 억원',{exact:true})).toBeVisible();
 await expect(page.getByLabel('추가로 보탤 현금 · 억원',{exact:true})).toBeVisible();
 await page.locator('#switchSale').fill('10');
 await page.locator('#switchDebt').fill('2');
 await page.locator('#switchExtra').fill('1');
 await page.screenshot({path:'test-results/SYNTHETIC-move-input-'+info.project.name+'.png',fullPage:true});
 await page.locator('#switchCalculate').click();
 await expect(page.locator('#switchResult .stats')).toContainText('팔고 남는 돈8.00억');
 await expect(page.locator('#switchResult .stats')).toContainText('집 살 예산9.00억');
 await expect(page.locator('#switchResult')).toContainText('대출·비용은 입력한 금액만');
 await page.screenshot({path:'test-results/SYNTHETIC-move-result-'+info.project.name+'.png',fullPage:true});
 await page.locator('#switchDebt').fill('3');
 await expect(page.locator('#switchResult')).toBeEmpty();
 await page.locator('#switchCalculate').click();
 await expect(page.locator('#switchResult .stats')).toContainText('집 살 예산8.00억');
 expect(await page.locator('html').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
});


test('SYNTHETIC QA: zero sale budget offers one nearby edit action',async({page},info)=>{
 await installMoveFixture(page);await page.goto('/#/move');
 await expect(page.locator('#switchCalculate')).toBeEnabled();
 await page.locator('#switchSale').fill('10');await page.locator('#switchDebt').fill('10');await page.locator('#switchExtra').fill('0');
 await page.locator('#switchCalculate').click();
 await expect(page.locator('#switchResult')).toContainText('남는 예산이 없어요');
 await expect(page.locator('#switchError')).toBeEmpty();
 await expect(page.locator('#switchResult button')).toHaveCount(1);
 await expect(page.locator('#editEmptySwitch')).toBeVisible();
 await page.locator('#editEmptySwitch').scrollIntoViewIfNeeded();
 const recovery=await page.locator('#editEmptySwitch').boundingBox();
 expect(recovery.height).toBeGreaterThanOrEqual(44);
 expect(recovery.y).toBeGreaterThanOrEqual(0);
 expect(recovery.y+recovery.height).toBeLessThanOrEqual(page.viewportSize().height);
 const reason=await page.locator('#switchResult .empty-budget p').boundingBox();
 expect(recovery.y-(reason.y+reason.height)).toBeLessThanOrEqual(48);
 await expect(page.locator('#switchResult [data-review]')).toHaveCount(0);
 await page.screenshot({path:'test-results/SYNTHETIC-zero-budget-'+info.project.name+'.png',fullPage:true});
 await page.locator('#editEmptySwitch').click();await expect(page.locator('#switchSale')).toBeFocused();
 await expect(page.locator('#switchSale')).toHaveValue('10');await expect(page.locator('#switchDebt')).toHaveValue('10');await expect(page.locator('#switchExtra')).toHaveValue('0');
 await page.locator('#switchDebt').fill('9');await expect(page.locator('#switchResult')).toBeEmpty();await page.locator('#switchCalculate').click();
 await expect(page.locator('#switchResult .stats')).toContainText('집 살 예산1.00억');
 await page.locator('#switchDebt').fill('11');await page.locator('#switchCalculate').click();
 await expect(page.locator('#switchError')).toContainText('매수 예산이 0 이하');await expect(page.locator('#switchResult')).toBeEmpty();
});

