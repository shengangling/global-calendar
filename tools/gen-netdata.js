// 生成 netdata.json：阿联酋与其他国家的最新公共假期（Google 公共假期日历）。
// 浏览器无法跨域读取 Google 日历，由 GitHub Actions 每天运行本脚本并提交结果，网页从同源读取。
// 用法：node tools/gen-netdata.js
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const ui=fs.readFileSync(root+'/ui.js','utf8');
const pick=name=>{const a=ui.indexOf('function '+name+'(');if(a<0)throw name;let i=ui.indexOf('{',a),d=0;for(;i<ui.length;i++){if(ui[i]==='{')d++;else if(ui[i]==='}'&&--d===0)break}return ui.slice(a,i+1)};
const code=fs.readFileSync(root+'/core.js','utf8')+'\n'+fs.readFileSync(root+'/countries.js','utf8')+'\n'+pick('aeName')+'\n'+pick('parseAeIcs')+
  '\n;module.exports={COUNTRIES,parseHolIcs,parseAeIcs,icsURL,HOL_PV};';
const m={exports:{}};new Function('module',code)(m);const L=m.exports;
const AE_ICS='https://calendar.google.com/calendar/ical/en.ae%23holiday%40group.v.calendar.google.com/public/basic.ics';
const get=async u=>{for(let i=0;i<3;i++){try{const r=await fetch(u);if(r.ok)return await r.text()}catch(e){}await new Promise(r=>setTimeout(r,2000))}throw new Error('下载失败 '+u)};
(async()=>{
  const old=fs.existsSync(root+'/netdata.json')?JSON.parse(fs.readFileSync(root+'/netdata.json','utf8')):{x:{}};
  const out={v:L.HOL_PV,at:Date.now(),ae:old.ae||null,x:old.x||{}};let ok=0,fail=[];
  try{out.ae=L.parseAeIcs(await get(AE_ICS));ok++}catch(e){fail.push('ae')}
  for(const c of L.COUNTRIES){if(!c.g)continue;
    try{const list=L.parseHolIcs(await get(L.icsURL(c)),c);if(list.length<5)throw 0;out.x[c.k]=list.map(x=>x.tent?[x.J,x.name,1]:[x.J,x.name]);ok++}catch(e){fail.push(c.k)}}
  // 内容没变就不改文件（避免每天空提交）
  const strip=o=>JSON.stringify({...o,at:0});
  if(strip(out)!==strip(old)){fs.writeFileSync(root+'/netdata.json',JSON.stringify(out));console.log('已更新 netdata.json')}else console.log('数据无变化');
  console.log('成功',ok,'失败',fail.join(',')||'无');if(ok===0)process.exit(1)})();
