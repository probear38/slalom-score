// 🤖 自動分析：MediaPipe Pose Landmarker（裝置端 WASM），失敗時改用 TF.js MoveNet
(()=>{
const $=s=>document.querySelector(s),V=$('#vid'),MP='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const LABELS={sitMargin:'蹲坐：髖低於膝容許(身高比)',sitMin:'蹲坐最短秒數',jumpThr:'跳躍：雙踝上升(身高比)',jumpMinGap:'跳躍最短間隔秒',spinDeg:'旋轉角度°',spinWin:'旋轉時間窗秒',fallTorso:'摔倒：軀幹高度比上限',fallDrop:'摔倒：髖下降速度',wobbleThr:'失衡：重心橫向加速度',armThr:'失衡：手臂甩動速度',motionThr:'開始/結束：移動速度',motionMin:'開始/結束：持續秒數',minVis:'關節可見度下限',crossMin:'交叉：最少換腳次數',crossWin:'交叉：時間窗秒',snakeStag:'蛇形：前後腳距(身高比)',snakeMin:'蛇形最短秒數',wheelLift:'單腳：抬腳高度(身高比)',wheelMin:'單腳最短秒數',hueTol:'樁色相容許°',satMin:'樁飽和度下限',valMin:'樁亮度下限',minArea:'樁最小像素',dispThr:'踢樁：位移(樁高比)',kickPersist:'踢樁：位移持續秒',missPersist:'踢樁：消失持續秒',bandK:'漏樁：腳踝距排線容許'};
const DEF={...AI_DEFAULTS,...CONE_DEFAULTS};
let opt={...DEF,...(JSON.parse(localStorage.getItem('aiOpt')||'{}'))},frames=[],cancel=false,det=null,kind='';
function drawSet(){$('#aiSet').innerHTML='';for(const k in DEF){const l=document.createElement('label');l.innerHTML=`<span>${LABELS[k]}</span><input type="number" step="0.05" value="${opt[k]}">`;l.querySelector('input').onchange=e=>{opt[k]=+e.target.value;localStorage.setItem('aiOpt',JSON.stringify(opt));if(frames.length)apply(false)};$('#aiSet').append(l)}}
$('#aiReset').onclick=()=>{opt={...DEF};localStorage.removeItem('aiOpt');drawSet()};drawSet();
const msg=t=>$('#aiMsg').innerHTML=t;
async function loadMP(){const v=await import(MP+'/vision_bundle.mjs');const fs=await v.FilesetResolver.forVisionTasks(MP+'/wasm');
 const mk=d=>v.PoseLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',delegate:d},runningMode:'VIDEO',numPoses:1});
 let p;try{p=await mk('GPU')}catch(e){p=await mk('CPU')}kind='MediaPipe';return (el,ms)=>{const r=p.detectForVideo(el,ms);return r.landmarks&&r.landmarks[0]?r.landmarks[0].map((l,i)=>{const w=r.worldLandmarks&&r.worldLandmarks[0]&&r.worldLandmarks[0][i];return w?{...l,z:w.z,wx:w.x}:l}):null}}
function script(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.append(s)})}
async function loadMN(){await script('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
 const d=await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet,{modelType:poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING});kind='MoveNet（無深度，旋轉無法偵測）';
 const map={0:0,5:11,6:12,7:13,8:14,9:15,10:16,11:23,12:24,13:25,14:26,15:27,16:28};
 return async el=>{const p=(await d.estimatePoses(el))[0];if(!p)return null;const lm=[];const W=el.videoWidth,H=el.videoHeight;p.keypoints.forEach((k,i)=>{if(map[i]!=null)lm[map[i]]={x:k.x/W,y:k.y/H,visibility:k.score}});for(let i=0;i<33;i++)lm[i]=lm[i]||{x:0,y:0,visibility:0};return lm}}
let coneHSV=JSON.parse(localStorage.getItem('coneHSV')||'null'),rows=[],coneFrames=[],gapEst=null;const GW=320,G=document.createElement('canvas'),gx=G.getContext('2d',{willReadFrequently:true});
function grab(){G.width=GW;G.height=Math.round(GW*V.videoHeight/V.videoWidth)||180;gx.drawImage(V,0,0,G.width,G.height);return{data:gx.getImageData(0,0,G.width,G.height).data,w:G.width,h:G.height}}
const cmsg=t=>$('#coneMsg').innerHTML=t;
$('#coneSample').onclick=()=>{if(!V.videoWidth)return alert('請先載入影片');V.pause();O.classList.add('pick');cmsg('請在影片上點一個樁');};
document.getElementById('ovl').addEventListener('click',ev=>{const O=ev.target;if(!O.classList.contains('pick'))return;O.classList.remove('pick');const r=O.getBoundingClientRect(),sc=Math.min(r.width/V.videoWidth,r.height/V.videoHeight),vw=V.videoWidth*sc,vh=V.videoHeight*sc;
 const nx=(ev.clientX-r.left-(r.width-vw)/2)/vw,ny=(ev.clientY-r.top-(r.height-vh)/2)/vh;const im=grab();let R=0,Gg=0,B=0,n=0;const px=Math.round(nx*im.w),py=Math.round(ny*im.h);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=((py+dy)*im.w+px+dx)*4;if(p>=0&&p<im.data.length){R+=im.data[p];Gg+=im.data[p+1];B+=im.data[p+2];n++}}
 coneHSV=rgb2hsv(R/n,Gg/n,B/n);localStorage.setItem('coneHSV',JSON.stringify(coneHSV));cmsg(`已取色 H${coneHSV[0]|0} S${coneHSV[1].toFixed(2)} V${coneHSV[2].toFixed(2)}，請按「偵測樁位」`)});
