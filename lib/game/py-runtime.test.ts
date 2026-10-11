import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runPython,formatPyError,type PyResult} from './py-runtime.ts';

type RecordedCase={name:string;src:string;files?:Record<string,string>;stdout:string;error:string|null;line:number|null};
const recorded=JSON.parse(readFileSync(new URL('./fixtures/py-runtime-cpython.json',import.meta.url),'utf8')) as {generatedWith:string;cases:RecordedCase[]};
const lastLine=(r:PyResult)=>r.error?(r.error.message?`${r.error.type}: ${r.error.message}`:r.error.type):null;

test('replays programs recorded from real CPython 3.12 with identical output and error text',()=>{
 assert.match(recorded.generatedWith,/^Python 3\.12\./);
 assert.ok(recorded.cases.length>=80);
 for(const c of recorded.cases){
  const r=runPython(c.src,{files:c.files??{},filename:'main.py'});
  assert.equal(r.stdout,c.stdout,c.name+' stdout');
  assert.equal(lastLine(r),c.error,c.name+' error');
  if(c.line!==null)assert.equal(r.error?.line,c.line,c.name+' line');
 }
});

test('tracebacks and syntax errors are formatted like CPython',()=>{
 const runtime=runPython('def fee(days):\n    if days <= 0:\n        return 0\n\nprint(fee("3"))\n',{filename:'overdue.py'});
 assert.equal(formatPyError(runtime.error!,'overdue.py'),[
  'Traceback (most recent call last):',
  '  File "overdue.py", line 5, in <module>',
  '    print(fee("3"))',
  '  File "overdue.py", line 2, in fee',
  '    if days <= 0:',
  "TypeError: '<=' not supported between instances of 'str' and 'int'",
 ].join('\n'));
 const syntax=runPython('total = 0\nfor x in range(3)\n    total += x\n');
 assert.equal(formatPyError(syntax.error!,'loop.py'),'  File "loop.py", line 2\n    for x in range(3)\n                     ^\nSyntaxError: expected \':\'');
 assert.equal(formatPyError(runPython('print(1/0)').error!),'Traceback (most recent call last):\n  File "<string>", line 1, in <module>\nZeroDivisionError: division by zero');
 const deep=runPython('def f(n):\n    return f(n + 1)\nf(0)\n');
 assert.equal(deep.error?.type,'RecursionError');
 assert.match(formatPyError(deep.error!,'r.py'),/\[Previous line repeated \d+ more times\]\nRecursionError: maximum recursion depth exceeded$/);
});

test('the sandbox has no host access and stops runaway scripts',()=>{
 const blocked=(src:string,type:string,message:RegExp)=>{const r=runPython(src);assert.equal(r.ok,false,src);assert.equal(r.error?.type,type,src);assert.match(r.error!.message,message,src);};
 blocked('import os','ModuleNotFoundError',/No module named 'os'.*available modules are csv, json, math, random, string/);
 blocked('import subprocess','ModuleNotFoundError',/subprocess/);
 blocked("open('/etc/passwd')",'FileNotFoundError',/No such file or directory: '\/etc\/passwd'/);
 blocked("open('out.txt', 'w')",'PermissionError',/Permission denied: 'out\.txt'/);
 blocked("eval('1+1')",'NotImplementedError',/eval\(\) is not supported/);
 blocked("__import__('os')",'NotImplementedError',/__import__\(\) is not supported/);
 blocked('class A:\n    pass','NotImplementedError',/class definitions are not supported/);
 blocked('while True:\n    pass','TimeoutError',/steps/);
 blocked("s = 'x' * 10**9",'MemoryError',/string grew/);
 blocked('n = 10 ** 10 ** 10','MemoryError',/integer grew too large/);
 blocked('x = []\nwhile True:\n    x.append(1)','MemoryError',/container grew/);
 blocked('while True:\n    print("spam")','MemoryError',/output passed/);
 const stopped=runPython('try:\n    while True:\n        pass\nexcept Exception:\n    print("caught")');
 assert.equal(stopped.error?.type,'TimeoutError');assert.equal(stopped.stdout,'');
 assert.equal(runPython('x = input("Name: ")').stdout,'Name: ');
 assert.equal(runPython('exit()\nprint("after")').ok,true);
 assert.equal(runPython('print(1)',{maxSteps:0}).error?.type,'TimeoutError');
});

test('scripts read only the virtual files they are given',()=>{
 const files={'data/menu.csv':'name,price\nLatte,5000\n','notes.txt':'a\r\nb\r\n'};
 const r=runPython("import csv\nwith open('./data/menu.csv') as f:\n    print([dict(row) for row in csv.DictReader(f)])\nprint(open('notes.txt').read().splitlines())",{files});
 assert.equal(r.error,null);assert.equal(r.stdout,"[{'name': 'Latte', 'price': '5000'}]\n['a', 'b']\n");
 assert.deepEqual(files,{'data/menu.csv':'name,price\nLatte,5000\n','notes.txt':'a\r\nb\r\n'});
 assert.match(runPython("open('menu.csv')",{files}).error!.message,/No such file/);
});

test('beginner-friendly suggestions follow CPython 3.12',()=>{
 assert.equal(runPython('pritn("hi")').error?.message,"name 'pritn' is not defined. Did you mean: 'print'?");
 assert.equal(runPython('csv.reader').error?.message,"name 'csv' is not defined. Did you forget to import 'csv'?");
 assert.equal(runPython('nums = [1]\nnums.apend(2)').error?.message,"'list' object has no attribute 'apend'. Did you mean: 'append'?");
 assert.equal(runPython('print "hi"').error?.message,"Missing parentheses in call to 'print'. Did you mean print(...)?");
 assert.equal(runPython('if x = 1:\n    pass').error?.message,"invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
 assert.equal(runPython('print(“hi”)').error?.message,"invalid character '“' (U+201C)");
});
