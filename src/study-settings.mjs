const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validStudySettings(v){
  return object(v)&&Object.keys(v).length===7&&['reciter','speed','rep','repOn','wait','mode','splitCombine'].every(k=>Object.hasOwn(v,k))&&
    Number.isInteger(v.reciter)&&v.reciter>0&&v.reciter<=1000&&Number.isFinite(v.speed)&&v.speed>=0.5&&v.speed<=2&&
    Number.isInteger(v.rep)&&v.rep>=1&&v.rep<=99&&typeof v.repOn==='boolean'&&
    Number.isFinite(v.wait)&&v.wait>=0&&v.wait<=60&&['range','verse','cumulative'].includes(v.mode)&&typeof v.splitCombine==='boolean';
}
export function validStudyProgress(v,from,to){
  return object(v)&&Object.keys(v).every(k=>['ay','part','completed'].includes(k))&&
    Number.isInteger(v.ay)&&v.ay>=from&&v.ay<=to&&typeof v.completed==='boolean'&&
    (v.part===undefined||(Number.isInteger(v.part)&&v.part>=0&&v.part<1000));
}
