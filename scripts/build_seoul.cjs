// Same production calculation engine as the UI; synthetic inputs only in tests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),E=require('../site/engine.js');
const root=path.resolve(__dirname,'..'),base=JSON.parse(fs.readFileSync(path.join(root,'site/data.json'))),out=path.join(root,'site/seoul');
fs.mkdirSync(path.join(out,'units'),{recursive:true});fs.mkdirSync(path.join(out,'districts'),{recursive:true});
const districts=[],files=fs.readdirSync(path.join(root,'data/seoul-collected')).filter(f=>f.endsWith('.json'));
if(files.length!==25)throw Error('All 25 district snapshots required');
let total=0;
for(const file of files){
 const input=JSON.parse(fs.readFileSync(path.join(root,'data/seoul-collected',file))),groups=new Map();
 for(const t of input.transactions){if(t.date>base.asOf||t.cancelled)continue;const key=t.id+'|'+t.area;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
 const units=[];
 for(const [key,rows] of groups){rows.sort((a,b)=>a.date.localeCompare(b.date));const t=rows[0],token=crypto.createHash('sha256').update(key).digest('hex').slice(0,24),relative='units/'+token+'.json',stats={};
 for(const years of [1,3,5,10])stats[years]=E.compare(rows,base.asOf,years);
 const latest=rows.at(-1).date,unit={key,id:t.id,name:t.name,area:t.area,region:'서울',district:input.name,dong:t.dong,latest,stats,file:relative};units.push(unit);
 fs.writeFileSync(path.join(out,relative),JSON.stringify({asOf:base.asOf,key,rows:rows.map(r=>({date:r.date,price:r.price,floor:r.floor}))}));
 }
 const size=input.transactions.length;total+=size;const catalog={asOf:base.asOf,code:input.code,name:input.name,units};fs.writeFileSync(path.join(out,'districts',input.code+'.json'),JSON.stringify(catalog));
 districts.push({code:input.code,name:input.name,units:units.length,trades:size,file:'districts/'+input.code+'.json'});
}
const manifest={schema:1,asOf:base.asOf,fromMonth:'2015-01',throughMonth:base.asOf.slice(0,7),totalTrades:total,districts,source:'국토교통부 아파트 매매 실거래가 API',excluded:'취소·직거래·토지임대부',refreshPolicy:'최초 전체 수집 후 최근 6개월 재조회. 이전 월은 검증된 체크포인트 재사용. 전체 재수집은 수동 선택.',retrievedAt:new Date().toISOString()};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));console.log(JSON.stringify(manifest));
