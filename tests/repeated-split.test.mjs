import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){
  const start=html.search(new RegExp('(?:async )?function '+name+'\\('));
  assert.ok(start>=0,`Missing ${name}`);
  const line=html.slice(start,html.indexOf('\n',start));
  return line.endsWith('}')?line:html.slice(start,html.indexOf('\n}',start)+2);
}
const ctx=vm.createContext({clearHTMLPlaybackWatch(){}});
for(const name of ['splitPauseAllowed','splitPhraseBoundary','splitChunkPositions',
  'repeatedTimeline','repeatedAudioRanges','computeParts','partKey','partStep',
  'terminalMuallimTailEnd','splitBounds','stepBounds','stepReps','buildPartsPlan'])vm.runInContext(source(name),ctx);
vm.runInContext('var pieceCursor=0; var plan=[],pi=0,pr=0,playing=true,useWA=true,AD_=null,splitParts=[],wordArr=[],ayGi={},curS=2,SET={cumu:true,repOn:true,rep:3,startPad:0,endPad:0};',ctx);

function assertClips(raw,lo,hi,ranges){
  for(const [pos,from,to] of raw){
    const coverage=ranges.filter(r=>r.f<=from&&r.t>=to).length;
    assert.equal(coverage,pos>=lo&&pos<=hi?1:0,`position ${pos} at ${from}`);
    if(pos<lo||pos>hi)for(const r of ranges)assert.ok(r.t<=from||r.f>=to,`excluded position ${pos}`);
  }
}

test('a repeated middle phrase is retained exactly in isolated, cumulative and selected-range parts',async()=>{
  // One canonical phrase is reread after position 13.
  const raw=[];let t=1000;
  for(const pos of [...Array.from({length:13},(_,i)=>i+1),...Array.from({length:10},(_,i)=>i+7)]){
    raw.push([pos,t,t+100]);t+=120;
  }
  const range=[950,t+50],timeline=ctx.repeatedTimeline(raw,16,range);
  assert.ok(timeline);
  for(const [lo,hi] of [[1,5],[6,10],[7,13],[10,16],[1,10],[1,16]]){
    const clips=ctx.repeatedAudioRanges(timeline,lo,hi,range,16);
    assertClips(raw,lo,hi,clips);
    if(lo===1&&hi===16)assert.equal(clips.length,1);
    if(lo===6&&hi===10)assert.ok(clips.length>1);
  }
  ctx.AD_={verseRanges:{14:range},verseSegments:{14:raw},buffer:null,verifiedCbr:true};
  ctx.wordArr=Array.from({length:16},(_,gi)=>({gi,ay:14,pos:gi+1,txt:'وَاللَّهُ',joinNext:false}));
  ctx.ayGi={14:[0,15]};ctx.QTEXT={2:Array.from({length:14},()=>[null,null,[]])};
  ctx.QTEXT[2][13][2]=ctx.wordArr.map(w=>[w.txt,0]);
  const parts=ctx.computeParts(14);ctx.splitParts=parts;
  assert.ok(parts.length>=3);
  assert.ok(parts.every(p=>p.words.length<=8));
  const plan=ctx.buildPartsPlan(0);
  assert.ok(plan.some(p=>p.combo));
  for(const st of plan){
    const hi=parts[st.part].words.at(-1).pos;
    const lo=st.combo?1:parts[st.part].words[0].pos;
    assertClips(raw,lo,hi,st.ranges);
    for(let i=0;i<st.ranges.length;i++){
      ctx.pieceCursor=i;
      const b=ctx.stepBounds(st);
      assert.equal(b.f,st.ranges[i].f);
      assert.equal(b.t,st.ranges[i].t);
    }
  }
  // Exercise the actual selected-range action: its cumulative prefix starts
  // at fi, so no earlier unselected words may enter its combined step.
  let captured=null;
  Object.assign(ctx,{
    ac:()=>({state:'running'}),stopPlan(){},renderSplit(){},updateSplitIntro(){},
    ensureSplitAudio:async()=>{},runPlan:p=>{captured=p;},toast(){},
    $:()=>({classList:{contains:()=>true}}),audioRequestId:0,splitAy:14,curS:2,splitSelIdx:0
  });
  ctx.AD_.splitBuf={ay:14,lo:range[0],hi:range[1],shift:0};
  vm.runInContext(source('startPartsRange'),ctx);
  await ctx.startPartsRange(1,Math.min(2,parts.length-1));
  assert.ok(captured?.some(st=>st.combo));
  for(const st of captured){
    const lo=st.combo?parts[1].words[0].pos:parts[st.part].words[0].pos;
    const hi=parts[st.part].words.at(-1).pos;
    assertClips(raw,lo,hi,st.ranges);
  }
  // A measured fixed offset belongs to this exact recording and must reach
  // both individual and cumulative multi-take clips after PCM preparation.
  ctx.AD_.verifiedCbr=false;ctx.AD_.reciterId=3;ctx.AD_.splitBuf.shift=875;
  const shifted=ctx.computeParts(14);ctx.splitParts=shifted;
  const shiftedPlan=ctx.buildPartsPlan(0);
  for(let i=0;i<parts.length;i++)for(let j=0;j<parts[i].ranges.length;j++){
    assert.equal(shifted[i].ranges[j].f,parts[i].ranges[j].f+875);
    assert.equal(shifted[i].ranges[j].t,parts[i].ranges[j].t+875);
  }
  for(let i=0;i<plan.length;i++)for(let j=0;j<plan[i].ranges.length;j++){
    assert.equal(shiftedPlan[i].ranges[j].f,plan[i].ranges[j].f+875);
    assert.equal(shiftedPlan[i].ranges[j].t,plan[i].ranges[j].t+875);
  }
  const played=[],expected=[];
  Object.assign(ctx,{
    cancelFade(){},stopSrc(){},cancelHTMLFade(){},updateStat(){},
    pauseThen(fn){fn();},goStep(){played.push([ctx.pi,ctx.pr,ctx.pieceCursor,...Object.values(ctx.stepBounds(ctx.plan[ctx.pi]))]);},
    finishPlan(){played.push(['finished']);}
  });
  ctx.plan=shiftedPlan;ctx.pi=0;ctx.pr=0;ctx.pieceCursor=0;ctx.useWA=true;
  vm.runInContext('var htmlBtimer=null;',ctx);
  vm.runInContext(source('handleBoundary'),ctx);
  for(let i=0;i<shiftedPlan.length;i++)for(let rep=0;rep<3;rep++)
    for(let clip=0;clip<shiftedPlan[i].ranges.length;clip++){
      const {f,t}=shiftedPlan[i].ranges[clip];expected.push([i,rep,clip,f,t]);
    }
  ctx.goStep();
  for(let i=0;i<expected.length;i++)ctx.handleBoundary();
  assert.deepEqual(played,[...expected,['finished']]);
});

