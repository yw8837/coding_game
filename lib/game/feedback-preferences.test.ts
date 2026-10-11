import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_FEEDBACK_PREFERENCES,readFeedbackPreferences,feedbackVolumeGain,effectsVolume,withEffectsVolume} from './feedback-preferences.ts';

test('missing, malformed and foreign preferences recover without touching a save',()=>{
 for(const raw of [null,'{','null','1','"muted"'])assert.deepEqual(readFeedbackPreferences(raw),DEFAULT_FEEDBACK_PREFERENCES);
 assert.deepEqual(readFeedbackPreferences('{"master":-5,"ui":1000,"events":"0","reducedMotion":true}'),{master:0,ui:100,events:100,bgm:45,reducedMotion:true});
 assert.equal(readFeedbackPreferences('{"reducedMotion":"false"}').reducedMotion,false);
});
test('volume curve has a real silent endpoint and bounded perceptual gain',()=>{
 assert.equal(feedbackVolumeGain(0),0);assert.equal(feedbackVolumeGain(NaN),0);
 assert.equal(feedbackVolumeGain(100),1);assert.equal(feedbackVolumeGain(1000),1);
 assert.ok(Math.abs(feedbackVolumeGain(50)-.2511886432)<1e-8);
 assert.ok(feedbackVolumeGain(1)>0&&feedbackVolumeGain(1)<feedbackVolumeGain(50));
});
test('saved music volume is restored and older settings gain the default',()=>{
 assert.equal(readFeedbackPreferences('{"master":60,"ui":50,"events":70,"reducedMotion":false}').bgm,DEFAULT_FEEDBACK_PREFERENCES.bgm);
 assert.equal(readFeedbackPreferences('{"bgm":12.4}').bgm,12);assert.equal(readFeedbackPreferences('{"bgm":400}').bgm,100);
});
test('one effects slider keeps the interface/reward balance',()=>{
 const base={...DEFAULT_FEEDBACK_PREFERENCES,ui:40,events:80};
 assert.equal(effectsVolume(base),80);
 assert.deepEqual([withEffectsVolume(base,40).ui,withEffectsVolume(base,40).events],[20,40]);
 assert.deepEqual([withEffectsVolume({...base,ui:0,events:0},30).ui,withEffectsVolume({...base,ui:0,events:0},30).events],[30,30]);
 assert.equal(withEffectsVolume(base,NaN).events,0);assert.equal(withEffectsVolume(base,250).events,100);
});
