/* ================= 多国家节假日 =================
 * 中国、阿联酋沿用 core.js 的专用逻辑；其他国家：
 *   内置 Google 公共假期日历快照（holdata.js，2021–2031）＋联网同步最新数据，
 *   快照覆盖范围以外的年份按历年规律推算（固定日期 / 第几个星期几 / 复活节 / 农历 / 伊斯兰历 / 节气）。
 */
// we = 周末（0=周日 … 6=周六）；g = Google 日历 id；reg = 只取该地区的假期；isl = 显示伊斯兰历
const COUNTRIES=[
  {k:'cn',n:'中国',we:[0,6],grp:'亚洲'},
  {k:'ae',n:'阿联酋',we:[0,6],isl:1,grp:'中东'},
  {k:'hk',n:'中国香港',g:'en.hong_kong',we:[0,6],grp:'亚洲'},
  {k:'mo',n:'中国澳门',g:'en.mo',we:[0,6],grp:'亚洲'},
  {k:'tw',n:'中国台湾',g:'en.taiwan',we:[0,6],grp:'亚洲'},
  {k:'jp',n:'日本',g:'en.japanese',we:[0,6],grp:'亚洲'},
  {k:'kr',n:'韩国',g:'en.south_korea',we:[0,6],grp:'亚洲'},
  {k:'sg',n:'新加坡',g:'en.singapore',we:[0,6],grp:'亚洲'},
  {k:'my',n:'马来西亚',g:'en.malaysia',reg:'Kuala Lumpur',rn:'按吉隆坡',we:[0,6],isl:1,grp:'亚洲'},
  {k:'th',n:'泰国',g:'en.th',we:[0,6],grp:'亚洲'},
  {k:'id',n:'印度尼西亚',g:'en.indonesian',we:[0,6],isl:1,grp:'亚洲'},
  {k:'vn',n:'越南',g:'en.vietnamese',we:[0,6],grp:'亚洲'},
  {k:'ph',n:'菲律宾',g:'en.philippines',we:[0,6],grp:'亚洲'},
  {k:'in',n:'印度',g:'en.indian',we:[0,6],grp:'亚洲'},
  {k:'pk',n:'巴基斯坦',g:'en.pk',we:[0,6],isl:1,grp:'亚洲'},
  {k:'sa',n:'沙特阿拉伯',g:'en.saudiarabian',we:[5,6],weOld:['2013-06-29',[4,5]],isl:1,grp:'中东'},
  {k:'qa',n:'卡塔尔',g:'en.qa',we:[5,6],weOld:['2003-09-01',[4,5]],isl:1,grp:'中东'},
  {k:'kw',n:'科威特',g:'en.kw',we:[5,6],weOld:['2007-09-01',[4,5]],isl:1,grp:'中东'},
  {k:'om',n:'阿曼',g:'en.om',we:[5,6],weOld:['2013-05-01',[4,5]],isl:1,grp:'中东'},
  {k:'bh',n:'巴林',g:'en.bh',we:[5,6],weOld:['2006-09-01',[4,5]],isl:1,grp:'中东'},
  {k:'eg',n:'埃及',g:'en.eg',we:[5,6],isl:1,grp:'中东'},
  {k:'tr',n:'土耳其',g:'en.turkish',we:[0,6],isl:1,grp:'中东'},
  {k:'ru',n:'俄罗斯',g:'en.russian',we:[0,6],grp:'欧洲'},
  {k:'gb',n:'英国',g:'en.uk',reg:'England',rn:'按英格兰',we:[0,6],grp:'欧洲'},
  {k:'de',n:'德国',g:'en.german',we:[0,6],grp:'欧洲'},
  {k:'fr',n:'法国',g:'en.french',we:[0,6],grp:'欧洲'},
  {k:'it',n:'意大利',g:'en.italian',we:[0,6],grp:'欧洲'},
  {k:'es',n:'西班牙',g:'en.spain',we:[0,6],grp:'欧洲'},
  {k:'nl',n:'荷兰',g:'en.dutch',we:[0,6],grp:'欧洲'},
  {k:'us',n:'美国',g:'en.usa',we:[0,6],grp:'美洲'},
  {k:'ca',n:'加拿大',g:'en.canadian',reg:'Ontario',rn:'按联邦假日',we:[0,6],grp:'美洲'},
  {k:'au',n:'澳大利亚',g:'en.australian',reg:'New South Wales',rn:'按新南威尔士州（悉尼）',we:[0,6],sub:['元旦','澳大利亚国庆日','圣诞节','节礼日'],grp:'大洋洲'},
  {k:'nz',n:'新西兰',g:'en.new_zealand',we:[0,6],grp:'大洋洲'}];
