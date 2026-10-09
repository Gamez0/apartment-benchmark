const assert=require('node:assert/strict'),E=require('../site/engine');
const g=(key,excess,count=5,date='2026-07-01')=>({key,rate:20,excess,current:{count},previous:{count},rows:[{date}]});
assert.deepEqual(E.priorities([g('a',10),g('b',15),g('few',30,4),g('old',40,5,'2026-04-01'),g('negative',-1)],'2026-07-31'),['b','a']);
assert.deepEqual(E.priorities([g('a',null),{...g('b',1),rate:null}], '2026-07-31'),[]);
assert.deepEqual(E.priorities([g('future',10,5,'2026-08-01'),{...g('cancel',10),rows:[{date:'2026-07-01',cancelled:true}]}],'2026-07-31'),[]);
assert.equal(E.priorities([g('a',1),g('b',2),g('c',3),g('d',4)],'2026-07-31').length,3);
console.log('Priority eligibility: sparse, stale, future, cancelled, unavailable BM and top-three cap passed');
