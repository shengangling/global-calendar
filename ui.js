/* 环球万年历 · 界面 v2 */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WK_CN=['日','一','二','三','四','五','六'],WK_EN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const M_CN=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const M_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const now=new Date(),TODAY=jdn(now.getFullYear(),now.getMonth()+1,now.getDate()),G0=ymd(TODAY);
const MINJ=jdn(1901,1,1),MAXJ=jdn(2099,12,31);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const MH=window.webkit&&window.webkit.messageHandlers,NATIVE=MH&&MH.native,STORE=MH&&MH.store;
const native=o=>{try{if(NATIVE)NATIVE.postMessage(JSON.stringify(o))}catch(e){}};

/* ---------- 持久化（App 内写入 ~/Library/Application Support，浏览器里用 localStorage） ---------- */
const DEF={v:2,theme:'paper',view:'month',cn:true,ae:true,ca:'cn',cb:'ae',weekNum:false,menubar:true,mbFmt:'{月日} {星期} {时分秒}',holRemind:true,wx:true,wxCity:0,cities:null};
const DB={settings:{...DEF},events:[]};
try{const raw=window.__STORE__||JSON.parse(localStorage.getItem('wnl-data')||'null');
  if(raw){Object.assign(DB.settings,raw.settings||{});if(Array.isArray(raw.events))DB.events=raw.events;if(Array.isArray(raw.sent))DB.sent=raw.sent;if(raw.hol)DB.hol=raw.hol}}catch(e){}
/* 先用上次联网同步的节假日数据 */
loadSnapshot();
try{const H=DB.hol;if(H){Object.keys(H.cn||{}).sort().forEach(y=>applyCnNet(y,H.cn[y]));applyAeNet(H.ae);applyXNet(H.x)}}catch(e){}
const S=DB.settings;
if(S.v!==2){S.theme='paper';S.v=2;Object.keys(DEF).forEach(k=>{if(S[k]===undefined)S[k]=DEF[k]});setTimeout(()=>save(),0)}
/* ---------- 国家：最多两个（第一个用红色，第二个用绿色），S.cn / S.ae 为各自的显示开关 ---------- */
function fixCountries(){if(!CTRY[S.ca])S.ca='cn';if(S.cb==null)S.cb='ae';if(S.cb&&!CTRY[S.cb])S.cb='';if(S.cb===S.ca)S.cb=''}
fixCountries();
const slotA=()=>S.cn&&S.ca?S.ca:null,slotB=()=>S.ae&&S.cb?S.cb:null;
const SEL=()=>[{k:S.ca,col:'cn',n:ctryName(S.ca)},...(S.cb?[{k:S.cb,col:'ae',n:ctryName(S.cb)}]:[])];
const VIS=()=>SEL().filter(s=>s.col==='cn'?S.cn:S.ae);
const cnVis=()=>VIS().some(s=>s.k==='cn'),islVis=()=>VIS().some(s=>CTRY[s.k].isl);
const nonWork=(k,J)=>{const x=xInfo(k,J);return!!(x.hol||x.weekend)};
const srcMark=x=>x.src==='rule'?'（推算）':x.src==='tent'?'（暂定）':'';
const offWeekday=(k,J)=>{const x=xInfo(k,J);if(!x.hol)return false;if(k==='cn')return wday(J)%6!==0;if(k==='ae')return!x.weekend;return!x.isWe};
function applyXNet(X){if(!X)return;for(const k in X){const v=X[k];if(v&&v.v===HOL_PV&&Array.isArray(v.list))setHolData(k,v.list.map(a=>({J:a[0],name:a[1],tent:!!a[2]})),'net')}}
function save(){const s=JSON.stringify(DB);if(STORE){try{STORE.postMessage(s)}catch(e){}}else{try{localStorage.setItem('wnl-data',s)}catch(e){}}}

const st={sel:TODAY};
let focus=G0.y*12+G0.m-1,vy=G0.y;
const curYear=()=>S.view==='month'?Math.floor(focus/12):vy;
const toISO=J=>{const g=ymd(J);return`${g.y}-${String(g.m).padStart(2,'0')}-${String(g.d).padStart(2,'0')}`};
const isoJ=s=>{const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s||'');return m?jdn(+m[1],+m[2],+m[3]):NaN};
const fmtFull=J=>{const g=ymd(J);return`${g.y}年${g.m}月${g.d}日`};
const fmtMD=J=>{const g=ymd(J);return`${g.m}月${g.d}日`};
const wkTxt=J=>'周'+WK_CN[wday(J)];
const lunarTxt=J=>{const L=lunar(J);return L?lmName(L)+ldName(L.d):''};
const relTxt=d=>d===0?'今天':d>0?`${d} 天后`:`${-d} 天前`;
let toastT;function toast(t){let el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el)}
  el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,1600)}

/* ---------- 主题 ---------- */
const THEMES=[{k:'system',n:'跟随系统',bg:'linear-gradient(135deg,#F2F3F5 50%,#141619 50%)',ink:'#16181C'},
  {k:'light',n:'素白',bg:'#FFFFFF',ink:'#16181C',cn:'#B3262D',ae:'#0B7A57'},
  {k:'dark',n:'墨夜',bg:'#141619',ink:'#ECEDEF',cn:'#E6585D',ae:'#3EBF90'},
  {k:'paper',n:'宣纸',bg:'#F7F3EB',ink:'#2B261F',cn:'#A5302A',ae:'#3E6B4F'},
  {k:'navy',n:'深海',bg:'#0F182A',ink:'#E4E9F2',cn:'#F07479',ae:'#4ED3A3'},
  {k:'sky',n:'晴空',bg:'#F7FAFE',ink:'#2F6BD0',cn:'#B42F35',ae:'#0E7A57'},
  {k:'celadon',n:'青瓷',bg:'#F5F9F6',ink:'#2A8462',cn:'#B0332F',ae:'#0D6E4C'},
  {k:'lotus',n:'藕荷',bg:'#FAF8FC',ink:'#7A5BA8',cn:'#B02E4A',ae:'#1D7A5E'}];
function applyTheme(){document.documentElement.dataset.theme=S.theme;
  requestAnimationFrame(()=>native({type:'bg',color:getComputedStyle(document.body).backgroundColor}))}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);

/* ---------- 我的事件 ---------- */
const EVC=['var(--ev1)','var(--ev2)','var(--ev3)','var(--ev4)'];
function evMatch(e,J,g,L){
  if(e.rep==='once')return e.y===g.y&&e.m===g.m&&e.d===g.d;
  if(g.y<e.y)return false;
  if(e.rep==='solar')return e.m===g.m&&e.d===g.d;
  if(e.rep==='lunar'){L=L||lunar(J);return!!L&&!L.leap&&L.m===e.lm&&(L.d===e.ld||(e.ld===30&&L.len===29&&L.d===29))}
  return false}
function evOn(J){if(!DB.events.length)return[];const g=ymd(J);let L=null;const out=[];
  for(const e of DB.events){if(e.rep==='lunar'&&!L)L=lunar(J);if(evMatch(e,J,g,L))out.push(e)}return out}
function evNext(e,from){if(e.rep==='once'){const J=jdn(e.y,e.m,e.d);return J>=from?J:null}
  for(let J=from;J<from+800&&J<=MAXJ;J++)if(evMatch(e,J,ymd(J)))return J;return null}
function evRule(e){if(e.rep==='once')return`${e.y}年${e.m}月${e.d}日`;if(e.rep==='solar')return`每年公历 ${e.m}月${e.d}日`;return`每年农历 ${LM[e.lm-1]}月${ldName(e.ld)}`}
const evAge=(e,J)=>{const n=ymd(J).y-e.y;return e.rep!=='once'&&n>0?` · ${n} 周年`:''};

/* ---------- 月视图：连续滚动 ---------- */
const BASE=(()=>{const J=jdn(1901,1,1);return J-mod(wday(J)-1,7)})();
const TOTAL=Math.ceil((MAXJ-BASE+1)/7);
const weekOf=J=>Math.floor((J-BASE)/7);
const sc=$('sc'),sp=$('sp');
let rowH=120,rows=new Map();
$('wk').innerHTML=[1,2,3,4,5,6,0].map(i=>`<div class="${i===0||i===6?'we':''}">${WK_CN[i]}<small>${WK_EN[i]}</small></div>`).join('');
function isoWeek(g){const dt=new Date(Date.UTC(g.y,g.m-1,g.d)),day=(dt.getUTCDay()+6)%7;dt.setUTCDate(dt.getUTCDate()-day+3);const f=new Date(Date.UTC(dt.getUTCFullYear(),0,4));return 1+Math.round(((dt-f)/864e5-3+((f.getUTCDay()+6)%7))/7)}

function cellHTML(J){const{cn,ae}=info(J),g=cn.g,cls=['cell'],tags=[];
  if(J===TODAY)cls.push('today');if(J===st.sel)cls.push('sel');
  if(g.d<=7)cls.push('mt');if(g.d===1&&wday(J)!==1)cls.push('ml');
  const ka=slotA(),kb=slotB(),a=ka?xInfo(ka,J):null,b=kb?xInfo(kb,J):null;
  if(a&&a.hol)cls.push('offcn');if(b&&b.hol)cls.push('offae');
  if(a&&(a.hol||a.weekend))cls.push('ncn');else if(!a&&b&&(b.hol||b.weekend))cls.push('nae');
  if(a&&a.hol)tags.push(`<i class="tag cn" title="${ctryName(ka)}放假">休</i>`);
  if(a&&a.work)tags.push(`<i class="tag work" title="${ctryName(ka)}调休上班">班</i>`);
  if(b&&b.hol)tags.push(`<i class="tag ae" title="${ctryName(kb)}放假">休</i>`);
  if(b&&b.work)tags.push(`<i class="tag work" title="${ctryName(kb)}调休上班">班</i>`);
  const fx=(k,x)=>{if(!x)return null;if(k==='cn'){const mj=cn.f.find(v=>MAJOR.has(v));if(mj)return[mj,'fest'];if(cn.term)return[cn.term,'term'];if(cn.f.length)return[cn.f[0],'fest'];return null}return x.f.length?[x.f[0],'fest']:null};
  const lun=cn.L?[cn.L.d===1?lmName(cn.L):ldName(cn.L.d),cn.L.d===1?'mon':'']:['',''],hij=ae.h?[`${ae.h.d} ${HM_AB[ae.h.m-1]}`,'']:['',''],isl=islVis(),l1h=!a&&isl;
  const[l1,c1]=fx(ka,a)||(l1h?hij:lun),[l2,c2]=fx(kb,b)||(isl&&!l1h?hij:['','']);
  const evs=evOn(J).slice(0,2).map(e=>`<span class="ev" style="--c:${EVC[e.c||0]}">${esc(e.title)}</span>`).join('');
  const mlab=g.d===1?`<span class="mlab">${g.m===1?g.y+'年':''}${g.m}月</span>`:'';
  const wn=S.weekNum&&wday(J)===1?`<span class="wn">第${isoWeek(g)}周</span>`:'';
  return`<div class="${cls.join(' ')}" data-j="${J}" data-ym="${g.y*12+g.m-1}"><div class="c-top"><span class="nw"><span class="num">${g.d}</span>${mlab}</span><span class="tags">${tags.join('')}</span></div><div class="c-bot">${evs}<span class="l1 ${c1}">${l1||'&nbsp;'}</span><span class="l2 ${c2}">${l2||'&nbsp;'}</span></div>${wn}</div>`}
function rowEl(i){const d=document.createElement('div');d.className='row';d.style.top=(i*rowH)+'px';d.style.height=rowH+'px';
  let h='';for(let k=0;k<7;k++)h+=cellHTML(BASE+i*7+k);d.innerHTML=h;return d}
function paint(){if(!sc.clientHeight)return;const top=sc.scrollTop,a=Math.max(0,Math.floor(top/rowH)-6),b=Math.min(TOTAL-1,Math.ceil((top+sc.clientHeight)/rowH)+6);
  for(const[i,el]of rows)if(i<a||i>b){el.remove();rows.delete(i)}
  for(let i=a;i<=b;i++)if(!rows.has(i)){const el=rowEl(i);sp.appendChild(el);rows.set(i,el)}
  updateFocus()}
function repaintAll(){for(const el of rows.values())el.remove();rows.clear();paint()}
function layout(){if(!sc.clientHeight)return;const nh=Math.round(Math.max(72,sc.clientHeight/6));
  if(nh===rowH&&sp.style.height)return;
  const anchor=(animRow!==null?null:sc.scrollTop/rowH);rowH=nh;
  sp.style.height=(TOTAL*rowH)+'px';if(anchor!==null)sc.scrollTop=anchor*rowH;repaintAll()}
function updateFocus(force){const mid=sc.scrollTop+sc.clientHeight/2,i=Math.max(0,Math.min(TOTAL-1,Math.floor(mid/rowH)));
  const g=ymd(BASE+i*7+3),ym=g.y*12+g.m-1;if(ym===focus&&!force)return;
  const changed=ym!==focus;focus=ym;vy=g.y;$('dim').textContent=`.cell:not([data-ym="${ym}"]){opacity:.34}`;renderHead(changed)}

/* 动画以“周行”为单位，rowH 变化时目标仍准确 */
let anim=0,animRow=null;
const maxRow=()=>Math.max(0,TOTAL-sc.clientHeight/rowH);
const clampRow=r=>Math.max(0,Math.min(maxRow(),r));
function animateToRow(r,dur=560){r=clampRow(r);cancelAnimationFrame(anim);
  if(RM){sc.scrollTop=r*rowH;animRow=null;return}
  let s=sc.scrollTop/rowH;const far=24;if(Math.abs(r-s)>far){s=r-Math.sign(r-s)*far;sc.scrollTop=s*rowH}
  const d=r-s,t0=performance.now();animRow=r;
  const step=n=>{const p=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-p,4);sc.scrollTop=(s+d*e)*rowH;
    if(p<1)anim=requestAnimationFrame(step);else{sc.scrollTop=r*rowH;animRow=null;paint()}};
  anim=requestAnimationFrame(step)}