const CTRY={};COUNTRIES.forEach(c=>CTRY[c.k]=c);
const ctryName=k=>CTRY[k]?CTRY[k].n:'';
const icsURL=c=>`https://calendar.google.com/calendar/ical/${encodeURIComponent(c.g+'#holiday@group.v.calendar.google.com')}/public/basic.ics`;
const weOf=(k,J)=>{const c=CTRY[k]||{we:[0,6]};if(c.weOld){const[d,w]=c.weOld,[y,m,dd]=d.split('-').map(Number);if(J<jdn(y,m,dd))return w}return c.we};
const weTxt=(k,J)=>{const we=J!=null?weOf(k,J):(CTRY[k]||{we:[0,6]}).we;return we.slice().sort((a,b)=>(a||7)-(b||7)).map(w=>'周'+'日一二三四五六'[w]).join('、')};

/* 英文假期名 → 中文 */
const HN={
"New Year's Day":'元旦',"New Year":'元旦',"International New Year's Day":'元旦',"January 1 Bank":'元旦',"Day after New Year's Day":'元旦次日',"New Year Special":'新年特别假',"Special non-working day after New Year":'新年后特别假',"New Year's Eve":'除夕（公历）',"New Year's Eve Afternoon":'除夕（公历）',
"Lunar New Year":'春节',"Lunar New Year (First Day)":'春节',"Lunar New Year (Second Day)":'春节',"Lunar New Year (Third Day)":'春节',"Lunar New Year's Day":'春节',"Second Day of Lunar New Year":'春节',"Third Day of Lunar New Year":'春节',"Fourth Day of Lunar New Year":'春节',"Chinese New Year":'春节',"Chinese New Year's Day":'春节',"Second Day of Chinese New Year":'春节',"Spring Festival":'春节',"Lunar New Year Eve":'除夕',"Lunar New Year's Eve":'除夕',"Seollal":'春节（설날）',"Tet":'越南春节',"Vietnamese New Year":'越南春节',"Vietnamese New Year's Eve":'越南除夕',
"Tomb Sweeping Day":'清明节',"The Day Following Tomb Sweeping Day":'清明节翌日',"Cheng Ming":'清明节',"Cheng Ming Festival":'清明节',"Dragon Boat Festival":'端午节',"Mid-Autumn Festival":'中秋节',"Day after Mid-Autumn Festival":'中秋节翌日',"Day after the Mid-Autumn-Festival":'中秋节翌日',"Chung Yeung Festival":'重阳节',"Chong Yeung Festival":'重阳节',"Winter Solstice":'冬至',"Chuseok":'中秋（추석）',
"National Day of the People's Republic of China":'国庆日',"PRC National Day":'国庆日',"Day after PRC National Day":'国庆日翌日',"Hong Kong Special Administrative Region Establishment Day":'香港特区成立纪念日',"Macau S.A.R. Establishment Day":'澳门特区成立纪念日',"July 1 Bank":'7月1日银行假',
"Buddha's Birthday":'佛诞',"Day following Buddha's Birthday":'佛诞翌日',"Vesak Day":'卫塞节',"Wesak Day":'卫塞节',"Waisak Day":'卫塞节',"Waisak Day (Buddha's Anniversary)":'卫塞节',"Buddha Purnima":'佛诞节',"Visakha Bucha":'佛诞节（卫塞）',"Makha Bucha":'万佛节',"Asalha Bucha":'三宝佛节',"Buddhist Lent Day":'守夏节',
"Good Friday":'耶稣受难日',"Holy Saturday":'复活节前夕',"Black Saturday":'复活节前夕',"Maundy Thursday":'濯足节',"Easter Sunday":'复活节',"Easter Monday":'复活节星期一',"The Day Following Easter Monday":'复活节星期一翌日',"Ascension Day":'耶稣升天节',"Ascension Day of Jesus Christ":'耶稣升天节',"Whit Sunday":'圣灵降临节',"Whit Monday":'圣灵降临节星期一',"Assumption of Mary":'圣母升天节',"All Saints' Day":'诸圣节',"All Souls' Day":'追思节',"All Soul's Day":'追思节',"Feast of the Immaculate Conception":'圣母无原罪瞻礼',"Immaculate Conception":'圣母无原罪瞻礼',"Epiphany":'主显节',"St. Stephen's Day":'圣斯德望日',"Feast of St Francis of Assisi":'圣方济各节',
"Christmas":'圣诞节',"Christmas Day":'圣诞节',"Christmas Eve":'平安夜',"Boxing Day":'节礼日',"Boxing Day / Christmas":'节礼日',"Second Day of Christmas":'圣诞节第二天',"Day After Christmas Day":'圣诞节翌日',"First Weekday After Christmas Day":'圣诞节后第一个工作日',"Second Weekday After Christmas Day":'圣诞节后第二个工作日',"Special Day after Christmas":'圣诞节后特别假',"Orthodox Christmas Day":'东正教圣诞节',"Coptic Christmas Day":'科普特圣诞节',
"Eid al-Fitr":'开斋节',"Eid el Fitr":'开斋节',"Eid-ul-Fitr":'开斋节',"Idul Fitri":'开斋节',"Hari Raya Puasa":'开斋节',"Ramadan Feast":'开斋节',"Ramadan Feast Day":'开斋节',"Ramzan Id":'开斋节',"Chand Raat":'开斋节前夜',"Ramadan Feast Eve (Private Sector)":'开斋节前夕',"Ramadan Feast Eve (Public Sector)":'开斋节前夕',
"Eid al-Adha":'宰牲节',"Eid al Adha":'宰牲节',"Eid al-Adha (Feast of Sacrifice)":'宰牲节',"Idul Adha":'宰牲节',"Hari Raya Haji":'宰牲节',"Bakrid":'宰牲节',"Sacrifice Feast":'宰牲节',"Sacrifice Feast Eve":'宰牲节前夕',"Arafat Day":'阿拉法特日',"Arafat (Hajj) Day":'阿拉法特日',"Day of Arafah":'阿拉法特日',"Waqfat Arafat Day":'阿拉法特日',
"Islamic New Year":'伊斯兰新年',"Al-Hijra (Islamic New Year)":'伊斯兰新年',"Al-Hijra Holiday (Islamic New Year)":'伊斯兰新年',"Muharram / Islamic New Year":'伊斯兰新年',"Amun Jadid":'伊斯兰新年',"Muharram":'阿舒拉节',"Muharram/Ashura":'阿舒拉节',"Ashura":'阿舒拉节',"Ashoora":'阿舒拉节',
"The Prophet's Birthday":'圣纪节',"The Prophet Muhammad's Birthday":'圣纪节',"Prophet Mohamed's Birthday":'圣纪节',"Mouloud":'圣纪节',"Maulid Nabi Muhammad":'圣纪节',"Maulid un-Nabi":'圣纪节',"Milad un-Nabi":'圣纪节',"Eid Milad un-Nabi":'圣纪节',"Isra and Mi'raj":'登霄节',"Isra and Miraj":'登霄节',"Ascension of the Prophet Muhammad":'登霄节',"Lailatul Isra Wal Mi Raj":'登霄节',
"Labor Day":'劳动节',"Labour Day":'劳动节',"International Labor Day":'劳动节',"May Day":'劳动节',"Labor and Solidarity Day":'劳动节',"Spring and Labor Day":'春天与劳动节',"Labor Thanksgiving Day":'勤劳感谢日',"Early May Bank":'五月初银行假',"Spring Bank":'春季银行假',"Summer Bank":'夏季银行假',"Summer Bank Holiday":'夏季银行假',
"National Day":'国庆日',"Independence Day":'独立日',"Republic Day":'共和国日',"Constitution Day":'宪法日',"Victory Day":'胜利日',"WWII Victory Day":'二战胜利纪念日',"Armistice Day":'一战停战纪念日',"Liberation Day":'解放日',"Unity Day":'民族团结日',"Memorial Day":'阵亡将士纪念日',"Veterans Day":'退伍军人节',"Children's Day":'儿童节',"Teachers' Day":'教师节',"International Women's Day":'国际妇女节',"Election Day":'选举日',"Presidential Election":'总统选举日',"Local Election Day":'地方选举日',"National Assembly Election Day":'国会选举日',"National Elections":'全国选举日',"Parliamentary Elections":'议会选举日',
"Coming of Age Day":'成人节',"National Foundation Day":'建国纪念日',"Emperor's Birthday":'天皇诞辰',"Spring Equinox":'春分日',"Autumn Equinox":'秋分日',"Shōwa Day":'昭和日',"Constitution Memorial Day":'宪法纪念日',"Greenery Day":'绿之日',"Sea Day":'海之日',"Mountain Day":'山之日',"Respect for the Aged Day":'敬老日',"Sports Day":'体育日',"Culture Day":'文化日',"Bridge Public":'国民休息日',
"Independence Movement Day":'三一节',"Hangeul Proclamation Day":'韩文日',
"Peace Memorial Day":'和平纪念日',"Taiwan's Retrocession Day":'台湾光复节',
"Malaysia's National Day":'国庆日',"Malaysia Day":'马来西亚日',"The Yang di-Pertuan Agong's Birthday":'最高元首诞辰',"Elections Victory Public":'大选胜利假期',
"Diwali/Deepavali":'排灯节',"Diwali":'排灯节',"Thaipusam":'大宝森节',"Federal Territory Day":'联邦直辖区日',"Nuzul Al-Quran":'古兰经降世日',"Holi":'洒红节',"Dussehra":'十胜节',"Janmashtami":'黑天节',"Maha Shivaratri":'湿婆节',"Mahavir Jayanti":'大雄诞辰',"Mahatma Gandhi Jayanti":'甘地诞辰',"Guru Nanak Jayanti":'那纳克诞辰',"Rama Navami":'罗摩诞辰',"Ambedkar Jayanti":'安贝德卡尔诞辰',
"Bali's Day of Silence and Hindu New Year (Nyepi)":'安宁日（印度教新年）',"Pancasila Day":'建国五项原则日',"Indonesian Independence Day":'独立日',"Joint Holiday (Cuti Bersama)":'联合休假',
"Chakri Day":'却克里王朝纪念日',"Songkran":'宋干节（泼水节）',"Coronation Day":'加冕纪念日',"Queen Suthida's Birthday":'王后诞辰',"King Vajiralongkorn's Birthday":'国王诞辰',"The Queen Mother's Birthday":'王太后诞辰（母亲节）',"Anniversary of the Death of King Bhumibol":'普密蓬国王忌日',"Chulalongkorn Day":'五世王纪念日',"King Bhumibol's Birthday":'普密蓬国王诞辰（父亲节）',"Royal Ploughing Ceremony Day":'春耕节',"Mahidol Day":'玛希敦纪念日',"Extra":'额外假日',
"Hung Kings Festival":'雄王节',"Liberation Day/Reunification Day":'南方解放日',"Vietnam Culture Day":'越南文化日',
"The Day of Valor":'英勇日',"Maundy Thursday ":'濯足节',"Bonifacio Day":'博尼法西奥日',"Rizal Day":'黎刹日',"Ninoy Aquino Day":'尼诺·阿基诺纪念日',"National Heroes Day":'国家英雄日',"People Power Anniversary":'人民力量革命纪念日',"Founding Anniversary of Iglesia ni Cristo":'基督教会成立纪念日',
"Pakistan Day":'巴基斯坦日',"Kashmir Day":'克什米尔团结日',"Quaid-e-Azam Day":'国父真纳诞辰',"Iqbal Day":'伊克巴尔日',"Youm-i-Takbeer":'核试纪念日',
"Founding Day":'建国日',"Saudi National Day":'国庆日',"World Cup Win Public":'世界杯胜利假日',
"National Sports Day":'国家体育日',"Constitutional Referendum":'宪法公投日',
"National and Liberation Day":'国庆与解放日',"Gulf Cooperation Council (GCC) Summit":'海合会峰会假日',"Public Sector":'公共部门假日',"Public":'公共假日',
"Sultan's Accession Day":'苏丹登基日',"Accession Day of Sultan Haitham bin Tarik":'苏丹登基日',
"Day of Pledge and Loyalty":'效忠日',"Arabian Gulf Cup":'海湾杯假日',
"Revolution Day January 25":'1·25 革命纪念日',"Revolution Day July 23":'7·23 革命纪念日',"June 30 Revolution":'6·30 革命纪念日',"Sinai Liberation Day":'西奈解放日',"Armed Forces Day":'建军节',"Grand Egyptian Museum Opening":'大埃及博物馆开馆假日',
"National Sovereignty and Children's Day":'国家主权和儿童节',"Commemoration of Atatürk, Youth and Sports Day":'青年和体育节',"Democracy and National Unity Day":'民主与民族团结日',
"Defender of the Fatherland Day":'祖国保卫者日',"Russia Day":'俄罗斯日',"Non-Working Day (COVID-19)":'防疫非工作日',
"Bank Holiday for the Coronation of King Charles III":'国王加冕假日',"Queen Elizabeth II's Platinum Jubilee":'女王登基 70 周年',"State Funeral of Queen Elizabeth II":'女王国葬日',"National Day of Mourning for Her Majesty The Queen":'女王国丧日',"Queen Elizabeth II Memorial Day":'女王纪念日',"Queen Elizabeth II's Birthday":'女王诞辰',"King's Birthday":'国王诞辰',
"Day of German Unity":'德国统一日',"Reformation Day":'宗教改革日',"Bastille Day":'国庆日（巴士底日）',"Hispanic Day":'西班牙国庆日',
"Martin Luther King Jr. Day":'马丁·路德·金纪念日',"Presidents' Day":'总统日',"Juneteenth":'六月节（解放日）',"Columbus Day":'哥伦布日',"Thanksgiving Day":'感恩节',"National Day of Mourning for Jimmy Carter":'卡特国丧日',
"Canada Day":'加拿大国庆日',"Civic/Provincial Day":'公民日',"Victoria Day":'维多利亚日',"National Day for Truth and Reconciliation":'真相与和解日',"Remembrance Day":'阵亡将士纪念日',"Family Day":'家庭日',
"Australia Day":'澳大利亚国庆日',"ANZAC Day":'澳新军团日',"Waitangi Day":'怀唐伊日',"Matariki":'马塔里基新年',
"Commemoration Day":'烈士纪念日',"Public Holiday (Death of Sheikh Khalifa bin Zayed Al Nahyan)":'国丧（哈利法总统逝世）'};
const HN_C={
  kr:{"Memorial Day":'显忠日',"Liberation Day":'光复节',"National Foundation Day":'开天节',"Constitution Day":'制宪节',"Labor Day":'劳动节'},
  tw:{"Republic Day":'开国纪念日',"Constitution Day":'行宪纪念日',"National Day":'国庆日（双十节）',"Children's Day":'儿童节'},
  hk:{"Labour Day":'劳动节'},
  in:{"Muharram":'阿舒拉节',"Muharram/Ashura":'阿舒拉节'},
  ca:{"Remembrance Day":'国殇纪念日',"Civic/Provincial Day":'公民日'},
  au:{"Labour Day":'劳动节'},
  ph:{"Independence Day":'独立日'},
  vn:{"Independence Day":'国庆日'},
  id:{"Independence Day":'独立日'}};
