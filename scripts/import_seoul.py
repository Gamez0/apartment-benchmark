"""Normalize Seoul OA-21275 CSV exports; keep source files outside the repository."""
import argparse,csv,datetime,hashlib,json,math
from pathlib import Path
FIELDS=['id','name','region','area','date','price','floor','cancelled','district','dong']
REQUIRED=['자치구코드','법정동코드','본번','부번','건물명','계약일','물건금액(만원)','건물면적(㎡)','건물용도','권리구분','취소일','신고구분']
def convert(rows):
 out=[];counts={}
 def skip(reason):counts[reason]=counts.get(reason,0)+1
 for n,r in enumerate(rows,2):
  if r['건물용도'].strip()!='아파트':skip('non_apartment');continue
  if r['취소일'].strip() not in ['', '-', '0']:skip('cancelled');continue
  if r['권리구분'].strip():skip('rights_transaction');continue
  if r['신고구분'].strip()=='직거래':skip('direct_trade');continue
  try:
   name=r['건물명'].strip();raw=r['계약일'].strip();date=datetime.datetime.strptime(raw,'%Y%m%d').date().isoformat()
   price=float(r['물건금액(만원)'].replace(',',''))/10000;area=float(r['건물면적(㎡)'].replace(',',''))
   if not name or not all(math.isfinite(x) and x>0 for x in [price,area]):raise ValueError('price, area or name')
   location=[r[k].strip() for k in ['자치구코드','법정동코드','본번','부번']]
   if any(not x for x in location):raise ValueError('location')
   identity='|'.join(location+[name]);id='seoul-'+hashlib.sha256(identity.encode()).hexdigest()[:20]
   out.append(dict(id=id,name=name,region='서울',area=area,date=date,price=price,floor=r.get('층','').strip(),cancelled=False,district=r.get('자치구명','').strip(),dong=r.get('법정동명','').strip()))
  except (ValueError,KeyError) as e:raise ValueError(f'Invalid eligible trade at CSV row {n}') from e
 return out,counts

def main():
 p=argparse.ArgumentParser();p.add_argument('files',nargs='+');p.add_argument('--output',default=str(Path(__file__).resolve().parents[1]/'data/transactions.csv'));a=p.parse_args();allrows=[];sources=[]
 for file in a.files:
  raw=Path(file).read_bytes()
  try:text=raw.decode('utf-8-sig')
  except UnicodeDecodeError:text=raw.decode('cp949')
  reader=csv.DictReader(text.splitlines());missing=set(REQUIRED)-set(reader.fieldnames or [])
  if missing:raise ValueError(f'Missing headers: {sorted(missing)}')
  rows=list(reader);trades,excluded=convert(rows);allrows.extend(trades);sources.append(dict(file=Path(file).name,sha256=hashlib.sha256(raw).hexdigest(),inputRows=len(rows),accepted=len(trades),excluded=excluded))
 if len({s['sha256'] for s in sources})!=len(sources):raise ValueError('Same input file supplied twice')
 out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
 with out.open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=FIELDS);w.writeheader();w.writerows(allrows)
 report=dict(source='서울특별시 서울열린데이터광장 OA-21275',files=sources,transactions=len(allrows),dateMin=min((x['date'] for x in allrows),default=None),dateMax=max((x['date'] for x in allrows),default=None),policy='아파트만; 취소·분양/입주권·직거래 제외. 동일 원천 거래행을 임의 중복 제거하지 않음.')
 out.with_suffix('.provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
