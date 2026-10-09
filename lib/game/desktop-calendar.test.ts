import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarMonth,calendarWeeks,recentEditorFiles} from './desktop-calendar.ts';
import {createGame,runCommand} from './engine.ts';

test('calendar shows the actual leap month with complete weekday rows and one today',()=>{
 const now=new Date(2024,1,29,23,59),weeks=calendarWeeks(calendarMonth(now),now),days=weeks.flat();
 assert.equal(weeks.length,6);assert.ok(weeks.every(row=>row.length===7));
 assert.equal(days.filter(day=>day.inMonth).length,29);
 assert.equal(days[0].date.getDay(),0);assert.equal(days.at(-1)!.date.getDay(),6);
 assert.equal(days.filter(day=>day.today).length,1);assert.equal(days.find(day=>day.today)!.date.getDate(),29);
 assert.equal(calendarMonth(now,1).getMonth(),2);assert.equal(calendarMonth(new Date(2026,0,31),-1).getFullYear(),2025);
});

test('current day is not falsely highlighted when browsing a different month',()=>{
 const now=new Date(2026,9,9);
 assert.equal(calendarWeeks(calendarMonth(now,-2),now).flat().filter(day=>day.today).length,0);
});

test('recent files follow real successful local code history, deduplicate and cap at three',()=>{
 let state=createGame();
 for(const file of ['first.js','second.js','third.js','fourth file.js']){
  state.machines.local.files[`/home/dev/${file}`]='';
  state=runCommand(state,`code "${file}"`).state;
 }
 state=runCommand(state,'code ./first.js').state;
 state=runCommand(state,'code missing.js').state;
 assert.deepEqual(recentEditorFiles(state.history,state.machines.local.files),['/home/dev/first.js','/home/dev/fourth file.js','/home/dev/third.js']);
 delete state.machines.local.files['/home/dev/first.js'];
 assert.deepEqual(recentEditorFiles(state.history,state.machines.local.files),['/home/dev/fourth file.js','/home/dev/third.js','/home/dev/second.js']);
});

test('echo output, failed commands, remote files and malformed history do not count',()=>{
 const files={'/home/dev/a.js':''},base={cwd:'/home/dev',error:false,machine:'local' as const,output:'Opening /home/dev/a.js'};
 assert.deepEqual(recentEditorFiles([
  {...base,command:'echo Opening /home/dev/a.js'},
  {...base,command:'code a.js',error:true},
  {...base,command:'code a.js',machine:'server'},
  {...base,command:'code "a.js'},
  {...base,command:'code a.js; echo yes'},
  {...base,command:'code a.js',output:'Something else'},
 ],files),[]);
});
