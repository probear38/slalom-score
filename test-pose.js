const {analyze,refScores}=require('./pose.js');const a=require('assert');
// 合成站立骨架：肩 0.4、髖 0.55、膝 0.7、踝 0.85
function pose({x=0.5,dy=0,hip=0.55,knee=0.7,ank=0.85,sh=0.4,ang=0,armDx=0}){const lm=[];for(let i=0;i<33;i++)lm[i]={x,y:0.5,z:0,visibility:1};
 const c=Math.cos(ang)*0.05,s=Math.sin(ang)*0.05;lm[0]={x,y:sh-0.08+dy,z:0,visibility:1};
 lm[11]={x:x-c,y:sh+dy,z:-s,visibility:1};lm[12]={x:x+c,y:sh+dy,z:s,visibility:1};
 lm[15]={x:x-0.1-armDx,y:hip+dy,z:0,visibility:1};lm[16]={x:x+0.1+armDx,y:hip+dy,z:0,visibility:1};
 for(const[i,y]of[[23,hip],[24,hip],[25,knee],[26,knee],[27,ank],[28,ank]])lm[i]={x:x+(i%2?-0.03:0.03),y:y+dy,z:0,visibility:1};return lm}
const seq=(n,fn,t0=0)=>Array.from({length:n},(_,i)=>({t:+(t0+i*0.1).toFixed(1),lm:pose(fn(i))}));
// 1 靜止 3 秒 → 無事件、無開始
let r=analyze(seq(30,()=>({})));a.equal(r.events.length,0);a.equal(r.start,null);
// 2 蹲坐：髖降到膝下 1 秒
r=analyze(seq(50,i=>({x:0.3+i*0.005,...(i>=20&&i<30?{hip:0.72,sh:0.6}:{})})));a.deepEqual(r.events.filter(e=>e.family=='sit').map(e=>e.t),[2]);
// 3 跳躍：雙踝與全身上升 0.05
r=analyze(seq(50,i=>({x:0.3+i*0.005,dy:i>=25&&i<28?-0.05:0})));a.equal(r.events.filter(e=>e.family=='jump').length,1);
// 單腳抬起不算跳
let fr=seq(50,i=>({x:0.3+i*0.005}));for(let i=25;i<28;i++)fr[i].lm[27].y-=0.1;r=analyze(fr);a.equal(r.events.filter(e=>e.family=='jump').length,0);
// 4 旋轉：1.5 秒轉 360°
r=analyze(seq(50,i=>({ang:i>=20&&i<=35?(i-20)/15*2*Math.PI:0})));a.equal(r.events.filter(e=>e.family=='spin').length,1);
// 半圈不算
r=analyze(seq(50,i=>({ang:i>=20&&i<=35?(i-20)/15*Math.PI:0})));a.equal(r.events.filter(e=>e.family=='spin').length,0);
// 5 摔倒：0.3 秒內軀幹倒到地面
r=analyze(seq(50,i=>i<25?{}:i<28?{sh:0.4+(i-24)*0.13,hip:0.55+(i-24)*0.09}:{sh:0.82,hip:0.83,knee:0.84}));a.equal(r.events.filter(e=>e.fault=='fall').length,1);
// 蹲坐不是摔倒
r=analyze(seq(50,i=>i>=20&&i<30?{hip:0.72,sh:0.6}:{}));a.equal(r.events.filter(e=>e.fault=='fall').length,0);
// 6 失衡：手臂突然大幅甩動
r=analyze(seq(50,i=>({armDx:i==25?0.25:0})));a.ok(r.events.some(e=>e.fault=='balance'));
// 7 開始/結束：1–4 秒移動
r=analyze(seq(60,i=>({x:0.3+(i>=10&&i<=40?(i-10)*0.01:i>40?0.3:0)})));a.ok(Math.abs(r.start-1)<=0.2&&Math.abs(r.end-4)<=0.2,`${r.start} ${r.end}`);
// 低可見度 frame 被忽略
fr=seq(10,()=>({}));fr.forEach(f=>f.lm[27].visibility=0.1);a.equal(analyze(fr).frames,0);
const rs=refScores(analyze(seq(50,i=>({x:0.3+i*0.005,dy:i>=25&&i<28?-0.05:0}))),110);a.ok(rs.tech[0]>=10&&rs.tech[1]<=60&&rs.art[1]<=70);
console.log('all pose tests passed');
