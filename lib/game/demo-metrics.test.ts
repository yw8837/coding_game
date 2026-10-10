import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDemoPulse,dashboardOwnerAllowed,stageLabel} from '../demo-metrics.ts';

test('telemetry only accepts bounded stages, intervals and known fields',()=>{
 const pulse={session:'03fd149f-3c09-4cc3-baa9-5fb80acd5200',language:'ko',stage:'cafe-0-sign',seconds:15,mode:'new'};
 assert.equal(validDemoPulse(pulse),true);
 for(const patch of [{seconds:31},{seconds:-1},{seconds:Infinity},{stage:'user code'},{language:'fr'},{mode:'x'},{source:'secret source code'},{session:'guessable'}])assert.equal(validDemoPulse({...pulse,...patch}),false);
 assert.equal(validDemoPulse(null),false);
 assert.equal(stageLabel('cafe-0-sign'),'1장 · 카페 이름 고치기');
});
test('dashboard is denied without configured owner and never grants other accounts',()=>{
 assert.equal(dashboardOwnerAllowed(null,'owner@example.invalid'),false);
 assert.equal(dashboardOwnerAllowed({email:'owner@example.invalid'},undefined),false);
 assert.equal(dashboardOwnerAllowed({email:'visitor@example.invalid'},'owner@example.invalid'),false);
 assert.equal(dashboardOwnerAllowed({email:'Owner@Example.Invalid'},'owner@example.invalid'),true);
});
