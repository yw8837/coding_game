import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCareer} from './career-evaluation.ts';
const evaluate=(rows:string)=>evaluateCareer('workshop-slots',{'schedule.csv':'id,start,end\n'+rows+'\n'});
test('three one-hour classes admit ordered alternatives within the stated 09–13 window',()=>{
 for(const rows of ['A,09:00,10:00\nB,10:00,11:00\nC,11:00,12:00','A,10:00,11:00\nB,11:00,12:00\nC,12:00,13:00','A,09:15,10:15\nB,10:30,11:30\nC,11:45,12:45','C,12:00,13:00\nA,09:00,10:00\nB,10:30,11:30'])assert.equal(evaluate(rows).passed,true,rows);
});
test('ordering, availability, duration, overlap, IDs and class count still constrain alternatives',()=>{
 for(const rows of ['A,08:59,09:59\nB,10:00,11:00\nC,11:00,12:00','A,10:01,11:01\nB,11:01,12:01\nC,12:01,13:01','B,09:00,10:00\nA,10:00,11:00\nC,11:00,12:00','A,09:00,10:00\nB,09:59,10:59\nC,11:00,12:00','A,09:00,10:01\nB,10:01,11:01\nC,11:01,12:01','A,09:00,10:00\nB,10:00,11:00','A,09:00,10:00\nB,10:00,11:00\nC,11:00,12:00\nD,12:00,13:00'])assert.equal(evaluate(rows).passed,false,rows);
});
