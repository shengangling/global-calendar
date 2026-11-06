/* ================= 天文与历法核心 ================= */
const D2R=Math.PI/180;
const mod=(a,n)=>((a%n)+n)%n;
function jdn(y,m,d){const a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045}
function ymd(J){const a=J+32044,b=Math.floor((4*a+3)/146097),c=a-Math.floor(146097*b/4),d=Math.floor((4*c+3)/1461),e=c-Math.floor(1461*d/4),m=Math.floor((5*e+2)/153);
  return{y:100*b+d-4800+Math.floor(m/10),m:m+3-12*Math.floor(m/10),d:e-Math.floor((153*m+2)/5)+1}}
const wday=J=>mod(J+1,7); // 0=周日
function deltaT(y){let t;
  if(y<1920){t=y-1900;return -2.79+1.494119*t-0.0598939*t*t+0.0061966*t**3-0.000197*t**4}
  if(y<1941){t=y-1920;return 21.2+0.84493*t-0.0761*t*t+0.0020936*t**3}
  if(y<1961){t=y-1950;return 29.07+0.407*t-t*t/233+t**3/2547}
  if(y<1986){t=y-1975;return 45.45+1.067*t-t*t/260-t**3/718}
  if(y<2005){t=y-2000;return 63.86+0.3345*t-0.060374*t*t+0.0017275*t**3+0.000651814*t**4+0.00002373599*t**5}
  if(y<2050){t=y-2000;return 62.92+0.32217*t+0.005589*t*t}
  return -20+32*((y-1820)/100)**2-0.5628*(2150-y)}
const ttToBJDay=jde=>{const y=2000+(jde-2451545)/365.25;return Math.floor(jde-deltaT(y)/86400+8/24+0.5)};
const bjDayStartTT=J=>{const ut=J-0.5-8/24;return ut+deltaT(2000+(ut-2451545)/365.25)/86400};
function sunLon(jde){const T=(jde-2451545)/36525;
  const L0=280.46646+36000.76983*T+0.0003032*T*T, M=(357.52911+35999.05029*T-0.0001537*T*T)*D2R;
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);
  const Om=(125.04-1934.136*T)*D2R;return mod(L0+C-0.00569-0.00478*Math.sin(Om),360)}
function solveLon(target,guess){let jd=guess;for(let i=0;i<10;i++){const df=mod(target-sunLon(jd)+180,360)-180;jd+=df*365.2422/360;if(Math.abs(df)<1e-6)break}return jd}
function newMoon(k){const T=k/1236.85,T2=T*T,T3=T2*T,T4=T3*T;
  let jde=2451550.09766+29.530588861*k+0.00015437*T2-0.00000015*T3+0.00000000073*T4;
  const E=1-0.002516*T-0.0000074*T2;
  const M=(2.5534+29.1053567*k-0.0000014*T2-0.00000011*T3)*D2R;
  const Mp=(201.5643+385.81693528*k+0.0107582*T2+0.00001238*T3-0.000000058*T4)*D2R;
  const F=(160.7108+390.67050284*k-0.0016118*T2-0.00000227*T3+0.000000011*T4)*D2R;
  const Om=(124.7746-1.56375588*k+0.0020672*T2+0.00000215*T3)*D2R;const s=Math.sin;
  jde+=-0.4072*s(Mp)+0.17241*E*s(M)+0.01608*s(2*Mp)+0.01039*s(2*F)+0.00739*E*s(Mp-M)-0.00514*E*s(Mp+M)+0.00208*E*E*s(2*M)
    -0.00111*s(Mp-2*F)-0.00057*s(Mp+2*F)+0.00056*E*s(2*Mp+M)-0.00042*s(3*Mp)+0.00042*E*s(M+2*F)+0.00038*E*s(M-2*F)
    -0.00024*E*s(2*Mp-M)-0.00017*s(Om)-0.00007*s(Mp+2*M)+0.00004*s(2*Mp-2*F)+0.00004*s(3*M)+0.00003*s(Mp+M-2*F)
    +0.00003*s(2*Mp+2*F)-0.00003*s(Mp+M+2*F)+0.00003*s(Mp-M+2*F)-0.00002*s(Mp-M-2*F)-0.00002*s(3*Mp+M)+0.00002*s(4*Mp);
  const A=[[299.77,0.107408,-0.009173],[251.88,0.016321],[251.83,26.651886],[349.42,36.412478],[84.66,18.206239],[141.74,53.303771],[207.14,2.453732],[154.84,7.30686],[34.52,27.261239],[207.19,0.121824],[291.34,1.844379],[161.72,24.198154],[239.56,25.513099],[331.55,3.592518]];
  const W=[325,165,164,126,110,62,60,56,47,42,40,37,35,23];
  A.forEach((a,i)=>{jde+=W[i]*1e-6*s((a[0]+a[1]*k+(a[2]||0)*T2)*D2R)});return jde}
