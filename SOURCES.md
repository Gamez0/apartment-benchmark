# 데이터 출처

확인일: 2026-10-09

- BM: 한국부동산원 R-ONE, 2026년 7월 공동주택 실거래가격지수 통계표의 `26.7 Sales Price Indices.xlsx`, `Sales Price Indices_Apt` 시트. 기준 2026년 6월=100. 전국·수도권·서울·인천·경기, 2006-01~2026-07. 전체 이력은 동일 파일에서 추출해 기준 변경을 혼합하지 않음. https://www.reb.or.kr/r-one/portal/bbs/rpt/searchBulletinPage.do?listSubCd=RPT04
- 금리: 한국은행 기준금리 변경 이력. 효력일부터 다음 변경일까지 유지. https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643
- 국토교통부 API에서 신도림동 실제 거래 5,850건 확보 및 공개 배포 확인 (2015-01~2026-07, Actions 37911100901). API 수집에서 취소·직거래·토지임대부 제외. 공개 서비스의 가상 체험은 제거했으며 합성 자료는 개발 검증에만 사용함.

재생성: `python scripts/prepare_data.py`. 공식 엑셀 재추출: `python scripts/import_benchmark.py --help`. 최신 BM과 금리는 자동 수집되지 않으며 소스 CSV 갱신 후 배포해야 함.

추가 수집 경로: 서울특별시 서울열린데이터광장 OA-21275, 국토교통부 실거래가 연계 자료. 공공누리 1유형(출처표시) 확인. https://data.seoul.go.kr/dataList/OA-21275/S/1/datasetView.do . CSV 스키마와 원천 정보는 확인했으나 이번 브라우저 다운로드는 시간 초과로 파일을 확보하지 못함. 변환 기능 검증은 합성 테스트 자료로 수행했으며 실제 단지 거래 확보로 표시하지 않음.

구매 시나리오 규정 참고 (2026-10-13 확인): 금융위원회 https://www.fsc.go.kr/no010101/85432 (2025-10-15 가격별 6/4/2억 상한), https://www.fsc.go.kr/no040000?cnId=3374 (2026년 실수요자 지원·LTV/DSR 유지 안내). 입력 LTV와 은행 확인 대출을 사용하며 생애최초·보유 주택·DSR 자격은 자동 심사하지 않음. 원리금균등 월 부담은 입력 금리·기간에 따른 일반 금융 계산, 현재 시장금리나 승인액 아님.
