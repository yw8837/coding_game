'use strict';
// Every hostile probe runs in a memory/time/stack-bounded child. Never mutate the
// package store. Use --baseline for the upstream copy and --patched for a patched
// copy or installed package directory; --node-path can supply copied dependencies.
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const path = require('node:path');

const cases = [
  ...['compile', 'expand', 'stringify', 'parse'].flatMap(api => [
    {name:`${api}:braces`, api, pattern:'{'.repeat(1500)+'x'+'}'.repeat(1500)},
    {name:`${api}:parens`, api, pattern:'('.repeat(1500)+'x'+')'.repeat(1500)},
    {name:`${api}:unclosed`, api, pattern:'{'.repeat(1500)+'x'},
  ]),
  ...['compile', 'expand', 'stringify'].map(api => ({name:`${api}:direct-ast`,api,ast:true})),
  ...['compile', 'expand', 'stringify'].flatMap(api => [
    {name:`${api}:cyclic-parent`,api,cycle:'parent'},
    {name:`${api}:cyclic-nodes`,api,cycle:'nodes'},
    {name:`${api}:wide-ast`,api,wide:true,skipBaseline:true},
  ]),
  {name:'expand:cartesian',api:'expand',pattern:'{a,b}'.repeat(14)},
  {name:'expand:descending',api:'expand',pattern:'{10000..0}'},
  {name:'expand:disabled-range-limit',api:'expand',pattern:'{0..10000}',options:{rangeLimit:false}},
  {name:'compile:stepped-range',api:'compile',pattern:'{20002..0..2}'},
  {name:'expand:unsafe-integer',api:'expand',pattern:'{9007199254740992..9007199254740993}',skipBaseline:true},
  {name:'compile:aggregate-stepped-output',api:'compile',pattern:'{0..19998..2}'.repeat(400),skipBaseline:true},
  {name:'compile:aggregate-range-work',api:'compile',pattern:'{0..19998..2}'.repeat(11),skipBaseline:true},
  ...['compile', 'stringify'].map(api=>({name:`${api}:escaped-output-budget`,api,outputBudget:true,options:{escapeInvalid:true},skipBaseline:true})),
  ...['compile', 'expand', 'stringify'].flatMap(api=>[
    {name:`${api}:ast-array-value`,api,structuredValue:'array',skipBaseline:true},
    {name:`${api}:ast-object-value`,api,structuredValue:'object',skipBaseline:true},
  ]),
  ...['compile', 'stringify'].flatMap(api=>[
    {name:`${api}:ast-numeric-output`,api,scalarOutput:'number',scalarChars:1000000,skipBaseline:true},
    {name:`${api}:ast-boolean-output`,api,scalarOutput:'boolean',scalarChars:1000000,skipBaseline:true},
  ]),
  ...['compile', 'expand'].flatMap(api=>[
    {name:`${api}:ast-object-step`,api,rangeOverload:'object',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:ast-transform-step`,api,rangeOverload:'function',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:ast-array-step`,api,rangeOverload:'array',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:ast-null-step`,api,rangeOverload:'null',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:options-object-step`,api,pattern:'{0..2000000}',options:{step:{},rangeLimit:false},skipBaseline:true},
    {name:`${api}:options-nested-step`,api,pattern:'{0..2000000}',options:{step:{step:2},rangeLimit:false},skipBaseline:true},
    {name:`${api}:options-array-step`,api,pattern:'{1..3}',options:{step:[2],rangeLimit:false},skipBaseline:true},
    {name:`${api}:ast-extra-range-argument`,api,extraRangeArgument:true,options:{rangeLimit:false},skipBaseline:true},
  ]),
  ...['compile', 'expand'].flatMap(api => [
    {name:`${api}:scientific-unsafe`,api,pattern:'{1e20..1e21..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:hex-unsafe`,api,pattern:'{0x20000000000000..0x20000000000002..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:signed-unsafe`,api,pattern:'{+9007199254740992..+9007199254740994..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:space-unsafe`,api,pattern:'{ 9007199254740992 .. 9007199254740994 ..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:scientific-large`,api,pattern:'{1e1..3e4..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:hex-large`,api,pattern:'{0x0..0xffff..2}',options:{rangeLimit:false},skipBaseline:true},
    {name:`${api}:exponent-step`,api,pattern:'{0..30000..2e0}',options:{rangeLimit:false},skipBaseline:true},
  ]),
];

const boundedCases = [
  {name:'compile:aggregate-stepped-safe',api:'compile',pattern:'{0..19998..2}'.repeat(8),minLength:400000,maxLength:500000},
  {name:'compile:compact-contiguous-large',api:'compile',pattern:'{0..1000000}',minLength:1,maxLength:1000},
  ...['compile', 'stringify'].flatMap(api=>[
    {name:`${api}:literal-output-boundary`,api,literalChars:1000000,minLength:1000000,maxLength:1000000},
    {name:`${api}:escaped-output-boundary`,api,outputBudget:true,outputChars:499999,options:{escapeInvalid:true},minLength:1000000,maxLength:1000000},
    {name:`${api}:numeric-output-boundary`,api,scalarOutput:'number',scalarChars:999977,minLength:1000000,maxLength:1000000},
    {name:`${api}:boolean-output-boundary`,api,scalarOutput:'boolean',scalarChars:999996,minLength:1000000,maxLength:1000000},
  ]),
];

function options(argv) {
  const result = {};
  for (let i=0;i<argv.length;i+=2) result[argv[i].replace(/^--/,'')] = argv[i+1];
  return result;
}

function child(modulePath, item) {
  const braces = require(path.resolve(modulePath));
  let input = item.pattern;
  if (item.cycle) {
    input = {type:'paren',nodes:[]};
    if (item.cycle === 'parent') input.parent = input;
    else input.nodes.push(input);
  }
  if (item.wide) input = {type:'root',nodes:Array.from({length:20001},()=>({type:'text',value:'x'}))};
  if (item.outputBudget) input = {type:'root',nodes:[
    {type:'open',invalid:true,value:'{'.repeat(item.outputChars??500000)},
    {type:'close',invalid:true,value:'}'.repeat(item.outputChars??500000)},
  ]};
  if (item.literalChars) input = {type:'root',nodes:[{type:'text',value:'x'.repeat(item.literalChars)}]};
  if (item.structuredValue) input = {type:'root',nodes:[{type:'text',
    value:item.structuredValue==='array'?['x'.repeat(500000),'x'.repeat(500000)]:{nested:'x'.repeat(1000000)}}]};
  if (item.scalarOutput) input = {type:'root',nodes:[{type:'text',value:'x'.repeat(item.scalarChars)},
    {type:'text',value:item.scalarOutput==='number'?Number.MAX_VALUE:true}]};
  if (item.rangeOverload) input = {type:'root',nodes:[{type:'brace',ranges:1,nodes:[
    {type:'text',value:'0'},{type:'text',value:'2000000'},
    {type:'text',value:item.rangeOverload==='object'?{}:item.rangeOverload==='array'?[2]:item.rangeOverload==='null'?null:value=>value},
  ]}]};
  if (item.extraRangeArgument) input = {type:'root',nodes:[{type:'brace',ranges:1,
    nodes:['0','2000000','1','ignored'].map(value=>({type:'text',value}))}]};
  if (item.ast) {
    input = {type:'root',nodes:[]};
    let node = input;
    for (let i=0;i<1500;i++) {
      const next = {type:'paren',nodes:[],parent:node};
      node.nodes.push(next);node = next;
    }
    node.nodes.push({type:'text',value:'x',parent:node});
  }
  try {
    const result = braces[item.api](input,item.options || {});
    const sha256 = typeof result==='string'?createHash('sha256').update(result).digest('hex'):undefined;
    console.log(JSON.stringify({status:'accepted',length:result.length,...(sha256?{sha256}:{})}));
  } catch (error) {
    console.log(JSON.stringify({status:'rejected',type:error.name,message:error.message}));
  }
}

function probe(modulePath, item, nodePath) {
  const result = spawnSync(process.execPath,
    ['--stack-size=256','--max-old-space-size=64',__filename,'--child',modulePath,'--case',JSON.stringify(item)],
    {encoding:'utf8',timeout:5000,maxBuffer:65536,env:{...process.env,...(nodePath?{NODE_PATH:nodePath}:{})}});
  assert.ifError(result.error);
  assert.equal(result.status,0,`${item.name}: child failed: ${result.stderr}`);
  return JSON.parse(result.stdout.trim());
}

function compatibility(modulePath, nodePath) {
  const item = {name:'compatibility',api:'compatibility'};
  const result = spawnSync(process.execPath,[__filename,'--compat',modulePath],
    {encoding:'utf8',timeout:5000,maxBuffer:65536,env:{...process.env,...(nodePath?{NODE_PATH:nodePath}:{})}});
  assert.ifError(result.error);
  assert.equal(result.status,0,`${item.name}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

const args = options(process.argv.slice(2));
if (args.child) child(args.child,JSON.parse(args.case));
else if (args.compat) {
  const braces = require(path.resolve(args.compat));
  const patterns = ['src/{components,lib}/file.ts','a/{b,{c,d}}/e','\\{a,b\\}',
    '[{a,b}]','"{a,b}"','${a,b}','{01..05}','{5..1}','{a..e..2}',
    '{1..5..2}','{a,b}{c,d}','{a,,b}','{}','a/(b(c))/d','{unclosed',
    '{a..b,c}','x'.repeat(300),'('.repeat(40)+'x'+')'.repeat(40),
    '{1e1..12}','{0xA..0xE}','{+1..+3}','{ 1 .. 3 }',
    '{0b10..0b100}','{0o2..0o4}','{1..5..2e0}','{a..e..2e0}',
    '{1..5..bogus}','{1e1..a}','{a..1e1}',
    '{1..3..1..2}','{1..3..}','{..3}','{1..}'];
  // Upstream rejects some numeric spellings during regex compilation even
  // though expansion accepts them. Compare those errors as part of semantics.
  const outcome = run => {try {return run();} catch(error) {return {error:error.name,message:error.message};}};
  const fixtures = [
    ...patterns.map(pattern=>({pattern,settings:{}})),
    ...[2,-2,'2','2e0',0,false,null,'','bogus','Infinity','0x2'].map(step=>({pattern:'{1..5}',settings:{step}})),
    // A valid explicit range step overrides an unused malformed option.
    {pattern:'{1..5..2}',settings:{step:{}}},
    {pattern:'{1..5..2}',settings:{step:[2]}},
    {pattern:'{0..2000000..500000}',settings:{step:{}}},
  ];
  console.log(JSON.stringify(fixtures.map(({pattern,settings}) => ({pattern,settings,
    compile:outcome(()=>braces.compile(pattern,settings)),expand:outcome(()=>braces.expand(pattern,settings)),
    stringify:outcome(()=>braces.stringify(pattern,settings)),default:outcome(()=>braces(pattern,settings)),
    escaped:outcome(()=>braces.compile(pattern,{...settings,escapeInvalid:true,keepEscaping:true,keepQuotes:true}))}))));
} else {
  assert.ok(args.patched,'Pass --patched <braces package directory>.');
  const evidence = [];
  for (const item of cases) {
    const patched = probe(args.patched,item,args['node-path']);
    assert.equal(patched.status,'rejected',item.name);
    assert.equal(patched.type,'RangeError',item.name);
    assert.equal(patched.message,'braces resource limit exceeded',item.name);
    // Do not run a known nonterminating arithmetic probe against upstream.
    const baseline = args.baseline && !item.skipBaseline && item.cycle !== 'parent' ? probe(args.baseline,item,args['node-path']) : undefined;
    if (baseline) assert.notEqual(baseline.message,patched.message,`${item.name}: baseline unexpectedly mitigated`);
    evidence.push({name:item.name,...(baseline?{baseline}:{}),patched});
  }
  const patchedNormal = compatibility(args.patched,args['node-path']);
  if (args.baseline) assert.deepEqual(patchedNormal,compatibility(args.baseline,args['node-path']));
  // Assert exact representative behavior even when only an installed patch is tested.
  assert.deepEqual(patchedNormal.find(x=>x.pattern==='a/{b,{c,d}}/e').expand,['a/b/e','a/c/e','a/d/e']);
  assert.deepEqual(patchedNormal.find(x=>x.pattern==='{01..05}').expand,['01','02','03','04','05']);
  assert.equal(patchedNormal.find(x=>x.pattern==='src/{components,lib}/file.ts').compile,'src/(components|lib)/file.ts');
  assert.deepEqual(patchedNormal.find(x=>x.pattern==='{1e1..12}').expand,['10','11','12']);
  const bounded = boundedCases.map(item=>{
    const patched = probe(args.patched,item,args['node-path']);
    assert.equal(patched.status,'accepted',item.name);
    assert.ok(patched.length>=item.minLength&&patched.length<=item.maxLength,item.name);
    const baseline = args.baseline?probe(args.baseline,item,args['node-path']):undefined;
    if(baseline)assert.deepEqual(patched,baseline,item.name);
    return {name:item.name,patched,...(baseline?{baseline}:{})};
  });
  console.log(JSON.stringify({node:process.version,hostileProbes:evidence,compatibilityPatterns:patchedNormal.length,boundedOutputs:bounded},null,2));
}
