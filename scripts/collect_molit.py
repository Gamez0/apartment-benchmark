"""Collect public Sindorim transactions; credentials remain in Actions environment."""
import csv,datetime,hashlib,json,os,sys,time,urllib.request,urllib.parse,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class CollectionError(Exception):pass
def endpoint_url(value):
 p=urllib.parse.urlsplit(value.strip())
 if p.hostname!='apis.data.go.kr' or p.scheme not in ('http','https') or p.query or p.fragment or p.username:raise CollectionError('Invalid API endpoint configuration')
 path=p.path.rstrip('/')
 if path.endswith('/RTMSDataSvcAptTrade'):path+='/getRTMSDataSvcAptTrade'
 if not path.endswith('/getRTMSDataSvcAptTrade'):raise CollectionError('Expected apartment trade API endpoint')
 return urllib.parse.urlunsplit(('https',p.netloc,path,'',''))
def parse_page(raw):
 try:root=ET.fromstring(raw)
 except ET.ParseError:raise CollectionError('API returned non-XML content') from None
 code=root.findtext('.//resultCode')
 if code=='03':return [],0
 if code not in ('000','00','0'):raise CollectionError('API response code '+(code if code and code.isdigit() else 'unknown'))
 rows=[]
 for item in root.findall('.//item'):
  get=lambda key:(item.findtext(key) or '').strip()
  if get('umdNm')!='신도림동' or get('cdealType') in ('Y','O') or get('cdealDay') or get('dealingGbn')=='직거래' or get('landLeaseholdGbn')=='Y':continue
  name=get('aptNm');jibun=get('jibun')
  if not name or not jibun:raise CollectionError('Missing apartment identity')
  try:
   date=datetime.date(int(get('dealYear')),int(get('dealMonth')),int(get('dealDay'))).isoformat()
   price=float(get('dealAmount').replace(',',''))/10000;area=float(get('excluUseAr'))
   if price<=0 or area<=0:raise ValueError()
  except ValueError:raise CollectionError('Invalid transaction values') from None
  rows.append(dict(id='molit:11530:'+get('umdNm')+':'+jibun+':'+name,name=name,region='서울',district='구로구',dong=get('umdNm'),area=area,date=date,price=price,floor=get('floor'),buildYear=get('buildYear'),landLeaseholdGbn=get('landLeaseholdGbn'),cancelled=False))
 return rows,int(root.findtext('.//totalCount') or '0')
def collect():
 key=os.environ.get('MOLIT_API_KEY','').strip()
 if not key:raise CollectionError('MOLIT_API_KEY secret is missing')
 endpoint=endpoint_url(os.environ.get('MOLIT_API_ENDPOINT',''))
 # Accept both portal representations and URL-encode exactly once.
 key=urllib.parse.unquote(key)
 with (ROOT/'data/benchmark.csv').open(encoding='utf-8-sig') as f:bench=list(csv.DictReader(f))
 end=min(max(x['month'] for x in bench if x['region']==r) for r in {x['region'] for x in bench})
 ey,em=map(int,end.split('-'));months=[f'{y:04}{m:02}' for y in range(2015,ey+1) for m in range(1,13) if (y,m)<=(ey,em)]
 rows=[]
 for month in months:
  page=1
  while True:
   query=urllib.parse.urlencode(dict(serviceKey=key,LAWD_CD='11530',DEAL_YMD=month,pageNo=page,numOfRows=1000))
   for attempt in range(3):
    try:
     with urllib.request.urlopen(endpoint+'?'+query,timeout=30) as response:raw=response.read()
     break
    except Exception:
     if attempt==2:raise CollectionError('API network request failed for '+month+' after 3 attempts') from None
     time.sleep(2*(attempt+1))
   part,total=parse_page(raw);rows.extend(part)
   if page*1000>=total:break
   page+=1
   if page>100:raise CollectionError('Unexpected pagination size')
   time.sleep(.15)
  if month.endswith('12') or month==months[-1]:print('Collected through '+month,flush=True)
  time.sleep(.15)
 if not rows:raise CollectionError('No Sindorim transactions returned; existing data was not overwritten')
 path=ROOT/'data/transactions.csv';temp=path.with_suffix('.tmp')
 with temp.open('w',encoding='utf-8',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
 temp.replace(path)
 (ROOT/'data/molit-provenance.json').write_text(json.dumps(dict(source='국토교통부 아파트 매매 실거래가 API',districtCode='11530',dong='신도림동',fromMonth=months[0],throughMonth=months[-1],rows=len(rows),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),excluded='취소·직거래',identity='법정동·지번·단지명·전용면적'),ensure_ascii=False))
 print(f'Collected {len(rows)} official Sindorim transactions')
if __name__=='__main__':
 try:collect()
 except CollectionError as e:print(str(e),file=sys.stderr);sys.exit(1)
