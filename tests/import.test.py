"""Verify official export conversion and preservation through the Pages build."""
import csv,importlib.util,json,subprocess,sys,tempfile,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('seoul',root/'scripts/import_seoul.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
row={k:'' for k in m.REQUIRED};row.update({'자치구코드':'11680','법정동코드':'10300','본번':'0010','부번':'0000','건물명':'검증아파트','계약일':'20260701','물건금액(만원)':'100,000','건물면적(㎡)':'84.9','건물용도':'아파트','신고구분':'중개거래','자치구명':'강남구','법정동명':'개포동','층':'10'})
rows=[row,dict(row,취소일='20260702'),dict(row,권리구분='분양권'),dict(row,신고구분='직거래'),dict(row,건물용도='오피스텔')]
out,counts=m.convert(rows);assert len(out)==1 and out[0]['price']==10 and out[0]['date']=='2026-07-01';assert sum(counts.values())==4
assert m.convert([row,row])[0][0]==m.convert([row,row])[0][1] # legitimate equal rows retained
assert m.convert([dict(row,본번='0011')])[0][0]['id']!=out[0]['id']
try:m.convert([dict(row,계약일='20260230')]);raise AssertionError('invalid date accepted')
except ValueError:pass
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp);shutil.copytree(root/'scripts',p/'scripts');shutil.copytree(root/'data',p/'data');(p/'site').mkdir();raw=p/'official.csv'
 with raw.open('w',encoding='cp949',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(row));w.writeheader();w.writerows(rows)
 subprocess.run([sys.executable,str(p/'scripts/import_seoul.py'),str(raw)],check=True,stdout=subprocess.DEVNULL)
 subprocess.run([sys.executable,str(p/'scripts/prepare_data.py')],check=True,stdout=subprocess.DEVNULL)
 d=json.loads((p/'site/data.json').read_text());assert not d['demo'] and len(d['transactions'])==1 and d['transactions'][0]['price']==10
 assert len(d['benchmark'])==1235;assert not (p/'site/demo.json').exists()
print('Official CSV: units, cancellation, rights, direct trades, identity, dates, CP949 and build preservation passed')