function animateTo(t,dur){animateToRow(t/rowH,dur)}
const clampTop=t=>clampRow(t/rowH)*rowH;
const monthTop=(y,m)=>weekOf(jdn(y,m,1))*rowH;
const monthRow=(y,m)=>weekOf(jdn(y,m,1));
function isVisible(J){const top=weekOf(J)*rowH;return top>=sc.scrollTop-1&&top+rowH<=sc.scrollTop+sc.clientHeight+1}
let raf=0;
sc.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;paint()})},{passive:true});
sc.addEventListener('wheel',e=>{if(e.ctrlKey)return;
  const mouse=e.deltaMode===1||(e.wheelDeltaY&&Math.abs(e.wheelDeltaY)%120===0&&Math.abs(e.deltaY)>=40&&e.deltaX===0);
  if(!mouse)return;e.preventDefault();animateToRow((animRow!==null?animRow:sc.scrollTop/rowH)+Math.sign(e.deltaY)*0.85,420)},{passive:false});
new ResizeObserver(()=>layout()).observe(sc);
sp.addEventListener('click',e=>{const c=e.target.closest('.cell');if(c)select(+c.dataset.j)});
sp.addEventListener('dblclick',e=>{const c=e.target.closest('.cell');if(c){select(+c.dataset.j);setTab('ev');setTimeout(()=>{const t=$('eT');if(t)t.focus()},30)}});

/* ---------- 年视图 ---------- */
const yearStatsCache={};
function yearStats(k,y){const key=k+y;if(yearStatsCache[key])return yearStatsCache[key];let off=0,w=0;
  for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++){if(nonWork(k,J))off++;else w++}
  return yearStatsCache[key]={off,w}}
function renderYear(){const y=vy;let h='<div class="yv">';const wd=[1,2,3,4,5,6,0].map(i=>`<span class="wd ${i===0||i===6?'we':''}">${WK_CN[i]}</span>`).join('');
  const ka=slotA(),kb=slotB(),nA=ctryName(ka),nB=ctryName(kb),cv=cnVis();
  for(let m=1;m<=12;m++){const first=jdn(y,m,1),start=first-mod(wday(first)-1,7),last=jdn(m===12?y+1:y,m===12?1:m+1,1)-1;
    const La=lunar(first),Lb=lunar(last);
    h+=`<div class="ym ${y===G0.y&&m===G0.m?'cur':''}"><button class="ym-h" data-mm="${m}" title="打开${m}月"><b>${M_CN[m-1]}</b><small>${La&&Lb?lmName(La)+(La.m!==Lb.m||La.leap!==Lb.leap?' – '+lmName(Lb):''):''}</small></button><div class="ym-g">${wd}`;
    for(let i=0;i<42;i++){const J=start+i;if(J<first||J>last){if(i>=35&&J>last)break;h+='<span class="yd blank"></span>';continue}
      const{cn}=info(J),g=cn.g,c=[],a=ka?xInfo(ka,J):null,b=kb?xInfo(kb,J):null;
      if(J===TODAY)c.push('today');if(J===st.sel)c.push('sel');
      if(a&&a.hol)c.push('cnoff');else if((a&&a.work)||(b&&b.work&&!(a&&a.hol)))c.push('work');
      if(b&&b.hol)c.push('aeoff');
      if(wday(J)===0||wday(J)===6)c.push('we');
      const evs=evOn(J);let dot='';const has=(k,x)=>x&&(k==='cn'?cn.f.some(v=>MAJOR.has(v)):x.f.length);
      if(evs.length)dot=EVC[evs[0].c||0];else if(has(ka,a))dot='var(--cn)';else if(cv&&cn.term)dot='var(--term)';else if(has(kb,b))dot='var(--ae)';
      const tip=[`${g.m}月${g.d}日 ${wkTxt(J)}`,cn.L?'农历'+lmName(cn.L)+ldName(cn.L.d):'',...(a?a.f:[]),cv?cn.term:'',...(b?b.f:[]),a&&a.hol?nA+'放假':'',a&&a.work?nA+'调休上班':'',b&&b.hol?nB+'放假':'',b&&b.work?nB+'调休上班':'',...evs.map(e=>e.title)].filter(Boolean).join(' · ');
      h+=`<button class="yd ${c.join(' ')}" data-j="${J}" title="${esc(tip)}">${g.d}${dot?`<i style="--c:${dot}"></i>`:''}</button>`}
    h+='</div></div>'}
  h+=`</div><div class="ylegend">${ka?`<span><em style="background:var(--cn-wash);box-shadow:inset 0 0 0 1px var(--cn)"></em>${nA}放假</span>`:''}${cv?'<span><em style="box-shadow:inset 0 0 0 1px var(--faint)"></em>中国调休上班</span>':''}${kb?`<span><em style="background:var(--ae-wash);box-shadow:inset 0 -2px 0 var(--ae)"></em>${nB}放假</span>`:''}<span><em style="background:var(--cn);width:6px;height:6px;border-radius:50%"></em>节日</span>${cv?'<span><em style="background:var(--term);width:6px;height:6px;border-radius:50%"></em>节气</span>':''}<span><em style="background:var(--ev1);width:6px;height:6px;border-radius:50%"></em>我的事件</span><span>单击查看详情 · 双击打开该月</span></div>`;
  $('yBody').innerHTML=h}
$('yBody').addEventListener('click',e=>{const d=e.target.closest('.yd');if(d){select(+d.dataset.j);return}
  const mh=e.target.closest('.ym-h');if(mh)openMonth(vy,+mh.dataset.mm)});
$('yBody').addEventListener('dblclick',e=>{const d=e.target.closest('.yd');if(d){const J=+d.dataset.j,g=ymd(J);openMonth(g.y,g.m,J)}});

/* ---------- 假期一览 ---------- */
function groupsIn(y,pick){const out=[];let cur=null;
  for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++){const n=pick(J);if(n&&cur&&cur.name===n&&cur.e===J-1)cur.e=J;else if(n){cur={name:n,s:J,e:J};out.push(cur)}}return out}
const rangeHTML=(s,e)=>`${fmtMD(s)}（${wkTxt(s)}）${e>s?` – ${fmtMD(e)}（${wkTxt(e)}）`:''}`;
const stateHTML=(s,e)=>TODAY>e?'<span class="past">已过</span>':TODAY>=s?'<span class="nowp">进行中</span>':`${s-TODAY} 天后`;
function renderList(){const y=vy;let h='<div class="lv">';const V=VIS();
  h+=`<div class="cols">`;
  for(const sl of V){const k=sl.k,ys=yearStats(k,y),col=`var(--${sl.col})`;
    const gs=groupsIn(y,J=>xInfo(k,J).hol).map(g=>{const x=xInfo(k,g.s);return{...g,rule:x.src==='rule',tent:x.src==='tent',work:[]}});
    if(k==='cn')for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++)if(xInfo(k,J).work&&gs.length){let b=gs[0],bd=1e9;gs.forEach(g=>{const d=Math.min(Math.abs(J-g.s),Math.abs(J-g.e));if(d<bd){bd=d;b=g}});b.work.push(J)}
    const wl=g=>g.work.map(w=>fmtMD(w)+'（'+wkTxt(w)+'）').join('、');
    const sub=g=>{if(k==='cn')return g.rule?'官方安排未公布，按近年国务院排法推算'+(g.work.length?'；预计调休上班：'+wl(g):''):g.work.length?'调休上班：'+wl(g):'无调休';
      const h1=CTRY[k].isl?hijri(g.s):null;return[h1?`${h1.d} ${HM_EN[h1.m-1]} ${h1.y}`:'',g.rule?'按历年规律推算，以官方公布为准':g.tent?'暂定，以官方公告为准':''].filter(Boolean).join(' · ')};
    const rows=gs.map(g=>`<button class="tr" data-go="${g.s}"><span class="n"><i style="--c:${col}"></i>${esc(g.name)}</span><span class="d">${rangeHTML(g.s,g.e)}<small>${sub(g)}</small></span><span class="s"><b>${g.e-g.s+1} 天</b>${stateHTML(g.s,g.e)}</span></button>`).join('');
    h+=`<section><h2>${k==='cn'?'中国法定节假日':esc(sl.n)+'公共假期'+(CTRY[k].rn?`<em style="font-style:normal;font-size:12px;color:var(--muted);font-weight:500;margin-left:6px">${CTRY[k].rn}</em>`:'')}<small>全年休息 ${ys.off} 天（含周末）· 工作日 ${ys.w} 天</small></h2><div class="tbl">${rows||'<div class="empty">暂无数据</div>'}</div>${CTRY[k].isl?'<p class="note" style="margin-top:10px">伊斯兰节日以月相观测为准，官方通常提前数日公布，可能相差 1 天。</p>':''}</section>`}
  if(!V.length)h+='<section><div class="empty">没有显示任何国家。点击右上角的国家按钮选择要显示的国家。</div></section>';
  h+='</div>';
  // 传统节日 & 伊斯兰纪念日
  const fest=[],isl=[],hasCN=V.some(x=>x.k==='cn'),hasAE=V.some(x=>x.k==='ae');
  for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++){const i=info(J);if(hasCN)i.cn.f.forEach(n=>fest.push({n,J}));if(hasAE)i.ae.f.forEach(n=>isl.push({n,J}))}
  const fRow=(x,c,sub)=>`<button class="tr" data-go="${x.J}"><span class="n"><i style="--c:${c}"></i>${x.n}</span><span class="d">${fmtMD(x.J)}（${wkTxt(x.J)}）<small>${sub(x.J)}</small></span><span class="s">${stateHTML(x.J,x.J)}</span></button>`;
  const colOf=k=>(V.find(x=>x.k===k)||{}).col;
  h+='<div class="cols">';
  if(hasCN)h+=`<section><h2>节日<small>${fest.length} 个</small></h2><div class="tbl">${fest.map(x=>fRow(x,MAJOR.has(x.n)?`var(--${colOf('cn')})`:'var(--faint)',J=>'农历'+lunarTxt(J))).join('')}</div></section>`;
  if(hasAE)h+=`<section><h2>阿联酋与伊斯兰节日<small>${isl.length} 个</small></h2><div class="tbl">${isl.map(x=>fRow(x,`var(--${colOf('ae')})`,J=>{const hh=hijri(J);return hh?`${hh.d} ${HM_EN[hh.m-1]} ${hh.y}`:''})).join('')}</div></section>`;
  h+='</div>';
  if(hasCN){const tm=termsOfYear(y),ks=Object.keys(tm).map(Number).sort((a,b)=>a-b);
    h+=`<section><h2>二十四节气<small>北京时间</small></h2><div class="terms">${ks.map(J=>`<button data-go="${J}" class="${J<TODAY?'done':''}"><b>${tm[J]}</b><span>${fmtMD(J)} ${wkTxt(J)}</span></button>`).join('')}</div></section>`}
  if(DB.events.length){const occ=[];for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++)evOn(J).forEach(e=>occ.push({e,J}));
    h+=`<section><h2>我的事件<small>${occ.length} 次</small></h2><div class="tbl">${occ.map(o=>`<button class="tr" data-go="${o.J}"><span class="n"><i style="--c:${EVC[o.e.c||0]}"></i>${esc(o.e.title)}</span><span class="d">${fmtMD(o.J)}（${wkTxt(o.J)}）<small>${evRule(o.e)}${evAge(o.e,o.J)}</small></span><span class="s">${stateHTML(o.J,o.J)}</span></button>`).join('')||'<div class="empty">今年没有</div>'}</div></section>`}
  $('lBody').innerHTML=h+'</div>'}
$('lBody').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){const J=+b.dataset.go,g=ymd(J);openMonth(g.y,g.m,J)}});

/* ---------- 头部 ---------- */
$('months').innerHTML=M_CN.map((n,i)=>`<button data-m="${i+1}" title="${n}">${i+1}<span class="mo">月</span></button>`).join('');
function renderHead(animate){const y=curYear();$('yBtn').textContent=y;
  [...$('months').children].forEach((b,i)=>{b.classList.toggle('on',S.view==='month'&&focus===y*12+i);b.classList.toggle('now',y===G0.y&&i+1===G0.m)});
  [...$('views').children].forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));
  const Ly=lunar(jdn(y,7,1)),zy=Ly?`${gzYear(Ly.y)}${ZOD[mod(Ly.y-4,12)]}年`:'';
  if(S.view==='month'){const m=focus%12+1;$('tMonth').textContent=M_CN[m-1];$('tYear').textContent=y;
    const a=jdn(y,m,1),b=jdn(m===12?y+1:y,m===12?1:m+1,1)-1,La=lunar(a),Lb=lunar(b),ha=hijri(a),hb=hijri(b);
    const lun=La&&Lb?`${gzYear(La.y)}${ZOD[mod(La.y-4,12)]}年 ${lmName(La)}${(La.m!==Lb.m||La.leap!==Lb.leap)?' – '+lmName(Lb):''}`:'';
    const hij=ha&&hb?`${HM_EN[ha.m-1]}${ha.m!==hb.m?' – '+HM_EN[hb.m-1]:''} ${hb.y} AH`:'';
    const cnt=VIS().map(sl=>{let n=0;for(let J=a;J<=b;J++)if(offWeekday(sl.k,J))n++;return n?`<span class="${sl.col}c">${esc(sl.n)}${sl.k==='cn'?'节假日':'假期'} ${n} 天</span>`:''}).join('');
    $('tSub').innerHTML=`<span><b>${M_EN[m-1]}</b></span>${lun?`<span>农历 ${lun}</span>`:''}${hij?`<span>${hij}</span>`:''}${cnt}`}
  else{const h1=hijri(jdn(y,1,1)),h2=hijri(jdn(y,12,31));
    $('tMonth').textContent=S.view==='year'?'全年':'假期一览';$('tYear').textContent=y;
    $('tSub').innerHTML=`<span><b>${zy}</b></span>${h1&&h2?`<span>${h1.y}${h1.y!==h2.y?'–'+h2.y:''} AH</span>`:''}<span>${jdn(y+1,1,1)-jdn(y,1,1)} 天</span>${VIS().map(sl=>`<span class="${sl.col}c">${esc(sl.n)}休 ${yearStats(sl.k,y).off} 天</span>`).join('')}`}
  if(animate&&!RM)$('tMonth').parentNode.animate([{opacity:.25},{opacity:1}],{duration:260,easing:'ease-out'})}

