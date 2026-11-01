// 樁偵測（顏色）、分排、踢樁追蹤、漏樁估計。純函式。座標輸出為 0–1 正規化。
const CONE_DEFAULTS={hueTol:18,satMin:0.35,valMin:0.3,minArea:6,dispThr:0.6,kickPersist:1.0,missPersist:3.0,bandK:0.45};
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0;if(d){h=M==r?((g-b)/d)%6:M==g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,M?d/M:0,M]}
function findBlobs(img,target,o){const{data,w,h}=img,m=new Uint8Array(w*h);
 for(let i=0;i<w*h;i++){const[hh,s,v]=rgb2hsv(data[i*4],data[i*4+1],data[i*4+2]);let dh=Math.abs(hh-target[0]);dh=Math.min(dh,360-dh);if(dh<=o.hueTol&&s>=o.satMin&&v>=o.valMin)m[i]=1}
 const out=[],q=[];for(let i=0;i<w*h;i++){if(m[i]!=1)continue;m[i]=2;q.length=0;q.push(i);let a=0,sx=0,sy=0,x0=w,x1=0,y0=h,y1=0;
  while(q.length){const p=q.pop(),x=p%w,y=(p/w)|0;a++;sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const n of[p-1,p+1,p-w,p+w])if(n>=0&&n<w*h&&m[n]==1&&Math.abs((n%w)-x)<=1){m[n]=2;q.push(n)}}
  if(a>=o.minArea)out.push({cx:sx/a/w,cy:sy/a/h,bot:(y1+1)/h,bw:(x1-x0+1)/w,bh:(y1-y0+1)/h,area:a/(w*h)})}
 return out}
const md=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[s.length>>1]:0};
function clusterRows(bl){if(bl.length<6)return[];const s=[...bl].sort((a,b)=>a.bot-b.bot),gp=[];for(let i=1;i<s.length;i++)gp.push([s[i].bot-s[i-1].bot,i]);
 const cut=gp.sort((a,b)=>b[0]-a[0]).slice(0,2).map(g=>g[1]).sort((a,b)=>a-b);const groups=[s.slice(0,cut[0]),s.slice(cut[0],cut[1]),s.slice(cut[1])];
 const rows=groups.map(g=>{g.sort((a,b)=>a.cx-b.cx);const sp=md(g.slice(1).map((c,i)=>c.cx-g[i].cx)),sz=md(g.map(c=>c.bh));return{cones:g,y:md(g.map(c=>c.bot)),spacing:sp,ratio:sz?sp/sz:0}});
 [...rows].sort((a,b)=>a.ratio-b.ratio).forEach((r,i)=>r.row=['50','80','120'][i]);rows.forEach(r=>r.cones.forEach((c,i)=>{c.row=r.row;c.idx=i}));return rows}
// frames: [{t,blobs}]；回傳踢樁事件
function trackKicks(rows,frames,o){const cs=rows.flatMap(r=>r.cones.map(c=>({...c,rad:Math.min(3*c.bh,0.45*r.spacing||1),runA:null,moved:false,gone:false})));const ev=[];
 for(const f of frames)for(const c of cs){if(c.gone)continue;let b=null,bd=1e9;for(const x of f.blobs){const d=Math.hypot((x.cx-c.cx),(x.bot-c.bot));if(d<bd&&d<=c.rad){bd=d;b=x}}
  const ok=b&&bd<=o.dispThr*c.bh&&b.area/c.area>0.5&&b.area/c.area<2&&b.bh/c.bh>0.6;
  if(ok){c.runA=null;c.moved=false;continue}
  if(c.runA==null)c.runA=f.t;if(b)c.moved=true;const dur=f.t-c.runA;
  if((c.moved&&b&&dur>=o.kickPersist)||dur>=o.missPersist){ev.push({t:+c.runA.toFixed(1),type:'fault',fault:'kick',value:1,row:c.row,ai:true,cone:c.idx+1});
   if(b)Object.assign(c,{cx:b.cx,cy:b.cy,bot:b.bot,bh:b.bh,area:b.area});else c.gone=true;c.runA=null;c.moved=false}}
 return ev.sort((a,b)=>a.t-b.t)}
// ankles: [{t,x,y}]；估計未穿過的樁間
function estimateGaps(rows,ankles,o){const ys=rows.map(r=>r.y).sort((a,b)=>a-b),dmin=Math.min(...ys.slice(1).map((y,i)=>y-ys[i]));const band=o.bandK*(isFinite(dmin)?dmin:0.1);
 const per=rows.map(r=>{const c=r.cones,miss=[];for(let i=0;i+1<c.length;i++){const a=c[i].cx,b=c[i+1].cx;if(!ankles.some(p=>p.x>a&&p.x<b&&Math.abs(p.y-r.y)<=band))miss.push(i+1)}return{row:r.row,gaps:c.length-1,missed:miss.length,list:miss}});
 return{per,total:per.reduce((s,p)=>s+p.missed,0)}}
if(typeof module!=='undefined')module.exports={CONE_DEFAULTS,rgb2hsv,findBlobs,clusterRows,trackKicks,estimateGaps};
