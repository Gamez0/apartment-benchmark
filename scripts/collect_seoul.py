"""Official Seoul collection, bounded concurrency and validated per-month checkpoints."""
import concurrent.futures,csv,datetime,hashlib,json,os,threading,time,urllib.parse,urllib.request
from pathlib import Path
from collect_molit import CollectionError,endpoint_url,parse_page
ROOT=Path(__file__).resolve().parents[1]
DISTRICTS={'11110':'종로구','11140':'중구','11170':'용산구','11200':'성동구','11215':'광진구','11230':'동대문구','11260':'중랑구','11290':'성북구','11305':'강북구','11320':'도봉구','11350':'노원구','11380':'은평구','11410':'서대문구','11440':'마포구','11470':'양천구','11500':'강서구','11530':'구로구','11545':'금천구','11560':'영등포구','11590':'동작구','11620':'관악구','11650':'서초구','11680':'강남구','11710':'송파구','11740':'강동구'}
def write_json(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix('.tmp');temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')));temp.replace(path)
def digest(rows):return hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def checkpoint(path,code,month,today,refresh):
 try:
  v=json.loads(path.read_text())
  if v['schema']!=1 or v['code']!=code or v['month']!=month or v['sha256']!=digest(v['rows']):return None
  if refresh and v['retrievedAt'][:10]!=today:return None
  return v
 except (OSError,ValueError,KeyError,TypeError):return None
def collect():
 key=urllib.parse.unquote(os.environ.get('MOLIT_API_KEY','').strip())
 if not key:raise CollectionError('MOLIT_API_KEY secret is missing')
 endpoint=endpoint_url(os.environ.get('MOLIT_API_ENDPOINT',''));today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
 with (ROOT/'data/benchmark.csv').open(encoding='utf-8-sig') as f:bench=list(csv.DictReader(f))
 end=min(max(x['month'] for x in bench if x['region']==r) for r in {x['region'] for x in bench});ey,em=map(int,end.split('-'))
 months=[f'{y:04}{m:02}' for y in range(2015,ey+1) for m in range(1,13) if (y,m)<=(ey,em)]
 counter=[0];lock=threading.Lock()
 def district(code):
  rows=[];observations=[]
  for index,month in enumerate(months):
   path=ROOT/'data/seoul-cache'/code/(month+'.json');refresh=index>=len(months)-6 or os.environ.get('FULL_REFRESH')=='true';saved=checkpoint(path,code,month,today,refresh)
   if not saved:
    part=[];page=1
    while True:
     query=urllib.parse.urlencode(dict(serviceKey=key,LAWD_CD=code,DEAL_YMD=month,pageNo=page,numOfRows=1000))
     for attempt in range(3):
      with lock:
       counter[0]+=1
       if counter[0]>9500:raise CollectionError('Run request budget exhausted; checkpoints retained')
      try:
       with urllib.request.urlopen(endpoint+'?'+query,timeout=30) as response:raw=response.read()
       break
      except Exception:
       if attempt==2:raise CollectionError('Network request failed for '+code+'/'+month) from None
       time.sleep(2*(attempt+1))
     parsed,total=parse_page(raw,code,DISTRICTS[code],None)
     if any(r['date'][:7].replace('-','')!=month for r in parsed):raise CollectionError('Contract month mismatch')
     part.extend(parsed)
     if page*1000>=total:break
     page+=1
     if page>100:raise CollectionError('Unexpected pagination size')
     time.sleep(.25)
    saved=dict(schema=1,code=code,month=month,rows=part,sha256=digest(part),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat());write_json(path,saved);time.sleep(.25)
   rows.extend(saved['rows']);observations.append(dict(month=month,retrievedAt=saved['retrievedAt'],sha256=saved['sha256']))
  if not rows:raise CollectionError('No district transactions: '+code)
  out=dict(code=code,name=DISTRICTS[code],fromMonth=months[0],throughMonth=months[-1],transactions=rows,observations=observations)
  write_json(ROOT/'data/seoul-collected'/(code+'.json'),out);print('Completed '+code+': '+str(len(rows))+' official trades',flush=True)
  return out
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(district,DISTRICTS))
 sindorim=[r for d in results if d['code']=='11530' for r in d['transactions'] if r['dong']=='신도림동']
 path=ROOT/'data/transactions.csv';temp=path.with_suffix('.tmp')
 with temp.open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(sindorim[0]));w.writeheader();w.writerows(sindorim)
 temp.replace(path)
 write_json(ROOT/'data/molit-provenance.json',dict(source='국토교통부 아파트 매매 실거래가 API',districtCode='11530',dong='신도림동',fromMonth=months[0],throughMonth=months[-1],rows=len(sindorim),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),excluded='취소·직거래·토지임대부'))
 print('All 25 districts complete; requests this run: '+str(counter[0]),flush=True)
if __name__=='__main__':
 try:collect()
 except CollectionError as e:print(str(e));raise SystemExit(1)
