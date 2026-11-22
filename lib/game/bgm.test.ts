import test from 'node:test';
import assert from 'node:assert/strict';
import {BGM_BPM,BGM_LOOKAHEAD,BGM_LOOP_STEPS,BGM_MASTER_DB,BGM_MOODS,BGM_PROGRESSION,BGM_STEPS_PER_BAR,SYNTHWAVE_BPM,SYNTHWAVE_GATES,SYNTHWAVE_LOOP_STEPS,SYNTHWAVE_PROGRESSION,bgmLevel,bgmMood,bgmStep,createBgmPlayer,synthwaveStep} from './bgm.ts';
import {dbGain} from './audio-feedback.ts';
import {DEFAULT_FEEDBACK_PREFERENCES,feedbackVolumeGain} from './feedback-preferences.ts';

function fakeContext(){
 const param=()=>({value:0,events:[] as Array<[string,number]>,setValueAtTime(v:number){this.events.push(['set',v]);},linearRampToValueAtTime(v:number){this.events.push(['linear',v]);},exponentialRampToValueAtTime(v:number){this.events.push(['exp',v]);},setTargetAtTime(v:number){this.events.push(['target',v]);},cancelScheduledValues(){}});
 const started:string[]=[],log:Array<{kind:string;type:string;at:number;frequency:number}>=[];
 const node=(kind:string)=>({kind,type:'',frequency:param(),detune:param(),Q:param(),gain:param(),buffer:null as unknown,onended:null as null|(()=>void),connect(){},disconnect(){},start(at=0){started.push(kind);log.push({kind,type:this.type,at,frequency:this.frequency.value});},stop(){}});
 // 생성 순서: gains[0]=출력, gains[1]=덕킹, filters[0]=마스터 톤 필터.
 const gains:ReturnType<typeof node>[]=[],filters:ReturnType<typeof node>[]=[];
 const ctx={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:()=>{const gain=node('gain');gains.push(gain);return gain;},createBiquadFilter:()=>{const filter=node('filter');filters.push(filter);return filter;},createOscillator:()=>node('osc'),createBufferSource:()=>node('noise'),createBuffer:(_c:number,length:number)=>({getChannelData:()=>new Float32Array(length)})};
 return {ctx:ctx as unknown as AudioContext,raw:ctx,started,log,gains,filters};
}

test('the loop is deterministic, wraps cleanly and stays in a soft register',()=>{
 assert.equal(BGM_LOOP_STEPS,128);
 assert.deepEqual(bgmStep(0),bgmStep(BGM_LOOP_STEPS));assert.deepEqual(bgmStep(-1),bgmStep(BGM_LOOP_STEPS-1));
 assert.deepEqual(bgmStep(0).pad,BGM_PROGRESSION[0].chord);assert.equal(bgmStep(0).bass,BGM_PROGRESSION[0].root);
 for(let step=0;step<BGM_LOOP_STEPS;step++){
  const s=bgmStep(step);
  for(const note of s.pad??[])assert.ok(note>=55&&note<=72);
  if(s.bass!==undefined)assert.ok(s.bass>=33&&s.bass<=52);
  if(s.pluck!==undefined){assert.ok(step>=64,'arpeggio waits for the second half');assert.ok(s.pluck<=84);}
 }
});

test('mute, master and music sliders all reach a true zero',()=>{
 const mix=DEFAULT_FEEDBACK_PREFERENCES;
 assert.equal(bgmLevel(false,mix),0);assert.equal(bgmLevel(true,{...mix,bgm:0}),0);assert.equal(bgmLevel(true,{...mix,master:0}),0);
 assert.equal(bgmLevel(true,{...mix,master:100,bgm:100}),dbGain(BGM_MASTER_DB));
 assert.equal(bgmLevel(true,mix),dbGain(BGM_MASTER_DB)*feedbackVolumeGain(mix.master)*feedbackVolumeGain(mix.bgm));
});

test('the player schedules ahead only while started and fades instead of clicking',()=>{
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx);
 assert.equal(player.playing,false);assert.equal(audio.started.length,0);
 player.setLevel(.2);player.start();
 assert.equal(player.playing,true);assert.ok(audio.started.includes('osc'),'first bar is scheduled immediately');
 const count=audio.started.length;player.start();assert.equal(audio.started.length,count,'start is idempotent');
 player.stop();assert.equal(player.playing,false);player.dispose();player.start();assert.equal(player.playing,false,'a disposed player stays silent');
});