/* ---------- 视图切换与导航 ---------- */
function setView(v,keepScroll){S.view=v;save();
  $('vMonth').hidden=v!=='month';$('vYear').hidden=v!=='year';$('vList').hidden=v!=='list';
  if(v==='month'){requestAnimationFrame(()=>{layout();if(!keepScroll){const fm=focus%12+1;if(Math.floor(focus/12)!==vy){sc.scrollTop=monthTop(vy,fm)}}paint();updateFocus(true)})}
  else{if(v==='year')renderYear();else renderList();
    const body=v==='year'?$('yBody'):$('lBody');body.scrollTop=0;if(!RM)body.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.75,.2,1)'})}
  renderHead(true)}
function openMonth(y,m,J){vy=y;if(J!=null)select(J);S.view='month';save();
  $('vMonth').hidden=false;$('vYear').hidden=true;$('vList').hidden=true;
  requestAnimationFrame(()=>{layout();sc.scrollTop=clampTop(monthTop(y,m));paint();updateFocus(true)})}
function setYear(y){y=Math.max(1901,Math.min(2099,y));
  if(S.view==='month')animateToRow(monthRow(y,focus%12+1));
  else{const dir=y>vy?1:-1;vy=y;S.view==='year'?renderYear():renderList();renderHead(true);
    const body=S.view==='year'?$('yBody'):$('lBody');if(!RM)body.animate([{opacity:0,transform:`translateX(${dir*24}px)`},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.75,.2,1)'})}}
function step(n){if(S.view==='month'){const ym=focus+n,y=Math.floor(ym/12);if(y<1901||y>2099)return;animateToRow(monthRow(y,ym%12+1))}else setYear(vy+n)}
function select(J){st.sel=J;document.querySelectorAll('.cell.sel,.yd.sel').forEach(c=>c.classList.remove('sel'));
  document.querySelectorAll(`.cell[data-j="${J}"],.yd[data-j="${J}"]`).forEach(c=>c.classList.add('sel'));renderPanel()}
function goDay(J){J=Math.max(MINJ,Math.min(MAXJ,J));const g=ymd(J);
  if(S.view==='month'){select(J);if(!isVisible(J))animateToRow(monthRow(g.y,g.m))}
  else if(S.view==='year'){if(g.y!==vy){vy=g.y;st.sel=J;renderYear();renderHead(true)}select(J)}
  else openMonth(g.y,g.m,J)}
function refreshAll(){scheduleReminders();Object.keys(yearStatsCache).forEach(k=>delete yearStatsCache[k]);repaintAll();if(S.view==='year')renderYear();if(S.view==='list')renderList();renderHead();renderPanel()}

$('views').onclick=e=>{const b=e.target.closest('[data-v]');if(b&&b.dataset.v!==S.view)setView(b.dataset.v)};
$('months').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const m=+b.dataset.m,y=curYear();
  if(S.view==='month')animateToRow(monthRow(y,m));else openMonth(y,m)};
$('yPrev').onclick=()=>setYear(curYear()-1);$('yNext').onclick=()=>setYear(curYear()+1);
$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);
$('today').onclick=()=>{if(S.view!=='month'&&vy!==G0.y){vy=G0.y;S.view==='year'?renderYear():renderList();renderHead(true)}goDay(TODAY)};
function setLayer(k){S[k]=!S[k];layBtns();save();refreshAll()}
$('tgCN').onclick=()=>setLayer('cn');$('tgAE').onclick=()=>setLayer('ae');
function layBtns(){$('tgCN').innerHTML=`<span class="dot"></span>${esc(ctryName(S.ca))}`;$('tgCN').setAttribute('aria-pressed',S.cn);$('tgCN').title=`显示 / 隐藏${ctryName(S.ca)}假期`;
  $('tgAE').hidden=!S.cb;$('tgAE').innerHTML=`<span class="dot"></span>${esc(ctryName(S.cb))}`;$('tgAE').setAttribute('aria-pressed',S.ae);$('tgAE').title=`显示 / 隐藏${ctryName(S.cb)}假期`}
/* 选择国家（最多两个） */
function ctryGridHTML(){const groups=[...new Set(COUNTRIES.map(c=>c.grp))];
  return`<div class="ct-tip">最多同时显示两个国家：第一个用红色，第二个用绿色</div>${groups.map(g=>`<div class="ct-grp">${g}</div><div class="ct-g">${COUNTRIES.filter(c=>c.grp===g).map(c=>{const o=c.k===S.ca?1:c.k===S.cb?2:0;return`<button class="ct ${o?'on'+o:''}" data-ct="${c.k}" title="${c.n}${c.rn?'（'+c.rn+'）':''}">${o?`<i>${o}</i>`:''}${c.n}</button>`}).join('')}</div>`).join('')}`}
function pickCountry(k){let msg='';
  if(k===S.ca){if(!S.cb){toast('至少保留一个国家');return}S.ca=S.cb;S.cb='';S.cn=S.ae}
  else if(k===S.cb){S.cb=''}
  else if(!S.cb){S.cb=k;S.ae=true}
  else{msg=`最多显示两个国家，已把${ctryName(S.cb)}换成${ctryName(k)}`;S.cb=k;S.ae=true}
  if(!S.cn&&!S.ae)S.cn=true;
  countriesChanged();if(msg)toast(msg)}
function countriesChanged(){fixCountries();save();layBtns();Object.keys(yearStatsCache).forEach(k=>delete yearStatsCache[k]);
  if($('cU'))calcOpts();refreshAll();if(!$('ctryPop').hidden)$('ctryPop').innerHTML=ctryGridHTML();syncCountries()}
$('btnCtry').onclick=e=>{e.stopPropagation();if(!$('ctryPop').hidden){closePops();return}closePops();$('ctryPop').innerHTML=ctryGridHTML();placePop($('ctryPop'),$('btnCtry'),true)};
$('ctryPop').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-ct]');if(b)pickCountry(b.dataset.ct)});

/* ---------- 年份浮层 ---------- */
let ypBase=0;
function placePop(pop,anchor,alignRight){const r=anchor.getBoundingClientRect();pop.hidden=false;const w=pop.offsetWidth;
  let x=alignRight?r.right-w:r.left;x=Math.max(12,Math.min(innerWidth-w-12,x));pop.style.left=x+'px';pop.style.top=(r.bottom+8)+'px';
  if(!RM)pop.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:160,easing:'ease-out'})}
function drawYearPop(){const y=curYear();
  $('yearPop').innerHTML=`<div class="yp-h"><button id="ypP" title="前 12 年"><svg class="ic" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><b>${ypBase} – ${ypBase+11}</b><button id="ypN" title="后 12 年"><svg class="ic" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>
  <div class="yp-g">${Array.from({length:12},(_,i)=>{const Y=ypBase+i,ok=Y>=1901&&Y<=2099;return ok?`<button data-y="${Y}" class="${Y===y?'on':''} ${Y===G0.y?'now':''}">${Y}<small>${gzYear(Y)}${ZOD[mod(Y-4,12)]}</small></button>`:'<span></span>'}).join('')}</div>
  <div class="yp-in"><input class="inp" id="ypIn" type="number" min="1901" max="2099" placeholder="输入年份后回车（1901–2099）"></div>`;
  $('ypP').onclick=()=>{ypBase=Math.max(1896,ypBase-12);drawYearPop()};$('ypN').onclick=()=>{ypBase=Math.min(2088,ypBase+12);drawYearPop()};
  $('ypIn').onkeydown=e=>{if(e.key==='Enter'){const v=+e.target.value;if(v>=1901&&v<=2099){closePops();setYear(v)}else toast('年份范围 1901–2099')}}}
$('yBtn').onclick=e=>{e.stopPropagation();if(!$('yearPop').hidden){closePops();return}closePops();ypBase=curYear()-mod(curYear()-1900,12);drawYearPop();placePop($('yearPop'),$('yBtn'))};
$('yearPop').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-y]');if(b){closePops();setYear(+b.dataset.y)}});
let ypw=0;$('yearPop').addEventListener('wheel',e=>{e.preventDefault();const t=performance.now();if(t<ypw||Math.abs(e.deltaY)<3)return;ypw=t+180;ypBase=Math.max(1896,Math.min(2088,ypBase+(e.deltaY>0?12:-12)));drawYearPop()},{passive:false});
$('yBtn').addEventListener('wheel',e=>{e.preventDefault();const t=performance.now();if(t<ypw||Math.abs(e.deltaY)<3)return;ypw=t+220;setYear(curYear()+(e.deltaY>0?1:-1))},{passive:false});

/* ---------- 外观浮层 ---------- */
function drawThemePop(){
  $('themePop').innerHTML=`<div class="p-lab" style="margin-bottom:10px">外观</div><div class="th-g">${THEMES.map(t=>`<button class="th ${S.theme===t.k?'on':''}" data-th="${t.k}"><span class="pv" style="background:${t.bg}">${t.k!=='system'?`<b style="color:${t.ink}">5</b><i style="left:7px;background:${t.cn}"></i><i style="left:19px;background:${t.ae}"></i>`:''}</span><span>${t.n}</span></button>`).join('')}</div>
  <div class="sep"></div>
  <div class="opt"><span>显示周数</span><button class="tg" data-opt="weekNum" role="switch" aria-checked="${S.weekNum}"></button></div>
  <div class="opt"><span>顶部显示天气<br><small style="color:var(--muted);font-size:11.5px">联网时获取，点开才看详情</small></span><button class="tg" data-opt="wx" role="switch" aria-checked="${S.wx}"></button></div>
  ${NATIVE?`<div class="opt"><span>假期提醒<br><small style="color:var(--muted);font-size:11.5px">放假和调休上班的前一天 20:00 通知</small></span><button class="tg" data-opt="holRemind" role="switch" aria-checked="${S.holRemind}"></button></div>
  <div class="opt col"><div class="optrow"><span>菜单栏常驻<br><small style="color:var(--muted);font-size:11.5px">关闭窗口后仍在菜单栏显示</small></span><button class="tg" data-opt="menubar" role="switch" aria-checked="${S.menubar}"></button></div>
    <select class="inp" id="mbSel" ${S.menubar?'':'disabled'}>${MB_FMTS.map(f=>`<option value="${esc(f)}" ${S.mbFmt===f?'selected':''}>${esc(fmtStatus(f))}</option>`).join('')}<option value="__c" ${MB_FMTS.includes(S.mbFmt)?'':'selected'}>自定义格式…</option></select>
    <input class="inp" id="mbCustom" value="${esc(S.mbFmt)}" placeholder="例如：{农历} {时分秒}" ${MB_FMTS.includes(S.mbFmt)?'hidden':''}>
    <div class="tok" id="mbTok" ${MB_FMTS.includes(S.mbFmt)?'hidden':''}>点击插入：${['{日期}','{月日}','{年}','{星期}','{农历}','{节气}','{时分}','{时分秒}','{北京}','{迪拜}'].map(t=>`<code data-tok="${t}">${t}</code>`).join(' ')}</div></div>`:''}`}
$('btnTheme').onclick=e=>{e.stopPropagation();if(!$('themePop').hidden){closePops();return}closePops();drawThemePop();placePop($('themePop'),$('btnTheme'),true)};
$('themePop').addEventListener('click',e=>{e.stopPropagation();const t=e.target.closest('[data-th]');
  if(t){S.theme=t.dataset.th;save();applyTheme();drawThemePop();return}
  const o=e.target.closest('[data-opt]');if(o){const k=o.dataset.opt;S[k]=!S[k];save();o.setAttribute('aria-checked',S[k]);
    if(k==='weekNum')repaintAll();if(k==='menubar'){native({type:'menubar',on:S.menubar});pushStatus();drawThemePop()}
    if(k==='wx')refreshWx();if(k==='holRemind')scheduleReminders();return}
  const tk=e.target.closest('[data-tok]');if(tk){const i=$('mbCustom');i.value+=(i.value&&!/\s$/.test(i.value)?' ':'')+tk.dataset.tok;i.dispatchEvent(new Event('input'));i.focus()}});
$('themePop').addEventListener('change',e=>{if(e.target.id!=='mbSel')return;const v=e.target.value;
  if(v==='__c'){$('mbCustom').hidden=false;$('mbTok').hidden=false;$('mbCustom').focus();return}
  $('mbCustom').hidden=true;$('mbTok').hidden=true;S.mbFmt=v;save();pushStatus()});
$('themePop').addEventListener('input',e=>{if(e.target.id!=='mbCustom')return;S.mbFmt=e.target.value||MB_FMTS[0];save();pushStatus()});
function closePops(){$('yearPop').hidden=true;$('themePop').hidden=true;$('wxPop').hidden=true;$('ctryPop').hidden=true}
document.addEventListener('click',closePops);