function hnorm(s){s=String(s).replace(/\\,/g,',').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();let tag='',m;
  s=s.replace(/\s*\(regional holiday\)$/i,'');
  if(m=/^Day off for (.+)$/i.exec(s)){s=m[1];tag='sub'}
  if(m=/^Substitute (?:Bank )?Holiday for (.+)$/i.exec(s)){s=m[1];tag='sub'}
  if(m=/^Joint Holiday (?:for|after) (.+)$/i.exec(s)){s=m[1];tag='joint'}
  if(/\s*\((substitute|substitute day)\)$/i.test(s)){s=s.replace(/\s*\((substitute|substitute day)\)$/i,'');tag='sub'}
  if(/\s+observed$/i.test(s)){s=s.replace(/\s+observed$/i,'');tag='sub'}
  if(/\s+Joint Holiday$/i.test(s)){s=s.replace(/\s+Joint Holiday$/i,'');tag='joint'}
  s=s.replace(/\s*\((tentative|extra holiday|Public Employees Only)\)$/i,'').replace(/\s+Holiday Day \d+$/i,'').replace(/\s+(Public Sector )?Holiday$/i,'').replace(/\s+holiday$/i,'').replace(/\s+public sector$/i,'').replace(/\s+Weekend$/,'').replace(/\s*\(regional holiday\)$/i,'').trim();
  return{base:s,tag}}