test('lofi stays the default mood and its loop is unchanged',()=>{
 const lofi=BGM_MOODS.lofi;
 assert.equal(lofi.step,bgmStep);assert.equal(BGM_BPM,84);
 assert.deepEqual({bpm:lofi.bpm,bars:lofi.bars,stepsPerBar:lofi.stepsPerBar,loopSteps:lofi.loopSteps,tone:lofi.tone},{bpm:84,bars:8,stepsPerBar:16,loopSteps:128,tone:2600});
 // 분위기 기능을 넣기 전 bgmStep 128칸 전체를 JSON으로 펼친 FNV-1a 해시.
 const json=JSON.stringify(Array.from({length:BGM_LOOP_STEPS},(_,i)=>bgmStep(i)));let hash=0x811c9dc5;
 for(const c of json){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)>>>0;}
 assert.equal(hash.toString(16),'3e1db9fb');
 for(const id of [undefined,null,'','jazz','LOFI'])assert.equal(bgmMood(id),'lofi',String(id));
 assert.equal(bgmMood('synthwave'),'synthwave');
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx);
 assert.equal(player.mood,'lofi');assert.equal(audio.filters[0].frequency.value,2600);
 player.setLevel(.2);player.start();
 const first=audio.log.filter(e=>e.at===audio.log[0].at).map(e=>e.type||e.kind).sort();
 assert.deepEqual(first,[...Array(5).fill('triangle'),...Array(5).fill('sawtooth'),'sine','osc','noise'].sort(),'Am9 pad, sine bass, kick and hat on beat one');
 player.stop();
});

test('synthwave is an 8-bar 104 BPM minor loop with gated pads, octave bass, backbeat snare and a late arpeggio',()=>{
 const mood=BGM_MOODS.synthwave;
 assert.equal(SYNTHWAVE_BPM,104);assert.equal(SYNTHWAVE_LOOP_STEPS,128);assert.equal(SYNTHWAVE_GATES,8);assert.equal(mood.step,synthwaveStep);
 assert.deepEqual({bpm:mood.bpm,bars:mood.bars,stepsPerBar:mood.stepsPerBar,loopSteps:mood.loopSteps},{bpm:104,bars:8,stepsPerBar:16,loopSteps:128});
 assert.deepEqual(synthwaveStep(0),synthwaveStep(SYNTHWAVE_LOOP_STEPS));assert.deepEqual(synthwaveStep(-1),synthwaveStep(SYNTHWAVE_LOOP_STEPS-1));
 assert.deepEqual(new Set(SYNTHWAVE_PROGRESSION[0].chord.map(n=>n%12)),new Set([4,7,11]),'the tonic is E minor');
 const harmonicMinor=new Set([4,6,7,9,11,0,2,3]);
 for(let step=0;step<SYNTHWAVE_LOOP_STEPS;step++){
  const s=synthwaveStep(step),bar=Math.floor(step/16),beat=step%16,{root,chord}=SYNTHWAVE_PROGRESSION[bar];
  assert.equal(s.pad,beat===0?chord:undefined);assert.equal(s.gate,beat===0?SYNTHWAVE_GATES:undefined);
  assert.equal(s.bass,beat%2===0?(beat%4===0?root:root+12):undefined,'octave bass pulses on every eighth');
  assert.equal(s.snare,beat===4||beat===12?1:undefined,'snare on 2 and 4');
  assert.equal(Boolean(s.hat),beat%2===0,'hats on eighths');
  if(s.lead!==undefined){assert.ok(bar>=4,'arpeggio waits for the second half');assert.ok(chord.includes(s.lead-12));assert.ok(s.lead<=84);}
  else if(bar>=4)assert.equal(beat%4,3,'the arpeggio only rests on the last sixteenth of each beat');
  for(const note of [...(s.pad??[]),...(s.bass===undefined?[]:[s.bass]),...(s.lead===undefined?[]:[s.lead])])assert.ok(harmonicMinor.has(note%12),'stays in E harmonic minor: '+note);
  for(const note of s.pad??[])assert.ok(note>=52&&note<=72);
  if(s.bass!==undefined)assert.ok(s.bass>=28&&s.bass<=57);
 }
});