const TERMS=['春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒','立春','雨水','惊蛰'];
const termCache={};
function termsOfYear(Y){if(termCache[Y])return termCache[Y];const map={};const base=jdn(Y,1,6)-0.5;
  for(let k=0;k<24;k++){const lon=(285+15*k)%360;const J=ttToBJDay(solveLon(lon,base+k*15.2184));map[J]=TERMS[lon/15]}
  return termCache[Y]=map}
const termOf=J=>termsOfYear(ymd(J).y)[J]||null;
function nmOnOrBefore(J){let k=Math.floor((J-2451550.1)/29.530588861)+1;while(ttToBJDay(newMoon(k))>J)k--;return k}
const seqCache={};
function lunarSeq(Y){if(seqCache[Y])return seqCache[Y];
  const ws1=ttToBJDay(solveLon(270,jdn(Y-1,12,21)-0.5)),ws2=ttToBJDay(solveLon(270,jdn(Y,12,21)-0.5));
  const k1=nmOnOrBefore(ws1),k2=nmOnOrBefore(ws2),st=[];for(let k=k1;k<=k2;k++)st.push(ttToBJDay(newMoon(k)));
  const n=st.length-1,leapYear=n===13,zq=i=>Math.floor(sunLon(bjDayStartTT(st[i+1]))/30)!==Math.floor(sunLon(bjDayStartTT(st[i]))/30);
  const out=[];let num=11,ly=Y-1,leapDone=false;
  for(let i=0;i<n;i++){let leap=false;
    if(i>0){if(leapYear&&!leapDone&&!zq(i)){leap=true;leapDone=true}else{num=num%12+1;if(num===1)ly=Y}}
    out.push({s:st[i],e:st[i+1],num,leap,ly})}
  return seqCache[Y]=out}
function lunar(J){const y=ymd(J).y;for(const Y of[y,y+1]){for(const mo of lunarSeq(Y))if(J>=mo.s&&J<mo.e)return{y:mo.ly,m:mo.num,leap:mo.leap,d:J-mo.s+1,len:mo.e-mo.s}}return null}
const STEM='甲乙丙丁戊己庚辛壬癸',BRANCH='子丑寅卯辰巳午未申酉戌亥',ZOD='鼠牛虎兔龙蛇马羊猴鸡狗猪';
const LM=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const lmName=L=>(L.leap?'闰':'')+LM[L.m-1]+'月';
function ldName(d){if(d===10)return'初十';if(d===20)return'二十';if(d===30)return'三十';return'初十廿三'[Math.floor(d/10)]+'一二三四五六七八九'[(d-1)%10]}
const gzYear=y=>{const i=mod(y-4,60);return STEM[i%10]+BRANCH[i%12]};
const gzDay=J=>{const i=mod(J+49,60);return STEM[i%10]+BRANCH[i%12]};

/* 伊斯兰历（乌姆库拉历） */
let HF=null;try{const f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});if(/islamic/.test(f.resolvedOptions().calendar))HF=f}catch(e){}
const hCache={};
function hijri(J){if(!HF)return null;if(J in hCache)return hCache[J];const g=ymd(J);const p={};
  HF.formatToParts(new Date(Date.UTC(g.y,g.m-1,g.d))).forEach(x=>{if(x.type!=='literal')p[x.type]=parseInt(x.value,10)});
  return hCache[J]=(p.year&&p.month&&p.day)?{y:p.year,m:p.month,d:p.day}:null}
const HM_EN=['Muharram','Safar','Rabiʻ I','Rabiʻ II','Jumada I','Jumada II','Rajab','Shaʻban','Ramadan','Shawwal','Dhu al-Qaʻdah','Dhu al-Hijjah'];
const HM_AB=['Muh','Saf','Rab I','Rab II','Jum I','Jum II','Raj','Shab','Ram','Shw','Qaʻd','Hij'];
const HM_CN=['穆哈兰姆月','色法尔月','赖比尔·敖外鲁月','赖比尔·阿色尼月','主马达·敖外鲁月','主马达·阿色尼月','赖哲卜月','舍尔邦月','莱麦丹月（斋月）','闪瓦鲁月','都尔喀尔德月','都尔黑哲月'];

