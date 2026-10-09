# 데이터 출처

확인일: 2026-10-09

- BM: 한국부동산원 R-ONE, 2026년 7월 공동주택 실거래가격지수 통계표의 `26.7 Sales Price Indices.xlsx`, `Sales Price Indices_Apt` 시트. 기준 2026년 6월=100. 전국·수도권·서울·인천·경기, 2006-01~2026-07. 전체 이력은 동일 파일에서 추출해 기준 변경을 혼합하지 않음. https://www.reb.or.kr/r-one/portal/bbs/rpt/searchBulletinPage.do?listSubCd=RPT04
- 금리: 한국은행 기준금리 변경 이력. 효력일부터 다음 변경일까지 유지. https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643
- 기본 화면에 실제 단지 거래는 아직 없음. 가상 단지와 가상 BM은 별도 체험 모드에만 사용함. 실제 금리와 함께 보더라도 투자 후보가 아님.

재생성: `python scripts/prepare_data.py`. 공식 엑셀 재추출: `python scripts/import_benchmark.py --help`. 최신 BM과 금리는 자동 수집되지 않으며 소스 CSV 갱신 후 배포해야 함.
