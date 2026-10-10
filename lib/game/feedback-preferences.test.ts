import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_FEEDBACK_PREFERENCES,readFeedbackPreferences,feedbackVolumeGain} from './feedback-preferences.ts';

test('missing, malformed and foreign preferences recover without touching a save',()=>{
 for(const raw of [null,'{','null','1','"muted"'])assert.deepEqual(readFeedbackPreferences(raw),DEFAULT_FEEDBACK_PREFERENCES);
 assert.deepEqual(readFeedbackPreferences('{"master":-5,"ui":1000,"events":"0","reducedMotion":true}'),{master:0,ui:100,events:100,reducedMotion:true});
 assert.equal(readFeedbackPreferences('{"reducedMotion":"false"}').reducedMotion,false);
});
test('volume curve has a real silent endpoint and bounded perceptual gain',()=>{
 assert.equal(feedbackVolumeGain(0),0);assert.equal(feedbackVolumeGain(NaN),0);
 assert.equal(feedbackVolumeGain(100),1);assert.equal(feedbackVolumeGain(1000),1);
 assert.ok(Math.abs(feedbackVolumeGain(50)-.2511886432)<1e-8);
 assert.ok(feedbackVolumeGain(1)>0&&feedbackVolumeGain(1)<feedbackVolumeGain(50));
});
