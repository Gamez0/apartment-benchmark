import datetime,hashlib,importlib.util,json,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('cache','scripts/check_cache.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
now=datetime.datetime(2026,10,9,tzinfo=datetime.timezone.utc)
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'data').mkdir();assert not mod.valid_cache(root,now)
 (root/'data/benchmark.csv').write_text('region,month,value\n서울,2026-07,100\n')
 p=root/'data/transactions.csv';p.write_text('id,name\nsynthetic,test\n')
 meta=dict(source='국토교통부 아파트 매매 실거래가 API',districtCode='11530',dong='신도림동',fromMonth='201501',throughMonth='202607',rows=1,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),retrievedAt=now.isoformat())
 def save():(root/'data/molit-provenance.json').write_text(json.dumps(meta))
 save();assert mod.valid_cache(root,now)
 assert not mod.valid_cache(root,now+datetime.timedelta(days=1))
 meta['throughMonth']='202606';save();assert not mod.valid_cache(root,now)
 meta['throughMonth']='202607';meta['rows']=2;save();assert not mod.valid_cache(root,now)
 meta['rows']=1;save();p.write_text('id,name\nchanged,test\n');assert not mod.valid_cache(root,now)
print('Cache checks: age, source range, completeness, integrity and missing files passed (synthetic fixture only)')