test('one group repeats all its disjoint audio ranges N times',()=>{
  const calls=[];
  Object.assign(ctx,{cancelFade(){},stopSrc(){},cancelHTMLFade(){},goStep(){calls.push(['play',ctx.pieceCursor,ctx.pr]);},updateStat(){},pauseThen(fn){fn();},finishPlan(){calls.push(['finished']);}});
  vm.runInContext('var htmlBtimer=null; var activeStep={ranges:[{f:10,t:20},{f:30,t:40}],dyn:true,part:0}; plan=[activeStep];pi=0;pr=0;pieceCursor=0;playing=true;',ctx);
  vm.runInContext(source('handleBoundary'),ctx);
  for(let i=0;i<6;i++)ctx.handleBoundary();
  assert.deepEqual(calls,[['play',1,0],['play',0,1],['play',1,1],['play',0,2],['play',1,2],['finished']]);
});

test('an incomplete PCM window cannot silently truncate a repeated take',()=>{
  let stopped=false,warning='';
  ctx.AD_={splitBuf:{ay:14,lo:100,hi:300},buffer:null};
  ctx.plan=[{preserveTail:true,wholeVerse:false,cutKey:'14:4',ranges:[{f:250,t:350}]}];
  ctx.pi=0;ctx.pieceCursor=0;
  Object.assign(ctx,{stopPlan:()=>{stopped=true;},toast:s=>{warning=s;}});
  vm.runInContext(source('seekPlay'),ctx);
  const b=ctx.stepBounds(ctx.plan[0]);
  assert.equal(b.t,350);
  ctx.seekPlay(b.f,b.t);
  assert.equal(stopped,true);
  assert.match(warning,/tam ses doğrulanamadı/);
});

test('source catalog repeat metadata never assigns excluded words to a clip',()=>{
  let checked=0;
  for(const folder of ['assets/verified-audio/']){
    for(const file of fs.readdirSync(new URL('../'+folder,import.meta.url)).filter(f=>f.endsWith('.json'))){
      const data=JSON.parse(fs.readFileSync(new URL('../'+folder+file,import.meta.url),'utf8'));
      for(const verse of data.verse_timings){
        const raw=verse.segments||[],count=Math.max(0,...raw.map(s=>s[0]));
        const timeline=ctx.repeatedTimeline(raw,count,[verse.timestamp_from,verse.timestamp_to]);
        if(!timeline)continue;
        checked++;
        for(let lo=1;lo<=count;lo+=5){
          const hi=Math.min(count,lo+4);
          assertClips(raw,lo,hi,ctx.repeatedAudioRanges(timeline,lo,hi,[verse.timestamp_from,verse.timestamp_to],count));
        }
      }
    }
  }
  assert.ok(checked>5000,`only ${checked} repeated verses checked`);
});