$('#coneDetect').onclick=()=>{if(!coneHSV)return alert('請先取色');const b=findBlobs(grab(),coneHSV,opt);rows=clusterRows(b);App.st.coneRows=rows;App.save();
 cmsg(rows.length?`找到 ${b.length} 個色塊 → `+rows.map(r=>`${r.row}cm 排 ${r.cones.length} 樁`).join('、')+'<br><small>標準：50cm×20、80cm×20、120cm×14。數量不符請調整色相/飽和度/最小像素後重試。</small>':`只找到 ${b.length} 個色塊，無法分成三排，請調整門檻`)};
rows=App.st.coneRows||[];
const seek=t=>new Promise(r=>{const h=()=>{V.removeEventListener('seeked',h);r()};V.addEventListener('seeked',h);V.currentTime=t});
$('#aiCancel').onclick=()=>cancel=true;
$('#aiBtn').onclick=async()=>{if(!V.src||!V.duration)return alert('請先載入影片');cancel=false;$('#aiBtn').disabled=true;$('#aiCancel').hidden=false;const pg=$('#aiProg');pg.hidden=false;pg.value=0;
 try{if(!det){msg('載入姿勢模型中…（第一次需下載約 6MB）');try{det=await loadMP()}catch(e){console.warn(e);msg('MediaPipe 無法載入，改用 MoveNet…');det=await loadMN()}}
  V.pause();frames=[];coneFrames=[];const D=V.duration,step=0.1,t0=performance.now();
  for(let t=0;t<D&&!cancel;t+=step){await seek(t);const lm=await det(V,Math.round(t*1000)+1);if(lm)frames.push({t:+t.toFixed(2),lm});if(rows.length)coneFrames.push({t:+t.toFixed(2),blobs:findBlobs(grab(),coneHSV,opt)});pg.value=t/D;
   if(frames.length%10==0){const el=(performance.now()-t0)/1000,eta=el/(t/D||1e-3)-el;msg(`分析中 ${(t/D*100|0)}%（${kind}，剩約 ${eta|0} 秒）`)}}
  if(cancel){msg('已取消（已分析部分：'+frames.length+' 幀）');}
  apply(true)}catch(e){msg('分析失敗：'+e.message)}finally{$('#aiBtn').disabled=false;$('#aiCancel').hidden=true;pg.hidden=true}};
function apply(addLog){const st=App.st,r=analyze(frames,opt);
 st.log=st.log.filter(e=>!e.ai);// 重算時移除未確認的 AI 標記
 r.events.forEach(e=>st.log.push({row:'?',...e}));
 let kicks=0;gapEst=null;if(rows.length&&coneFrames.length){const k=trackKicks(rows,coneFrames,opt);kicks=k.length;k.forEach(e=>st.log.push(e));
  const an=[];frames.forEach(f=>[27,28].forEach(i=>{const l=f.lm[i];if(l&&(l.visibility??1)>=opt.minVis)an.push({t:f.t,x:l.x,y:l.y})}));gapEst=estimateGaps(rows,an,opt)}st.log.sort((a,b)=>a.t-b.t);
 const dur=r.start!=null&&r.end!=null?+(r.end-r.start).toFixed(1):null;const ref=refScores(r,dur||0);
 st.ai={kicks,gapEst,cones:!!rows.length,kind,frames:r.frames,start:r.start,end:r.end,dur,ref,series:r.series.filter((_,i)=>i%2==0).map(s=>[s.t,s.v])};App.save();App.render();summary()}