function hname(raw,k,J){const{base,tag}=hnorm(raw);const C=HN_C[k]||{};
  let zh=C[base]||HN[base]||HN[base.replace(/ Holiday$/,'')]||base;
  // “Muharram” 各国含义不同：伊斯兰历 1 月 1–3 日是新年，9–11 日是阿舒拉节
  if(/^Muharram$/i.test(base)&&J!=null&&!C[base]){const h=hijri(J);if(h&&h.m===1)zh=h.d<=4?'伊斯兰新年':'阿舒拉节'}
  return zh+(tag==='sub'?'（补假）':tag==='joint'?'（联合休假）':'')}
/* 解析 Google 公共假期 ICS：只取全国性公共假期（或指定地区），跳过半天假 */
function parseHolIcs(text,c){const out=[];const t=String(text).replace(/\r?\n[ \t]/g,'');
  for(const ev of t.split('BEGIN:VEVENT').slice(1)){
    const ds=/DTSTART;VALUE=DATE:(\d{8})/.exec(ev),de=/DTEND;VALUE=DATE:(\d{8})/.exec(ev);if(!ds)continue;
    const desc=((/\nDESCRIPTION:(.*)/.exec(ev)||[])[1]||'').replace(/\\,/g,','),sum=((/\nSUMMARY:(.*)/.exec(ev)||[])[1]||'').trim();
    const first=desc.split('\\n')[0];if(!/^Public holiday/.test(first))continue;
    if(/ in /.test(first)&&!(c.reg&&first.includes(c.reg)))continue;
    if(/half-day/i.test(desc+' '+sum))continue;
    const p=s=>jdn(+s.slice(0,4),+s.slice(4,6),+s.slice(6,8));const a=p(ds[1]),b=de?p(de[1])-1:a;
    const tent=/tentative/i.test(desc),hs=/ Holiday$/i.test(sum.replace(/\s*\((tentative|regional holiday)\)$/ig,''))&&!/^(New Year|Christmas|Public) Holiday$/i.test(sum);
    for(let J=a;J<=Math.max(a,b);J++)out.push({J,name:hname(sum,c.k,J),tent,hs})}
  out.sort((x,y)=>x.J-y.J);
  // “某某 Holiday”若与正日不相连，就是补假（如澳门清明节逢周日改到周二）
  // 仅当同年存在同名“正日”且两者不相连时才算补假（“Spring Bank Holiday”这类本名就带 Holiday 的不受影响）
  for(const x of out)if(x.hs&&!/（/.test(x.name)&&out.some(y=>!y.hs&&y.name===x.name&&ymd(y.J).y===ymd(x.J).y)&&!out.some(y=>y!==x&&y.name===x.name&&Math.abs(y.J-x.J)===1))x.name+='（补假）';
  return fixSubs(c,out.map(({J,name,tent})=>({J,name,tent})))}