/* ================= 中国节假日 ================= */
// 国务院办公厅公布的放假调休安排：[开始, 结束, 名称]，work = 调休上班日
const CN_OFFICIAL={
  2023:{off:[['2022-12-31','2023-01-02','元旦'],['2023-01-21','2023-01-27','春节'],['2023-04-05','2023-04-05','清明节'],['2023-04-29','2023-05-03','劳动节'],['2023-06-22','2023-06-24','端午节'],['2023-09-29','2023-10-06','中秋·国庆']],work:['2023-01-28','2023-01-29','2023-04-23','2023-05-06','2023-06-25','2023-10-07','2023-10-08']},
  2024:{off:[['2024-01-01','2024-01-01','元旦'],['2024-02-10','2024-02-17','春节'],['2024-04-04','2024-04-06','清明节'],['2024-05-01','2024-05-05','劳动节'],['2024-06-08','2024-06-10','端午节'],['2024-09-15','2024-09-17','中秋节'],['2024-10-01','2024-10-07','国庆节']],work:['2024-02-04','2024-02-18','2024-04-07','2024-04-28','2024-05-11','2024-09-14','2024-09-29','2024-10-12']},
  2025:{off:[['2025-01-01','2025-01-01','元旦'],['2025-01-28','2025-02-04','春节'],['2025-04-04','2025-04-06','清明节'],['2025-05-01','2025-05-05','劳动节'],['2025-05-31','2025-06-02','端午节'],['2025-10-01','2025-10-08','国庆·中秋']],work:['2025-01-26','2025-02-08','2025-04-27','2025-09-28','2025-10-11']},
  2026:{off:[['2026-01-01','2026-01-03','元旦'],['2026-02-15','2026-02-23','春节'],['2026-04-04','2026-04-06','清明节'],['2026-05-01','2026-05-05','劳动节'],['2026-06-19','2026-06-21','端午节'],['2026-09-25','2026-09-27','中秋节'],['2026-10-01','2026-10-07','国庆节']],work:['2026-01-04','2026-02-14','2026-02-28','2026-05-09','2026-09-20','2026-10-10']},
  // 国办发明电〔2026〕10号，2026-11-05 发布
  2027:{off:[['2027-01-01','2027-01-03','元旦'],['2027-02-05','2027-02-13','春节'],['2027-04-03','2027-04-05','清明节'],['2027-05-01','2027-05-05','劳动节'],['2027-06-09','2027-06-09','端午节'],['2027-09-15','2027-09-15','中秋节'],['2027-10-01','2027-10-07','国庆节']],work:['2027-01-31','2027-02-14','2027-05-08','2027-09-26','2027-10-09']}
};
const parseD=s=>{const[a,b,c]=s.split('-').map(Number);return jdn(a,b,c)};
const CN_OFF={},CN_WORK={};
for(const y in CN_OFFICIAL){const o=CN_OFFICIAL[y];o.off.forEach(([a,b,n])=>{for(let J=parseD(a);J<=parseD(b);J++)CN_OFF[J]=n});o.work.forEach(s=>CN_WORK[parseD(s)]=1)}
/* 联网同步的官方数据（覆盖内置），见 ui.js syncHolidays */
const CN_NET={},AE_NET={},AE_NET_Y={};
function clearInfoCache(){for(const k in infoCache)delete infoCache[k]}
function applyCnNet(y,days){y=+y;if(!Array.isArray(days)||!days.length)return;
  for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++){delete CN_OFF[J];delete CN_WORK[J]}
  for(const d of days){const J=parseD(d.date),n=String(d.name||'').replace(/、/g,'·');if(d.isOffDay){CN_OFF[J]=n;delete CN_WORK[J]}else{CN_WORK[J]=1;delete CN_OFF[J]}}
  if(!CN_OFFICIAL[y])CN_OFFICIAL[y]={off:[],work:[]};CN_NET[y]=1;clearInfoCache()}
function applyAeNet(list){if(!Array.isArray(list)||!list.length)return;
  for(const k in AE_NET)delete AE_NET[k];for(const k in AE_NET_Y)delete AE_NET_Y[k];
  for(const x of list){const J=x.J;if(!AE_NET[J]||x.main)AE_NET[J]={name:x.name,main:!!x.main||(AE_NET[J]&&AE_NET[J].main),tent:!!x.tent};AE_NET_Y[ymd(J).y]=1}
  clearInfoCache()}
