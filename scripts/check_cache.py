"""Reuse only a recent complete official snapshot, never credentials or partial output."""
import csv,datetime,hashlib,json,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def valid_cache(root=ROOT,now=None):
 try:
  now=now or datetime.datetime.now(datetime.timezone.utc)
  meta=json.loads((root/'data/molit-provenance.json').read_text())
  retrieved=datetime.datetime.fromisoformat(meta['retrievedAt'])
  if not retrieved.tzinfo or not 0<=(now-retrieved).total_seconds()<86400:return False
  if meta['source']!='국토교통부 아파트 매매 실거래가 API' or meta['districtCode']!='11530' or meta['dong']!='신도림동' or meta['fromMonth']!='201501':return False
  with (root/'data/benchmark.csv').open(encoding='utf-8-sig') as f:bench=list(csv.DictReader(f))
  end=min(max(x['month'] for x in bench if x['region']==r) for r in {x['region'] for x in bench}).replace('-','')
  if meta['throughMonth']!=end:return False
  path=root/'data/transactions.csv'
  if hashlib.sha256(path.read_bytes()).hexdigest()!=meta['sha256']:return False
  with path.open(encoding='utf-8-sig') as f:rows=list(csv.DictReader(f))
  return len(rows)==meta['rows'] and len(rows)>0
 except (OSError,KeyError,ValueError,TypeError):return False
if __name__=='__main__':
 value=('day='+datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')) if '--day' in sys.argv else 'valid='+str(valid_cache()).lower()
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write(value+'\n')
 print(value)