/* 部分数据源缺少“周末顺延”的补假（如新南威尔士州的圣诞、节礼日、元旦），按当地规则补上 */
function fixSubs(c,list){if(!c||!c.sub||!list.length)return list;const out=list.slice(),day={};out.forEach(x=>(day[x.J]=day[x.J]||[]).push(x.name));
  const isOff=J=>!!day[J]||c.we.includes(wday(J));
  for(const x of list.slice()){if(!c.sub.includes(x.name)||!c.we.includes(wday(x.J)))continue;const nm=x.name+'（补假）';
    if(out.some(y=>y.name===nm&&y.J>x.J&&y.J<=x.J+4))continue;
    let J=x.J+1;while(isOff(J))J++;out.push({J,name:nm,tent:x.tent});(day[J]=day[J]||[]).push(nm)}
  return out.sort((a,b)=>a.J-b.J)}

/* ---------- 数据：快照 + 联网 ---------- */
const HX={};   // k -> {y0,y1,d:{J:[name...]},t:{J:1}}
// 解析规则版本：规则改进后，旧版缓存的联网数据作废并重新下载
const HOL_PV=2;
const SNAPL={};
function setHolData(k,list,src){if(!Array.isArray(list)||!list.length)return false;
  if(src==='snap')SNAPL[k]=list;
  else if(SNAPL[k]){const ys=new Set(list.map(x=>ymd(x.J).y));list=SNAPL[k].filter(x=>!ys.has(ymd(x.J).y)).concat(list)}
  const d={},t={};let y0=9999,y1=0;
  for(const x of list){(d[x.J]=d[x.J]||[]).includes(x.name)||d[x.J].push(x.name);if(x.tent)t[x.J]=1;const y=ymd(x.J).y;if(y<y0)y0=y;if(y>y1)y1=y}
  HX[k]={y0,y1,d,t,src};delete XC[k];return true}
