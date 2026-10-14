import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
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

test('cumulative data work stops repeated transformations and resets per run',()=>{
 const source="values = []\nfor i in range(20):\n    values.append((str(i) + 'x' * 100).upper())\nprint(len(values))";
 const stopped=runPython(source,{maxDataWork:2048});
 assert.equal(stopped.ok,false);
 assert.equal(stopped.error?.type,'MemoryError');
 assert.match(stopped.error!.message,/cumulative data work/);
 const guarded=runPython("try:\n"+source.split('\n').map(line=>'    '+line).join('\n')+"\nexcept Exception:\n    print('caught')",{maxDataWork:2048});
 assert.equal(guarded.error?.type,'MemoryError');
 assert.equal(guarded.stdout,'');
 assert.equal(runPython(source).stdout,'20\n');
 assert.equal(runPython('print(6 * 7)').stdout,'42\n');
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

/** Hostile input is interpreted only inside a disposable, heap/time bounded child. */
function boundedProgram(source:string,maxSteps=1000):{result:PyResult;recovery:PyResult}{
 const runtime=new URL('./py-runtime.ts',import.meta.url).href;
 const script=`import {runPython} from ${JSON.stringify(runtime)};const result=runPython(${JSON.stringify(source)},{maxSteps:${maxSteps}});const recovery=runPython('print(6 * 7)');process.stdout.write(JSON.stringify({result,recovery}));`;
 const child=spawnSync(process.execPath,['--max-old-space-size=96','--input-type=module','-e',script],{encoding:'utf8',timeout:8000,maxBuffer:128*1024,windowsHide:true});
 assert.equal(child.error,undefined,source+' child error: '+child.error);
 assert.equal(child.signal,null,source+' child signal: '+child.signal);
 assert.equal(child.status,0,source+' child stderr: '+child.stderr);
 const response=JSON.parse(child.stdout) as {result:PyResult;recovery:PyResult};
 assert.equal(response.recovery.ok,true,source+' subsequent normal run');
 assert.equal(response.recovery.stdout,'42\n',source+' subsequent normal output');
 return response;
}

test('large integer math terminates exactly or observes the execution budget',()=>{
 const cases:[string,string][]=[
  ['import math\nprint(math.isqrt(10**100))','1'+'0'.repeat(50)+'\n'],
  ['import math\nprint(math.isqrt(10**1000-1))','9'.repeat(500)+'\n'],
  ['import math\nprint(math.comb(10**20,10**20))','1\n'],
  ['import math\nprint(math.comb(10**20,10**20-1))','100000000000000000000\n'],
  ['import math\nprint(math.comb(100,98))','4950\n'],
 ];
 for(const [source,stdout] of cases){const {result}=boundedProgram(source);assert.equal(result.ok,true,source);assert.equal(result.stdout,stdout,source);assert.ok(result.steps<=1000,source);}
 let a=BigInt(0),b=BigInt(1);for(let i=0;i<1500;i++)[a,b]=[b,a+b];
 for(const source of [
  'import math\nmath.comb(100000,50000)',
  'import math\nmath.factorial(2000)',
  `import math\nmath.gcd(${a},${b})`,
  'pow(2,10**1000,7)',
 ]){
  const {result}=boundedProgram(source);assert.equal(result.ok,false,source);assert.equal(result.error?.type,'TimeoutError',source);assert.match(result.error!.message,/1000 steps|1,000 steps/);assert.equal(result.steps,1000);
 }
});

test('empty sequence repetition avoids count-sized temporary arrays',()=>{
 for(const source of [
  'print([] * 10000000)',
  'print(() * 10000000)',
  'print(repr("" * 10000000))',
  'x=[]\nx *= 10000000\nprint(x)',
 ]){
  const {result}=boundedProgram(source);assert.equal(result.ok,true,source);assert.equal(result.stdout,source.includes('repr')?"''\n":source.includes('()')?'()\n':'[]\n',source);
 }
 for(const source of ['[1] * 10000000','(1,) * 10000000','x=[1]\nx *= 10000000','x=(0,) * 60000\ny=x+x']){
  const {result}=boundedProgram(source,100000);assert.equal(result.error?.type,'MemoryError',source);assert.match(result.error!.message,/container grew/,source);
 }
});

test('shared representations and JSON stop before exponential allocation and recover',()=>{
 const list='x=[0]\nfor i in range(24):\n    x=[x,x]\n';
 const tuple='x=(0,)\nfor i in range(24):\n    x=(x,x)\n';
 const sources=[
  list+'print(x)',list+'str(x)',list+'repr(x)',list+'ascii(x)',list+'f"{x!r}"',list+'"{!r}".format(x)',list+'"%r" % x',
  list+'import json\njson.dumps(x)',list+'raise ValueError(x)',list+'exit(x)',tuple+'hash(x)',
  'x=[0]\nfor i in range(300):\n    x=[x]\nprint(x)',
  'import json\nx=[0]\nfor i in range(300):\n    x=[x]\njson.dumps(x)',
 ];
 for(const source of sources){
  const {result}=boundedProgram(source,10000);assert.equal(result.ok,false,source);assert.ok(['MemoryError','TimeoutError','RecursionError'].includes(result.error?.type??''),source+' '+result.error?.type);
  assert.match(result.error!.message,/simulated Python limit/,source);assert.ok(result.stdout.length<=30000,source);
 }
 const {result}=boundedProgram('x=[]\nx.append(x)\nprint(x)\nimport json\nprint(json.dumps({"a":[1,2]},indent=2))');
 assert.equal(result.ok,true);assert.equal(result.stdout,'[[...]]\n{\n  "a": [\n    1,\n    2\n  ]\n}\n');
});

test('expanding strings and formatting enforce limits before materializing results',()=>{
 const sources=[
  '"x".replace("", "y"*1000000)',
  '("x"*100000).replace("x", "y"*100000)',
  '("x"*100000).replace("x", "y"*100000, 100000)',
  '"x"*1000000+"y"',
  '("x"*1000000).join([""]*1000)',
  '"\\t".expandtabs(1000000000)',
  'import json\njson.dumps([1],indent=1000000000)',
  'import json\njson.dumps(["é"*200000])',
  '("{0}"*100).format("x"*100000)',
  '("%s"*100) % (("x"*100000,)*100)',
  'format(1,"01000000000,")',
  'format(1.0,"01000000000")',
  'format(1e21,".1000000000f")',
 ];
 for(const source of sources){const {result}=boundedProgram(source,10000);assert.equal(result.error?.type,'MemoryError',source);assert.match(result.error!.message,/simulated Python limit/,source);}
 const {result}=boundedProgram('print("ab".replace("", "-", 2))\nprint("abc".replace("b","XYZ"))\nprint("a\\tb".expandtabs(4))\nprint(round(123,-1000000000))');
 assert.equal(result.ok,true);assert.equal(result.stdout,'-a-b\naXYZc\na   b\n0\n');
});

test('shared comparisons and grouped numeric padding avoid repeated expansion',()=>{
 const {result}=boundedProgram('x=[0]\ny=[0]\nfor i in range(24):\n    x=[x,x]\n    y=[y,y]\nprint(x == y)\nprint(x <= y)\nprint(format(1234,"010,"))\nprint(len(format(1,"0100000,")))');
 assert.equal(result.ok,true);assert.equal(result.stdout,'True\nTrue\n00,001,234\n100001\n');
 const {result:cyclic}=boundedProgram('x=[]\ny=[]\nx.append(x)\ny.append(y)\nprint(x == y)');
 assert.equal(cyclic.error?.type,'RecursionError');assert.match(cyclic.error!.message,/simulated Python limit/);
});

test('one ordering operation shares comparison cache and charges the interpreter budget',()=>{
 const source='x=[0]*50000\ny=[0]*50000\na=[x]*50000\nb=[y]*50000\nprint(a<=b)';
 const {result:limited}=boundedProgram(source,250000);
 assert.equal(limited.ok,false);assert.equal(limited.error?.type,'TimeoutError');assert.equal(limited.steps,250000);assert.match(limited.error!.message,/steps.*simulated Python limit/);
 const {result:complete}=boundedProgram(source,400000);
 assert.equal(complete.ok,true);assert.equal(complete.stdout,'True\n');assert.ok(complete.steps<310000,'shared inner lists are scanned only once');
 const {result:equality}=boundedProgram('x=[0]*1000\ny=[0]*1000\nprint(x == y)',2500);
 assert.equal(equality.error?.type,'TimeoutError');assert.equal(equality.steps,2500);
});

test('ascii preserves complete Unicode code points including supplementary characters',()=>{
 const {result}=boundedProgram('print(ascii("é東😀"))\nprint(ascii(chr(0x10ffff)))\nprint(ascii(chr(0xd83d)))');
 assert.equal(result.ok,true);
 assert.equal(result.stdout,"'\\xe9\\u6771\\U0001f600'\n'\\U0010ffff'\n'\\ud83d'\n");
});