function summary(){const a=App.st.ai;if(!a){$('#aiSum').innerHTML='';return}const c=a.ref.counts;
 $('#aiSum').innerHTML=`<h3>自動分析摘要 <small>(${a.kind}，${a.frames} 幀有骨架)</small></h3>
 <div>偵測：蹲坐 ${c.sit}、跳躍 ${c.jump}、旋轉 ${c.spin}、摔倒 ${c.fall}、失衡 ${c.balance}<br><small>單輪／其他、踢樁、漏樁、招式名稱請手動記錄。</small></div>
 <div>動作開始 ${a.start??'—'}s、結束 ${a.end??'—'}s → 建議時間 <b>${a.dur??'—'}</b> 秒 ${a.dur?'<button class="btn sm" id="useDur">套用</button>':''}<br><small>正式計時應從音樂開始起算。</small></div>
 <div>${a.cones?`踢樁 AI：${a.kicks} 次`:'<small>未設定樁位，踢樁/漏樁未偵測</small>'}</div>
 ${a.gapEst?`<div class="card"><b>漏樁 參考值</b>：${a.gapEst.total} 個樁間（${a.gapEst.per.map(p=>p.row+'cm '+p.missed+'/'+p.gaps).join('、')}）<br><small>依腳踝軌跡估計，確認後才計入「超過 5 個扣 5」</small><br><button class="btn sm" id="useGap">確認並加入漏樁</button></div>`:''}
 <canvas id="aiChart"></canvas><small>重心移動速度（身高/秒）隨時間</small>
 <div class="card"><b>參考值</b>（非裁判分數，僅供練習參考）：技術分 ${a.ref.tech[0]}–${a.ref.tech[1]}、藝術分 ${a.ref.art[0]}–${a.ref.art[1]}</div>`;
 const ug=$('#useGap');if(ug)ug.onclick=()=>{a.gapEst.per.filter(p=>p.missed).forEach(p=>App.st.log.push({t:0,type:'fault',fault:'gap',value:p.missed,row:p.row}));App.save();App.render()};
 const u=$('#useDur');if(u)u.onclick=()=>{App.st.duration=a.dur;App.st.musicStart=a.start;App.save();App.render()};
 const cv=$('#aiChart'),w=cv.width=cv.clientWidth*2||600,h=cv.height=280,g=cv.getContext('2d'),s=a.series;if(!s.length)return;const T=s[s.length-1][0]||1,M=Math.max(...s.map(x=>x[1]),0.5);
 g.strokeStyle='#00838f';g.lineWidth=3;g.beginPath();s.forEach(([t,v],i)=>{const x=t/T*w,y=h-10-v/M*(h-20);i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();
 g.fillStyle='rgba(11,61,145,.15)';if(a.start!=null)g.fillRect(a.start/T*w,0,(a.end-a.start)/T*w,h);
 App.st.log.filter(e=>e.ai).forEach(e=>{g.fillStyle=e.type=='fault'?'#c62828':'#ff8f00';g.fillRect(e.t/T*w-2,0,4,14)})}
// 骨架覆蓋
const E=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]],O=$('#ovl');
function draw(){const g=O.getContext('2d');O.width=O.clientWidth;O.height=O.clientHeight;g.clearRect(0,0,O.width,O.height);
 if($('#ovlOn').checked&&frames.length&&V.videoWidth){let f=frames[0];for(const x of frames){if(x.t>V.currentTime+0.05)break;f=x}
  const sc=Math.min(O.width/V.videoWidth,O.height/V.videoHeight),vw=V.videoWidth*sc,vh=V.videoHeight*sc,ox=(O.width-vw)/2,oy=(O.height-vh)/2,P=l=>[ox+l.x*vw,oy+l.y*vh];
  g.strokeStyle='#0f0';g.lineWidth=3;E.forEach(([a,b])=>{const A=f.lm[a],B=f.lm[b];if(A&&B&&(A.visibility??1)>.3&&(B.visibility??1)>.3){g.beginPath();g.moveTo(...P(A));g.lineTo(...P(B));g.stroke()}})}
 if($('#conePrev').checked&&rows.length&&V.videoWidth){const sc=Math.min(O.width/V.videoWidth,O.height/V.videoHeight),vw=V.videoWidth*sc,vh=V.videoHeight*sc,ox=(O.width-vw)/2,oy=(O.height-vh)/2,RC={'50':'#ff0','80':'#0ff','120':'#f0f'};
  g.font='11px sans-serif';rows.forEach(r=>{g.strokeStyle=g.fillStyle=RC[r.row];r.cones.forEach(c=>g.strokeRect(ox+(c.cx-c.bw/2)*vw,oy+(c.bot-c.bh)*vh,c.bw*vw,c.bh*vh));g.fillText(r.row+'cm',ox+r.cones[0].cx*vw-30,oy+r.y*vh)})}
 requestAnimationFrame(draw)}
App.onConfirm=e=>{if(e.type!='trick'||!frames.length)return;const sn=JSON.parse(localStorage.getItem('snips')||'[]');sn.push({name:e.name||'',family:e.family,row:e.row,date:App.st.date,dur:e.dur||1,frames:snippet(frames,e.t-0.5,e.t+(e.dur||1)+0.5)});
 while(JSON.stringify(sn).length>3e6)sn.shift();localStorage.setItem('snips',JSON.stringify(sn));$('#snipMsg').textContent='已存姿勢片段 '+sn.length+' 筆'};
$('#snipExp').onclick=()=>{const sn=localStorage.getItem('snips')||'[]',f=new File([sn],'pose-snippets.json',{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f]}).catch(()=>{});const l=document.createElement('a');l.href=URL.createObjectURL(f);l.download=f.name;l.click()};
$('#snipMsg').textContent='已存姿勢片段 '+JSON.parse(localStorage.getItem('snips')||'[]').length+' 筆';
requestAnimationFrame(draw);summary();
})();