/* 未公布年份：按 2025 年起国务院放假调休的一贯排法推算（含补班） */
const CN_EST={};
function cnEstimate(y){if(CN_EST[y])return CN_EST[y];const off={},work={},blocks=[];
  const findL=(m,d,a,b)=>{for(let J=a;J<=b;J++){const L=lunar(J);if(L&&!L.leap&&L.m===m&&L.d===d)return J}return null};
  const isWE=J=>{const w=wday(J);return w===0||w===6};
  const add=(a,b,name,stat)=>blocks.push({a,b,name,stat});
  // 春节：除夕起，含 6 个工作日；除夕逢周一则从周日放起；结束后紧跟周六一并放
  const cj=findL(1,1,jdn(y,1,19),jdn(y,2,22));
  if(cj){const ex=cj-1;let a=wday(ex)===1?ex-1:ex,b=a-1,n=0;while(n<6&&b-a+1<9){b++;if(!isWE(b))n++}if(wday(b+1)===6&&b-a+1<9)b++;add(a,b,'春节',4)}
  // 单日节：周三只放 1 天；周二/周一 往前凑周末；周四/周五/周六 往后凑；周日 前后各一天
  const one=(D,name)=>{const w=wday(D);let a=D,b=D;
    if(w===1||w===2){a=D-2}else if(w===4||w===5||w===6){b=D+2}else if(w===0){a=D-1;b=D+1}add(a,b,name,1)};
  // 国庆（+中秋合并）
  const mid=findL(8,15,jdn(y,9,7),jdn(y,10,8));const o1=jdn(y,10,1);
  if(mid&&mid>=o1-3&&mid<o1)add(mid,mid+7,'中秋·国庆',4);
  else if(mid&&mid>=o1&&mid<=o1+7)add(o1,o1+7,'国庆·中秋',4);
  else{add(o1,o1+6,'国庆节',3);if(mid)one(mid,'中秋节')}
  one(jdn(y,1,1),'元旦');
  for(let J=jdn(y,4,3);J<=jdn(y,4,6);J++)if(termOf(J)==='清明'){one(J,'清明节');break}
  const dw=findL(5,5,jdn(y,5,25),jdn(y,6,26));if(dw)one(dw,'端午节');
  // 劳动节：5 天，含 5/1、5/2，工作日最少，同等时尽量从 5/1 起
  {let best=null;for(let a=jdn(y,4,28);a<=jdn(y,5,1);a++){let n=0;for(let J=a;J<a+5;J++)if(!isWE(J))n++;const sc=n*10+(jdn(y,5,1)-a);if(!best||sc<best.sc)best={a,sc}}add(best.a,best.a+4,'劳动节',2)}
  for(const k of blocks)for(let J=k.a;J<=k.b;J++)off[J]=k.name;
  // 补班：需补天数 = 放假天数 − 其中周末 − 法定天数；取前后最近的周末（不占其他假期）
  for(const k of blocks){let need=(k.b-k.a+1)-(()=>{let n=0;for(let J=k.a;J<=k.b;J++)if(isWE(J))n++;return n})()-k.stat;if(need<=0)continue;
    const before=[],after=[];for(let d=1;d<=21;d++){const x=k.a-d,z=k.b+d;if(isWE(x)&&!off[x]&&!work[x])before.push(x);if(isWE(z)&&!off[z]&&!work[z])after.push(z)}
    const pick=[];if(need===1){const c=[before[0],after[0]].filter(v=>v!=null).sort((p,q)=>Math.min(Math.abs(p-k.a),Math.abs(p-k.b))-Math.min(Math.abs(q-k.a),Math.abs(q-k.b))||q-p);pick.push(c[0])}
    else{let i=0,j=0;while(pick.length<need){if(pick.length%2===0&&before[i]!=null)pick.push(before[i++]);else if(after[j]!=null)pick.push(after[j++]);else if(before[i]!=null)pick.push(before[i++]);else break}}
    pick.forEach(J=>{if(J!=null)work[J]=1})}
  return CN_EST[y]={off,work}}
