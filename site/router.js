/* URL-backed screens. Private form values stay in the existing in-memory DOM. */
(()=>{
 const panels={home:'.landing-screen',market:'#marketRankFlow',candidates:'#nearbyFlow',budget:'#purchaseFlow',move:'#switchPanel',shortlist:'#shortlistPage',compare:'#trendFlow',detail:'#detail',advanced:'#advancedFlow',evidence:'#evidencePage'};
 const names={home:'내 집, 서울과 비교하면?',market:'서울 시장과 차이가 큰 곳은?',candidates:'우리 동네와 비교하면?',budget:'내 예산으로 어디를 살 수 있을까?',move:'우리 집을 팔면 어디까지 갈 수 있을까?',shortlist:'어디부터 알아볼까요?',compare:'가격 흐름과 실제 거래',detail:'실제 거래 상세',advanced:'다른 기준으로 계산하기',evidence:'설정과 데이터 출처'};
 const byId={marketRankFlow:'market',nearbyFlow:'candidates',purchaseFlow:'budget',switchPanel:'move',trendFlow:'compare',detail:'detail',advancedFlow:'advanced',evidencePage:'evidence'};
 const $=id=>document.getElementById(id),positions=new Map(),reviews=new Map();let active='home',serial=0,entryKey=null,applying=false,ready=false;
 const parse=()=>location.hash.replace(/^#\/?/,'')||'home';
 const state=()=>history.state?.apartmentFlow?history.state:null;
 function focusKey(){const e=document.activeElement;if(e?.id)return '#'+CSS.escape(e.id);if(e?.hasAttribute?.('data-review-open'))return '[data-page="'+e.closest('[data-page]').dataset.page+'"] [data-review-open]';for(const a of ['data-rank-detail','data-rank-compare','data-detail','data-add','data-purchase-detail','data-switch-detail','data-remove','data-review','data-review-detail','data-review-remove'])if(e?.hasAttribute?.(a))return '['+a+'="'+CSS.escape(e.getAttribute(a))+'"]';return null;}
 function save(){if(entryKey)positions.set(entryKey,{y:window.scrollY,focus:focusKey()});}
 function title(){const root=document.querySelector(panels[active]);let text=root?.querySelector('summary h2,summary span,h2,h1')?.textContent?.trim()||names[active];if(active==='detail')text=$('detailTitle').textContent||names.detail;$('flowTitle').textContent=text;document.title=text+' · 집의 흐름';}
 function syncReviews(){document.querySelectorAll('[data-review]').forEach(b=>{const chosen=reviews.has(b.dataset.review);b.setAttribute('aria-pressed',String(chosen));b.textContent=chosen?'후보에서 빼기':'알아볼 후보로 담기';});document.querySelectorAll('[data-review-next]').forEach(e=>e.hidden=reviews.size===0);document.querySelectorAll('[data-review-count]').forEach(e=>e.textContent='알아볼 후보 '+reviews.size+'/3곳');}
 function renderReviews(){const cards=[...reviews].map(([key,origin])=>{const g=reviewCandidate(key,origin);if(!g)return '';const price=g.current.price;const money=!(price>0)?'최근 거래 자료가 부족해요':g.budget==null?'예산을 다시 확인해주세요':price<=g.budget?'계산 예산에서 '+(g.budget-price).toFixed(2)+'억 남아요':'현재 조건의 예산보다 '+(price-g.budget).toFixed(2)+'억 높아요';return '<article class="review-card"><h3>'+esc(g.district||g.region)+' '+esc(g.dong)+'</h3><p>'+esc(g.name)+' · 전용 '+g.area+'㎡</p><strong>'+(price==null?'가격 자료 부족':price.toFixed(2)+'억')+'</strong><p class="review-money">'+money+'</p><p>'+g.years+'년 서울 대비 '+(g.excess==null?'거래 부족':signed(g.excess)+'%p')+'</p>'+(g.sale==null||!(price>0)?'':'<p>매도 가정과 가격 차이 '+signed(price-g.sale)+'억</p>')+'<div class="card-actions"><button data-review-detail="'+esc(key)+'">실제 거래 보기</button><button data-review-remove="'+esc(key)+'">후보에서 빼기</button></div><a data-route="'+origin+'" href="#/'+origin+'">'+(g.budget==null?'예산 다시 확인':'자금 가정 수정')+'</a></article>';}).join('');$('reviewCards').innerHTML=cards||'<p class="empty">아직 고른 후보가 없어요. 예산에 맞는 아파트에서 알아볼 후보를 담아보세요.</p><a href="#/budget" data-route="budget">예산으로 후보 찾기 →</a>';}
 function paint(restore=false){
  applying=true;document.body.dataset.route=active;
  document.querySelectorAll('main > [data-page]').forEach(e=>{const on=e.dataset.page===active;e.hidden=!on;e.inert=!on;e.toggleAttribute('data-active',on);if(on&&e.tagName==='DETAILS')e.open=true;});
  document.querySelectorAll('a[data-route]').forEach(a=>{if(a.dataset.route===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  syncReviews();if(active==='shortlist')renderReviews();
  $('flowNavigation').hidden=active==='home';$('flowTitle').hidden=active==='home';title();
  for(const [id,page]of Object.entries(byId)){const button={marketRankFlow:'openMarketRank',nearbyFlow:'openNearby',purchaseFlow:'openPurchase'}[id];if(button)$(button).setAttribute('aria-expanded',String(page===active));}
  const saved=restore?positions.get(state()?.key):null,page=active;
  requestAnimationFrame(()=>{if(active!==page||parse()!==page)return;window.scrollTo({top:saved?.y||0,behavior:'instant'});if(!restore&&document.activeElement?.closest('main > [data-active]'))return;const focus=saved?.focus?document.querySelector(saved.focus):null;(focus&&!focus.closest('[inert]')?focus:active==='home'?$('contextHeading'):$('flowTitle')).focus?.({preventScroll:true});});
  applying=false;if(active==='market'&&ready)loadMarketRank();
 }
 function move(page,{replace=false,restore=false}={}){
  let message='';if(!panels[page]){page='home';message='찾을 수 없는 화면이에요. 처음부터 살펴보세요.';}
  if(page==='detail'&&!$('detailTitle').textContent){page='home';message='단지를 먼저 고르면 실제 거래를 볼 수 있어요.';}
  save();const prev=state();active=page;
  const next={apartmentFlow:true,key:Date.now()+'-'+(++serial),parent:replace?prev?.parent:prev?.page,page,depth:replace?prev?.depth||0:(prev?.depth||0)+1};
  history[replace?'replaceState':'pushState'](next,'','#/'+page);entryKey=next.key;$('routeStatus').textContent=message;paint(restore);
 }
 function back(){save();if(state()?.depth>0)history.back();else move('home',{replace:true});}
 function open(id,target=id){const page=byId[id]||document.getElementById(id)?.closest('[data-page]')?.dataset.page;if(!page)return;
  if(page===active){const e=$(target);if(target!==id)e?.scrollIntoView({behavior:'instant',block:'start'});return;}
  move(page);
 }
 window.FlowRouter={open,back,ready(){ready=true;title();if(active==='market')loadMarketRank();},refresh(){title();syncReviews();if(active==='shortlist')renderReviews();}};
 $('contextHeading').tabIndex=-1;$('flowBack').onclick=back;
 document.addEventListener('click',e=>{const pick=e.target.closest('[data-review]');if(pick){const key=pick.dataset.review;if(reviews.has(key))reviews.delete(key);else if(reviews.size<3)reviews.set(key,pick.dataset.reviewOrigin);else{$('routeStatus').textContent='후보는 최대 3곳까지 담을 수 있어요. 먼저 담은 후보를 빼주세요.';return;}syncReviews();return;}
  const remove=e.target.closest('[data-review-remove]');if(remove){reviews.delete(remove.dataset.reviewRemove);renderReviews();syncReviews();const next=document.querySelector('[data-review-remove]');if(next)next.focus();else{$('reviewStatus').tabIndex=-1;$('reviewStatus').textContent='고른 후보를 모두 뺐어요.';$('reviewStatus').focus();}return;}
  if(e.target.closest('[data-review-open]')){move('shortlist');return;}const detail=e.target.closest('[data-review-detail]');if(detail){openReviewDetail(detail.dataset.reviewDetail);return;}
  const link=e.target.closest('a[data-route]');if(link){e.preventDefault();move(link.dataset.route);return;}
  if(e.target.closest('[data-detail],[data-rank-detail],[data-purchase-detail],[data-switch-detail],#leaderDetail'))open('detail');
 });
 // Root summaries are page titles; secondary disclosure remains native.
 for(const [id,page]of Object.entries(byId)){const root=$(id);if(root?.tagName==='DETAILS'){root.ontoggle=()=>{};root.querySelector(':scope > summary').addEventListener('click',e=>e.preventDefault());}}
 window.addEventListener('popstate',()=>{if(!state()||!panels[parse()]||(parse()==='detail'&&!$('detailTitle').textContent)){move(parse(),{replace:true});return;}save();entryKey=state().key;active=parse();$('routeStatus').textContent='';paint(true);});
 window.addEventListener('hashchange',()=>{if(parse()!==active)move(parse(),{replace:true});});
 history.scrollRestoration='manual';
 const initial=parse();active=panels[initial]?initial:'home';history.replaceState({apartmentFlow:true,key:Date.now()+'-'+(++serial),page:active,depth:0},'','#/'+active);
 entryKey=state()?.key;
 if(initial!==active||active==='detail')move(initial,{replace:true});else paint();
})();
