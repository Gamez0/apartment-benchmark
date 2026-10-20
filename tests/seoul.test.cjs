// Synthetic district fixtures: not production transactions.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('../site/engine.js');
const els=new Map(),el=id=>{if(!els.has(id))els.set(id,{value:({period:'1',region:'서울',dong:'신도림동',areaScope:'all',budget:'0',search:'',sort:'rate',marketPeriod:'1'})[id]??'',innerHTML:'',textContent:'',checked:false,hidden:false,addEventListener(){},querySelectorAll(){return[]},scrollIntoView(){}});return els.get(id);};
const rows=price=>['2025','2026'].flatMap((y,i)=>[1,2,3,4,5].map(day=>({date:y+'-07-0'+day,price:price+i*2,floor:day})));
const base=rows(8).map(r=>({...r,id:'base',name:'동아2',area:84.908,region:'서울',district:'구로구',dong:'신도림동'}));
const data={asOf:'2026-07-31',transactions:base,benchmark:[{region:'서울',month:'2025-07',value:100},{region:'서울',month:'2026-07',value:110}],rates:[]};
const unit=(key,name,district,code)=>({key,name,area:84,region:'서울',district,dong:name+'동',latest:'2026-07-05',file:'units/'+code.repeat(24)+'.json',stats:Object.fromEntries([1,3,5,10].map(y=>[y,E.compare(rows(6),data.asOf,y)]))});
const u=unit('middle|84','중구단지','중구','a'),v=unit('guro|84','구로단지','구로구','b');
const manifest={schema:1,asOf:data.asOf,totalTrades:30,districts:[{code:'11530',name:'구로구',file:'districts/11530.json'},{code:'11140',name:'중구',file:'districts/11140.json'},...Array.from({length:23},(_,i)=>({code:'test'+i,name:'합성'+i,file:'districts/test'+i+'.json'}))]};
let requests=[],responses={'seoul/manifest.json':manifest,'seoul/districts/11530.json':{asOf:data.asOf,code:'11530',units:[v]},'seoul/districts/11140.json':{asOf:data.asOf,code:'11140',units:[u]},['seoul/'+u.file]:{asOf:data.asOf,key:u.key,rows:rows(6)}};
const context={document:{getElementById:el},fetch:()=>new Promise(()=>{}),Engine:E,console,dataFixture:data};vm.createContext(context);vm.runInContext(fs.readFileSync('site/app.js','utf8'),context);vm.runInContext('load(dataFixture)',context);
context.fetch=async url=>{requests.push(url);return {ok:!!responses[url],json:async()=>structuredClone(responses[url])}};
(async()=>{
 await vm.runInContext('initSeoul()',context);assert.ok(!requests.some(x=>x.startsWith('seoul/units')));assert.ok(vm.runInContext('groups().every(g=>g.district==="구로구")',context));
 el('districtScope').value='11140';el('dong').value='';await vm.runInContext('loadScope()',context);assert.match(el('results').innerHTML,/중구단지/);assert.ok(!el('results').innerHTML.includes('구로단지'));assert.ok(!requests.some(x=>x.startsWith('seoul/units')));
 const compared=vm.runInContext('groupCompare(groups()[0],1)',context);assert.equal(compared.rate,E.compare(rows(6),data.asOf,1).rate);
 el('referenceHome').value=u.key;await el('referenceHome').onchange();assert.equal(vm.runInContext('baselineTitle()',context),'중구단지');assert.equal(requests.filter(x=>x==='seoul/'+u.file).length,1);assert.match(el('referenceResult').innerHTML,/중구단지/);assert.ok(!el('results').innerHTML.includes('priority-card'));
 for(const [id,value] of Object.entries({buyOwn:'8',buyPartner:'0',buyReserve:'0',buyLoan:'0',buyLtv:'40',buyInterest:'4',buyYears:'30',buyMonthly:'0'}))el(id).value=value;
 el('purchaseCalculate').onclick();assert.equal(el('purchaseError').textContent,'');assert.match(el('purchaseResult').innerHTML,/중구단지/);el('dong').value='없는동';vm.runInContext('render()',context);assert.equal(el('purchaseResult').innerHTML,'');
 el('districtScope').value='';el('dong').value='';await vm.runInContext('loadScope()',context);assert.equal(el('purchaseCalculate').disabled,true);el('purchaseCalculate').onclick();assert.match(el('purchaseError').textContent,/아직 준비/);
 assert.ok(fs.readFileSync('site/style.css','utf8').includes('input,select{font-size:16px'));
 console.log('Seoul synthetic UI: lazy histories, scope isolation, shared calculations, reference changes, stale results and partial-load refusal passed');
})().catch(e=>{console.error(e);process.exitCode=1});