function loadSnapshot(){if(typeof HOL_SNAP==='undefined')return;
  for(const k in HOL_SNAP){if(HX[k]&&HX[k].src==='net')continue;const s=HOL_SNAP[k],list=[];
    s.d.split(',').forEach(e=>{const[ds,ni,tt]=e.split(':');list.push({J:jdn(+ds.slice(0,4),+ds.slice(4,6),+ds.slice(6,8)),name:s.n[+ni],tent:tt==='t'})});
    setHolData(k,fixSubs(CTRY[k],list),'snap')}}

/* ---------- 规律推算（快照范围之外的年份） ---------- */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
  h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),x=h+l-7*m+114;
  return jdn(y,Math.floor(x/31),(x%31)+1)}
function ruleDays(k,y){const R=(typeof HOL_RULES!=='undefined'&&HOL_RULES[k])||[];const out={};
  const add=(J,n)=>{if(J==null)return;(out[J]=out[J]||[]).includes(n)||out[J].push(n)};
  const needL=R.some(r=>r[0]==='L'),needH=R.some(r=>r[0]==='H');
  if(needL||needH)for(let J=jdn(y,1,1);J<=jdn(y,12,31);J++){
    if(needL){const L=lunar(J);if(L&&!L.leap)for(const r of R)if(r[0]==='L'&&r[1]===L.m&&r[2]===L.d)add(J,r[4])}
    if(needH){const h=hijri(J);if(h)for(const r of R)if(r[0]==='H'&&r[1]===h.m&&r[2]===h.d)add(J,r[4])}}
  for(const r of R){const[t,a,b,c,n]=r;
    if(t==='F')add(jdn(y,a,b),n);
    else if(t==='W'){if(c>0){const f=jdn(y,a,1);add(f+mod(b-wday(f),7)+(c-1)*7,n)}else{const l=jdn(a===12?y+1:y,a===12?1:a+1,1)-1;add(l-mod(wday(l)-b,7),n)}}
    else if(t==='E')add(easter(y)+a,n);
    else if(t==='T'){const tm=termsOfYear(y);for(const J in tm)if(tm[J]===a)add(+J,n)}}
  return out}
