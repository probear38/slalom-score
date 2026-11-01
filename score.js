// 純計分邏輯（瀏覽器與 node 共用）
const FAMILIES={sit:'蹲坐',jump:'跳躍',spin:'旋轉',wheel:'單輪',other:'其他'};
const FAULTS={kick:{n:'踢樁',d:1},gap:{n:'漏樁(樁間)',d:0},balance:{n:'失衡',d:1},fall:{n:'摔倒',d:3},stop:{n:'自身中斷',d:5},costume:{n:'服飾/眼鏡掉落',d:2}};
function compute(s){
  const tricks=s.log.filter(e=>e.type==='trick'&&e.valid!==false);
  const fams=new Set(tricks.map(t=>t.family));
  const missing=Object.keys(FAMILIES).filter(f=>!fams.has(f));
  const rows=new Set(tricks.map(t=>t.row));
  const missTricks=Math.max(0,8-tricks.length);
  const tech=Math.min(60,Math.max(10,+s.tech||10));
  const art=Math.min(70,Math.max(0,+s.art||0));
  const techDed=missTricks*2+missing.length*3;
  let pen=0,gaps=0;const detail={};
  for(const e of s.log.filter(e=>e.type==='fault')){
    if(e.fault==='gap'){gaps+=(+e.value||1);continue;}
    let v=+e.value||FAULTS[e.fault].d;
    if(e.fault==='balance')v=Math.min(1.5,Math.max(0.5,v));
    if(e.fault==='fall')v=Math.min(5,Math.max(2,v));
    pen+=v;detail[e.fault]=(detail[e.fault]||0)+v;
  }
  if(gaps>5){pen+=5;detail.gap=5;}
  const t=+s.duration||0;const timeOk=t>=105&&t<=120;
  if(t&&!timeOk){pen+=10;detail.time=10;}
  const total=Math.round((tech+art-techDed-pen)*10)/10;
  return {tricks:tricks.length,missing,missTricks,rows:[...rows].sort(),rowsOk:rows.size===3,tech,art,techDed,pen,gaps,detail,timeOk,total};
}
if(typeof module!=='undefined')module.exports={compute,FAMILIES,FAULTS};