/* ---------- 详情栏 ---------- */
let tab='info';
function setTab(t){tab=t;[...$('tabs').children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  $('pInfo').hidden=t!=='info';$('pCalc').hidden=t!=='calc';$('pEv').hidden=t!=='ev';
  if(t==='calc'&&!$('cA'))buildCalc();renderPanel()}
$('tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(b)setTab(b.dataset.t)};
function moonSVG(L){const p=(L.d-1)/L.len,r=10,rx=Math.abs(Math.cos(2*Math.PI*p))*r;let d;
  if(p<0.5)d=`M12 2 A${r} ${r} 0 0 1 12 22 A${rx} ${r} 0 0 ${p<0.25?0:1} 12 2`;
  else d=`M12 2 A${r} ${r} 0 0 0 12 22 A${rx} ${r} 0 0 ${p<0.75?0:1} 12 2`;
  const name=L.d===1?'朔月':L.d<=6?'蛾眉月':L.d<=9?'上弦月':L.d<=13?'盈凸月':L.d<=16?'满月':L.d<=21?'亏凸月':L.d<=24?'下弦月':'残月';
  return`<div class="moon" title="${name}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="var(--wash)" stroke="var(--line)"/>${L.d===1?'':`<path d="${d}" fill="var(--ink)" opacity=".82"/>`}</svg>${name}</div>`}
function stOne(k,J,col){const x=xInfo(k,J),cls='off-'+col;
  if(k==='cn'){const c=info(J).cn.st;return c.off?{t:'放假',s:c.name+(c.src==='rule'?' · 推算，以官方公布为准':''),cls}:c.work?{t:'调休上班',s:c.src==='rule'?'补班日 · 推算，以官方公布为准':'补班日'}:c.weekend?{t:'周末',cls}:{t:'工作日'}}
  const isWe=k==='ae'?x.weekend:x.isWe;
  return x.hol?{t:'放假',s:x.hol+(x.src==='tent'?' · 暂定，以官方公告为准':x.src==='rule'?(k==='ae'?' · 按伊斯兰历推算':' · 按历年规律推算'):''),cls}:isWe?{t:'周末',s:k==='ae'?(ymd(J).y>=2022?'周六、周日':'周五、周六'):weTxt(k,J),cls}:{t:'工作日'}}
function statusOf(J){return SEL().map(sl=>({...sl,st:stOne(sl.k,J,sl.col)}))}
function upcoming(from){const out=[];const scan=(key,pick,col)=>{let cur=null;
  for(let J=from;J<from+200&&J<=MAXJ;J++){const n=pick(J);if(n&&cur&&cur.name===n&&cur.e===J-1)cur.e=J;else if(n){cur={k:key,c:col,name:n,s:J,e:J};out.push(cur)}}};
  VIS().forEach(sl=>scan(sl.n,J=>{const x=xInfo(sl.k,J);return x.hol?x.hol+srcMark(x):null},`var(--${sl.col})`));
  DB.events.forEach(e=>{const J=evNext(e,from);if(J!=null&&J<from+200)out.push({k:'ev',c:EVC[e.c||0],name:e.title,s:J,e:J,ev:e})});
  return out.sort((a,b)=>a.s-b.s).slice(0,7)}
function nextTerm(J){const y=ymd(J).y;for(const Y of[y,y+1]){const m=termsOfYear(Y);for(const k of Object.keys(m).map(Number).sort((a,b)=>a-b))if(k>J)return{J:k,name:m[k]}}return null}
function copyText(J){const{cn,ae}=info(J),L=cn.L,h=ae.h,s=statusOf(J);
  return[`${fmtFull(J)} 星期${WK_CN[wday(J)]}`,L?`农历${gzYear(L.y)}年${lmName(L)}${ldName(L.d)}`:'',h?`伊斯兰历 ${h.d} ${HM_EN[h.m-1]} ${h.y}`:'',
    ...s.map(x=>`${x.n}：${x.st.t}${x.st.s?'（'+x.st.s+'）':''}`),[...new Set([...SEL().flatMap(sl=>xInfo(sl.k,J).f),cn.term])].filter(Boolean).join('、')].filter(Boolean).join('｜')}
function doCopy(t){if(NATIVE){native({type:'copy',text:t});toast('已复制');return}
  const fb=()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('已复制')}catch(e){toast('复制失败')}ta.remove()};
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('已复制'),fb);else fb()}
function renderInfo(){const J=st.sel,{cn,ae}=info(J),g=cn.g,L=cn.L,h=ae.h,doy=J-jdn(g.y,1,1)+1,s=statusOf(J),evs=evOn(J);
  const seen=new Set(),chips=[...evs.map(e=>`<span class="chip ev" style="--c:${EVC[e.c||0]}">${esc(e.title)}${evAge(e,J)}</span>`),
    ...SEL().flatMap(sl=>xInfo(sl.k,J).f.filter(x=>!seen.has(x)&&seen.add(x)).map(x=>`<span class="chip ${sl.col}">${esc(x)}</span>`)),...(cn.term?[`<span class="chip term">${cn.term}</span>`]:[])];
  const nt=nextTerm(J);
  const up=upcoming(J).map(u=>{const days=u.e-u.s+1,d0=u.s-J;
    return`<button data-go="${u.s}"><i style="--c:${u.c}"></i><span class="nm">${esc(u.name)}<small>${u.k==='ev'?'我的事件':esc(u.k)} · ${fmtMD(u.s)}${days>1?' – '+fmtMD(u.e):''}${days>1?' · '+days+' 天':''}</small></span><span class="ct">${d0<=0?(u.k==='ev'?'今天':'进行中'):d0+' 天后'}</span></button>`}).join('');
  $('pInfo').innerHTML=`
  <div class="p-hero"><div class="p-num">${g.d}</div><div style="flex:1;min-width:0"><div class="p-date selectable">${fmtFull(J)} · 星期${WK_CN[cn.w]}</div><div class="p-week">${relTxt(J-TODAY)} · 第 ${isoWeek(g)} 周 · 本年第 ${doy} 天</div></div></div>
  <div class="p-sec"><span class="p-lab">当日状态<button class="lnk" id="btnCopy" title="复制这一天的完整信息"><svg class="ic" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>复制</button></span><div class="status">
    ${s.map(x=>`<span class="flag ${x.col}">${esc(x.n)}</span><span class="st ${x.st.cls||''}">${x.st.t}${x.st.s?`<small>${esc(x.st.s)}</small>`:''}</span>`).join('')}</div></div>
  ${L?`<div class="p-sec"><span class="p-lab">农历</span><div class="lunar-row"><div><div class="p-big selectable">${lmName(L)}${ldName(L.d)}</div><div class="p-small">${gzYear(L.y)}年 · ${ZOD[mod(L.y-4,12)]}年 · ${gzDay(J)}日 · 本月${L.len===30?'大':'小'}</div></div>${moonSVG(L)}</div></div>`:''}
  ${h?`<div class="p-sec"><span class="p-lab">伊斯兰历 Hijri</span><span class="p-big lat selectable">${h.d} ${HM_EN[h.m-1]} ${h.y}</span><span class="p-small">希吉来历 ${h.y} 年 ${HM_CN[h.m-1]} ${h.d} 日</span></div>`:''}
  ${chips.length?`<div class="p-sec"><span class="p-lab">节日、节气与事件</span><div class="chips">${chips.join('')}</div></div>`:''}
  ${nt?`<div class="p-sec"><span class="p-lab">下一个节气</span><span class="p-small" style="color:var(--ink);font-size:13.5px"><b style="color:var(--term)">${nt.name}</b> · ${ymd(nt.J).y!==g.y?ymd(nt.J).y+'年':''}${fmtMD(nt.J)} ${wkTxt(nt.J)} · 还有 ${nt.J-J} 天</span></div>`:''}
  ${up?`<div class="p-sec"><span class="p-lab">接下来</span><div class="up">${up}</div></div>`:''}
  <div class="p-sec"><p class="note">中国放假与调休按国务院公布的安排（内置 2023–2027 年，联网时自动同步最新公告），未公布的年份按近年国务院排法推算（含补班日）并标注“推算”。其他国家假期来自各国官方公布日期（内置 2021–2031 年，联网自动更新），范围之外的年份按历年规律推算；未正式确认的标注“暂定”。${holSyncTxt()}双击月历中的某天可直接添加事件。</p></div>`;
  $('btnCopy').onclick=()=>doCopy(copyText(J))}
$('pInfo').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)goDay(+b.dataset.go)});

/* 日期计算 */
function buildCalc(){
  $('pCalc').innerHTML=`
  <div class="p-sec"><span class="p-lab">两个日期相差多少天</span>
    <div class="frow"><span class="flab">从</span><input class="inp" type="date" id="cA" min="1901-01-01" max="2099-12-31"></div>
    <div class="frow"><span class="flab">到</span><input class="inp" type="date" id="cB" min="1901-01-01" max="2099-12-31"></div>
    <div class="frow"><button class="btn ghost" id="cSel" style="flex:1">“到”设为选中日期</button><button class="btn ghost" id="cSwap">互换</button></div>
    <div id="cOut" style="margin-top:6px"></div></div>
  <div class="p-sec"><span class="p-lab">从某天往后 / 往前推算</span>
    <div class="frow"><span class="flab">从</span><input class="inp" type="date" id="cC" min="1901-01-01" max="2099-12-31"></div>
    <div class="frow"><input class="inp" type="number" id="cN" value="100" style="width:92px;flex:none"><select class="inp" id="cU"></select></div>
    <span class="p-small">负数表示往前推。</span>
    <div id="cOut2" style="margin-top:6px"></div></div>`;
  calcOpts();$('cA').value=toISO(TODAY);$('cB').value=toISO(st.sel===TODAY?TODAY+30:st.sel);$('cC').value=toISO(st.sel);
  ['cA','cB'].forEach(i=>$(i).addEventListener('input',calcDiff));['cC','cN','cU'].forEach(i=>$(i).addEventListener('input',calcAdd));
  $('cSel').onclick=()=>{$('cB').value=toISO(st.sel);calcDiff()};$('cSwap').onclick=()=>{const t=$('cA').value;$('cA').value=$('cB').value;$('cB').value=t;calcDiff()};
  $('pCalc').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)goDay(+b.dataset.go)})}
function calcOpts(){const el=$('cU'),v=el.value;el.innerHTML=`<option value="d">自然日</option>${SEL().map(sl=>`<option value="${sl.k}">${esc(sl.n)}工作日</option>`).join('')}`;if([...el.options].some(o=>o.value===v))el.value=v}
function calcDiff(){const A=isoJ($('cA').value),B=isoJ($('cB').value);if(isNaN(A)||isNaN(B)){$('cOut').innerHTML='<span class="p-small">请选择两个日期</span>';return}
  const lo=Math.min(A,B),hi=Math.max(A,B),n=hi-lo;
  let h=`<div class="cbig">${n}<small> 天</small></div><div class="kv" style="margin-top:10px"><span>折合</span><b>${Math.floor(n/7)} 周 ${n%7} 天${n>=365?` · 约 ${(n/365.2425).toFixed(2)} 年`:''}</b><span>含首尾</span><b>${n+1} 天</b>`;
  if(n<=3660){for(const sl of SEL()){let w=0;for(let J=lo;J<=hi;J++)if(!nonWork(sl.k,J))w++;h+=`<span>${esc(sl.n)}工作日</span><b style="color:var(--${sl.col})">${w} 天</b>`}}
  else h+=`<span>工作日</span><b style="color:var(--muted);font-weight:500">跨度超过 10 年，不统计</b>`;
  $('cOut').innerHTML=h+'</div>'}
function calcAdd(){const C=isoJ($('cC').value),N=parseInt($('cN').value,10),U=CTRY[$('cU').value]?$('cU').value:'d';
  if(isNaN(C)||isNaN(N)){$('cOut2').innerHTML='';return}let J=C;
  if(U==='d')J=C+N;else{const s=N>=0?1:-1;let k=Math.abs(N),guard=0;
    while(k>0&&guard<40000&&J>MINJ&&J<MAXJ){J+=s;guard++;if(!nonWork(U,J))k--}}
  if(J<MINJ||J>MAXJ){$('cOut2').innerHTML='<span class="p-small">超出 1901–2099 的范围</span>';return}
  $('cOut2').innerHTML=`<button class="tr" data-go="${J}" style="width:100%;border:1px solid var(--line);border-radius:12px;grid-template-columns:1fr auto"><span class="d"><b style="font-size:16px">${fmtFull(J)}</b><small>星期${WK_CN[wday(J)]} · 农历${lunarTxt(J)} · 距今 ${relTxt(J-TODAY)}</small></span><span class="s">跳转 ›</span></button>`}
function renderCalc(){calcDiff();calcAdd()}