const RC={};
function ruleAt(k,J){const y=ymd(J).y,key=k+y;if(!RC[key])RC[key]=ruleDays(k,y);return RC[key][J]||null}

/* ---------- 统一的国家信息 ---------- */
const XC={};
function xInfo(k,J){if(k==='cn'||k==='ae'){const i=info(J);if(k==='cn'){const s=i.cn.st;return{k,f:i.cn.f,hol:s.off?s.name:null,work:!!s.work,weekend:!!s.weekend,src:s.src||''}}
    const a=i.ae;return{k,f:a.f,hol:a.hol,work:false,weekend:a.weekend,src:a.src}}
  const c=XC[k]||(XC[k]={});if(c[J])return c[J];
  const C=CTRY[k];if(!C)return{k,f:[],hol:null,work:false,weekend:false,src:''};
  const y=ymd(J).y,H=HX[k];let names=null,src='net';
  if(H&&y>=H.y0&&y<=H.y1){names=H.d[J]||null;if(names&&H.t[J])src='tent'}
  else{names=ruleAt(k,J);src='rule'}
  const we=weOf(k,J).includes(wday(J));
  return c[J]={k,f:names||[],hol:names?names.join('·'):null,work:false,weekend:!names&&we,isWe:we,src:names?src:''}}
function clearXCache(){for(const k in XC)delete XC[k]}
