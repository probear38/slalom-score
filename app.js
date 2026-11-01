const $=s=>document.querySelector(s),V=$('#vid');
const COL={sit:'#6a1b9a',jump:'#e65100',spin:'#00838f',wheel:'#2e7d32',other:'#5d4037'};
const SUG={
kick:['踢樁：重心偏移或腳步過大','分解：同一招先在 120cm 樁慢速做 10 樁 ×5 組，零踢樁再換 80cm，最後 50cm','視線看前 2–3 樁，不低頭看腳','手臂收在身體兩側穩定上身，每組錄影檢查哪一樁踢到'],
gap:['漏樁：路線規劃或速度不足','先在地上畫出整排路線，徒步走一遍確認每個樁間都經過','每套路排練時請人數樁間，漏 0 才算一組；連續 3 組成功','進樁前多 1–2 步加速，維持均速'],
balance:['失衡：核心與腳踝穩定不足','單腳站立 30 秒 ×3 組/腳（閉眼進階）','難招先在無樁平地 20 次成功率 >80% 再上樁','落地/換腳時膝蓋微彎吸收，重心壓在支撐腳正上方'],
fall:['摔倒：動作超出目前穩定度','把該招拆成進入→維持→出招三段，每段 10 次 ×3 組','比賽套路只放成功率 >80% 的招式，其餘列為練習中','練習穿戴護具，摔倒後練習立即重新接回音樂'],
stop:['自身中斷：體力或記憶套路不足','整套音樂跑 3 次/天，中間休息 2 分鐘，練到不中斷','分段背套路：每 20 秒一段，各段 5 次','加強心肺：間歇溜 30 秒快/30 秒慢 ×8'],
costume:['服飾/眼鏡掉落','比賽服裝彩排至少 2 次；眼鏡用防滑繩','頭髮、配件固定，鞋帶綁緊並塞好']};
let st=load('cur')||blank(),row='50',rec,chunks=[];
function blank(){return{id:Date.now(),date:new Date().toISOString().slice(0,10),name:'',tech:30,art:35,duration:'',musicStart:null,log:[],notes:'',coach:'',thumb:''}}
function load(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){}}
function save(){localStorage.setItem('cur',JSON.stringify(st))}
const hist=()=>load('hist')||[];
const fmt=t=>(+t).toFixed(1)+'s';
// tabs
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x==b));document.querySelectorAll('main section').forEach(s=>s.hidden=s.id!=b.dataset.tab);render()});
// video
function setVid(f){V.src=URL.createObjectURL(f);V.load()}
$('#camIn').onchange=e=>e.target.files[0]&&setVid(e.target.files[0]);
$('#picIn').onchange=e=>e.target.files[0]&&setVid(e.target.files[0]);
$('#liveBtn').onclick=async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:true});$('#liveV').srcObject=s;$('#liveBox').hidden=false;chunks=[];rec=new MediaRecorder(s);rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{s.getTracks().forEach(t=>t.stop());$('#liveBox').hidden=true;setVid(new Blob(chunks,{type:rec.mimeType||'video/mp4'}))};rec.start()}catch(e){alert('無法開啟相機，請改用「📷 錄影」：'+e.message)}};
$('#stopLive').onclick=()=>rec&&rec.stop();
$('#playBtn').onclick=()=>V.paused?V.play():V.pause();
document.querySelectorAll('[data-seek]').forEach(b=>b.onclick=()=>V.currentTime=Math.max(0,V.currentTime+ +b.dataset.seek));
V.ontimeupdate=()=>{$('#tnow').textContent=fmt(V.currentTime)+' / '+fmt(V.duration||0);if(V.duration)$('#scrub').value=V.currentTime/V.duration*1000};
$('#scrub').oninput=e=>V.duration&&(V.currentTime=e.target.value/1000*V.duration);
V.onloadeddata=()=>{setTimeout(()=>{try{const c=document.createElement('canvas');c.width=160;c.height=160*V.videoHeight/V.videoWidth||90;c.getContext('2d').drawImage(V,0,0,c.width,c.height);st.thumb=c.toDataURL('image/jpeg',.6);save()}catch(e){}},300)};
$('#musicBtn').onclick=()=>{st.musicStart=V.currentTime;save();render()};
$('#endBtn').onclick=()=>{if(st.musicStart==null)return alert('請先標記音樂開始');st.duration=+(V.currentTime-st.musicStart).toFixed(1);save();render()};
$('#rowSel').onclick=e=>{if(!e.target.dataset.v)return;row=e.target.dataset.v;[...$('#rowSel').children].forEach(b=>b.classList.toggle('on',b==e.target))};
for(const[k,n]of Object.entries(FAMILIES)){const b=document.createElement('button');b.textContent=n;b.style.background=COL[k];b.onclick=()=>{const name=prompt(n+' 動作名稱（可留空）','')??'';add({type:'trick',family:k,row,name})};$('#trickBtns').append(b)}
for(const[k,f]of Object.entries(FAULTS)){const b=document.createElement('button');b.textContent=f.n;b.style.background='#c62828';b.onclick=()=>{let v=f.d;if(k=='balance')v=+prompt('失衡扣分 0.5–1.5','1')||1;if(k=='fall')v=+prompt('摔倒扣分 2–5','3')||3;if(k=='gap')v=+prompt('漏了幾個樁間？','1')||1;add({type:'fault',fault:k,row,value:v})};$('#faultBtns').append(b)}
function add(e){e.t=+V.currentTime.toFixed(1);st.log.push(e);st.log.sort((a,b)=>a.t-b.t);save();render();navigator.vibrate&&navigator.vibrate(30)}
function label(e){return (e.ai?'<span class="aitag">AI</span> ':'')+(e.type=='trick'?`🟢 ${FAMILIES[e.family]}${e.name?'·'+e.name:''} (${e.row}cm)${e.valid===false?' ✗無效':''}`:`🔴 ${FAULTS[e.fault].n} ${e.fault=='gap'?e.value+'個':'-'+e.value} (${e.row}cm)`)}
// sheet
['name','duration','tech','art','notes','coach'].forEach(k=>$('#'+k).oninput=e=>{st[k]=e.target.value;save();render(true)});
function render(skipInputs){
  if(!skipInputs)['name','duration','tech','art','notes','coach'].forEach(k=>$('#'+k).value=st[k]??'');
  $('#techV').textContent=st.tech;$('#artV').textContent=st.art;
  const r=compute(st);
  $('#log').innerHTML='';st.log.forEach((e,i)=>{const li=document.createElement('li');li.innerHTML=`<span><b>${fmt(e.t)}</b> ${label(e)}</span><span></span>`;li.onclick=()=>{V.currentTime=e.t};const btns=li.lastChild;
   if(e.ai){const k=document.createElement('button');k.textContent='✓確認';k.onclick=ev=>{ev.stopPropagation();delete e.ai;save();render()};btns.append(k)}
   if(e.type=='trick'){const v=document.createElement('button');v.textContent='有效?';v.onclick=ev=>{ev.stopPropagation();e.valid=e.valid===false;save();render()};btns.append(v)}
   const d=document.createElement('button');d.textContent='🗑';d.onclick=ev=>{ev.stopPropagation();st.log.splice(i,1);save();render()};btns.append(d);$('#log').append(li)});
  const c=(ok,t)=>`<div class="${ok?'ok':'bad'}">${ok?'✅':'⚠️'} ${t}</div>`;
  $('#checks').innerHTML=c(r.tricks>=8,`有效動作 ${r.tricks}/8${r.missTricks?`（少 ${r.missTricks}，-${r.missTricks*2}）`:''}`)+c(!r.missing.length,r.missing.length?`缺少類別：${r.missing.map(f=>FAMILIES[f]).join('、')}（-${r.missing.length*3}）`:'五大類齊全')+c(r.rowsOk,`使用樁排：${r.rows.join('、')||'無'}${r.rowsOk?'':'（三排都必須表演）'}`)+c(r.timeOk,`時間 ${st.duration||'未標記'} 秒（需 105–120，否則 -10）`)+c(r.gaps<=5,`漏樁間 ${r.gaps}（>5 扣 5）`);
  $('#totals').innerHTML=`技術 ${r.tech} − 動作規定扣分 ${r.techDed}<br>藝術 ${r.art}<br>罰分 −${r.pen} ${Object.entries(r.detail).map(([k,v])=>(k=='time'?'時間':FAULTS[k].n)+' '+v).join('、')}<div class="big">總分 ${r.total} / 130</div>`;
  // suggestions
  const counts={};st.log.filter(e=>e.type=='fault').forEach(e=>counts[e.fault]=(counts[e.fault]||0)+1);
  let h=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{const s=SUG[k];const rows=[...new Set(st.log.filter(e=>e.fault==k).map(e=>e.row+'cm'))].join('、');return `<div class="sg"><h4>${s[0]} ×${n}（樁排：${rows}）</h4><ul>${s.slice(1).map(x=>'<li>'+x+'</li>').join('')}</ul></div>`}).join('');
  if(r.missing.length)h+=`<div class="sg"><h4>缺少類別：${r.missing.map(f=>FAMILIES[f]).join('、')}</h4>每類先選一個最穩定的基礎招（如蹲坐：坐姿蛇形；跳躍：雙腳跳樁；旋轉：單腳原地轉；單輪：前輪/後輪滑行 4 樁），每天 10 次 ×3 組，成功率 >80% 後排入套路。</div>`;
  if(r.missTricks)h+=`<div class="sg"><h4>有效動作不足 ${r.missTricks} 個</h4>把已會的招式整理成清單，挑清楚、可穩定在樁內完成的動作補足 8 個以上，並保持動作清楚，不清楚的會被判無效。</div>`;
  if(!r.rowsOk&&st.log.length)h+=`<div class="sg"><h4>未使用全部三排樁</h4>套路設計時每排至少安排 2 個招式，並練習換排路線（排距 2m）。</div>`;
  if(st.duration&&!r.timeOk)h+=`<div class="sg"><h4>時間不符</h4>音樂剪到約 115 秒，用計時器配合整套排練。</div>`;
  $('#sugg').innerHTML=h||'<div class="card">目前沒有記錄失誤 👍</div>';
  renderHist();
}
$('#importCoach').onclick=()=>{try{const j=JSON.parse($('#coach').value);if(j.log)j.log.forEach(e=>e.t=+e.t||0);Object.assign(st,j);if(typeof j.coach!=='string')st.coach=JSON.stringify(j,null,1);save();render();alert('已匯入')}catch(e){alert('不是有效 JSON，已以文字保留')}};
$('#saveBtn').onclick=()=>{const h=hist().filter(x=>x.id!=st.id);const r=compute(st);h.push({...st,result:r});h.sort((a,b)=>a.date<b.date?-1:1);localStorage.setItem('hist',JSON.stringify(h));render();alert('已儲存，總分 '+r.total)};
$('#newBtn').onclick=()=>{if(confirm('開始新的一場？目前內容若未儲存將清除')){st=blank();save();V.removeAttribute('src');render()}};
function renderHist(){const h=hist();$('#histList').innerHTML='';h.slice().reverse().forEach(s=>{const li=document.createElement('li');li.innerHTML=`${s.thumb?`<img src="${s.thumb}" width="64">`:''}<span style="flex:1">${s.date} ${s.name||''}<br><b>${s.result.total}</b> 分（技${s.result.tech} 藝${s.result.art} 罰${s.result.pen}）</span><span><button>開啟</button><button>🗑</button></span>`;const[o,d]=li.querySelectorAll('button');o.onclick=()=>{st=JSON.parse(JSON.stringify(s));delete st.result;save();render();alert('已載入（影片需重新選取）')};d.onclick=()=>{if(confirm('刪除？')){localStorage.setItem('hist',JSON.stringify(h.filter(x=>x.id!=s.id)));render()}};$('#histList').append(li)});
  const cv=$('#chart');const w=cv.width=cv.clientWidth*2||600,H=cv.height=400,g=cv.getContext('2d');g.clearRect(0,0,w,H);g.font='22px sans-serif';g.fillStyle='#888';
  [0,65,130].forEach(v=>{const y=H-20-v/130*(H-40);g.fillText(v,4,y);g.fillRect(40,y,w,1)});if(!h.length){g.fillText('尚無紀錄',w/2-40,H/2);return}
  g.strokeStyle='#0b3d91';g.lineWidth=4;g.beginPath();h.forEach((s,i)=>{const x=50+(h.length==1?0:i/(h.length-1))*(w-80),y=H-20-s.result.total/130*(H-40);i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();
  g.fillStyle='#0b3d91';h.forEach((s,i)=>{const x=50+(h.length==1?0:i/(h.length-1))*(w-80),y=H-20-s.result.total/130*(H-40);g.beginPath();g.arc(x,y,7,0,7);g.fill();g.fillText(s.result.total,x-15,y-14)})}
$('#expBtn').onclick=async()=>{const txt=JSON.stringify({hist:hist(),cur:st},null,1),f=new File([txt],'slalom-'+new Date().toISOString().slice(0,10)+'.json',{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f]}).catch(()=>{});const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;a.click()};
$('#impIn').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());const arr=j.hist||(Array.isArray(j)?j:[]);const m=new Map(hist().map(x=>[x.id,x]));arr.forEach(x=>{x.result=x.result||compute(x);m.set(x.id,x)});localStorage.setItem('hist',JSON.stringify([...m.values()].sort((a,b)=>a.date<b.date?-1:1)));render();alert('匯入 '+arr.length+' 筆')}catch(err){alert('匯入失敗')}};
window.App={get st(){return st},save,render};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
render();
