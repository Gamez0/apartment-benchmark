"""Synthetic collection checkpoint and split asset checks. No API requests."""
import importlib.util,json,pathlib,shutil,subprocess,tempfile,sys
root=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
from collect_seoul import checkpoint,digest,DISTRICTS
from collect_molit import parse_page,CollectionError
xml=b'<response><header><resultCode>000</resultCode></header><body><totalCount>1</totalCount><items><item><sggCd>11140</sggCd><umdNm>test</umdNm><aptNm>sample</aptNm><jibun>1</jibun><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>1</dealDay><dealAmount>60,000</dealAmount><excluUseAr>84</excluUseAr></item></items></body></response>'
rows,total=parse_page(xml,'11140','중구',None);assert rows[0]['id'].startswith('molit:11140:') and rows[0]['district']=='중구'
try:parse_page(xml,'11530','구로구',None);raise AssertionError('cross-district accepted')
except CollectionError:pass
with tempfile.TemporaryDirectory() as d:
 t=pathlib.Path(d);p=t/'cache.json';value=dict(schema=1,code='11140',month='202607',rows=rows,sha256=digest(rows),retrievedAt='2026-10-19T00:00:00Z');p.write_text(json.dumps(value))
 assert checkpoint(p,'11140','202607','2026-10-20',False)
 assert checkpoint(p,'11140','202607','2026-10-20',True) is None
 value['rows'][0]['price']=999;p.write_text(json.dumps(value));assert checkpoint(p,'11140','202607','2026-10-20',False) is None
 for folder in ['scripts','site','data/seoul-collected']:(t/folder).mkdir(parents=True,exist_ok=True)
 shutil.copy(root/'scripts/build_seoul.cjs',t/'scripts/build_seoul.cjs');shutil.copy(root/'site/engine.js',t/'site/engine.js');(t/'site/data.json').write_text(json.dumps({'asOf':'2026-07-31'}))
 for code,name in DISTRICTS.items():
  trades=[dict(id='fixture:'+code,name='synthetic',area=84,region='서울',district=name,dong='fixture',date=f'{year}-07-0{day}',price=price,floor=day) for year,price in [(2016,3),(2021,4),(2023,5),(2025,6),(2026,8)] for day in range(1,6)]
  (t/'data/seoul-collected'/f'{code}.json').write_text(json.dumps(dict(code=code,name=name,transactions=trades)))
 subprocess.run(['node',str(t/'scripts/build_seoul.cjs')],check=True,capture_output=True)
 m=json.loads((t/'site/seoul/manifest.json').read_text());assert len(m['districts'])==25 and m['totalTrades']==625 and m['unitFiles']==25
 catalog=json.loads((t/'site/seoul'/next(d['file'] for d in m['districts'] if d['code']=='11140')).read_text());u=catalog['units'][0];assert abs(u['stats']['1'][6]-100/3)<1e-8
 history=json.loads((t/'site/seoul'/u['file']).read_text());assert len(history['rows'])==25 and history['key']==u['key']
print('Seoul synthetic collection: district identity, checksum/refresh checkpoints, 25 district split and calculation parity passed')
