// 姿勢啟發式分析（純函式，瀏覽器與 node 共用）。座標為 0–1 正規化，y 向下。
const AI_DEFAULTS={sitMargin:0.0,sitMin:0.5,jumpThr:0.06,jumpMinGap:0.6,spinDeg:330,spinWin:2.5,fallTorso:0.22,fallDrop:1.2,wobbleThr:2.5,armThr:3.5,motionThr:0.15,motionMin:1.0,minVis:0.4};
const L={nose:0,ls:11,rs:12,lw:15,rw:16,lh:23,rh:24,lk:25,rk:26,la:27,ra:28};
const med=a=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);return s.length?s[s.length>>1]:NaN};
function feats(f,minVis){const g=i=>f.lm&&f.lm[i];const ok=[L.ls,L.rs,L.lh,L.rh,L.lk,L.rk,L.la,L.ra].every(i=>g(i)&&(g(i).visibility??1)>=minVis);if(!ok)return null;
 const m=(a,b,k)=>(g(a)[k]+g(b)[k])/2;
 return{t:f.t,hipY:m(L.lh,L.rh,'y'),kneeY:m(L.lk,L.rk,'y'),shY:m(L.ls,L.rs,'y'),la:g(L.la).y,ra:g(L.ra).y,ankY:m(L.la,L.ra,'y'),
  cx:(m(L.lh,L.rh,'x')+m(L.ls,L.rs,'x'))/2,cy:(m(L.lh,L.rh,'y')+m(L.ls,L.rs,'y'))/2,
  ang:Math.atan2((g(L.rs).z||0)-(g(L.ls).z||0),(g(L.rs).wx??g(L.rs).x)-(g(L.ls).wx??g(L.ls).x)),hasZ:g(L.ls).z!=null,
  lw:g(L.lw),rw:g(L.rw),noseY:g(L.nose)?g(L.nose).y:NaN}}
function analyze(frames,opt={}){
 const o={...AI_DEFAULTS,...opt};const F=frames.map(f=>feats(f,o.minVis)).filter(Boolean);const ev=[];
 if(F.length<3)return{events:ev,series:[],start:null,end:null,bodyH:0,frames:F.length};
 const H=med(F.map(f=>f.ankY-f.shY))||0.3; // 肩到踝高度
 // 速度序列（以身高/秒為單位）
 const ser=F.map((f,i)=>{if(!i)return{t:f.t,v:0,cx:f.cx,cy:f.cy};const p=F[i-1],dt=Math.max(1e-3,f.t-p.t);return{t:f.t,v:Math.hypot(f.cx-p.cx,f.cy-p.cy)/H/dt,cx:f.cx,cy:f.cy,vx:(f.cx-p.cx)/H/dt}});
 // 蹲坐：髖低於膝（y 較大）持續
 let s0=null;F.forEach((f,i)=>{const sit=f.hipY>=f.kneeY-o.sitMargin*H;if(sit&&s0==null)s0=f.t;if((!sit||i==F.length-1)&&s0!=null){const e=sit?f.t:F[i-1].t;if(e-s0>=o.sitMin)ev.push({t:+s0.toFixed(1),type:'trick',family:'sit',ai:true,dur:+(e-s0).toFixed(1)});s0=null}});
 // 跳躍：雙踝同時高於基準線（前 2 秒踝位中位數）
 let lastJ=-9;F.forEach((f,i)=>{const w=F.slice(0,i).filter(p=>f.t-p.t<=2);if(w.length<3)return;const base=med(w.map(p=>Math.max(p.la,p.ra)));
  if(base-f.la>o.jumpThr*H&&base-f.ra>o.jumpThr*H&&f.t-lastJ>=o.jumpMinGap){ev.push({t:+f.t.toFixed(1),type:'trick',family:'jump',ai:true});lastJ=f.t}});
 // 旋轉：肩線方向（需 z）累計轉角
 if(F[0].hasZ){let acc=0,st=0;const un=[0];for(let i=1;i<F.length;i++){let d=F[i].ang-F[i-1].ang;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;un.push(un[i-1]+d)}
  for(let i=0;i<F.length;i++){while(F[i].t-F[st].t>o.spinWin)st++;if(Math.abs(un[i]-un[st])*180/Math.PI>=o.spinDeg){ev.push({t:+F[st].t.toFixed(1),type:'trick',family:'spin',ai:true});st=i}}}
 // 摔倒：軀幹接近水平且髖部快速下降
 let lastF=-9;F.forEach((f,i)=>{const torso=Math.abs(f.hipY-f.shY)/H;const p=F.find(q=>f.t-q.t<=0.6&&f.t-q.t>=0.2)||F[Math.max(0,i-3)];const drop=(f.hipY-p.hipY)/H/Math.max(0.1,f.t-p.t);
  if(torso<o.fallTorso&&drop>o.fallDrop&&f.t-lastF>2){ev.push({t:+f.t.toFixed(1),type:'fault',fault:'fall',value:3,ai:true});lastF=f.t}});
 // 失衡：重心橫向加速度突變或手臂甩動
 let lastB=-9;for(let i=2;i<F.length;i++){const a=Math.abs((ser[i].vx||0)-(ser[i-1].vx||0))/Math.max(1e-3,F[i].t-F[i-1].t)/10;
  let arm=0;if(F[i].lw&&F[i-1].lw){const dt=Math.max(1e-3,F[i].t-F[i-1].t);arm=(Math.hypot(F[i].lw.x-F[i-1].lw.x,F[i].lw.y-F[i-1].lw.y)+Math.hypot(F[i].rw.x-F[i-1].rw.x,F[i].rw.y-F[i-1].rw.y))/2/H/dt}
  if((a>o.wobbleThr||arm>o.armThr)&&F[i].t-lastB>1.5&&F[i].t-lastF>2){ev.push({t:+F[i].t.toFixed(1),type:'fault',fault:'balance',value:0.5,ai:true});lastB=F[i].t}}
 // 開始／結束：持續移動
 const mov=ser.map(s=>s.v>o.motionThr);let start=null,end=null;
 for(let i=0;i<F.length;i++){let j=i;while(j<F.length&&mov[j])j++;if(j>i&&F[j-1].t-F[i].t>=o.motionMin){if(start==null)start=F[i].t;end=F[j-1].t}i=j}
 ev.sort((a,b)=>a.t-b.t);return{events:ev,series:ser.map(s=>({t:+s.t.toFixed(2),v:+s.v.toFixed(3),cx:+s.cx.toFixed(3),cy:+s.cy.toFixed(3)})),start,end,bodyH:H,frames:F.length};
}
function refScores(res,dur){const c={sit:0,jump:0,spin:0,fall:0,balance:0};res.events.forEach(e=>c[e.family||e.fault]++);
 const fams=['sit','jump','spin'].filter(k=>c[k]).length;const moving=res.series.length?res.series.filter(s=>s.v>0.15).length/res.series.length:0;
 const tech=Math.max(10,Math.min(60,15+2*(c.sit+c.jump+c.spin)+4*fams-2*c.fall-0.5*c.balance));
 const art=Math.max(0,Math.min(70,20+35*moving-3*c.fall-c.balance+(dur>=105&&dur<=120?5:0)));
 const r=v=>Math.round(v);return{counts:c,tech:[r(Math.max(10,tech-6)),r(Math.min(60,tech+6))],art:[r(Math.max(0,art-8)),r(Math.min(70,art+8))]}}
if(typeof module!=='undefined')module.exports={analyze,refScores,AI_DEFAULTS};
