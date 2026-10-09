import importlib.util
from pathlib import Path
s=importlib.util.spec_from_file_location('collector',Path(__file__).parents[1]/'scripts/collect_molit.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
item='<item><umdNm>신도림동</umdNm><aptNm>검증단지</aptNm><jibun>644</jibun><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>15</dealDay><dealAmount>146,000</dealAmount><excluUseAr>84.908</excluUseAr><floor>26</floor></item>'
xml='<response><header><resultCode>000</resultCode></header><body><items>'+item+item.replace('</item>','<cdealType>Y</cdealType></item>')+'</items><totalCount>2</totalCount></body></response>'
r,total=m.parse_page(xml);assert len(r)==1 and total==2 and r[0]['price']==14.6 and r[0]['area']==84.908
assert m.endpoint_url('http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade').endswith('/getRTMSDataSvcAptTrade')
for url in ['https://evil.example/path','https://apis.data.go.kr/path?serviceKey=secret']:
 try:m.endpoint_url(url);raise AssertionError()
 except m.CollectionError:pass
try:m.parse_page('<response><resultCode>30</resultCode></response>');raise AssertionError()
except m.CollectionError as e:assert str(e)=='API response code 30'
print('API parser: units, identity, cancellation, pagination total and secret-safe endpoint checks passed')