test('synthwave renders one gated pad per bar through the same gain chain and fades like lofi',()=>{
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx,'synthwave');
 assert.equal(player.mood,'synthwave');assert.equal(audio.filters[0].frequency.value,BGM_MOODS.synthwave.tone);
 player.setLevel(.2);player.start();assert.deepEqual(audio.gains[0].gain.events.at(-1),['target',.2],'fades in to the music level');
 const first=audio.log.filter(e=>e.at===audio.log[0].at);
 assert.equal(first.filter(e=>e.type==='square').length,4);assert.equal(first.filter(e=>e.type==='sawtooth').length,5,'four pad saws plus the bass');
 assert.ok(first.some(e=>e.kind==='noise'),'a hat on the downbeat');
 // 엔벨로프 하나짜리 음성 게인과 달리 게이트 게인은 한 마디 동안 여러 번 여닫힌다.
 const gate=audio.gains.find(g=>g.gain.events.filter(e=>e[0]==='linear').length>2);
 assert.ok(gate,'a shared gate gain exists');
 const open=Math.max(...gate.gain.events.map(e=>e[1]));
 assert.equal(gate.gain.events.filter(e=>e[0]==='linear'&&e[1]===open).length,SYNTHWAVE_GATES,'it opens eight times per bar');
 assert.equal(audio.gains.filter(g=>g.gain.events.filter(e=>e[0]==='linear').length>2).length,1,'one gate per bar, not one node per eighth');
 const events=gate.gain.events;assert.deepEqual(events[0],['set',0]);assert.deepEqual(events.at(-1),['linear',0]);
 // 게이트는 선형 램프로만 움직이고, set은 이미 그 값에 있을 때만 찍어 순간 점프(딸깍)가 없다.
 assert.ok(events.every((e,i)=>e[0]==='linear'||i===0||(e[0]==='set'&&e[1]===events[i-1][1])));
 player.duck(-6);assert.deepEqual(audio.gains[1].gain.events.slice(-2),[['target',dbGain(-6)],['target',1]]);
 player.stop();assert.deepEqual(audio.gains[0].gain.events.at(-1),['target',0]);assert.equal(player.playing,false);
});

test('switching mood while playing waits for the bar line, then starts the new loop on beat one',t=>{
 t.mock.timers.enable({apis:['setInterval']});
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx);player.setLevel(.2);player.start();
 const drive=(until:number)=>{while(audio.raw.currentTime<until){audio.raw.currentTime+=.1;t.mock.timers.tick(60);}};
 player.setMood('synthwave');assert.equal(player.mood,'lofi','the current lofi bar keeps playing');
 const barLine=.08+BGM_STEPS_PER_BAR*60/BGM_BPM/4;
 // 스케줄러는 BGM_LOOKAHEAD만큼 앞서 예약하므로 마디선 직전 예약 창 밖에서는 아직 lofi다.
 drive(barLine-BGM_LOOKAHEAD-.2);assert.equal(player.mood,'lofi');
 drive(barLine);assert.equal(player.mood,'synthwave');
 const before=audio.log.filter(e=>e.at<barLine-1e-9),after=audio.log.filter(e=>e.at>=barLine-1e-9);
 assert.ok(before.every(e=>e.type!=='square'),'nothing from synthwave leaks into the lofi bar');
 assert.equal(after.filter(e=>Math.abs(e.at-barLine)<1e-9&&e.type==='square').length,4,'the gated pad lands exactly on the bar line');
 assert.ok(after.every(e=>e.type!=='triangle'),'no new lofi pads after the switch');
 const times=[...new Set(after.map(e=>e.at))].sort((a,b)=>a-b);
 assert.ok(times.length>=2&&Math.abs(times[1]-times[0]-2*60/SYNTHWAVE_BPM/4)<1e-9,'the next eighth (bass + hat) follows at 104 BPM');
 assert.deepEqual(audio.filters[0].frequency.events.at(-1),['target',BGM_MOODS.synthwave.tone],'the tone filter glides instead of jumping');
 player.stop();
});

test('mood changes apply at once while stopped, cancel when reselected, and land on stop',t=>{
 t.mock.timers.enable({apis:['setInterval']});
 const audio=fakeContext(),player=createBgmPlayer(audio.ctx,'bogus');assert.equal(player.mood,'lofi');
 player.setMood('synthwave');assert.equal(player.mood,'synthwave','a stopped player switches immediately');
 assert.deepEqual(audio.filters[0].frequency.events.at(-1),['target',BGM_MOODS.synthwave.tone]);
 player.setMood('???');assert.equal(player.mood,'lofi','unknown moods fall back to lofi');
 player.start();player.setMood('synthwave');player.setMood('lofi');
 while(audio.raw.currentTime<4){audio.raw.currentTime+=.1;t.mock.timers.tick(60);}
 assert.equal(player.mood,'lofi','reselecting the playing mood cancels the pending switch');
 assert.ok(audio.log.every(e=>e.type!=='square'),'only lofi was scheduled');
 player.setMood('synthwave');player.stop();assert.equal(player.mood,'synthwave','a pending switch lands when the music stops');
 player.dispose();
});