/* 我的事件 */
let evColor=0,editId=null;
const REM_OPTS=[['','不提醒'],['0','当天提醒'],['1','提前 1 天'],['1,0','提前 1 天 + 当天'],['3,0','提前 3 天 + 当天'],['7,1,0','提前 7 天、1 天 + 当天']];
/* 提醒时区：空 = 跟随本机（Mac 当前时区，出差改时区后自动跟着变） */
const EV_TZ=[['Asia/Shanghai','北京时间'],['Asia/Dubai','迪拜时间'],['Asia/Riyadh','利雅得'],['Asia/Hong_Kong','香港'],['Asia/Singapore','新加坡'],['Asia/Tokyo','东京'],['Asia/Seoul','首尔'],['Asia/Kolkata','新德里'],['Europe/Istanbul','伊斯坦布尔'],['Europe/Moscow','莫斯科'],['Europe/London','伦敦'],['Europe/Berlin','柏林 / 巴黎'],['America/New_York','纽约'],['America/Los_Angeles','洛杉矶'],['Australia/Sydney','悉尼']];
const LOCAL_TZ=(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){return''}})();
const tzName=z=>{const f=EV_TZ.find(x=>x[0]===z);return f?f[1]:z};
const localTzTxt=()=>{const f=EV_TZ.find(x=>x[0]===LOCAL_TZ);return f?f[1].replace(/时间$/,''):(LOCAL_TZ||'系统设置')};
function tzOffMs(z,ms){const p={};new Intl.DateTimeFormat('en-US',{timeZone:z,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(new Date(ms)).forEach(x=>{if(x.type!=='literal')p[x.type]=+x.value});
  return Date.UTC(p.year,p.month-1,p.day,p.hour%24,p.minute,p.second)-Math.floor(ms/1000)*1000}
/* 某时区的“年月日 时:分” → 绝对时间（毫秒） */
function zonedMs(y,m,d,h,mi,z){if(!z||z===LOCAL_TZ)return new Date(y,m-1,d,h,mi).getTime();
  try{const w=Date.UTC(y,m-1,d,h,mi);let t=w-tzOffMs(z,w);t=w-tzOffMs(z,t);return t}catch(e){return new Date(y,m-1,d,h,mi).getTime()}}
const hhmm=ms=>{const d=new Date(ms);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const remTxt=e=>{if(!e.rem||!e.rem.length)return'';const o=REM_OPTS.find(x=>x[0]===e.rem.join(','));return`${o?o[1]:'提醒'} ${e.tz&&e.tz!==LOCAL_TZ?tzName(e.tz)+' ':''}${e.rt||'09:00'}`};
const BELL='<svg class="ic bell" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
function renderEvents(){const J=st.sel,ed=editId!=null?DB.events.find(e=>e.id===editId):null;
  const list=DB.events.map(e=>({e,n:evNext(e,TODAY)})).sort((a,b)=>(a.n??1e9)-(b.n??1e9)).map(({e,n})=>`<div class="evi"><i style="--c:${EVC[e.c||0]}"></i><span class="t" data-go="${n??jdn(e.y,e.m,e.d)}">${esc(e.title)}${e.rem&&e.rem.length?BELL:''}<small>${evRule(e)}${n!=null?evAge(e,n):''}${e.rem&&e.rem.length?' · '+remTxt(e):''}</small></span><span class="c">${n==null?'已过':n===TODAY?'今天':(n-TODAY)+' 天后'}</span><button class="x" data-edit="${e.id}" title="编辑"><svg class="ic" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button><button class="x" data-del="${e.id}" title="删除"><svg class="ic" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`).join('');
  const D0=ed?jdn(ed.y,ed.m,ed.d):J,rem0=ed?(ed.rem||[]).join(','):'1,0',col=ed?(ed.c||0):evColor;
  $('pEv').innerHTML=`
  <div class="p-sec"><span class="p-lab">${ed?'编辑事件':'添加事件'}${NATIVE?'<button class="lnk" id="eTest" title="立即发一条测试通知">测试通知</button>':''}</span>
    <input class="inp" id="eT" placeholder="例如：妈妈生日、签证到期、结婚纪念日" maxlength="40" value="${ed?esc(ed.title):''}">
    <div class="frow"><input class="inp" type="date" id="eD" value="${toISO(D0)}" min="1901-01-01" max="2099-12-31"><select class="inp" id="eR">${[['once','不重复'],['solar','每年 · 公历'],['lunar','每年 · 农历']].map(o=>`<option value="${o[0]}" ${ed&&ed.rep===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
    <div class="frow"><select class="inp" id="eM">${REM_OPTS.map(o=>`<option value="${o[0]}" ${o[0]===rem0?'selected':''}>${o[1]}</option>`).join('')}</select><input class="inp" type="time" id="eH" value="${ed&&ed.rt||'09:00'}" style="width:110px;flex:none"></div>
    <div class="frow"><span class="flab" style="flex:none">时区</span><select class="inp" id="eZ" title="按哪个时区的钟点提醒"><option value="">跟随本机（当前：${esc(localTzTxt())}）</option>${EV_TZ.map(z=>`<option value="${z[0]}" ${ed&&ed.tz===z[0]?'selected':''}>${z[1]}${z[0]===LOCAL_TZ?'（与本机相同）':''}</option>`).join('')}${ed&&ed.tz&&!EV_TZ.some(z=>z[0]===ed.tz)?`<option value="${esc(ed.tz)}" selected>${esc(ed.tz)}</option>`:''}</select></div>
    <div class="frow"><div class="sw" id="eC">${EVC.map((c,i)=>`<button data-c="${i}" class="${i===col?'on':''}" style="--c:${c}" title="颜色 ${i+1}"></button>`).join('')}</div>${ed?'<button class="btn ghost" id="eCancel">取消</button>':''}<button class="btn" id="eAdd">${ed?'保存':'添加'}</button></div>
    <span class="p-small" id="eHint"></span></div>
  <div class="p-sec"><span class="p-lab">我的事件 · ${DB.events.length}</span><div class="evl">${list||'<div class="empty">还没有事件。农历生日选“每年 · 农历”，每年会自动换算到对应公历日期；设置提醒后会用系统通知提前告诉你。</div>'}</div></div>`+pushHTML();
  let color=col;
  const hint=()=>{const D=isoJ($('eD').value),R=$('eR').value;if(isNaN(D)){$('eHint').textContent='';return}const L=lunar(D);
    const base=R==='lunar'&&L?`农历 ${LM[L.m-1]}月${ldName(L.d)}${L.leap?'（闰月按正常月份计）':''}，每年重复`:R==='solar'?`每年 ${ymd(D).m}月${ymd(D).d}日重复`:`${fmtFull(D)}（农历${lunarTxt(D)}）`;
    const Z=$('eZ').value,[hh,mm]=($('eH').value||'09:00').split(':').map(Number),g0=ymd(D);
    const zt=Z&&Z!==LOCAL_TZ?`按${tzName(Z)} ${$('eH').value||'09:00'} 提醒（本机时间 ${hhmm(zonedMs(g0.y,g0.m,g0.d,hh,mm,Z))}）`:`按本机时间（${localTzTxt()}）${$('eH').value||'09:00'} 提醒`;
    $('eHint').textContent=base+($('eM').value?`。${zt}，到时会发 macOS 通知${NATIVE?'并推送到已开启的手机渠道，App 关闭后通知也会准时弹出':''}。`:'')};
  ['eD','eR','eM','eH','eZ'].forEach(i=>$(i).oninput=hint);hint();
  $('eC').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;color=+b.dataset.c;if(!ed)evColor=color;[...$('eC').children].forEach(x=>x.classList.toggle('on',x===b))};
  const add=()=>{const t=$('eT').value.trim(),D=isoJ($('eD').value),R=$('eR').value,M=$('eM').value;if(!t){$('eT').focus();toast('请填写事件名称');return}if(isNaN(D)){toast('请选择日期');return}
    const g=ymd(D),L=lunar(D),ev={title:t,rep:R,y:g.y,m:g.m,d:g.d,c:color,rem:M?M.split(',').map(Number):[],rt:$('eH').value||'09:00',tz:$('eZ').value||''};if(R==='lunar'&&L){ev.lm=L.m;ev.ld=L.d}
    if(ed){Object.assign(ed,ev);editId=null;toast('已保存')}else{ev.id=Date.now();DB.events.push(ev);toast('已添加')}
    save();refreshAll()};
  $('eAdd').onclick=add;$('eT').onkeydown=e=>{if(e.key==='Enter')add()};
  if(ed)$('eCancel').onclick=()=>{editId=null;renderEvents()};
  if($('eTest'))$('eTest').onclick=()=>native({type:'testNotify'})}
$('pEv').addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){const id=+d.dataset.del,i=DB.events.findIndex(x=>x.id===id);if(i<0)return;const ev=DB.events[i];DB.events.splice(i,1);if(editId===id)editId=null;save();refreshAll();toast(`已删除“${ev.title}”`);return}
  const ed=e.target.closest('[data-edit]');if(ed){editId=+ed.dataset.edit;renderEvents();$('panel').scrollTop=0;$('eT').focus();return}
  const g=e.target.closest('[data-go]');if(g)goDay(+g.dataset.go)});


/* 手机推送渠道 */
const CH=[
 {k:'bark',n:'Bark',d:'iPhone 推送',f:[['key','推送地址或 Key','粘贴 https://api.day.app/xxxx']],help:'打开 Bark App 首页，复制示例里的推送地址，整段粘贴即可（自建服务器也支持）。以“时效性通知”推送，可穿透专注模式。'},
 {k:'ding',n:'钉钉',d:'群机器人',f:[['url','Webhook 地址','https://oapi.dingtalk.com/robot/send?access_token=…'],['secret','加签密钥（可选）','SEC 开头的密钥']],help:'钉钉群 → 设置 → 机器人 → 添加“自定义”机器人。安全设置选“加签”并把 SEC 开头的密钥填到这里；或选“自定义关键词”，填“提醒”。'},
 {k:'feishu',n:'飞书',d:'群机器人',f:[['url','Webhook 地址','https://open.feishu.cn/open-apis/bot/v2/hook/…'],['secret','签名校验密钥（可选）','开启签名校验时填写']],help:'飞书群 → 设置 → 群机器人 → 添加“自定义机器人”。开启“签名校验”就把密钥填到这里；或在“自定义关键词”里填“提醒”。'},
 {k:'wecom',n:'企业微信',d:'群机器人',f:[['url','Webhook 地址','https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…']],help:'企业微信群 → 右上角 … → 添加群机器人 → 新建机器人，复制 Webhook 地址。'},
 {k:'hook',n:'自定义 Webhook',d:'POST JSON',f:[['url','接收地址','https://…']],help:'到点会 POST 一段 JSON：{"title","body","source","time"}，可接 Server 酱、ntfy、Home Assistant 等。'}];
function pushCfg(){if(!S.push||typeof S.push!=='object')S.push={};if(S.push._hol===undefined)S.push._hol=true;return S.push}
function sendPushCfg(){native({type:'pushCfg',cfg:pushCfg()})}
/* ---------- 网页版提醒（浏览器通知、Bark、导出到日历） ---------- */
const WEB_TIMERS=[];
function webSchedule(items){WEB_TIMERS.splice(0).forEach(clearTimeout);const now=Date.now();
  for(const it of items){const d=it.at-now;if(d<0||d>2147e6)continue;WEB_TIMERS.push(setTimeout(()=>webFire(it),d))}}
function webFire(it){const P=pushCfg();if(/^(hol|work)-/.test(it.id)&&P._hol===false&&!S.webNotify)return;
  if(DB.sent&&DB.sent.includes(it.id))return;DB.sent=(DB.sent||[]).concat(it.id).slice(-300);save();
  toast(it.title);
  if(S.webNotify&&'Notification'in window&&Notification.permission==='granted'){try{new Notification(it.title,{body:it.body,tag:it.id})}catch(e){}}
  if(P.bark&&P.bark.on&&!(/^(hol|work)-/.test(it.id)&&P._hol===false))webBark(it.title,it.body).catch(()=>{})}
async function webBark(title,body){const v=((pushCfg().bark||{}).key||'').trim();let server='https://api.day.app',key=v;
  if(/:\/\//.test(v)){try{const u=new URL(v);server=u.origin;key=u.pathname.split('/').filter(Boolean)[0]||''}catch(e){}}
  if(!key)throw'请填写 Bark 推送地址或 Key';
  const r=await fetch(server+'/push',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({device_key:key,title,body:`【环球万年历提醒】${title}\n${body}`,group:'环球万年历',level:'timeSensitive',sound:'minuet'})});
  const j=await r.json().catch(()=>({}));if(!r.ok||(j.code&&j.code!==200))throw(j.message||'HTTP '+r.status);return true}
/* 导出“我的事件”为 .ics：导入 iPhone / Mac / Outlook / Google 日历后，由日历自己到点提醒，关掉网页也不影响 */
function exportIcs(){const evs=DB.events.filter(e=>e.title);if(!evs.length){toast('还没有事件');return}
  const p=n=>String(n).padStart(2,'0'),dt=ms=>{const d=new Date(ms);return`${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00Z`};
  const escI=t=>String(t).replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//环球万年历//CN','CALSCALE:GREGORIAN','X-WR-CALNAME:环球万年历'];let n=0;
  for(const e of evs){for(let J=TODAY;J<=TODAY+3*366;J++){if(!evMatch(e,J,ymd(J)))continue;const g=ymd(J),nx=ymd(J+1);n++;
      L.push('BEGIN:VEVENT',`UID:wnl-${e.id}-${J}@calendar`,`DTSTAMP:${dt(Date.now())}`,`DTSTART;VALUE=DATE:${g.y}${p(g.m)}${p(g.d)}`,`DTEND;VALUE=DATE:${nx.y}${p(nx.m)}${p(nx.d)}`,
        `SUMMARY:${escI(e.title)}`,`DESCRIPTION:${escI(evRule(e)+evAge(e,J)+' · 农历'+lunarTxt(J)+'\n来自「环球万年历」')}`);
      for(const off of(e.rem||[])){const[h,m]=(e.rt||'09:00').split(':').map(Number),F=ymd(J-off),t=zonedMs(F.y,F.m,F.d,h||0,m||0,e.tz);
        L.push('BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escI(e.title)}`,`TRIGGER;VALUE=DATE-TIME:${dt(t)}`,'END:VALARM')}
      L.push('END:VEVENT');if(e.rep==='once')break}}
  L.push('END:VCALENDAR');
  const blob=new Blob([L.join('\r\n')],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='环球万年历-我的事件.ics';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  toast(`已导出 ${n} 个日程（未来 3 年）`)}
function webPushHTML(){const P=pushCfg(),b=P.bark||{},perm='Notification'in window?Notification.permission:'unsupported';
  return`<div class="p-sec"><span class="p-lab">导出到手机 / 电脑日历（推荐）</span>
  <span class="p-small">把事件和提醒导出为 .ics 文件，导入 iPhone、Mac、Outlook 或 Google 日历后，由日历自己到点提醒——关掉网页、电脑关机都不影响。事件有改动时重新导出一次即可。</span>
  <div class="frow"><button class="btn" id="wIcs">导出 .ics 日历文件</button></div></div>
  <div class="p-sec"><span class="p-lab">网页打开时的提醒</span>
  <span class="p-small">以下两种需要这个网页开着（可以在后台标签页）。</span>
  <div class="opt" style="padding-top:2px"><span style="font-size:12.5px">浏览器通知<br><small style="color:var(--muted);font-size:11.5px">${perm==='denied'?'已被浏览器拒绝，请在地址栏左侧的网站设置里允许通知':perm==='unsupported'?'当前浏览器不支持':'到点在电脑右上角弹出通知'}</small></span><button class="tg" data-wn role="switch" aria-checked="${!!S.webNotify&&perm==='granted'}"></button></div>
  <div class="ch"><div class="ch-h"><b>Bark</b><small>iPhone 推送</small><button class="tg" data-ch-on="bark" role="switch" aria-checked="${!!b.on}" title="启用 Bark"></button></div>
    <div class="ch-b" id="chb-bark" ${b.on?'':'hidden'}><input class="inp" data-ch="bark" data-f="key" placeholder="粘贴 https://api.day.app/xxxx" value="${esc(b.key||'')}" aria-label="推送地址或 Key" spellcheck="false" autocomplete="off">
    <span class="p-small">打开 Bark App 首页，复制示例里的推送地址，整段粘贴即可。钉钉、飞书、企业微信受浏览器跨域限制，只能在 Mac App 版使用。</span>
    <div class="frow"><button class="btn ghost" id="wBarkTest">发送测试</button><span class="ch-st" id="chst-bark"></span></div></div></div>
  <div class="opt" style="padding-top:2px"><span style="font-size:12.5px">假期 / 调休提醒也通知</span><button class="tg" data-ch-hol role="switch" aria-checked="${P._hol!==false}"></button></div></div>`}
function pushHTML(){if(!NATIVE)return webPushHTML();const P=pushCfg(),n=CH.filter(c=>P[c.k]&&P[c.k].on).length;
  return`<div class="p-sec"><span class="p-lab">同步到 iPhone 日历（推荐）</span>
  <div class="opt" style="padding-top:2px"><span style="font-size:12.5px">把事件提醒写入系统日历<br><small style="color:var(--muted);font-size:11.5px">经 iCloud 同步到 iPhone，由手机自己到点提醒，Mac 合盖、关机都不影响</small></span><button class="tg" data-cal role="switch" aria-checked="${!!S.calSync}"></button></div>
  <span class="p-small" id="calSt" style="color:${calOK?'var(--ae)':'var(--cn)'}">${S.calSync&&calMsg?(calOK?'✓ ':'✕ ')+esc(calMsg):''}</span>
  ${S.calSync?'<div class="frow"><button class="btn ghost" id="calTest">发测试到 iPhone</button><span class="ch-st" id="calTestSt"></span></div>':''}</div>
  <div class="p-sec"><span class="p-lab">同时推送到手机 · 已开启 ${n}</span>
  <span class="p-small">提醒到点时，除了 Mac 上的卡片和通知，还会推送到下面开启的渠道。由 Mac 发出：需要 App 在运行；Mac 合盖睡眠时发不出，醒来后会补发当天错过的提醒（标“补发”）。</span>
  <div class="chs">${CH.map(c=>{const v=P[c.k]||{};return`<div class="ch"><div class="ch-h"><b>${c.n}</b><small>${c.d}</small><button class="tg" data-ch-on="${c.k}" role="switch" aria-checked="${!!v.on}" title="启用 ${c.n}"></button></div>
    <div class="ch-b" id="chb-${c.k}" ${v.on?'':'hidden'}>${c.f.map(f=>`<input class="inp" data-ch="${c.k}" data-f="${f[0]}" placeholder="${esc(f[2])}" value="${esc(v[f[0]]||'')}" aria-label="${f[1]}" spellcheck="false" autocomplete="off" ${f[0]==='secret'?'type="password"':''}>`).join('')}
    <span class="p-small">${esc(c.help)}</span>
    <div class="frow"><button class="btn ghost" data-ch-test="${c.k}">发送测试</button><span class="ch-st" id="chst-${c.k}"></span></div></div></div>`}).join('')}</div>
  <div class="opt" style="padding-top:2px"><span style="font-size:12.5px">假期 / 调休提醒也推送到手机</span><button class="tg" data-ch-hol role="switch" aria-checked="${P._hol!==false}"></button></div></div>`}
window.__pushRes=(ch,ok,msg)=>{const el=document.getElementById('chst-'+ch);if(el){el.textContent=ok?'✓ 发送成功，请看手机':'✕ '+msg;el.style.color=ok?'var(--ae)':'var(--cn)'}toast(ok?'推送成功':'推送失败：'+msg)};
let pushSaveT=0;
$('pEv').addEventListener('input',e=>{const t=e.target;if(!t.dataset||!t.dataset.ch)return;const P=pushCfg();P[t.dataset.ch]=P[t.dataset.ch]||{};P[t.dataset.ch][t.dataset.f]=t.value;
  sendPushCfg();clearTimeout(pushSaveT);pushSaveT=setTimeout(save,400)});
$('pEv').addEventListener('click',e=>{const P=pushCfg();
  if(e.target.closest('#wIcs')){exportIcs();return}
  if(e.target.closest('#wBarkTest')){const el=$('chst-bark');el.textContent='发送中…';el.style.color='var(--muted)';
    webBark('环球万年历 · 测试推送','收到这条说明推送配置成功，事件提醒到点会推送到这里（网页需开着）。').then(()=>{el.textContent='✓ 发送成功，请看手机';el.style.color='var(--ae)'},m=>{el.textContent='✕ '+m;el.style.color='var(--cn)'});return}
  const wn=e.target.closest('[data-wn]');if(wn){if(!('Notification'in window)){toast('当前浏览器不支持通知');return}
    if(S.webNotify){S.webNotify=false;save();wn.setAttribute('aria-checked','false');return}
    Notification.requestPermission().then(r=>{S.webNotify=r==='granted';save();wn.setAttribute('aria-checked',S.webNotify);
      if(r==='granted'){toast('已开启浏览器通知');try{new Notification('环球万年历',{body:'通知已开启，事件到点会在这里提醒。'})}catch(e){}}else toast('浏览器没有允许通知')});return}
  if(e.target.closest('#calTest')){const el=$('calTestSt');if(el){el.textContent='写入中…';el.style.color='var(--muted)'}native({type:'calTest'});return}
  const cb=e.target.closest('[data-cal]');if(cb){S.calSync=!S.calSync;cb.setAttribute('aria-checked',S.calSync);save();
    if(S.calSync){calAsk=true;lastCal='';const el=$('calSt');if(el){el.textContent='正在写入系统日历…';el.style.color='var(--muted)'}scheduleReminders()}
    else{native({type:'calSync',on:false});calOK=false;calMsg='';lastCal='';const el=$('calSt');if(el)el.textContent='已关闭，已从系统日历移除';scheduleReminders()}return}
  const on=e.target.closest('[data-ch-on]');if(on){const k=on.dataset.chOn;P[k]=P[k]||{};P[k].on=!P[k].on;on.setAttribute('aria-checked',P[k].on);$('chb-'+k).hidden=!P[k].on;save();sendPushCfg();if(P[k].on){const i=$('chb-'+k).querySelector('input');if(i&&!i.value)i.focus()}return}
  const hol=e.target.closest('[data-ch-hol]');if(hol){P._hol=!(P._hol!==false);hol.setAttribute('aria-checked',P._hol);save();sendPushCfg();return}
  const ts=e.target.closest('[data-ch-test]');if(ts){const k=ts.dataset.chTest;sendPushCfg();const el=$('chst-'+k);if(el){el.textContent='发送中…';el.style.color='var(--muted)'}native({type:'pushTest',ch:k})}});
/* 提醒：把未来 62 天内的提醒交给 macOS 通知中心排期（App 退出后也会弹出） */
function scheduleReminders(){const items=[],nowMs=Date.now(),end=TODAY+62;const sent=new Set(DB.sent||[]);let dirty=false;
  const at=(J,hm,z)=>{const g=ymd(J),[h,m]=(hm||'09:00').split(':').map(Number);return zonedMs(g.y,g.m,g.d,h||0,m||0,z)};
  for(const e of DB.events){if(!e.rem||!e.rem.length)continue;
    for(let J=TODAY;J<=end+7;J++){if(!evMatch(e,J,ymd(J)))continue;
      for(const off of e.rem){const F=J-off,t=at(F,e.rt,e.tz),id=`ev-${e.id}-${J}-${off}`;if(F>end)continue;
        if(t<=nowMs){if(F===TODAY&&!sent.has(id)){sent.add(id);dirty=true;items.push({id:id+'-now',at:nowMs+4000,title:off===0?`今天：${e.title}`:`${off===1?'明天':off+' 天后'}：${e.title}`,body:`${fmtFull(J)} 星期${WK_CN[wday(J)]} · 农历${lunarTxt(J)}${evAge(e,J)}（原定 ${e.tz&&e.tz!==LOCAL_TZ?tzName(e.tz)+' ':''}${e.rt||'09:00'} 提醒，已补发）`})}continue}
        items.push({id,at:t,title:off===0?`今天：${e.title}`:`${off===1?'明天':off+' 天后'}：${e.title}`,body:`${fmtFull(J)} 星期${WK_CN[wday(J)]} · 农历${lunarTxt(J)}${evAge(e,J)}`})}}}
  if(S.holRemind){
    const scan=(pick,label)=>{let prev=null;for(let J=TODAY-10;J<=end;J++){const n=pick(J);if(n&&n!==prev){let e2=J;while(pick(e2+1)===n)e2++;const t=at(J-1,'20:00');
      if(t>nowMs)items.push({id:`hol-${label}-${J}`,at:t,title:`明天起${label}放假：${n}`,body:`${fmtMD(J)}（${wkTxt(J)}）– ${fmtMD(e2)}（${wkTxt(e2)}），共 ${e2-J+1} 天`})}prev=n}};
    VIS().forEach(sl=>scan(J=>xInfo(sl.k,J).hol,sl.n));
    if(cnVis())for(let J=TODAY;J<=end;J++)if(CN_WORK[J]){const t=at(J-1,'20:00');if(t>nowMs)items.push({id:`work-${J}`,at:t,title:'明天调休上班',body:`${fmtMD(J)}（${wkTxt(J)}）是中国补班日，记得定闹钟`})}}
  if(dirty){DB.sent=[...sent].slice(-300);save()}
  // 同步到系统日历（iCloud → iPhone）：未来 400 天内带提醒的事件
  let cal=[];
  if(NATIVE&&S.calSync){for(const e of DB.events){if(!e.rem||!e.rem.length)continue;
    for(let J=TODAY;J<=TODAY+400&&cal.length<300;J++){if(!evMatch(e,J,ymd(J)))continue;const g=ymd(J);
      cal.push({key:`${e.id}-${J}`,title:e.title,y:g.y,m:g.m,d:g.d,alarms:e.rem.map(off=>at(J-off,e.rt,e.tz)),notes:`${evRule(e)}${evAge(e,J)} · 农历${lunarTxt(J)}\n提醒：${remTxt(e)}\n来自「环球万年历」`})}}
    // 日历已负责的提醒，Mac 上不再重复发系统通知（右上角卡片和手机推送照常）
    if(calOK){const ck=new Set(cal.map(c=>c.key));items.forEach(it=>{const m=/^ev-(\d+)-(\d+)-\d+$/.exec(it.id);if(m&&ck.has(m[1]+'-'+m[2]))it.cal=true})}}
  const cs=JSON.stringify(cal);if(S.calSync&&(cs!==lastCal||calAsk)){lastCal=cs;native({type:'calSync',on:true,items:cal,ask:calAsk});calAsk=false}
  items.sort((a,b)=>a.at-b.at);if(NATIVE)native({type:'schedule',items:items.slice(0,60)});else webSchedule(items)}
let lastCal='',calAsk=false,calOK=false,calMsg='';
window.__calTestRes=(icloud,hm)=>{const el=$('calTestSt'),t=icloud?`已建测试日程，iPhone 将在 ${hm} 提醒（iCloud 同步通常几秒到 1 分钟）`:`已写入本机日历，${hm} Mac 会提醒；但没开 iCloud 日历，iPhone 收不到`;if(el){el.textContent=t;el.style.color=icloud?'var(--ae)':'var(--cn)'}toast(icloud?'测试已发出，'+hm+' 看 iPhone':'没开 iCloud 日历，iPhone 收不到')};
window.__calRes=(ok,msg)=>{const was=calOK;calOK=ok;calMsg=msg;const el=$('calSt');if(el){el.textContent=(ok?'✓ ':'✕ ')+msg;el.style.color=ok?'var(--ae)':'var(--cn)'}if(ok!==was)scheduleReminders()};
/* 原生端到点已送达（含睡眠后补发）：记下来，避免跨天重载后再补发一次 */
window.__delivered=id=>{DB.sent=DB.sent||[];if(!DB.sent.includes(id)){DB.sent.push(id);DB.sent=DB.sent.slice(-300);save()}};
function renderPanel(){if(tab==='info')renderInfo();else if(tab==='calc')renderCalc();else renderEvents()}

/* ---------- 搜索与跳转（⌘K） ---------- */
let sItems=[],sAct=0,sT=0;
const HINTS=['2027-3-5','春节','中秋','开斋节','冬至','+100','农历八月十五','2030'];
function openSearch(){closePops();$('search').hidden=false;$('sIn').value='';runSearch();setTimeout(()=>$('sIn').focus(),10)}
function closeSearch(){$('search').hidden=true}
const dateItem=(J,name,c)=>({J,name,c:c||'var(--ink)',sub:`${fmtFull(J)} 星期${WK_CN[wday(J)]} · 农历${lunarTxt(J)}`,ct:relTxt(J-TODAY)});
function runSearch(){const q=$('sIn').value.trim();const r=[];let m;const okJ=J=>J>=MINJ&&J<=MAXJ;
  if(!q){$('sRes').innerHTML='';$('sHint').innerHTML=`试试：${HINTS.map(h=>`<button data-h="${h}">${h}</button>`).join('')}`;sItems=[];return}
  $('sHint').innerHTML='<span>↑↓ 选择 · 回车跳转 · Esc 关闭</span>';
  if((m=/^([+-])\s*(\d{1,5})\s*天?$/.exec(q))){const J=st.sel+(m[1]==='-'?-1:1)*+m[2];if(okJ(J))r.push(dateItem(J,`选中日期 ${m[1]}${m[2]} 天`))}
  else if((m=/^(\d{1,5})\s*天\s*(后|以后|之后|前|以前|之前)$/.exec(q))){const J=TODAY+(/前/.test(m[2])?-1:1)*+m[1];if(okJ(J))r.push(dateItem(J,`今天${/前/.test(m[2])?'往前':'往后'} ${m[1]} 天`))}
  else if((m=/^(\d{4})\s*[-/.年]\s*(\d{1,2})\s*(?:[-/.月]\s*(\d{1,2})\s*日?)?\s*月?$/.exec(q))||(m=/^(\d{4})(\d{2})(\d{2})$/.exec(q))){const y=+m[1],mo=+m[2],d=m[3]?+m[3]:0;
    if(mo>=1&&mo<=12&&y>=1901&&y<=2099){if(d){const J=jdn(y,mo,d);if(ymd(J).m===mo)r.push(dateItem(J,'跳转到日期'))}else r.push({act:'month',y,m:mo,name:`${y}年${mo}月`,sub:'打开月视图',c:'var(--ink)',ct:''})}}
  else if((m=/^(\d{1,2})\s*[月/.-]\s*(\d{1,2})\s*日?$/.exec(q))){const y=curYear(),J=jdn(y,+m[1],+m[2]);if(+m[1]<=12&&ymd(J).m===+m[1])r.push(dateItem(J,`${y}年${+m[1]}月${+m[2]}日`))}
  else if((m=/^(\d{4})\s*年?$/.exec(q))&&+m[1]>=1901&&+m[1]<=2099){const y=+m[1];r.push({act:'year',y,name:`${y}年（${gzYear(y)}${ZOD[mod(y-4,12)]}年）`,sub:'切换到这一年',c:'var(--ink)',ct:''})}
  if((m=/^农历\s*(闰)?\s*([正一二三四五六七八九十冬腊]{1,2})月\s*(初[一二三四五六七八九十]|十[一二三四五六七八九]|二十|廿[一二三四五六七八九]|三十)$/.exec(q))){
    const want=(m[1]||'')+m[2].replace(/^十一$/,'冬').replace(/^十二$/,'腊').replace(/^一$/,'正')+'月'+m[3];
    for(let J=st.sel;J<st.sel+1200&&J<=MAXJ&&r.length<4;J++){const L=lunar(J);if(L&&lmName(L)+ldName(L.d)===want)r.push(dateItem(J,q))}}
  else if(!r.length&&/[一-龥A-Za-z]/.test(q)){const per={};const ql=q.toLowerCase();
    for(let J=Math.max(MINJ,st.sel-30);J<st.sel+1130&&J<=MAXJ&&r.length<10;J++){const i=info(J);
      const names=[...i.cn.f.map(n=>[n,'var(--cn)']),...(i.cn.term?[[i.cn.term,'var(--term)']]:[]),...SEL().filter(sl=>sl.k!=='cn').flatMap(sl=>xInfo(sl.k,J).f.map(n=>[n,`var(--${sl.col})`])),...evOn(J).map(e=>[e.title,EVC[e.c||0]])];
      for(const[n,c]of names)if(n.toLowerCase().includes(ql)&&(per[n]=(per[n]||0)+1)<=3)r.push({...dateItem(J,n,c)})}
    r.sort((a,b)=>Math.abs(a.J-TODAY)-Math.abs(b.J-TODAY)).sort((a,b)=>(a.J<TODAY)-(b.J<TODAY))}
  sItems=r;sAct=0;drawResults()}
function drawResults(){$('sRes').innerHTML=sItems.length?sItems.map((x,i)=>`<button class="sr ${i===sAct?'act':''}" data-i="${i}"><i style="--c:${x.c}"></i><span><b>${esc(x.name)}</b><span>${x.sub}</span></span><em>${x.ct}</em></button>`).join(''):'<div class="empty" style="padding:14px 12px">没有找到。可以输入日期（2027-3-5、3月8日、20270305）、节日、节气、事件名，或 +30、100天后。</div>'}
function pick(i){const x=sItems[i];if(!x)return;closeSearch();
  if(x.act==='year'){setYear(x.y);return}if(x.act==='month'){if(S.view==='month')animateToRow(monthRow(x.y,x.m));else openMonth(x.y,x.m);return}
  const g=ymd(x.J);if(S.view==='month')goDay(x.J);else if(S.view==='year')goDay(x.J);else openMonth(g.y,g.m,x.J)}
$('sIn').addEventListener('input',()=>{clearTimeout(sT);sT=setTimeout(runSearch,110)});
$('sIn').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){sAct=Math.min(sItems.length-1,sAct+1);drawResults();e.preventDefault()}
  else if(e.key==='ArrowUp'){sAct=Math.max(0,sAct-1);drawResults();e.preventDefault()}
  else if(e.key==='Enter'){clearTimeout(sT);runSearch();pick(sAct)}else if(e.key==='Escape')closeSearch()});
