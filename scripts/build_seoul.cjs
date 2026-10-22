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
 for(const [key,rows] of groups){rows.sort((a,b)=>a.date.localeCompare(b.date));const t=rows[0],payload=JSON.stringify({asOf:base.asOf,key,rows:rows.map(r=>({date:r.date,price:r.price,floor:r.floor}))}),token=crypto.createHash('sha256').update(payload).digest('hex').slice(0,24),relative='units/'+token+'.json',stats={};
 for(const years of [1,3,5,10]){const c=E.compare(rows,base.asOf,years);stats[years]=[c.current.price,c.current.count,c.current.months,c.previous.price,c.previous.count,c.previous.months,c.rate,c.annual,c.previous.start,c.previous.end,c.current.start,c.current.end];}
 const latest=rows.at(-1).date,unit={key,id:t.id,name:t.name,area:t.area,region:'서울',district:input.name,dong:t.dong,latest,stats,file:relative};units.push(unit);
 fs.writeFileSync(path.join(out,relative),payload);
 }
 const size=input.transactions.length;total+=size;const catalog={asOf:base.asOf,code:input.code,name:input.name,units};const catalogPayload=JSON.stringify(catalog),catalogHash=crypto.createHash('sha256').update(catalogPayload).digest('hex').slice(0,24),catalogFile='districts/'+input.code+'-'+catalogHash+'.json';fs.writeFileSync(path.join(out,catalogFile),catalogPayload);
 districts.push({code:input.code,name:input.name,units:units.length,trades:size,file:catalogFile});
}
const manifest={schema:1,asOf:base.asOf,fromMonth:'2015-01',throughMonth:base.asOf.slice(0,7),totalTrades:total,districts,source:'국토교통부 아파트 매매 실거래가 API',excluded:'취소·직거래·토지임대부',refreshPolicy:'최초 전체 수집 후 최근 6개월 재조회. 이전 월은 검증된 체크포인트 재사용. 전체 재수집은 수동 선택.',retrievedAt:new Date().toISOString()};
fs.writeFileSync(path.join(out,'sindorim.json'),JSON.stringify(base));const boot={...base,transactions:(base.transactions||[]).filter(t=>t.dong==='신도림동'&&['동아2','신도림동아2차','신도림2차동아'].includes(t.name)&&Math.abs(t.area-84.908)<.001)};boot.revision=crypto.createHash('sha256').update(JSON.stringify(boot)).digest('hex');const bootstrapPayload=JSON.stringify(boot);manifest.bootstrapRevision=boot.revision;manifest.bootstrapFile='bootstrap-'+crypto.createHash('sha256').update(bootstrapPayload).digest('hex').slice(0,24)+'.json';fs.writeFileSync(path.join(out,manifest.bootstrapFile),bootstrapPayload);fs.writeFileSync(path.join(root,'site/data.json'),bootstrapPayload);manifest.bootstrapTrades=boot.transactions.length;manifest.bootstrapBytes=fs.statSync(path.join(root,'site/data.json')).size;manifest.summaryBytes=districts.reduce((n,d)=>n+fs.statSync(path.join(out,d.file)).size,0);manifest.unitFiles=fs.readdirSync(path.join(out,'units')).length;fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));console.log(JSON.stringify(manifest));
