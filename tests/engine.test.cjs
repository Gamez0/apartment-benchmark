const assert=require('node:assert/strict');const E=require('../site/engine.js');
assert.equal(E.median([3,1,2,4]),2.5);
const rows=['2025-08-01','2025-08-15','2025-09-01'].map(date=>({date,price:10})).concat(['2026-08-01','2026-08-15','2026-09-01'].map(date=>({date,price:11})),[{date:'2026-09-15',price:50,cancelled:true}]);
const c=E.compare(rows,'2026-09-30',1);assert.ok(Math.abs(c.rate-10)<1e-9);assert.equal(c.current.count,3);assert.equal(c.current.months,3);
assert.equal(E.compare(rows.slice(0,2),'2026-09-30',1).rate,null);
const fallback=rows.map(r=>({...r,date:r.date.replace('-08-','-05-')}));assert.equal(E.compare(fallback,'2026-09-30',1).current.months,6);
assert.equal(E.benchmark([{month:'2025-09',value:100},{month:'2026-09',value:108}],'2026-09-30',1).toFixed(1),'8.0');assert.equal(E.benchmark([],'2026-09-30',1),null);
assert.equal(E.csv('\uFEFFname,price\r\n"a,b",10\r\n')[0].name,'a,b');assert.throws(()=>E.csv('name\n"bad'));


assert.equal(E.windowPrice([], '2026-05-31',3).start,'2026-02-28');
assert.equal(E.windowPrice([], '2024-05-31',3).start,'2024-02-29');

console.log('Calculation checks passed, including month-end regression');
const officialRow={'자치구코드':'11680','법정동코드':'10300','본번':'0010','부번':'0000','건물명':'검증단지','계약일':'20260701','물건금액(만원)':'100,000','건물면적(㎡)':'84.9','건물용도':'아파트','신고구분':'중개거래','권리구분':'','취소일':''};
const normalized=E.normalizeTrades([officialRow,{...officialRow,'취소일':'20260702'},{...officialRow,'권리구분':'분양권'},{...officialRow,'신고구분':'직거래'},{...officialRow,'건물용도':'오피스텔'}]);assert.equal(normalized.rows.length,1);assert.equal(normalized.excluded,4);assert.equal(normalized.rows[0].price,10);assert.equal(normalized.rows[0].date,'2026-07-01');

const h=E.holding(rows,'2026-09-30','2016-09-30',5);assert.equal(h.gain,6);assert.ok(Math.abs(h.rate-120)<1e-9);assert.ok(Math.abs(h.annual-8.2)<.1);assert.equal(E.holding([],'2026-09-30','2016-09-30',5).rate,null);assert.throws(()=>E.holding(rows,'2026-09-30','2026-09-30',5));assert.throws(()=>E.holding(rows,'2026-09-30','2025-02-30',5));assert.throws(()=>E.holding(rows,'2026-09-30','2016-09-30',0));

const sw=require('../site/engine.js').switchBudget({sale:14.6,debt:3,saleCost:.1,extra:1,loan:3,buyCost:.3});assert.ok(Math.abs(sw.budget-15.2)<1e-9);assert.ok(Math.abs(sw.net-11.5)<1e-9);assert.throws(()=>require('../site/engine.js').switchBudget({sale:10,debt:-1,saleCost:0,extra:0,loan:0,buyCost:0}));

const carried=E.marketCarry([{date:'a',price:10},{date:'b',price:12},{date:'c',price:null},{date:'d',price:14}],{a:100,b:105,c:110,d:115},'a');
assert.ok(Math.abs(carried[2].value-125)<1e-9);assert.equal(carried[2].estimated,true);assert.ok(Math.abs(carried[3].value-140)<1e-9);assert.equal(carried[3].estimated,false);
assert.equal(E.marketCarry([{date:'a',price:null},{date:'b',price:12}],{a:100,b:105},'a')[0].value,null);
assert.equal(E.marketCarry([{date:'a',price:10},{date:'b',price:null}],{a:100,b:110},'b')[0].value,100);
console.log('Market carry: fixed index gap, observed return, prior anchor and no future fill passed');
const general=Engine.purchaseScenario({own:2,partner:1,reserve:0,loan:6,ltv:40,interest:4,years:30,monthly:0});
assert.equal(Engine.purchaseFit(5,general).required,2);assert.equal(Engine.purchaseFit(5.01,general),null);
const first=Engine.purchaseScenario({own:2,partner:1,reserve:0,loan:6,ltv:70,interest:4,years:30,monthly:0});
assert.equal(Engine.purchaseFit(9,first).required,6);assert.equal(Engine.purchaseFit(9.01,first),null);
const limited=Engine.purchaseScenario({own:2,partner:1,reserve:0.3,loan:6,ltv:70,interest:0,years:10,monthly:100});
assert.ok(Math.abs(limited.loan-1.2)<1e-9);assert.ok(Math.abs(limited.payment(1.2)-100)<1e-9);
assert.throws(()=>Engine.purchaseScenario({own:2,partner:1,reserve:4,loan:6,ltv:70,interest:4,years:30,monthly:0}));
assert.equal(Engine.purchaseFit(26,Engine.purchaseScenario({own:20,partner:0,reserve:0,loan:10,ltv:70,interest:4,years:30,monthly:0})),null);
console.log('Purchase: LTV, price cap, cash reserve, zero interest and monthly burden passed');

assert.ok(Math.abs(general.budget-5)<1e-9);assert.ok(Math.abs(first.budget-9)<1e-9);
assert.equal(Engine.purchaseScenario({own:10,partner:0,reserve:0,loan:6,ltv:70,interest:4,years:30,monthly:0}).budget,15);
assert.equal(Engine.purchaseScenario({own:24,partner:0,reserve:0,loan:6,ltv:70,interest:4,years:30,monthly:0}).budget,26);
console.log('Purchase ceiling includes LTV and discontinuous price-band loan caps');

// Synthetic evidence boundaries for symmetric historical market-relative rankings.
{
 const sample=(key,rate,extra={})=>({key,rate,current:{price:10,count:5},previous:{price:8,count:5},latest:'2026-07-31',...extra});
 const rows=[sample('high',30),sample('low',5),sample('decline',-5),sample('flat',0),sample('equal',10),sample('sparseHigh',100,{previous:{price:8,count:4}}),sample('sparseLow',-90,{current:{price:1,count:4}}),sample('stale',80,{latest:'2026-05-01'}),sample('future',90,{latest:'2026-08-01'}),sample('cancel',100,{cancelled:true})];
 const E=require('../site/engine.js');
 require('node:assert/strict').deepEqual(E.marketRanks(rows,10,'2026-07-31','high').map(g=>g.key),['high']);
 require('node:assert/strict').deepEqual(E.marketRanks(rows,10,'2026-07-31','low').map(g=>g.key),['flat','low']);
 require('node:assert/strict').equal(E.marketRanks(rows,null,'2026-07-31','high').length,0);
 require('node:assert/strict').equal(E.marketRanks([sample('neg',-2)],-10,'2026-07-31','high').length,0);
 require('node:assert/strict').deepEqual(E.marketRanks(rows,10,'2026-07-31','decline').map(g=>g.key),['decline']);
 require('node:assert/strict').equal(E.marketRanks([sample('neg',-2)],-10,'2026-07-31','decline')[0].excess,8);
 console.log('Seoul market ranks: same sample/recency rules on both sides; missing BM, future, cancellation and negative returns passed');
}