$('sRes').onclick=e=>{const b=e.target.closest('[data-i]');if(b)pick(+b.dataset.i)};
$('sHint').onclick=e=>{const b=e.target.closest('[data-h]');if(b){$('sIn').value=b.dataset.h;runSearch();$('sIn').focus()}};
$('search').onclick=e=>{if(e.target===$('search'))closeSearch()};
$('btnSearch').onclick=e=>{e.stopPropagation();openSearch()};

/* ---------- 键盘 ---------- */
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('search').hidden?openSearch():closeSearch();return}
  if((e.metaKey||e.ctrlKey)&&['1','2','3'].includes(e.key)){e.preventDefault();setView(['month','year','list'][+e.key-1]);return}
  if(!$('search').hidden)return;
  const tg=e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA'){if(e.key==='Escape')e.target.blur();return}
  if(e.key==='Escape'){closePops();return}
  const k=e.key;
  if(k==='/'){e.preventDefault();openSearch()}
  else if(k==='ArrowLeft'||k==='PageUp'){step(-1);e.preventDefault()}
  else if(k==='ArrowRight'||k==='PageDown'){step(1);e.preventDefault()}
  else if(k==='ArrowUp'&&S.view==='month'){animateToRow((animRow??sc.scrollTop/rowH)-1,380);e.preventDefault()}
  else if(k==='ArrowDown'&&S.view==='month'){animateToRow((animRow??sc.scrollTop/rowH)+1,380);e.preventDefault()}
  else if(k==='t'||k==='T')$('today').click();
  else if(k==='m'||k==='M')setView('month');else if(k==='y'||k==='Y')setView('year');else if(k==='l'||k==='L')setView('list')});

