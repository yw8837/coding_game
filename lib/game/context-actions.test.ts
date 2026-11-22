import test from 'node:test';
import assert from 'node:assert/strict';
import {shellPath,siblingPath,insertClipboard} from './context-actions.ts';
import {createGame,runCommand,tokenize} from './engine.ts';
import {parseTerminalInput} from './terminal-shell.ts';

test('menu paths cannot become shell operators or additional commands',()=>{
  for(const name of ["Jiwoo's draft.html",'hello world.html','a; rm x','$(whoami).txt','日本語.txt','a > b.txt','-option']) {
    const path=siblingPath('/home/dev',name)!;
    const command='touch '+shellPath(path);
    assert.deepEqual(tokenize(parseTerminalInput(command,tokenize).command),['touch',path]);
    const result=runCommand(createGame(),command);
    assert.equal(result.error,false,result.output);
    assert.ok(Object.hasOwn(result.state.machines.local.files,path));
  }
});
test('menu names reject traversal, controls and overlong save paths',()=>{
  for(const name of ['', '  ','.','..','../file','a/b','a\\b','a\nb','\0','x'.repeat(300)]) assert.equal(siblingPath('/home/dev',name),null);
  assert.equal(siblingPath('/','file.txt'),'/file.txt');
});
test('terminal paste replaces selection and never preserves command line breaks',()=>{
  assert.deepEqual(insertClipboard('echo old',5,8,'one\r\ntwo\tthree',true),{text:'echo one two three',caret:18});
  assert.deepEqual(insertClipboard('ab',1,1,'x\ny'),{text:'ax\nyb',caret:4});
});
test('file menu commands use canonical virtual filesystem mutations',()=>{
  let state=createGame();
  for(const command of ['touch /home/dev/source.txt',"echo 'my code' > /home/dev/source.txt",'cp /home/dev/source.txt /home/dev/copy.txt','mv /home/dev/copy.txt /home/dev/renamed.txt','rm /home/dev/source.txt']){
    const result=runCommand(state,command);assert.equal(result.error,false,result.output);state=result.state;
  }
  assert.equal(state.machines.local.files['/home/dev/renamed.txt'],'my code\n');
  assert.equal(Object.hasOwn(state.machines.local.files,'/home/dev/source.txt'),false);
});
