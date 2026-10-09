const assert=require('node:assert/strict');const E=require('../site/engine.js');
assert.equal(E.median([3,1,2,4]),2.5);
const rows=['2025-08-01','2025-08-15','2025-09-01'].map(date=>({date,price:10})).concat(['2026-08-01','2026-08-15','2026-09-01'].map(date=>({date,price:11})),[{date:'2026-09-15',price:50,cancelled:true}]);
const c=E.compare(rows,'2026-09-30',1);assert.ok(Math.abs(c.rate-10)<1e-9);assert.equal(c.current.count,3);assert.equal(c.current.months,3);
assert.equal(E.compare(rows.slice(0,2),'2026-09-30',1).rate,null);
const fallback=rows.map(r=>({...r,date:r.date.replace('-08-','-05-')}));assert.equal(E.compare(fallback,'2026-09-30',1).current.months,6);
assert.equal(E.benchmark([{month:'2025-09',value:100},{month:'2026-09',value:108}],'2026-09-30',1).toFixed(1),'8.0');assert.equal(E.benchmark([],'2026-09-30',1),null);
assert.equal(E.csv('\uFEFFname,price\r\n"a,b",10\r\n')[0].name,'a,b');assert.throws(()=>E.csv('name\n"bad'));
console.log('8 calculation checks passed');

assert.equal(E.windowPrice([], '2026-05-31',3).start,'2026-02-28');
assert.equal(E.windowPrice([], '2024-05-31',3).start,'2024-02-29');