/* ---------- 时钟 / 菜单栏 / 跨天刷新 ---------- */
const tf=tz=>new Intl.DateTimeFormat('zh-CN',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
function tick(){$('clock').innerHTML=`<span title="北京时间 UTC+8">北京<b>${tf('Asia/Shanghai')}</b></span><span title="迪拜时间 UTC+4">迪拜<b>${tf('Asia/Dubai')}</b></span>`;
  if(new Date().getDate()!==now.getDate()){if(NATIVE)native({type:'reload'});else location.reload()}}
const MB_FMTS=['{日期} {星期} · {农历}','{时分秒}','{时分}','{月日} {星期} {时分秒}','{日期} {星期} {时分秒}','{月日} {星期} {时分}','{农历} {时分秒}','{日期} {星期} {农历} {时分秒}','{月日} {星期} {农历} {节气}','北京 {北京} · 迪拜 {迪拜}','{农历}'];
function fmtStatus(t){const d=new Date(),p=n=>String(n).padStart(2,'0'),L=lunar(TODAY),c=info(TODAY).cn;
  const tz=z=>new Intl.DateTimeFormat('zh-CN',{timeZone:z,hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
  return t.replace(/\{日期\}/g,`${G0.m}/${G0.d}`).replace(/\{月日\}/g,`${G0.m}月${G0.d}日`).replace(/\{年\}/g,G0.y).replace(/\{星期\}/g,'周'+WK_CN[wday(TODAY)])
   .replace(/\{农历\}/g,L?lmName(L)+ldName(L.d):'').replace(/\{节气\}/g,c.term||'').replace(/\{时分秒\}/g,`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`)
   .replace(/\{时分\}/g,`${p(d.getHours())}:${p(d.getMinutes())}`).replace(/\{北京\}/g,tz('Asia/Shanghai')).replace(/\{迪拜\}/g,tz('Asia/Dubai')).replace(/\s{2,}/g,' ').replace(/\s*·\s*$/,'').trim()}
function pushStatus(){const L=lunar(TODAY),c=info(TODAY).cn;native({type:'statusFmt',fmt:S.mbFmt||MB_FMTS[0],lunar:L?lmName(L)+ldName(L.d):'',term:c.term||''})}


/* ---------- 节假日联网同步 ---------- */
// 中国：holiday-cn（自动抓取国务院办公厅通知）；阿联酋：Google 公共假期日历（含开斋节/宰牲节实际公布日期与暂定标记）
const CN_SRC=y=>[`https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${y}.json`,`https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${y}.json`];
const AE_ICS='https://calendar.google.com/calendar/ical/en.ae%23holiday%40group.v.calendar.google.com/public/basic.ics';
function holSyncTxt(){const t=DB.hol&&DB.hol.at;if(!t)return'';const d=new Date(t);return` 上次同步：${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}。`}
async function firstOk(urls,parse){let err;for(const u of urls){try{return parse(await http(u+(u.includes('?')?'&':'?')+'t='+Math.floor(Date.now()/6e5)))}catch(e){err=e}}throw err}
function aeName(sm){const n=sm.replace(/\s*\(tentative\)\s*/i,'').trim();
  const M=[[/Eid al-Fitr Holiday/i,'开斋节',0],[/Eid al-Fitr/i,'开斋节',1],[/Arafat/i,'阿拉法特日',1],[/Eid al-Adha public sector/i,'宰牲节（公共部门）',0],[/Eid al-Adha Holiday/i,'宰牲节',0],[/Eid al-Adha/i,'宰牲节',1],[/Hijr|Islamic New Year/i,'伊斯兰新年',1],[/Mouloud|Prophet/i,'圣纪节',1],[/National Day Holiday/i,'国庆日',0],[/National Day/i,'国庆日',1],[/New Year's Day/i,'新年',1],[/Commemoration/i,'纪念日',1]];
  for(const[r,c,m]of M)if(r.test(n))return{name:c,main:!!m};return{name:n,main:true}}
function parseAeIcs(t){t=t.replace(/\r?\n[ \t]/g,'');const out=[];
  for(const ev of t.split('BEGIN:VEVENT').slice(1)){const ds=/DTSTART;VALUE=DATE:(\d{8})/.exec(ev),de=/DTEND;VALUE=DATE:(\d{8})/.exec(ev),sm=/\nSUMMARY:(.*)/.exec(ev),ds2=/\nDESCRIPTION:(.*)/.exec(ev);
    if(!ds||!sm||!/Public holiday/i.test(ds2?ds2[1]:''))continue;
    const p=x=>jdn(+x.slice(0,4),+x.slice(4,6),+x.slice(6,8)),a=p(ds[1]),b=de?p(de[1])-1:a,nm=aeName(sm[1]),tent=/tentative/i.test(sm[1]);
    for(let J=a;J<=b;J++)out.push({J,name:nm.name,main:nm.main&&J===a,tent})}
  if(out.length<5)throw'数据异常';return out}
let holBusy=false;
let webNetP=null,webNetAt=0;
function webNet(){if(!webNetP||Date.now()-webNetAt>6e5){webNetAt=Date.now();webNetP=fetch('netdata.json?t='+Math.floor(Date.now()/6e5)).then(r=>r.ok?r.json():Promise.reject('HTTP '+r.status)).then(j=>{if(!j||j.v!==HOL_PV)throw'版本不符';return j});webNetP.catch(()=>{webNetP=null})}return webNetP}
/* 其他国家：Google 公共假期日历 */
async function syncOne(H,k){const c=CTRY[k];if(!c||!c.g)return null;H.x=H.x||{};
  try{const packed=NATIVE?(await firstOk([icsURL(c)],t=>{const l=parseHolIcs(t,c);if(l.length<5)throw'数据异常';return l})).map(x=>x.tent?[x.J,x.name,1]:[x.J,x.name]):((await webNet()).x||{})[k];
    if(!Array.isArray(packed)||packed.length<5)throw'无数据';const old=H.x[k];
    if(!old||old.v!==HOL_PV||JSON.stringify(old.list)!==JSON.stringify(packed)){const same=old&&old.v===HOL_PV;H.x[k]={v:HOL_PV,at:Date.now(),list:packed};return same?c.n+'假期日期':null}
    old.at=Date.now()}catch(e){}return null}
let ctrySyncBusy=false;
async function syncCountries(){if(ctrySyncBusy||holBusy)return;const H=DB.hol||(DB.hol={cn:{},ae:null,at:0});const need=SEL().filter(sl=>CTRY[sl.k].g&&!(H.x&&H.x[sl.k]&&H.x[sl.k].v===HOL_PV&&Date.now()-H.x[sl.k].at<6*3600e3));if(!need.length)return;
  ctrySyncBusy=true;let ch=false;for(const sl of need){await syncOne(H,sl.k);ch=true}ctrySyncBusy=false;
  if(ch){applyXNet(H.x);save();Object.keys(yearStatsCache).forEach(k=>delete yearStatsCache[k]);refreshAll()}}
async function syncHolidays(manual){if(holBusy)return;holBusy=true;const H=DB.hol||{cn:{},ae:null,at:0};H.cn=H.cn||{};const news=[];
  const y0=new Date().getFullYear();
  const yrs=[y0-1,y0,y0+1,y0+2];if(!H.hist){for(let y=2007;y<y0-1;y++)yrs.push(y)}
  for(const y of yrs){try{const j=await firstOk(CN_SRC(y),t=>JSON.parse(t));const days=(j.days||[]).map(d=>({date:d.date,name:d.name,isOffDay:!!d.isOffDay}));
      if(days.length&&JSON.stringify(days)!==JSON.stringify(H.cn[y])){const builtin=y>=2023&&y<=2027;if(H.cn[y]||!builtin)news.push(`${y} 年中国放假安排`);H.cn[y]=days}}catch(e){}}
  try{const ae=NATIVE?await firstOk([AE_ICS],parseAeIcs):(await webNet()).ae;if(!Array.isArray(ae)||ae.length<5)throw'无数据';const key=x=>JSON.stringify(x);if(key(ae)!==key(H.ae)){if(H.ae)news.push('阿联酋假期日期');H.ae=ae}}catch(e){}
  for(const sl of SEL()){const r=await syncOne(H,sl.k);if(r)news.push(r)}
  if(Object.keys(H.cn).some(y=>+y<2015))H.hist=1;H.at=Date.now();DB.hol=H;holBusy=false;
  Object.keys(H.cn).sort().forEach(y=>applyCnNet(y,H.cn[y]));applyAeNet(H.ae);applyXNet(H.x);
  save();Object.keys(yearStatsCache).forEach(k=>delete yearStatsCache[k]);refreshAll();if(news.length)toast('已同步最新官方公告：'+news.join('、'));else if(manual)toast('节假日数据已是最新')}

/* ---------- 天气（Open-Meteo，免费免密钥；App 内由系统网络栈代取） ---------- */
let nfId=0;const nfP={};window.__nf=(id,ok,txt)=>{const p=nfP[id];if(!p)return;delete nfP[id];ok?p.res(txt):p.rej(txt)};
function http(url){if(NATIVE)return new Promise((res,rej)=>{const id=++nfId;nfP[id]={res,rej};native({type:'fetch',id,url});setTimeout(()=>{if(nfP[id]){delete nfP[id];rej('请求超时')}},15000)});
  return fetch(url).then(r=>r.ok?r.text():Promise.reject('HTTP '+r.status))}
const getJSON=u=>http(u).then(t=>JSON.parse(t));
const WMO={0:'晴',1:'晴间多云',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'毛毛雨',53:'毛毛雨',55:'毛毛雨',56:'冻毛毛雨',57:'冻毛毛雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'冻雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨',81:'阵雨',82:'强阵雨',85:'阵雪',86:'强阵雪',95:'雷阵雨',96:'雷阵雨伴冰雹',99:'雷阵雨伴冰雹'};
const wxKind=c=>c===0?'sun':c<=2?'partly':c===3?'cloud':c<=48?'fog':((c>=71&&c<=77)||c===85||c===86)?'snow':c>=95?'thunder':'rain';
function wxIcon(code,day,size){const k=wxKind(code),cl='<path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15z"/>';let p;
  if(k==='sun'||(k==='partly'&&day===0))p=day===0?'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>';
  else if(k==='partly')p='<path d="M8 3v1.3M3 8h1.3M4.5 4.5l.9.9M11.5 4.5l-.9.9"/><path d="M5.2 10.6A3.2 3.2 0 0 1 10.9 6.9"/><path d="M8.5 19.5h9a3.6 3.6 0 0 0 .4-7.17A5 5 0 0 0 8.4 11.5a4 4 0 0 0 .1 8z"/>';
  else if(k==='cloud')p='<path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z"/>';
  else if(k==='fog')p='<path d="M4 8h16M3 12h18M5 16h14M8 20h8"/>';
  else if(k==='rain')p=cl+'<path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>';
  else if(k==='snow')p=cl+'<path d="M9 19h.01M12 21h.01M15 19h.01" stroke-width="2.8"/>';
  else p=cl+'<path d="M12.5 16l-2 3h3l-2 3"/>';
  return`<svg class="wxi" viewBox="0 0 24 24" style="width:${size}px;height:${size}px">${p}</svg>`}
const WX={};
function cities(){if(!Array.isArray(S.cities)||!S.cities.length)S.cities=[{n:'迪拜',lat:25.2048,lon:55.2708},{n:'北京',lat:39.9042,lon:116.4074}];if(!(S.wxCity>=0&&S.wxCity<S.cities.length))S.wxCity=0;return S.cities}
const wxKey=c=>(+c.lat).toFixed(3)+','+(+c.lon).toFixed(3);
const wxOf=i=>{const c=cities()[i];return c&&WX[wxKey(c)]};
async function loadWx(i,force){const c=cities()[i];if(!c)return;const k=wxKey(c),old=WX[k];if(old&&!force&&!old.err&&Date.now()-old.at<30*60e3)return old;
  const F=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`;
  const A=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&current=us_aqi,pm2_5&timezone=auto`;
  try{const[f,a]=await Promise.all([getJSON(F),getJSON(A).catch(()=>null)]);if(!f.current)throw'数据格式异常';WX[k]={f,a,at:Date.now()}}catch(e){WX[k]={err:String(e),at:Date.now()}}return WX[k]}
async function refreshWx(force){if(!S.wx){$('wxChip').hidden=true;$('wxPop').hidden=true;return}await loadWx(S.wxCity,force);renderChip();if(!$('wxPop').hidden)drawWxPop()}
function renderChip(){const el=$('wxChip'),d=wxOf(S.wxCity),c=cities()[S.wxCity];if(!S.wx||!d){el.hidden=true;return}el.hidden=false;
  if(d.err){el.innerHTML='<span class="wxoff">天气离线</span>';el.title='暂时无法获取天气，点击重试';return}
  const cu=d.f.current;el.innerHTML=`${wxIcon(cu.weather_code,cu.is_day,17)}<span>${esc(c.n)}</span><b>${Math.round(cu.temperature_2m)}°</b>`;
  {const dl=d.f.daily;native({type:'wx',data:{city:c.n,t:Math.round(cu.temperature_2m),text:WMO[cu.weather_code]||'',icon:wxIcon(cu.weather_code,cu.is_day,18),hi:dl?Math.round(dl.temperature_2m_max[0]):null,lo:dl?Math.round(dl.temperature_2m_min[0]):null}})}el.title=`${c.n} · ${WMO[cu.weather_code]||''} · 点击查看详情`}
function windTxt(v,deg){const lv=[1,6,12,20,29,39,50,62,75,89,103,118].filter(t=>v>=t).length;return`${['北','东北','东','东南','南','西南','西','西北'][Math.round((deg||0)/45)%8]}风 ${lv} 级`}
const hm=s=>s?s.slice(11,16):'—';
function indices(d){const cu=d.f.current,dl=d.f.daily,uv=dl.uv_index_max?dl.uv_index_max[0]:null,pp=dl.precipitation_probability_max||[],aq=d.a&&d.a.current,aqi=aq?aq.us_aqi:null,at=cu.apparent_temperature;
  const uvL=uv==null?'—':uv<3?'弱':uv<6?'中等':uv<8?'强':uv<11?'很强':'极强';
  const aqL=aqi==null?'—':aqi<=50?'优':aqi<=100?'良':aqi<=150?'轻度污染':aqi<=200?'中度污染':aqi<=300?'重度污染':'严重污染';
  const dress=at>=28?['短袖','清凉透气']:at>=23?['薄衫','短袖或薄长袖']:at>=18?['长袖','加件薄外套']:at>=12?['外套','夹克或风衣']:at>=5?['大衣','毛衣加大衣']:['羽绒服','注意保暖'];
  const p0=pp[0]||0,sport=(p0>=50||(aqi||0)>150||at>=35||at<=-5)?['不宜','建议室内运动']:((aqi||0)>100||at>=31||p0>=30)?['较适宜','注意时段和补水']:['适宜','适合户外运动'];
  const wash=Math.max(p0,pp[1]||0)>=40?['不宜','两天内可能下雨']:['适宜','两天内降水概率低'];
  return[['紫外线',uvL,uv!=null?`指数 ${Math.round(uv)}${uv>=6?' · 注意防晒':''}`:''],['空气质量',aqL,aqi!=null?`AQI ${Math.round(aqi)}${aq.pm2_5!=null?' · PM2.5 '+Math.round(aq.pm2_5):''}`:'暂无数据'],
    ['穿衣',dress[0],dress[1]],['运动',sport[0],sport[1]],['洗车',wash[0],wash[1]],['日出 / 日落',`${hm(dl.sunrise[0])} / ${hm(dl.sunset[0])}`,'当地时间']]}
let geoRes=[];
function drawWxPop(){const cs=cities(),d=wxOf(S.wxCity);
  let h=`<div class="wx-cities">${cs.map((x,i)=>`<button class="wxc ${i===S.wxCity?'on':''}" data-ci="${i}">${esc(x.n)}${cs.length>1?`<i data-rm="${i}" title="移除">×</i>`:''}</button>`).join('')}${cs.length<6?'<button class="wxc add" id="wxAdd" title="添加城市">+</button>':''}</div>
  <div class="wx-search" id="wxSearch" hidden><input class="inp" id="wxQ" placeholder="搜索城市，如 上海、阿布扎比、London" autocomplete="off"><div id="wxR"></div></div>`;
  if(!d)h+='<div class="empty">正在获取天气…</div>';
  else if(d.err)h+=`<div class="empty">暂时无法获取天气（${esc(d.err)}）。请确认已联网，然后 <button class="lnk" id="wxRefresh" style="display:inline-flex">重试</button></div>`;
  else{const f=d.f,cu=f.current,dl=f.daily;
    h+=`<div class="wx-now">${wxIcon(cu.weather_code,cu.is_day,46)}<div><div class="wx-t">${Math.round(cu.temperature_2m)}°<small>${WMO[cu.weather_code]||''}</small></div><div class="p-small">今天 ${Math.round(dl.temperature_2m_min[0])}° ~ ${Math.round(dl.temperature_2m_max[0])}° · 体感 ${Math.round(cu.apparent_temperature)}° · 湿度 ${cu.relative_humidity_2m}% · ${windTxt(cu.wind_speed_10m,cu.wind_direction_10m)}</div></div></div>`;
    const ht=f.hourly.time;let i0=ht.findIndex(t=>t>=cu.time.slice(0,13));if(i0<0)i0=0;const pr=f.hourly.precipitation_probability||[];
    h+=`<div class="wx-hours">${Array.from({length:8},(_,k)=>i0+k*2).filter(i=>i<ht.length).map((i,k)=>`<div><span>${k===0?'现在':ht[i].slice(11,13)+'时'}</span>${wxIcon(f.hourly.weather_code[i],(ht[i].slice(11,16)>=hm(dl.sunrise[0])&&ht[i].slice(11,16)<hm(dl.sunset[0]))?1:0,18)}<b>${Math.round(f.hourly.temperature_2m[i])}°</b><em>${pr[i]>=20?pr[i]+'%':'&nbsp;'}</em></div>`).join('')}</div>`;
    h+=`<div class="wx-idx">${indices(d).map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b><small title="${esc(x[2])}">${x[2]||'&nbsp;'}</small></div>`).join('')}</div>`;
    const lo=Math.min(...dl.temperature_2m_min),hi=Math.max(...dl.temperature_2m_max),span=Math.max(1,hi-lo),ppm=dl.precipitation_probability_max||[];
    h+=`<div class="wx-days">${dl.time.map((t,i)=>{const[Y,M,D]=t.split('-').map(Number),a=dl.temperature_2m_min[i],b=dl.temperature_2m_max[i];
      return`<div class="wx-day"><span class="dn">${i===0?'今天':i===1?'明天':wkTxt(jdn(Y,M,D))}<small>${M}/${D}</small></span>${wxIcon(dl.weather_code[i],1,18)}<span class="dd">${WMO[dl.weather_code[i]]||''}${ppm[i]>=30?' · '+ppm[i]+'%':''}</span><span class="dlo">${Math.round(a)}°</span><span class="bar"><i style="left:${(a-lo)/span*100}%;right:${(hi-b)/span*100}%"></i></span><span class="dhi">${Math.round(b)}°</span></div>`}).join('')}</div>`;
    h+=`<div class="wx-foot"><span>数据：Open-Meteo · 更新于 ${new Date(d.at).toTimeString().slice(0,5)}</span><button class="lnk" id="wxRefresh">刷新</button></div>`}
  $('wxPop').innerHTML=h}
$('wxChip').onclick=e=>{e.stopPropagation();if(!$('wxPop').hidden){closePops();return}closePops();const d=wxOf(S.wxCity);drawWxPop();placePop($('wxPop'),$('wxChip'),true);if(!d||d.err)refreshWx(true)};
let geoT=0;
$('wxPop').addEventListener('click',e=>{e.stopPropagation();
  const rm=e.target.closest('[data-rm]');if(rm){const i=+rm.dataset.rm;S.cities.splice(i,1);if(S.wxCity>=S.cities.length)S.wxCity=0;else if(S.wxCity>i)S.wxCity--;save();drawWxPop();refreshWx();return}
  const ci=e.target.closest('[data-ci]');if(ci){S.wxCity=+ci.dataset.ci;save();drawWxPop();refreshWx();return}
  if(e.target.closest('#wxAdd')){const b=$('wxSearch');b.hidden=!b.hidden;if(!b.hidden)$('wxQ').focus();return}
  if(e.target.closest('#wxRefresh')){refreshWx(true);toast('正在刷新天气');return}
  const g=e.target.closest('[data-geo]');if(g){const r=geoRes[+g.dataset.geo];S.cities.push({n:r.name,lat:r.latitude,lon:r.longitude});S.wxCity=S.cities.length-1;save();drawWxPop();refreshWx();return}});
$('wxPop').addEventListener('input',e=>{if(e.target.id!=='wxQ')return;clearTimeout(geoT);const q=e.target.value.trim();if(!q){$('wxR').innerHTML='';return}
  geoT=setTimeout(async()=>{try{const j=await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh&format=json`);geoRes=j.results||[];
    $('wxR').innerHTML=geoRes.length?geoRes.map((r,i)=>`<button class="geo" data-geo="${i}"><span>${esc(r.name)}</span><small>${esc([r.admin1,r.country].filter(Boolean).join(' · '))}</small></button>`).join(''):'<div class="empty">没有找到这个城市</div>'}catch(err){$('wxR').innerHTML='<div class="empty">搜索失败，请检查网络</div>'}},300)});