function cnEstAt(J){const y=ymd(J).y;for(const Y of[y,y+1,y-1]){if(CN_OFFICIAL[Y]||Y<2025||Y>2100)continue;const e=cnEstimate(Y);if(e.off[J])return{off:true,name:e.off[J],src:'rule'};if(e.work[J])return{work:true,src:'rule'}}return null}
const CN_SOLAR={'1-1':'元旦','2-14':'情人节','3-8':'妇女节','3-12':'植树节','5-1':'劳动节','5-4':'青年节','6-1':'儿童节','7-1':'建党节','8-1':'建军节','9-10':'教师节','10-1':'国庆节','12-24':'平安夜','12-25':'圣诞节'};
const CN_LUNAR={'1-1':'春节','1-15':'元宵节','2-2':'龙抬头','5-5':'端午节','7-7':'七夕','7-15':'中元节','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节','12-23':'小年'};
const MAJOR=new Set(['春节','除夕','元宵节','端午节','中秋节','七夕','重阳节','元旦','国庆节','劳动节','清明节','腊八节','小年','中元节','龙抬头']);
const infoCache={};
function cnInfo(J){const g=ymd(J),L=lunar(J),term=termOf(J),w=wday(J),f=[];
  if(CN_SOLAR[g.m+'-'+g.d])f.push(CN_SOLAR[g.m+'-'+g.d]);
  if(L&&!L.leap){const k=L.m+'-'+L.d;if(CN_LUNAR[k])f.unshift(CN_LUNAR[k]);if(L.m===12&&L.d===L.len)f.unshift('除夕')}
  if(term==='清明')f.unshift('清明节');
  if(w===0&&g.m===5&&g.d>7&&g.d<=14)f.push('母亲节');
  if(w===0&&g.m===6&&g.d>14&&g.d<=21)f.push('父亲节');
  let st;
  if(CN_OFF[J])st={off:true,name:CN_OFF[J],src:'official'};
  else if(CN_WORK[J])st={work:true,src:'official'};
  else{
    let name=null;const es=g.y>=2024?cnEstAt(J):null;
    if(es)st=es;
    else if(!CN_OFFICIAL[g.y]&&g.y>=1950&&g.y<2025){
      if(g.m===1&&g.d===1)name='元旦';
      else if(L&&!L.leap&&L.m===1&&L.d<=3)name='春节';
      else if(L&&!L.leap&&L.m===12&&L.d===L.len&&g.y>=2025)name='春节';
      else if(term==='清明')name='清明节';
      else if(g.m===5&&(g.d===1||(g.d===2&&g.y>=2025)))name='劳动节';
      else if(L&&!L.leap&&L.m===5&&L.d===5)name='端午节';
      else if(L&&!L.leap&&L.m===8&&L.d===15)name='中秋节';
      else if(g.m===10&&g.d<=3)name='国庆节';
    }
    if(!st)st=name?{off:true,name,src:'rule'}:(w===0||w===6)?{weekend:true}:{};
  }
  return{g,L,term,f,st,w}}
function aeInfo(J){const g=ymd(J),h=hijri(J),hn=hijri(J+1),w=wday(J),f=[];let hol=null;
  if(g.m===1&&g.d===1){f.push('新年');hol='新年'}
  if(g.m===11&&g.d===3)f.push('国旗日');
  if(g.m===11&&g.d===30)f.push('纪念日');
  if(g.m===12&&g.d===2){f.push('国庆日');hol='国庆日'}
  if(g.m===12&&g.d===3)hol='国庆日';
  if(h){
    if(h.m===9&&h.d===1)f.push('斋月开始');
    if(h.m===7&&h.d===27)f.push('登霄节');
    if(h.m===10&&h.d===1){f.push('开斋节');hol='开斋节'}
    else if(h.m===10&&h.d<=3)hol='开斋节';
    else if(hn&&hn.m===10&&hn.d===1)hol='开斋节';
    if(h.m===12&&h.d===9){f.push('阿拉法特日');hol='阿拉法特日'}
    if(h.m===12&&h.d===10){f.push('宰牲节');hol='宰牲节'}
    else if(h.m===12&&(h.d===11||h.d===12))hol='宰牲节';
    if(h.m===1&&h.d===1){f.push('伊斯兰新年');hol='伊斯兰新年'}
    if(h.m===3&&h.d===12){f.push('圣纪节');hol='圣纪节'}
  }
  let src='rule';
  if(AE_NET_Y[g.y]){const RULE=['开斋节','阿拉法特日','宰牲节','伊斯兰新年','圣纪节','新年','国庆日'];
    for(let i=f.length-1;i>=0;i--)if(RULE.includes(f[i]))f.splice(i,1);
    const n=AE_NET[J];hol=n?n.name:null;src=n&&n.tent?'tent':'net';if(n&&n.main)f.unshift(n.name)}
  const weekend=g.y>=2022?(w===6||w===0):(w===5||w===6);
  return{h,f,hol,weekend,w,src}}
function info(J){return infoCache[J]||(infoCache[J]={cn:cnInfo(J),ae:aeInfo(J)})}

