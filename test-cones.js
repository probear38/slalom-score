const C=require('./cones.js'),P=require('./pose.js'),a=require('assert'),o=C.CONE_DEFAULTS;
// 合成畫面 320x180：三排橘色樁（遠排小而密=50cm？以 間距/高度 判斷）
function scene(mods={}){const w=320,h=180,data=new Uint8ClampedArray(w*h*4).fill(60);for(let i=3;i<data.length;i+=4)data[i]=255;
 const rows=[{y:60,n:20,sp:12,sz:4},{y:100,n:20,sp:14,sz:4},{y:150,n:14,sp:20,sz:4}],cones=[];// ratio 3,3.5,5
 rows.forEach((r,ri)=>{for(let i=0;i<r.n;i++){let x=20+i*r.sp,y=r.y;const k=ri+'-'+i;if(mods[k]==='gone')continue;if(mods[k])x+=mods[k];
  for(let dy=-r.sz;dy<0;dy++)for(let dx=-1;dx<=1;dx++){const p=((y+dy)*w+x+dx)*4;data[p]=255;data[p+1]=120;data[p+2]=0}}});return{data,w,h}}
const tgt=C.rgb2hsv(255,120,0);let b=C.findBlobs(scene(),tgt,o);a.equal(b.length,54);
let rows=C.clusterRows(b);a.deepEqual(rows.map(r=>[r.row,r.cones.length]),[['50',20],['80',20],['120',14]]);
// 踢樁：1-5 號在 t=2 位移 5px 並維持
const fr=[];for(let t=0;t<6;t+=0.1)fr.push({t:+t.toFixed(1),blobs:C.findBlobs(scene(t>=2?{'1-5':5}:{}),tgt,o)});
let k=C.trackKicks(rows,fr,o);a.equal(k.length,1);a.equal(k[0].row,'80');a.equal(k[0].t,2);a.equal(k[0].cone,6);
// 短暫遮擋（消失 1 秒）不算
const fr2=[];for(let t=0;t<6;t+=0.1)fr2.push({t:+t.toFixed(1),blobs:C.findBlobs(scene(t>=2&&t<3?{'2-3':'gone'}:{}),tgt,o)});a.equal(C.trackKicks(rows,fr2,o).length,0);
// 被踢飛（消失 >3 秒）算
const fr3=[];for(let t=0;t<6;t+=0.1)fr3.push({t:+t.toFixed(1),blobs:C.findBlobs(scene(t>=1?{'2-3':'gone'}:{}),tgt,o)});k=C.trackKicks(rows,fr3,o);a.equal(k.length,1);a.equal(k[0].row,'120');
// 漏樁：腳踝走過 80cm 排所有樁間除了第 3、4 間
const r80=rows.find(r=>r.row=='80'),an=[];r80.cones.forEach((c,i)=>{if(i<r80.cones.length-1&&i!=2&&i!=3)an.push({t:i,x:(c.cx+r80.cones[i+1].cx)/2,y:r80.y})});
const g=C.estimateGaps(rows,an,o);a.deepEqual(g.per.find(p=>p.row=='80').list,[3,4]);a.equal(g.per.find(p=>p.row=='50').missed,19);
// 招式：交叉、蛇形、單腳、蹲坐名稱
function lm(f){const L=[];for(let i=0;i<33;i++)L[i]={x:f.x,y:0.5,z:0,visibility:1};L[0]={x:f.x,y:0.32,z:0,visibility:1};L[11]={x:f.x-.05,y:.4,z:0,visibility:1};L[12]={x:f.x+.05,y:.4,z:0,visibility:1};
 L[23]={x:f.x-.03,y:f.hip||.55,z:0,visibility:1};L[24]={x:f.x+.03,y:f.hip||.55,z:0,visibility:1};L[25]={x:f.x-.03,y:.7,z:0,visibility:1};L[26]={x:f.x+.03,y:.7,z:0,visibility:1};
 L[27]={x:f.x+(f.lx??-.03),y:.85-(f.ll||0),z:0,visibility:1};L[28]={x:f.x+(f.rx??.03),y:.85,z:0,visibility:1};return L}
const S=(n,fn)=>Array.from({length:n},(_,i)=>({t:+(i*.1).toFixed(1),lm:lm({x:.2+i*.012,...fn(i)})}));
const names=fr=>P.analyze(fr).events.filter(e=>e.name).map(e=>e.name);
a.ok(names(S(40,i=>({lx:i>=10&&i<25?(Math.floor((i-10)/4)%2?-.04:.04):-.04,rx:i>=10&&i<25?(Math.floor((i-10)/4)%2?.04:-.04):.04}))).includes('交叉 Cross'));
a.ok(names(S(40,i=>i>=10&&i<30?{lx:-.06,rx:.06}:{})).includes('蛇形 Snake'));
a.ok(names(S(40,i=>i>=10&&i<25?{ll:.08}:{})).includes('單腳/單輪（可能）'));
a.ok(names(S(40,()=>({}))).length==0);
a.ok(names(S(40,i=>i>=10&&i<20?{hip:.72,ll:.1}:{})).includes('單腳蹲（槍式）'));
a.ok(names(S(40,i=>i>=10&&i<20?{hip:.72}:{})).includes('雙腳蹲坐'));
a.equal(P.snippet(S(30,()=>({})),1,2).length,11);
console.log('all cone/trick tests passed');