$('wxPop').addEventListener('keydown',e=>{if(e.key==='Escape')closePops()});

window.__setSetting=(k,v)=>{if(k==='countries'&&v&&typeof v==='object')Object.assign(S,{ca:v.ca,cb:v.cb,cn:!!v.cn,ae:!!v.ae});else S[k]=v;save();
  if(k==='theme')applyTheme();
  if(k==='cn'||k==='ae'){layBtns();refreshAll()}
  if(k==='ca'||k==='cb'||k==='countries')countriesChanged();
  if(k==='weekNum')repaintAll();
  if(k==='wx'||k==='wxCity')refreshWx();
  if(k==='holRemind')scheduleReminders();
  if(k==='mbFmt')pushStatus();
  if(!$('themePop').hidden)drawThemePop()};
window.__goDay=J=>{if(S.view!=='month')setView('month',true);setTimeout(()=>goDay(+J),60)};
window.setMbFmt=f=>{S.mbFmt=f;save();if(!$('themePop').hidden)drawThemePop()};
window.openSettings=(custom=true)=>{closePops();drawThemePop();placePop($('themePop'),$('btnTheme'),true);const c=$('mbCustom');if(c&&custom){$('mbSel').value='__c';c.hidden=false;$('mbTok').hidden=false;c.focus()}};
/* ---------- 启动 ---------- */
applyTheme();
layBtns();
rowH=Math.round(Math.max(72,(sc.clientHeight||720)/6));sp.style.height=(TOTAL*rowH)+'px';sc.scrollTop=monthTop(G0.y,G0.m);
if(!['month','year','list'].includes(S.view))S.view='month';
setView(S.view,true);
if(S.view==='month')paint();
renderPanel();tick();setInterval(tick,15000);
native({type:'menubar',on:S.menubar});pushStatus();sendPushCfg();scheduleReminders();cities();refreshWx();syncHolidays();setInterval(()=>syncHolidays(),3*3600e3);addEventListener('focus',()=>{if(!DB.hol||Date.now()-DB.hol.at>3600e3)syncHolidays()});setInterval(()=>refreshWx(false),10*60e3);
