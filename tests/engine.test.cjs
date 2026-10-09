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
