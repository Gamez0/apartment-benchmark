/* URL-backed screens. Private form values stay in the existing in-memory DOM. */
(()=>{
 const panels={home:'.landing-screen',market:'#marketRankFlow',candidates:'#nearbyFlow',budget:'#purchaseFlow',move:'#switchPanel',compare:'#trendFlow',detail:'#detail',advanced:'#advancedFlow',evidence:'#evidencePage'};
 const names={home:'내 집, 서울과 비교하면?',market:'서울 시장과 차이가 큰 곳은?',candidates:'우리 동네와 비교하면?',budget:'내 예산으로 어디를 살 수 있을까?',move:'우리 집을 팔면 어디까지 갈 수 있을까?',compare:'가격 흐름과 실제 거래',detail:'실제 거래 상세',advanced:'다른 기준으로 계산하기',evidence:'설정과 데이터 출처'};
 const byId={marketRankFlow:'market',nearbyFlow:'candidates',purchaseFlow:'budget',switchPanel:'move',trendFlow:'compare',detail:'detail',advancedFlow:'advanced',evidencePage:'evidence'};
 const $=id=>document.getElementById(id),positions=new Map();let active='home',serial=0,entryKey=null,applying=false,ready=false;
 const parse=()=>location.hash.replace(/^#\/?/,'')||'home';
 const state=()=>history.state?.apartmentFlow?history.state:null;
 function focusKey(){const e=document.activeElement;if(e?.id)return '#'+CSS.escape(e.id);for(const a of ['data-rank-detail','data-rank-compare','data-detail','data-add','data-purchase-detail','data-switch-detail','data-remove'])if(e?.hasAttribute?.(a))return '['+a+'="'+CSS.escape(e.getAttribute(a))+'"]';return null;}
 function save(){if(entryKey)positions.set(entryKey,{y:window.scrollY,focus:focusKey()});}
 function title(){const root=document.querySelector(panels[active]);let text=root?.querySelector('summary h2,summary span,h2,h1')?.textContent?.trim()||names[active];if(active==='detail')text=$('detailTitle').textContent||names.detail;$('flowTitle').textContent=text;document.title=text+' · 집의 흐름';}
 function paint(restore=false){
  applying=true;document.body.dataset.route=active;
  document.querySelectorAll('main > [data-page]').forEach(e=>{const on=e.dataset.page===active;e.hidden=!on;e.inert=!on;e.toggleAttribute('data-active',on);if(on&&e.tagName==='DETAILS')e.open=true;});
  document.querySelectorAll('a[data-route]').forEach(a=>{if(a.dataset.route===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
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
 window.FlowRouter={open,back,ready(){ready=true;title();if(active==='market')loadMarketRank();},refresh:title};
 $('contextHeading').tabIndex=-1;$('flowBack').onclick=back;
 document.addEventListener('click',e=>{const link=e.target.closest('a[data-route]');if(link){e.preventDefault();move(link.dataset.route);return;}
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
