/** Sandboxed Python 3.12 subset for the automation track (curriculum stage 3).
 * Source is tokenized, parsed and walked here: no eval, no host files, no
 * network. Scripts only see the virtual files handed in, and error text
 * follows CPython so players learn to read real tracebacks. */

export type PyFrame={line:number;scope:string;text?:string};
export type PyError={type:string;message:string;line?:number;column?:number;text?:string;trace?:PyFrame[]};
export type PyResult={ok:boolean;stdout:string;error:PyError|null;steps:number};
export type PyOptions={files?:Readonly<Record<string,string>>;filename?:string;maxSteps?:number};

const LIMIT={source:60000,steps:250000,depth:200,output:30000,string:1000000,items:100000,digits:4300};
const MODULE_NOTE='simulated Python: available modules are csv, json, math, random, string';
const group=(n:number)=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');

// ---------- values ----------
const DONE=Symbol('done');
type Done=typeof DONE;
type Value=null|boolean|bigint|number|string|PyList|PyTuple|PyDict|PySet|PyRange|PySlice|PyFunc|PyBuiltin|PyModule|PyFile|PyIter|PyView|PyExc;
type Iter={next():Value|Done};
type Native=(args:Value[],kw:Map<string,Value>)=>Value;
type Num=bigint|number;
const ZERO=BigInt(0),ONE=BigInt(1),BIG_LIMIT=BigInt(10)**BigInt(20000);
const NO_KW:Map<string,Value>=new Map();

class PyList{items:Value[];constructor(items:Value[]){this.items=items;}}
class PyTuple{items:Value[];constructor(items:Value[]){this.items=items;}}
class PySlice{lo:Value;hi:Value;step:Value;constructor(lo:Value,hi:Value,step:Value){this.lo=lo;this.hi=hi;this.step=step;}}
class PyRange{
 start:bigint;stop:bigint;step:bigint;
 constructor(start:bigint,stop:bigint,step:bigint){this.start=start;this.stop=stop;this.step=step;}
 get length():number{const span=this.step>ZERO?this.stop-this.start:this.start-this.stop,step=this.step>ZERO?this.step:-this.step;return span<=ZERO?0:Number((span+step-ONE)/step);}
 at(i:number):bigint{return this.start+BigInt(i)*this.step;}
}
class PyDict{
 map=new Map<string,[Value,Value]>();
 get size(){return this.map.size;}
 get(k:Value):Value|undefined{return this.map.get(keyOf(k))?.[1];}
 set(k:Value,v:Value){const key=keyOf(k),old=this.map.get(key);if(old)old[1]=v;else this.map.set(key,[k,v]);}
 has(k:Value){return this.map.has(keyOf(k));}
 delete(k:Value){return this.map.delete(keyOf(k));}
 keys(){return [...this.map.values()].map(([k])=>k);}
}
/** Integer sets mirror CPython's hash table (slots, dummies, resizes, set_merge) so they
 * print in the same order as real Python; other element types keep insertion order. */
class PySet{
 map=new Map<string,Value>();slots:(string|null|undefined)[]|null=new Array(8);fill=0;
 constructor(items:Value[]=[]){for(const v of items)this.add(v);}
 /** A display of 3+ constants: CPython folds it into a frozenset, rebuilds that frozenset
  * from its own iteration order while merging constants, then SET_UPDATEs an empty set. */
 static constant(values:Value[]):PySet{const out=new PySet();out.merge(new PySet(new PySet(values).values()));return out;}
 static copy(src:PySet):PySet{const out=new PySet();out.merge(src);return out;}
 static fromKeys(keys:Value[]):PySet{const out=new PySet();if(keys.length*5>=21)out.resize(keys.length*2);for(const k of keys)out.add(k);return out;}
 get size(){return this.map.size;}
 add(v:Value){
  const key=keyOf(v);if(this.map.has(key))return;
  this.map.set(key,v);
  if(!this.slots)return;
  if(intHash(v)===null||this.map.size>5000){this.slots=null;return;}
  this.insert(key);
 }
 has(v:Value){return this.map.has(keyOf(v));}
 remove(v:Value):boolean{const key=keyOf(v);if(!this.map.delete(key))return false;if(this.slots){const i=this.slots.indexOf(key);if(i>=0)this.slots[i]=null;}return true;}
 clear(){this.map.clear();this.slots=new Array(8);this.fill=0;}
 values():Value[]{const slots=this.slots;return slots?slots.filter((k):k is string=>typeof k==='string').map(k=>this.map.get(k)!):[...this.map.values()];}
 merge(src:PySet){
  if(!this.slots||!src.slots){for(const v of src.values())this.add(v);return;}
  const n=src.size;if(!n)return;
  if((this.fill+n)*5>=(this.slots.length-1)*3)this.resize((this.size+n)*2);
  const table=this.slots!;
  if(this.fill===0&&table.length===src.slots.length&&src.fill===src.size){this.slots=src.slots.slice();this.fill=src.fill;for(const [k,v] of src.map)this.map.set(k,v);return;}
  if(this.fill===0){for(const k of src.slots)if(typeof k==='string'){this.map.set(k,src.map.get(k)!);this.insertClean(table,k);}this.fill=this.size;return;}
  for(const v of src.values())this.add(v);
 }
 private probe(table:(string|null|undefined)[],key:string,reuse:boolean):number{
  const h=intHash(this.map.get(key)!)!,mask=table.length-1,m=BigInt(mask),five=BigInt(5);
  let i=Number(h&m),perturb=h,free=-1;
  for(;;){
   const probes=i+9<=mask?9:0;
   for(let j=0;j<=probes;j++){const slot=table[i+j];if(slot===undefined)return reuse&&free>=0?-1-free:i+j;if(reuse&&slot===null)free=i+j;}
   perturb>>=five;i=Number((BigInt(i)*five+ONE+perturb)&m);
  }
 }
 private insertClean(table:(string|null|undefined)[],key:string){table[this.probe(table,key,false)]=key;}
 private insert(key:string){
  const table=this.slots!,at=this.probe(table,key,true);
  if(at<0){table[-1-at]=key;return;}
  table[at]=key;this.fill++;
  if(this.fill*5>=(table.length-1)*3)this.resize(this.size>50000?this.size*2:this.size*4);
 }
 resize(minused:number){
  if(!this.slots)return;
  let size=8;while(size<=minused)size<<=1;
  const old=this.slots,next:(string|null|undefined)[]=new Array(size);
  for(const k of old)if(typeof k==='string')this.insertClean(next,k);
  this.slots=next;this.fill=this.size;
 }
}
const HASH_MOD=(ONE<<BigInt(61))-ONE,U64=ONE<<BigInt(64);
function intHash(v:Value):bigint|null{
 const n=typeof v==='boolean'?(v?ONE:ZERO):typeof v==='bigint'?v:typeof v==='number'&&Number.isInteger(v)?BigInt(v):null;
 if(n===null)return null;
 let h=(n<ZERO?-n:n)%HASH_MOD;if(n<ZERO)h=-h;if(h===-ONE)h=BigInt(-2);
 return h<ZERO?h+U64:h;
}
class PyView{dict:PyDict;kind:'keys'|'values'|'items';constructor(dict:PyDict,kind:'keys'|'values'|'items'){this.dict=dict;this.kind=kind;}}
type BoundParam={name:string;kind:Param['kind'];def:Value|undefined};
class PyFunc{
 name:string;params:BoundParam[];body:Stmt[]|Expr;scope:Scope;info:FuncInfo;line:number;
 constructor(name:string,params:BoundParam[],body:Stmt[]|Expr,scope:Scope,info:FuncInfo,line:number){this.name=name;this.params=params;this.body=body;this.scope=scope;this.info=info;this.line=line;}
}
class PyBuiltin{
 name:string;fn:Native;type:string|null;owner:string|null;
 constructor(name:string,fn:Native,type:string|null=null,owner:string|null=null){this.name=name;this.fn=fn;this.type=type;this.owner=owner;}
}
class PyModule{name:string;file:string|null;attrs:Map<string,Value>;constructor(name:string,file:string|null,attrs:Map<string,Value>){this.name=name;this.file=file;this.attrs=attrs;}}
class PyIter{
 name:string;step:()=>Value|Done;attr:(name:string)=>Value|undefined;done=false;
 constructor(name:string,step:()=>Value|Done,attr:(name:string)=>Value|undefined=()=>undefined){this.name=name;this.step=step;this.attr=attr;}
 next():Value|Done{if(this.done)return DONE;const v=this.step();if(v===DONE)this.done=true;return v;}
}
class PyFile{
 name:string;text:string;pos=0;closed=false;
 constructor(name:string,text:string){this.name=name;this.text=text.replace(/\r\n?/g,'\n');}
 check(){if(this.closed)throw err('ValueError','I/O operation on closed file.');}
 readline():string{this.check();const end=this.text.indexOf('\n',this.pos),stop=end<0?this.text.length:end+1,line=this.text.slice(this.pos,stop);this.pos=stop;return line;}
 next():Value|Done{this.check();return this.pos>=this.text.length?DONE:this.readline();}
}
class PyExc{type:string;args:Value[];trace:PyFrame[]|null=null;constructor(type:string,args:Value[]){this.type=type;this.args=args;}}

/** A Python exception in flight; `except` can catch it. */
class PyRaise extends Error{exc:PyExc;constructor(exc:PyExc){super(exc.type);this.exc=exc;}}
/** A sandbox limit; deliberately invisible to `except`. */
class PyLimit extends Error{type:string;trace:PyFrame[]|null=null;constructor(type:string,message:string){super(message);this.type=type;}}
class PySyntax extends Error{detail:PyError;constructor(type:string,message:string,line:number,column?:number){super(message);this.detail={type,message,line,...(column?{column}:{})};}}
class PyExit extends Error{code:Value;constructor(code:Value){super('exit');this.code=code;}}
const err=(type:string,message:string)=>new PyRaise(new PyExc(type,[message]));
const keyError=(key:Value)=>new PyRaise(new PyExc('KeyError',[key]));
const limit=(what:string)=>new PyLimit('MemoryError',`${what} (simulated Python limit)`);

const EXC_BASE:Record<string,string|null>={
 BaseException:null,Exception:'BaseException',ArithmeticError:'Exception',ZeroDivisionError:'ArithmeticError',OverflowError:'ArithmeticError',
 LookupError:'Exception',IndexError:'LookupError',KeyError:'LookupError',ValueError:'Exception',TypeError:'Exception',NameError:'Exception',
 UnboundLocalError:'NameError',AttributeError:'Exception',OSError:'Exception',FileNotFoundError:'OSError',PermissionError:'OSError',
 ImportError:'Exception',ModuleNotFoundError:'ImportError',RuntimeError:'Exception',RecursionError:'RuntimeError',NotImplementedError:'RuntimeError',
 AssertionError:'Exception',StopIteration:'Exception',EOFError:'Exception',MemoryError:'Exception',TimeoutError:'OSError',SyntaxError:'Exception',
 IndentationError:'SyntaxError',KeyboardInterrupt:'BaseException','io.UnsupportedOperation':'OSError','_csv.Error':'Exception','json.decoder.JSONDecodeError':'ValueError',
};
function excIs(type:string,base:string):boolean{let c:string|null=type;while(c){if(c===base)return true;c=EXC_BASE[c]??null;}return false;}

const ids=new WeakMap<object,number>();let nextId=1;
function objectId(v:object):number{let id=ids.get(v);if(!id){id=nextId++;ids.set(v,id);}return id;}
const address=(v:object)=>'0x'+(0x7f3a2c000000+objectId(v)*0x40).toString(16);
function keyOf(v:Value):string{
 if(v===null)return 'N';
 switch(typeof v){
  case 'boolean':return v?'n1':'n0';
  case 'bigint':return 'n'+v.toString();
  case 'number':return Number.isInteger(v)?'n'+BigInt(v).toString():'f'+v;
  case 'string':return 's'+v;
 }
 if(v instanceof PyTuple)return 't'+JSON.stringify(v.items.map(keyOf));
 if(v instanceof PyList||v instanceof PyDict||v instanceof PySet)throw err('TypeError',`unhashable type: '${typeName(v)}'`);
 return 'o'+objectId(v);
}
function typeName(v:Value):string{
 if(v===null)return 'NoneType';
 switch(typeof v){case 'boolean':return 'bool';case 'bigint':return 'int';case 'number':return 'float';case 'string':return 'str';}
 if(v instanceof PyList)return 'list';if(v instanceof PyTuple)return 'tuple';if(v instanceof PyDict)return 'dict';if(v instanceof PySet)return 'set';
 if(v instanceof PyRange)return 'range';if(v instanceof PySlice)return 'slice';if(v instanceof PyFunc)return 'function';
 if(v instanceof PyBuiltin)return v.type?'type':'builtin_function_or_method';
 if(v instanceof PyModule)return 'module';if(v instanceof PyFile)return '_io.TextIOWrapper';if(v instanceof PyIter)return v.name;
 if(v instanceof PyView)return 'dict_'+v.kind;
 return v.type;
}
function truthy(v:Value):boolean{
 if(v===null)return false;
 switch(typeof v){case 'boolean':return v;case 'bigint':return v!==ZERO;case 'number':return v!==0;case 'string':return v.length>0;}
 if(v instanceof PyList||v instanceof PyTuple)return v.items.length>0;
 if(v instanceof PyDict)return v.size>0;if(v instanceof PySet)return v.map.size>0;
 if(v instanceof PyRange)return v.length>0;if(v instanceof PyView)return v.dict.size>0;
 return true;
}
const asNum=(v:Value):Num|undefined=>typeof v==='bigint'||typeof v==='number'?v:typeof v==='boolean'?(v?ONE:ZERO):undefined;
const isInt=(v:Value):v is bigint|boolean=>typeof v==='bigint'||typeof v==='boolean';
const toBig=(v:bigint|boolean):bigint=>typeof v==='boolean'?(v?ONE:ZERO):v;
function intArg(v:Value):number{if(!isInt(v))throw err('TypeError',`'${typeName(v)}' object cannot be interpreted as an integer`);return Number(toBig(v));}
function bigArg(v:Value):bigint{if(!isInt(v))throw err('TypeError',`'${typeName(v)}' object cannot be interpreted as an integer`);return toBig(v);}
function checkBig(v:bigint):bigint{if(v>BIG_LIMIT||v< -BIG_LIMIT)throw limit('integer grew too large');return v;}
function checkText(s:string):string{if(s.length>LIMIT.string)throw limit(`string grew past ${group(LIMIT.string)} characters`);return s;}
function checkItems(n:number){if(n>LIMIT.items)throw limit(`container grew past ${group(LIMIT.items)} items`);}
function floorDiv(a:bigint,b:bigint):bigint{const q=a/b;return a%b!==ZERO&&(a<ZERO)!==(b<ZERO)?q-ONE:q;}
function floorMod(a:bigint,b:bigint):bigint{const r=a%b;return r!==ZERO&&(r<ZERO)!==(b<ZERO)?r+b:r;}
function seqLen(v:PyList|PyTuple|PyRange|string):number{return typeof v==='string'?v.length:v instanceof PyRange?v.length:v.items.length;}
function seqAt(v:PyList|PyTuple|PyRange|string,i:number):Value{return typeof v==='string'?v[i]:v instanceof PyRange?v.at(i):v.items[i];}
const isSeq=(v:Value):v is PyList|PyTuple|PyRange|string=>typeof v==='string'||v instanceof PyList||v instanceof PyTuple||v instanceof PyRange;
const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`;

// ---------- text forms ----------
function intStr(v:bigint):string{const s=v.toString();if(s.length-(v<ZERO?1:0)>LIMIT.digits)throw err('ValueError',`Exceeds the limit (${LIMIT.digits} digits) for integer string conversion; use sys.set_int_max_str_digits() to increase the limit`);return s;}
function floatRepr(x:number):string{
 if(Number.isNaN(x))return 'nan';
 if(!Number.isFinite(x))return x>0?'inf':'-inf';
 if(x===0)return Object.is(x,-0)?'-0.0':'0.0';
 const [mant,expText]=Math.abs(x).toExponential().split('e'),exp=Number(expText),digits=mant.replace('.',''),sign=x<0?'-':'';
 if(exp>=-4&&exp<16){
  if(exp<0)return sign+'0.'+'0'.repeat(-exp-1)+digits;
  return sign+digits.slice(0,exp+1).padEnd(exp+1,'0')+'.'+(digits.slice(exp+1)||'0');
 }
 return sign+digits[0]+(digits.length>1?'.'+digits.slice(1):'')+'e'+(exp<0?'-':'+')+String(Math.abs(exp)).padStart(2,'0');
}
function strRepr(s:string):string{
 const q=s.includes("'")&&!s.includes('"')?'"':"'";let out=q;
 for(const ch of s){
  const c=ch.codePointAt(0)!;
  if(ch==='\\')out+='\\\\';else if(ch===q)out+='\\'+q;else if(ch==='\n')out+='\\n';else if(ch==='\r')out+='\\r';else if(ch==='\t')out+='\\t';
  else if(c<0x20||(c>=0x7f&&c<0xa0))out+='\\x'+c.toString(16).padStart(2,'0');else out+=ch;
 }
 return out+q;
}
function pyRepr(v:Value,seen:Set<object>=new Set()):string{
 if(v===null)return 'None';
 switch(typeof v){case 'boolean':return v?'True':'False';case 'bigint':return intStr(v);case 'number':return floatRepr(v);case 'string':return strRepr(v);}
 if(v instanceof PyList||v instanceof PyTuple||v instanceof PyDict||v instanceof PySet||v instanceof PyView){
  if(seen.has(v))return v instanceof PyList?'[...]':v instanceof PyDict?'{...}':'(...)';
  seen.add(v);
  try{
   const r=(x:Value)=>pyRepr(x,seen);
   if(v instanceof PyList)return '['+v.items.map(r).join(', ')+']';
   if(v instanceof PyTuple)return v.items.length===1?'('+r(v.items[0])+',)':'('+v.items.map(r).join(', ')+')';
   if(v instanceof PyDict)return '{'+[...v.map.values()].map(([k,x])=>r(k)+': '+r(x)).join(', ')+'}';
   if(v instanceof PySet)return v.map.size?'{'+v.values().map(r).join(', ')+'}':'set()';
   const entries=[...v.dict.map.values()],shown=v.kind==='keys'?entries.map(([k])=>r(k)):v.kind==='values'?entries.map(([,x])=>r(x)):entries.map(([k,x])=>'('+r(k)+', '+r(x)+')');
   return `dict_${v.kind}([${shown.join(', ')}])`;
  }finally{seen.delete(v);}
 }
 if(v instanceof PyRange)return v.step===ONE?`range(${v.start}, ${v.stop})`:`range(${v.start}, ${v.stop}, ${v.step})`;
 if(v instanceof PySlice)return `slice(${pyRepr(v.lo)}, ${pyRepr(v.hi)}, ${pyRepr(v.step)})`;
 if(v instanceof PyFunc)return `<function ${v.name} at ${address(v)}>`;
 if(v instanceof PyBuiltin)return v.type?`<class '${v.type}'>`:v.owner?`<built-in method ${v.name} of ${v.owner} object at ${address(v)}>`:`<built-in function ${v.name}>`;
 if(v instanceof PyModule)return v.file?`<module '${v.name}' from '${v.file}'>`:`<module '${v.name}' (built-in)>`;
 if(v instanceof PyFile)return `<_io.TextIOWrapper name=${strRepr(v.name)} mode='r' encoding='utf-8'>`;
 if(v instanceof PyIter)return `<${v.name} object at ${address(v)}>`;
 return v.type+'('+v.args.map(x=>pyRepr(x,seen)).join(', ')+')';
}
function pyStr(v:Value):string{
 if(typeof v==='string')return v;
 if(v instanceof PyExc){if(v.type==='KeyError'&&v.args.length===1)return pyRepr(v.args[0]);return v.args.length===0?'':v.args.length===1?pyStr(v.args[0]):pyRepr(new PyTuple(v.args));}
 return pyRepr(v);
}

// ---------- number formatting (format spec mini-language) ----------
function groupDigits(digits:string,sep:string,size:number):string{let out='';for(let i=0;i<digits.length;i++){if(i&&(digits.length-i)%size===0)out+=sep;out+=digits[i];}return out;}
/** toFixed with Python's round-half-even for exact binary ties. */
function toFixedPy(x:number,prec:number):string{
 if(x>=1e21)return BigInt(x).toString()+(prec?'.'+'0'.repeat(prec):'');
 prec=Math.min(prec,100);
 const exact=x.toFixed(Math.min(100,prec+25)),dot=exact.indexOf('.'),tail=exact.slice(dot+1+prec);
 if(/^50*$/.test(tail)){
  const cut=exact.slice(0,prec?dot+1+prec:dot),last=Number(cut[cut.length-1]);
  if(last%2===0)return cut;
 }
 return x.toFixed(prec);
}
function expForm(x:number,prec:number,upper:boolean):string{const s=x.toExponential(Math.min(prec,100)).replace(/e([+-])(\d)$/,'e$10$2');return upper?s.toUpperCase():s;}
function generalForm(x:number,prec:number,alt:boolean,noneType:boolean,upper:boolean):string{
 const p=prec===0?1:prec;
 const exp=x===0?0:Number(x.toExponential(p-1).split('e')[1]);
 let body:string;
 if(exp>=-4&&exp<(noneType?p-1:p)){
  body=toFixedPy(x,Math.max(0,p-1-exp));
  if(!alt&&body.includes('.'))body=body.replace(/\.?0+$/,'');
  if(noneType&&!body.includes('.'))body+='.0';
 }else{
  const [digits,e]=x.toExponential(p-1).split('e');let mant=digits;
  if(!alt&&mant.includes('.'))mant=mant.replace(/\.?0+$/,'');
  body=mant+'e'+(e[0]==='-'?'-':'+')+e.replace(/^[+-]/,'').padStart(2,'0');
 }
 return upper?body.toUpperCase():body;
}
function padText(s:string,width:number,fill:string,align:string):string{
 if(width>LIMIT.string)throw limit('format width is too large');
 const gap=width-s.length;if(gap<=0)return s;
 if(align==='<')return s+fill.repeat(gap);
 if(align==='^'){const left=Math.floor(gap/2);return fill.repeat(left)+s+fill.repeat(gap-left);}
 return fill.repeat(gap)+s;
}
const SPEC=/^(?:([\s\S])?([<>=^]))?([+\- ])?(z)?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/;
function formatValue(v:Value,spec:string):string{
 if(spec==='')return pyStr(v);
 const tn=typeName(v),m=SPEC.exec(spec);
 if(!m)throw err('ValueError',`Invalid format specifier '${spec}' for object of type '${tn}'`);
 const [,fillGiven,alignGiven,sign,z,alt,zero,widthText,sep,precText,type]=m;
 const width=widthText?Number(widthText):0,prec=precText!==undefined?Number(precText):null;
 if(typeof v==='string'){
  if(type&&type!=='s')throw err('ValueError',`Unknown format code '${type}' for object of type 'str'`);
  if(sign)throw err('ValueError','Sign not allowed in string format specifier');
  if(alt)throw err('ValueError','Alternate form (#) not allowed in string format specifier');
  if(sep)throw err('ValueError',`Cannot specify '${sep}' with 's'.`);
  if(alignGiven==='=')throw err('ValueError',"'=' alignment not allowed in string format specifier");
  return padText(prec!==null?v.slice(0,prec):v,width,fillGiven??(zero?'0':' '),alignGiven??'<');
 }
 const n=asNum(v);
 if(n===undefined)throw err('TypeError',`unsupported format string passed to ${tn}.__format__`);
 const fill=fillGiven??(zero&&!alignGiven?'0':' '),align=alignGiven??(zero?'=':'>');
 const finish=(neg:boolean,prefix:string,digits:string)=>{
  const signText=neg?'-':sign==='+'?'+':sign===' '?' ':'';
  let content=signText+prefix+digits;
  if(content.length>=width)return content;
  if(align!=='=')return padText(content,width,fill,align);
  if(fill==='0'&&sep){
   const at=digits.search(/[^\d,_]/),head=(at<0?digits:digits.slice(0,at)).replace(/[,_]/g,''),rest=at<0?'':digits.slice(at),size=sep==='_'&&'boxX'.includes(type??'')?4:3;
   let raw=head;for(;;){content=signText+prefix+groupDigits(raw,sep,size)+rest;if(content.length>=width)return content;raw='0'+raw;}
  }
  return signText+prefix+fill.repeat(width-content.length)+digits;
 };
 if(type==='s')throw err('ValueError',`Unknown format code 's' for object of type '${tn}'`);
 const floatType=type!==undefined&&'eEfFgG%'.includes(type);
 if(typeof n==='number'&&type!==undefined&&'bcdoxX'.includes(type))throw err('ValueError',`Unknown format code '${type}' for object of type 'float'`);
 if(typeof n==='bigint'&&!floatType){
  if(prec!==null)throw err('ValueError','Precision not allowed in integer format specifier');
  if(type==='c'){if(sign)throw err('ValueError',"Sign not allowed with integer format specifier 'c'");return padText(String.fromCodePoint(Number(n)),width,fill,align==='='?'>':align);}
  const neg=n<ZERO,abs=neg?-n:n,radix=type==='b'?2:type==='o'?8:type==='x'||type==='X'?16:10;
  let digits=abs.toString(radix);if(type==='X')digits=digits.toUpperCase();
  if(sep){if(sep===','&&radix!==10)throw err('ValueError',`Cannot specify ',' with '${type}'.`);digits=groupDigits(digits,sep,radix===10?3:4);}
  const prefix=alt&&radix!==10?'0'+(type==='X'?'X':type):'';
  return finish(neg,prefix,digits);
 }
 const x=Number(n);let neg=x<0||Object.is(x,-0);const ax=Math.abs(x);
 let body:string;
 if(!Number.isFinite(ax)){body=Number.isNaN(x)?'nan':'inf';if(type&&'EFG'.includes(type))body=body.toUpperCase();if(type==='%')body+='%';}
 else switch(type){
  case 'f':case 'F':body=toFixedPy(ax,prec??6);if(alt&&!body.includes('.'))body+='.';break;
  case 'e':case 'E':body=expForm(ax,prec??6,type==='E');break;
  case '%':body=toFixedPy(ax*100,prec??6)+'%';break;
  case 'g':case 'G':case 'n':body=generalForm(ax,prec??6,!!alt,false,type==='G');break;
  default:body=prec===null?floatRepr(ax):generalForm(ax,prec,!!alt,true,false);
 }
 if(z&&neg&&!/[1-9]/.test(body))neg=false;
 if(sep){const m2=/^(\d+)([\s\S]*)$/.exec(body);if(m2)body=groupDigits(m2[1],sep,3)+m2[2];}
 return finish(neg,'',body);
}
function percentFormat(fmt:string,arg:Value):string{
 const mapping=arg instanceof PyDict?arg:null,values=arg instanceof PyTuple?arg.items:[arg];
 let used=0,out='',last=0,m:RegExpExecArray|null;
 const re=/%(?:\(([^)]*)\))?([-+ #0]*)(\*|\d+)?(?:\.(\*|\d+))?([\s\S]?)/g;
 const take=(key?:string):Value=>{
  if(key!==undefined){if(!mapping)throw err('TypeError','format requires a mapping');const v=mapping.get(key);if(v===undefined)throw keyError(key);return v;}
  if(used>=values.length)throw err('TypeError','not enough arguments for format string');
  return values[used++];
 };
 while((m=re.exec(fmt))){
  out+=fmt.slice(last,m.index);last=re.lastIndex;
  const [whole,key,flags,w,p,conv]=m;
  if(conv==='%'&&whole==='%%'){out+='%';continue;}
  if(!conv)throw err('ValueError','incomplete format');
  const width=w==='*'?intArg(take()):Number(w??0),prec=p===undefined?null:p==='*'?intArg(take()):Number(p);
  const v=take(key),left=flags.includes('-');
  if(conv==='s'||conv==='r'||conv==='a'||conv==='c'){
   let text=conv==='s'?pyStr(v):conv==='c'?(isInt(v)?String.fromCodePoint(intArg(v)):typeof v==='string'&&v.length===1?v:(()=>{throw err('TypeError','%c requires an int or a unicode character, not '+typeName(v));})()):pyRepr(v);
   if(prec!==null&&conv!=='c')text=text.slice(0,prec);
   out+=padText(text,width,' ',left?'<':'>');continue;
  }
  if(!'diouxXeEfFgG'.includes(conv))throw err('ValueError',`unsupported format character '${conv}' (0x${conv.charCodeAt(0).toString(16)}) at index ${m.index+whole.length-1}`);
  const n=asNum(v);
  if(n===undefined){
   if('diu'.includes(conv))throw err('TypeError',`%${conv} format: a real number is required, not ${typeName(v)}`);
   if('oxX'.includes(conv))throw err('TypeError',`%${conv} format: an integer is required, not ${typeName(v)}`);
   throw err('TypeError',`must be real number, not ${typeName(v)}`);
  }
  if('oxX'.includes(conv)&&typeof n==='number')throw err('TypeError',`%${conv} format: an integer is required, not float`);
  const value:Value='diu'.includes(conv)?(typeof n==='number'?BigInt(Math.trunc(n)):n):'eEfFgG'.includes(conv)?Number(n):n;
  const type='diu'.includes(conv)?'d':conv;
  const spec=(left?'<':flags.includes('0')?'0':'')+(flags.includes('+')?'+':flags.includes(' ')?' ':'')+(flags.includes('#')?'#':'')+(width?String(width):'')+(prec!==null&&type!=='d'?'.'+prec:'')+type;
  out+=formatValue(value,spec);
 }
 out+=fmt.slice(last);
 if(!mapping&&used<values.length)throw err('TypeError','not all arguments converted during string formatting');
 return checkText(out);
}

// ---------- set algebra (CPython iteration order) ----------
function setIntersection(a:PySet,b:PySet):PySet{const [scan,probe]=b.size>a.size?[a,b]:[b,a],out=new PySet();for(const v of scan.values())if(probe.has(v))out.add(v);return out;}
function setDifference(a:PySet,drop:Value[],setLike=true):PySet{
 if(!setLike||(a.size>>2)>drop.length){const out=PySet.copy(a);for(const v of drop)out.remove(v);return out;}
 const gone=new PySet(drop),out=new PySet();for(const v of a.values())if(!gone.has(v))out.add(v);return out;
}
const constant=(e:Expr):boolean=>e.k==='const'||(e.k==='unary'&&(e.op==='-'||e.op==='+')&&e.e.k==='const'&&typeof e.e.v!=='string')||(e.k==='tuple'&&e.items.every(constant));

// ---------- comparisons ----------
function numEq(x:Num,y:Num):boolean{
 if(typeof x===typeof y)return x===y;
 const f=(typeof x==='number'?x:y) as number,i=(typeof x==='bigint'?x:y) as bigint;
 return Number.isInteger(f)&&BigInt(f)===i;
}
function pyEq(a:Value,b:Value):boolean{
 if(a===b)return true;
 const x=asNum(a),y=asNum(b);
 if(x!==undefined&&y!==undefined)return numEq(x,y);
 if((a instanceof PyList&&b instanceof PyList)||(a instanceof PyTuple&&b instanceof PyTuple))return a.items.length===b.items.length&&a.items.every((v,i)=>pyEq(v,b.items[i]));
 if(a instanceof PyDict&&b instanceof PyDict){if(a.size!==b.size)return false;for(const [key,[,v]] of a.map){const o=b.map.get(key);if(!o||!pyEq(v,o[1]))return false;}return true;}
 if(a instanceof PySet&&b instanceof PySet)return a.map.size===b.map.size&&[...a.map.keys()].every(k=>b.map.has(k));
 if(a instanceof PyRange&&b instanceof PyRange){const n=a.length;return n===b.length&&(n===0||(a.start===b.start&&(n===1||a.step===b.step)));}
 return false;
}
function order(op:string,a:Value,b:Value):boolean{
 const rel=(c:number)=>op==='<'?c<0:op==='<='?c<=0:op==='>'?c>0:c>=0;
 const x=asNum(a),y=asNum(b);
 if(x!==undefined&&y!==undefined)return rel(x<y?-1:x>y?1:numEq(x,y)?0:NaN);
 if(typeof a==='string'&&typeof b==='string')return rel(a<b?-1:a>b?1:0);
 if((a instanceof PyList&&b instanceof PyList)||(a instanceof PyTuple&&b instanceof PyTuple)){
  const n=Math.min(a.items.length,b.items.length);
  for(let i=0;i<n;i++)if(!pyEq(a.items[i],b.items[i]))return order(op,a.items[i],b.items[i]);
  return rel(a.items.length-b.items.length);
 }
 if(a instanceof PySet&&b instanceof PySet){
  const sub=(p:PySet,q:PySet)=>[...p.map.keys()].every(k=>q.map.has(k));
  return op==='<='?sub(a,b):op==='>='?sub(b,a):op==='<'?a.map.size<b.map.size&&sub(a,b):b.map.size<a.map.size&&sub(b,a);
 }
 throw err('TypeError',`'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
}

// ---------- tokenizer ----------
type TokType='name'|'number'|'string'|'op'|'newline'|'indent'|'dedent'|'eof';
type Tok={type:TokType;value:string;line:number;col:number;prefix:string};
const OPERATORS=['**=','//=','>>=','<<=','...','!=','%=','&=','**','*=','+=','-=','->','//','/=',':=','<<','<=','==','>=','>>','@=','^=','|=','%','&','(',')','*','+',',','-','.','/',':',';','<','=','>','@','[',']','^','{','|','}','~'];
const CLOSERS:Record<string,string>={')':'(',']':'[','}':'{'};
const NAME=new RegExp('[\\p{L}\\p{Nl}_][\\p{L}\\p{Nl}\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*','uy');
const NAME_PART=new RegExp('[\\p{L}\\p{Nl}\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]','u');
const NUMBER=/(?:0[xX](?:_?[\da-fA-F])+|0[oO](?:_?[0-7])+|0[bB](?:_?[01])+|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?[jJ]?)/y;
const STRING_START=/(?:[rR][bBfF]?|[bBfF][rR]?|[uU])?(?=['"])/y;

function tokenize(source:string):Tok[]{
 const src=source.replace(/\r\n?/g,'\n'),toks:Tok[]=[],indents=[0],open:{ch:string;line:number;col:number}[]=[];
 let i=0,line=1,lineStart=0,atStart=true;
 const col=(at:number)=>at-lineStart+1;
 const fail=(message:string,l:number,c:number,type='SyntaxError'):never=>{throw new PySyntax(type,message,l,c);};
 const push=(type:TokType,value:string,at:number,prefix='')=>{toks.push({type,value,line,col:col(at),prefix});};
 while(i<src.length){
  if(atStart){
   atStart=false;
   let width=0,j=i;
   for(;j<src.length;j++){const c=src[j];if(c===' ')width++;else if(c==='\t')width=(Math.floor(width/8)+1)*8;else if(c==='\f')width=0;else break;}
   if(j>=src.length){i=j;break;}
   if(src[j]==='\n'||src[j]==='#'){while(j<src.length&&src[j]!=='\n')j++;i=j+1;line++;lineStart=i;atStart=true;continue;}
   i=j;
   const top=indents[indents.length-1];
   if(width>top){indents.push(width);push('indent','',i);}
   else if(width<top){
    while(width<indents[indents.length-1]){indents.pop();push('dedent','',i);}
    if(width!==indents[indents.length-1])fail('unindent does not match any outer indentation level',line,col(i),'IndentationError');
   }
   continue;
  }
  const c=src[i];
  if(c===' '||c==='\t'||c==='\f'){i++;continue;}
  if(c==='#'){while(i<src.length&&src[i]!=='\n')i++;continue;}
  if(c==='\n'){if(!open.length){push('newline','',i);atStart=true;}i++;line++;lineStart=i;continue;}
  if(c==='\\'){if(src[i+1]==='\n'){i+=2;line++;lineStart=i;continue;}fail('unexpected character after line continuation character',line,col(i));}
  STRING_START.lastIndex=i;const sm=STRING_START.exec(src);
  if(sm){
   const prefix=sm[0].toLowerCase(),startLine=line,startCol=col(i),q=src[i+sm[0].length],triple=src.startsWith(q+q+q,i+sm[0].length),close=triple?q+q+q:q,f=prefix.includes('f');
   let j=i+sm[0].length+close.length,depth=0;const bodyStart=j;
   const unterminated=()=>fail(triple?`unterminated triple-quoted string literal (detected at line ${line})`:`unterminated string literal (detected at line ${startLine})`,startLine,startCol);
   for(;;){
    if(j>=src.length)unterminated();
    const ch=src[j];
    if(ch==='\\'){if(src[j+1]==='\n'){line++;lineStart=j+2;}j+=2;continue;}
    if(ch==='\n'){if(!triple)unterminated();line++;lineStart=j+1;j++;continue;}
    if(f&&depth>0){
     if(ch==='{'||ch==='['||ch==='(')depth++;
     else if(ch==='}'||ch===']'||ch===')')depth--;
     else if(ch==='"'||ch==="'"){let k=j+1;while(k<src.length&&src[k]!==ch&&src[k]!=='\n'){if(src[k]==='\\')k++;k++;}if(src[k]!==ch)unterminated();j=k+1;continue;}
     j++;continue;
    }
    if(f&&ch==='{'){if(src[j+1]==='{')j+=2;else{depth=1;j++;}continue;}
    if(src.startsWith(close,j))break;
    j++;
   }
   toks.push({type:'string',value:src.slice(bodyStart,j),line:startLine,col:startCol,prefix});
   i=j+close.length;continue;
  }
  if((c>='0'&&c<='9')||(c==='.'&&src[i+1]>='0'&&src[i+1]<='9')){
   NUMBER.lastIndex=i;const text=NUMBER.exec(src)![0];
   if(NAME_PART.test(src[i+text.length]??''))fail('invalid decimal literal',line,col(i));
   if(/^0[\d_]*$/.test(text)&&/[1-9]/.test(text))fail('leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers',line,col(i));
   push('number',text,i);i+=text.length;continue;
  }
  NAME.lastIndex=i;const nm=NAME.exec(src);
  if(nm){push('name',nm[0],i);i+=nm[0].length;continue;}
  const op=OPERATORS.find(o=>src.startsWith(o,i));
  if(op){
   if(op==='('||op==='['||op==='{')open.push({ch:op,line,col:col(i)});
   else if(op===')'||op===']'||op==='}'){
    const top=open.pop();
    if(!top)fail(`unmatched '${op}'`,line,col(i));
    else if(top.ch!==CLOSERS[op])fail(`closing parenthesis '${op}' does not match opening parenthesis '${top.ch}'${top.line!==line?` on line ${top.line}`:''}`,line,col(i));
   }
   push('op',op,i);i+=op.length;continue;
  }
  const cp=src.codePointAt(i)!;
  if(cp<128)fail('invalid syntax',line,col(i));
  fail(`invalid character '${String.fromCodePoint(cp)}' (U+${cp.toString(16).toUpperCase().padStart(4,'0')})`,line,col(i));
 }
 if(open.length){const o=open[open.length-1];fail(`'${o.ch}' was never closed`,o.line,o.col);}
 if(toks.length&&toks[toks.length-1].type!=='newline')push('newline','',i);
 while(indents.length>1){indents.pop();push('dedent','',i);}
 push('eof','',i);
 return toks;
}

// ---------- syntax tree ----------
type Pos={line:number;col:number};
type FPart=string|{e:Expr;conv:string;spec:FPart[]|null;debug:string};
type Arg={kind:'pos'|'star'|'kw'|'dstar';name?:string;value:Expr};
type Param={name:string;kind:'pos'|'star'|'dstar'|'kwonly';def:Expr|null};
type Gen={target:Expr;iter:Expr;ifs:Expr[]};
type FuncInfo={locals:Set<string>;globals:Set<string>;nonlocals:Set<string>};
type Expr=Pos&(
 {k:'const';v:Value}|{k:'fstr';parts:FPart[]}|{k:'name';id:string}|
 {k:'list'|'tuple'|'set';items:Expr[]}|{k:'dict';keys:(Expr|null)[];values:Expr[]}|
 {k:'bin';op:string;l:Expr;r:Expr}|{k:'unary';op:string;e:Expr}|{k:'bool';op:'and'|'or';l:Expr;r:Expr}|
 {k:'cmp';l:Expr;ops:string[];rs:Expr[]}|{k:'ifexp';test:Expr;body:Expr;orelse:Expr}|
 {k:'lambda';params:Param[];body:Expr;info:FuncInfo}|{k:'call';fn:Expr;args:Arg[]}|
 {k:'attr';obj:Expr;name:string}|{k:'sub';obj:Expr;index:Expr}|{k:'slice';lo:Expr|null;hi:Expr|null;step:Expr|null}|
 {k:'comp';kind:'list'|'set'|'dict'|'gen';elt:Expr;val:Expr|null;gens:Gen[]}|{k:'star';e:Expr}|{k:'walrus';id:string;value:Expr}
);
type Handler={type:Expr|null;name:string|null;body:Stmt[]};
type Stmt=Pos&(
 {k:'expr';e:Expr}|{k:'assign';targets:Expr[];value:Expr}|{k:'aug';target:Expr;op:string;value:Expr}|{k:'ann';target:Expr;value:Expr|null}|
 {k:'if';test:Expr;body:Stmt[];orelse:Stmt[]}|{k:'while';test:Expr;body:Stmt[];orelse:Stmt[]}|
 {k:'for';target:Expr;iter:Expr;body:Stmt[];orelse:Stmt[]}|{k:'def';name:string;params:Param[];body:Stmt[];info:FuncInfo}|
 {k:'return';value:Expr|null}|{k:'break'}|{k:'continue'}|{k:'pass'}|
 {k:'import';names:[string,string|null][]}|{k:'from';module:string;names:[string,string|null][]}|
 {k:'with';items:{e:Expr;target:Expr|null}[];body:Stmt[]}|{k:'try';body:Stmt[];handlers:Handler[];orelse:Stmt[];final:Stmt[]}|
 {k:'raise';exc:Expr|null;cause:Expr|null}|{k:'global';names:string[]}|{k:'nonlocal';names:string[]}|
 {k:'del';targets:Expr[]}|{k:'assert';test:Expr;msg:Expr|null}
);

const KEYWORDS=new Set(['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield']);
const AUG=new Set(['+=','-=','*=','/=','//=','%=','**=','&=','|=','^=','<<=','>>=','@=']);
const COMPARE=new Set(['<','>','==','>=','<=','!=']);
const LEVELS=[['|'],['^'],['&'],['<<','>>'],['+','-'],['*','/','//','%','@']];
const ESCAPES:Record<string,string>={'\n':'','\\':'\\',"'":"'",'"':'"',a:'\x07',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t',v:'\v'};
function decodeEscapes(s:string):string{
 if(!s.includes('\\'))return s;
 return s.replace(/\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[0-7]{1,3}|[\s\S])/g,(whole,e:string)=>{
  if(e.length===1&&e in ESCAPES)return ESCAPES[e];
  if(e[0]==='x'||e[0]==='u'||e[0]==='U'){const cp=parseInt(e.slice(1),16);return cp<=0x10ffff?String.fromCodePoint(cp):whole;}
  if(e[0]>='0'&&e[0]<='7')return String.fromCharCode(parseInt(e,8));
  return whole;
 });
}
function analyzeScope(params:Param[],body:Stmt[]):FuncInfo{
 const locals=new Set(params.map(p=>p.name)),globals=new Set<string>(),nonlocals=new Set<string>();
 const target=(e:Expr):void=>{if(e.k==='name')locals.add(e.id);else if(e.k==='tuple'||e.k==='list')e.items.forEach(target);else if(e.k==='star')target(e.e);};
 const walk=(list:Stmt[]):void=>{for(const s of list)switch(s.k){
  case 'assign':s.targets.forEach(target);break;
  case 'aug':case 'ann':target(s.target);break;
  case 'for':target(s.target);walk(s.body);walk(s.orelse);break;
  case 'while':case 'if':walk(s.body);walk(s.orelse);break;
  case 'with':for(const item of s.items)if(item.target)target(item.target);walk(s.body);break;
  case 'try':walk(s.body);for(const h of s.handlers){if(h.name)locals.add(h.name);walk(h.body);}walk(s.orelse);walk(s.final);break;
  case 'def':locals.add(s.name);break;
  case 'import':for(const [m,as] of s.names)locals.add(as??m.split('.')[0]);break;
  case 'from':for(const [n,as] of s.names)if(n!=='*')locals.add(as??n);break;
  case 'del':s.targets.forEach(target);break;
  case 'global':s.names.forEach(n=>globals.add(n));break;
  case 'nonlocal':s.names.forEach(n=>nonlocals.add(n));break;
 }};
 walk(body);
 for(const n of [...globals,...nonlocals])locals.delete(n);
 return {locals,globals,nonlocals};
}
const describe=(e:Expr):string=>e.k==='call'?'function call':e.k==='const'?(e.v===null||typeof e.v==='boolean'?pyRepr(e.v):'literal'):e.k==='fstr'?'f-string expression':e.k==='cmp'?'comparison':e.k==='lambda'?'lambda':e.k==='ifexp'?'conditional expression':e.k==='comp'?(e.kind==='gen'?'generator expression':e.kind+' comprehension'):e.k==='dict'?'dict literal':e.k==='set'?'set display':'expression';

class Parser{
 toks:Tok[];p=0;loops=0;funcs=0;
 constructor(toks:Tok[]){this.toks=toks;}
 get tok():Tok{return this.toks[this.p];}
 peek(n=1):Tok{return this.toks[Math.min(this.p+n,this.toks.length-1)];}
 isOp(v:string,t:Tok=this.tok){return t.type==='op'&&t.value===v;}
 isKw(v:string,t:Tok=this.tok){return t.type==='name'&&t.value===v;}
 next():Tok{const t=this.tok;if(t.type!=='eof')this.p++;return t;}
 eatOp(v:string){if(this.isOp(v)){this.p++;return true;}return false;}
 eatKw(v:string){if(this.isKw(v)){this.p++;return true;}return false;}
 fail(message:string,t:Tok=this.tok,type='SyntaxError'):never{throw new PySyntax(type,message,t.line,t.col);}
 unsupported(what:string,t:Tok=this.tok):never{throw new PySyntax('NotImplementedError',`${what} not supported in this simulated Python`,t.line,t.col);}
 expectOp(v:string,message=`expected '${v}'`){if(!this.eatOp(v))this.fail(message);}
 startsExpr(t:Tok){return t.type==='number'||t.type==='string'||(t.type==='name'&&(!KEYWORDS.has(t.value)||['True','False','None','not','lambda'].includes(t.value)))||(t.type==='op'&&['(','[','{','-','+','~'].includes(t.value));}
 closeBracket(ch:string){if(this.eatOp(ch))return;this.fail(this.startsExpr(this.tok)?'invalid syntax. Perhaps you forgot a comma?':'invalid syntax');}
 name():string{const t=this.tok;if(t.type!=='name'||KEYWORDS.has(t.value))this.fail('invalid syntax');this.p++;return t.value;}
 at(t:Tok):Pos{return {line:t.line,col:t.col};}

 file():Stmt[]{const body:Stmt[]=[];while(this.tok.type!=='eof'){if(this.tok.type==='newline'){this.p++;continue;}body.push(...this.statement());}return body;}
 statement():Stmt[]{
  const t=this.tok;
  if(t.type==='indent')this.fail('unexpected indent',t,'IndentationError');
  if(t.type==='dedent')this.fail('unindent does not match any outer indentation level',t,'IndentationError');
  if(t.type==='name')switch(t.value){
   case 'if':return [this.ifStmt()];
   case 'while':return [this.whileStmt()];
   case 'for':return [this.forStmt()];
   case 'def':return [this.defStmt()];
   case 'with':return [this.withStmt()];
   case 'try':return [this.tryStmt()];
   case 'class':if(this.peek().type==='name')return this.unsupported('class definitions are');break;
   case 'async':return this.unsupported('async functions are');
  }
  if(this.isOp('@'))this.unsupported('decorators are');
  return this.simpleLine();
 }
 block(kind:string,header:Tok):Stmt[]{
  if(!this.eatOp(':'))this.fail("expected ':'");
  if(this.tok.type!=='newline')return this.simpleLine();
  const first=this.toks[++this.p];
  if(first.type!=='indent')this.fail(`expected an indented block after ${kind} on line ${header.line}`,first,'IndentationError');
  this.p++;
  const body:Stmt[]=[];
  const kindAt=()=>this.toks[this.p].type;
  while(kindAt()!=='dedent'&&kindAt()!=='eof')body.push(...this.statement());
  if(kindAt()==='dedent')this.p++;
  return body;
 }
 simpleLine():Stmt[]{
  const out=[this.simple()];
  while(this.eatOp(';')){if(this.tok.type==='newline')break;out.push(this.simple());}
  if(this.tok.type!=='newline'){
   const last=out[out.length-1];
   if(last.k==='expr'&&last.e.k==='name'&&(last.e.id==='print'||last.e.id==='exec')&&this.startsExpr(this.tok))this.fail(`Missing parentheses in call to '${last.e.id}'. Did you mean ${last.e.id}(...)?`,this.toks[this.p-1]);
   this.fail('invalid syntax');
  }
  this.p++;return out;
 }
 endOfSimple(){return this.tok.type==='newline'||this.isOp(';');}
 simple():Stmt{
  const t=this.tok,pos=this.at(t);
  if(t.type==='name')switch(t.value){
   case 'pass':this.p++;return {...pos,k:'pass'};
   case 'break':if(!this.loops)this.fail("'break' outside loop");this.p++;return {...pos,k:'break'};
   case 'continue':if(!this.loops)this.fail("'continue' not properly in loop");this.p++;return {...pos,k:'continue'};
   case 'return':if(!this.funcs)this.fail("'return' outside function");this.p++;return {...pos,k:'return',value:this.endOfSimple()?null:this.exprList(true)};
   case 'raise':{this.p++;if(this.endOfSimple())return {...pos,k:'raise',exc:null,cause:null};const exc=this.test();const cause=this.eatKw('from')?this.test():null;return {...pos,k:'raise',exc,cause};}
   case 'global':case 'nonlocal':{
    this.p++;if(t.value==='nonlocal'&&!this.funcs)this.fail('nonlocal declaration not allowed at module level',t);
    const names=[this.name()];while(this.eatOp(','))names.push(this.name());
    return t.value==='global'?{...pos,k:'global',names}:{...pos,k:'nonlocal',names};
   }
   case 'del':{this.p++;const e=this.exprList(false),targets=e.k==='tuple'?e.items:[e];for(const x of targets)if(!['name','sub','attr','tuple','list'].includes(x.k))this.fail(`cannot delete ${describe(x)}`,t);return {...pos,k:'del',targets};}
   case 'assert':{this.p++;const test=this.test();const msg=this.eatOp(',')?this.test():null;return {...pos,k:'assert',test,msg};}
   case 'import':{
    this.p++;const names:[string,string|null][]=[];
    do{let n=this.name();while(this.eatOp('.'))n+='.'+this.name();names.push([n,this.eatKw('as')?this.name():null]);}while(this.eatOp(','));
    return {...pos,k:'import',names};
   }
   case 'from':{
    this.p++;if(this.isOp('.')||this.isOp('...'))this.unsupported('relative imports are');
    let mod=this.name();while(this.eatOp('.'))mod+='.'+this.name();
    if(!this.eatKw('import'))this.fail('invalid syntax');
    const names:[string,string|null][]=[];
    if(this.eatOp('*'))names.push(['*',null]);
    else{const paren=this.eatOp('(');do{if(paren&&this.isOp(')'))break;names.push([this.name(),this.eatKw('as')?this.name():null]);}while(this.eatOp(','));if(paren)this.closeBracket(')');}
    return {...pos,k:'from',module:mod,names};
   }
   case 'yield':this.unsupported('generators (yield) are');
  }
  const first=this.exprList(true);
  if(this.isOp('=')){
   const chain=[first];
   while(this.eatOp('=')){if(this.isKw('yield'))this.unsupported('generators (yield) are');chain.push(this.exprList(true));}
   const value=chain.pop()!;
   for(const target of chain)this.checkTarget(target,t,true);
   return {...pos,k:'assign',targets:chain,value};
  }
  if(this.tok.type==='op'&&AUG.has(this.tok.value)){
   if(first.k!=='name'&&first.k!=='attr'&&first.k!=='sub')this.fail(`'${first.k==='tuple'?'tuple':describe(first)}' is an illegal expression for augmented assignment`,t);
   const op=this.next().value.slice(0,-1);
   return {...pos,k:'aug',target:first,op,value:this.exprList(false)};
  }
  if(this.isOp(':')&&(first.k==='name'||first.k==='attr'||first.k==='sub')){
   this.p++;this.test();
   return {...pos,k:'ann',target:first,value:this.eatOp('=')?this.exprList(true):null};
  }
  if(first.k==='star')this.fail("can't use starred expression here",t);
  return {...pos,k:'expr',e:first};
 }
 checkTarget(e:Expr,t:Tok,assign:boolean):void{
  switch(e.k){
   case 'name':case 'attr':case 'sub':return;
   case 'tuple':case 'list':{if(e.items.filter(x=>x.k==='star').length>1)this.fail('multiple starred expressions in assignment',t);e.items.forEach(x=>this.checkTarget(x,t,assign));return;}
   case 'star':this.checkTarget(e.e,t,assign);return;
  }
  const what=describe(e);
  if(e.k==='const'&&(e.v===null||typeof e.v==='boolean'))this.fail(`cannot assign to ${what}`,t);
  this.fail(`cannot assign to ${what}${assign?" here. Maybe you meant '==' instead of '='?":''}`,t);
 }
 condition():Expr{const e=this.test();if(this.isOp('='))this.fail("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");return e;}
 elseBlock():Stmt[]{if(!this.isKw('else'))return [];const e=this.next();return this.block("'else' statement",e);}
 ifStmt():Stmt{
  const t=this.next(),test=this.condition(),body=this.block(`'${t.value}' statement`,t);
  const orelse=this.isKw('elif')?[this.ifStmt()]:this.elseBlock();
  return {...this.at(t),k:'if',test,body,orelse};
 }
 whileStmt():Stmt{const t=this.next(),test=this.condition();this.loops++;const body=this.block("'while' statement",t);this.loops--;return {...this.at(t),k:'while',test,body,orelse:this.elseBlock()};}
 forStmt():Stmt{
  const t=this.next(),target=this.targetList();this.checkTarget(target,t,false);
  if(!this.eatKw('in'))this.fail("expected 'in'");
  const iter=this.exprList(true);this.loops++;const body=this.block("'for' statement",t);this.loops--;
  return {...this.at(t),k:'for',target,iter,body,orelse:this.elseBlock()};
 }
 defStmt():Stmt{
  const t=this.next(),name=this.name();
  this.expectOp('(',"expected '('");
  const params=this.params(')',true);
  this.closeBracket(')');
  if(this.eatOp('->'))this.test();
  const loops=this.loops;this.loops=0;this.funcs++;
  const body=this.block('function definition',t);
  this.funcs--;this.loops=loops;
  return {...this.at(t),k:'def',name,params,body,info:analyzeScope(params,body)};
 }
 params(end:string,annotations:boolean):Param[]{
  const out:Param[]=[];let star=false,sawDefault=false;
  while(!this.isOp(end)){
   const t=this.tok;
   if(this.eatOp('/')){if(!this.eatOp(','))break;continue;}
   if(this.eatOp('**')){out.push({name:this.name(),kind:'dstar',def:null});if(annotations&&this.eatOp(':'))this.test();}
   else if(this.eatOp('*')){star=true;if(!this.isOp(',')){out.push({name:this.name(),kind:'star',def:null});if(annotations&&this.eatOp(':'))this.test();}}
   else{
    const name=this.name();if(annotations&&this.eatOp(':'))this.test();
    const def=this.eatOp('=')?this.test():null;
    if(!star){if(def)sawDefault=true;else if(sawDefault)this.fail('parameter without a default follows parameter with a default',t);}
    out.push({name,kind:star?'kwonly':'pos',def});
   }
   const last=out[out.length-1];
   if(last&&out.filter(p=>p.name===last.name).length>1)this.fail(`duplicate argument '${last.name}' in function definition`,t);
   if(!this.eatOp(','))break;
  }
  return out;
 }
 withStmt():Stmt{
  const t=this.next(),items:{e:Expr;target:Expr|null}[]=[];
  do{const e=this.test();let target:Expr|null=null;if(this.eatKw('as')){target=this.bitOr();this.checkTarget(target,t,false);}items.push({e,target});}while(this.eatOp(','));
  return {...this.at(t),k:'with',items,body:this.block("'with' statement",t)};
 }
 tryStmt():Stmt{
  const t=this.next(),body=this.block("'try' statement",t),handlers:Handler[]=[];
  while(this.isKw('except')){
   const h=this.next();let type:Expr|null=null,name:string|null=null;
   if(handlers.length&&!handlers[handlers.length-1].type)this.fail("default 'except:' must be last",h);
   if(!this.isOp(':')){type=this.test();if(this.isOp(','))this.fail('multiple exception types must be parenthesized');if(this.eatKw('as'))name=this.name();}
   handlers.push({type,name,body:this.block("'except' statement",h)});
  }
  const orelse=handlers.length?this.elseBlock():[];
  let final:Stmt[]=[];
  if(this.isKw('finally')){const f=this.next();final=this.block("'finally' statement",f);}
  if(!handlers.length&&!final.length)this.fail("expected 'except' or 'finally' block");
  return {...this.at(t),k:'try',body,handlers,orelse,final};
 }

 exprList(star:boolean):Expr{
  const t=this.tok,first=this.starOrTest(star);
  if(!this.isOp(','))return first;
  const items=[first];
  while(this.eatOp(',')){
   const n=this.tok;
   if(n.type==='newline'||n.type==='eof'||(n.type==='op'&&(['=',')',']','}',';',':'].includes(n.value)||AUG.has(n.value)))||this.isKw('in'))break;
   items.push(this.starOrTest(star));
  }
  return {...this.at(t),k:'tuple',items};
 }
 starOrTest(star:boolean):Expr{const t=this.tok;if(star&&this.eatOp('*'))return {...this.at(t),k:'star',e:this.bitOr()};return this.test();}
 test():Expr{
  const t=this.tok;
  if(this.isKw('lambda')){
   this.p++;const params=this.params(':',false);this.expectOp(':');
   const body=this.test();return {...this.at(t),k:'lambda',params,body,info:{locals:new Set(params.map(p=>p.name)),globals:new Set(),nonlocals:new Set()}};
  }
  if(t.type==='name'&&!KEYWORDS.has(t.value)&&this.isOp(':=',this.peek())){this.p+=2;return {...this.at(t),k:'walrus',id:t.value,value:this.test()};}
  const e=this.orTest();
  if(this.isKw('if')){
   this.p++;const test=this.orTest();
   if(!this.eatKw('else'))this.fail("expected 'else' after 'if' expression");
   return {...this.at(t),k:'ifexp',test,body:e,orelse:this.test()};
  }
  return e;
 }
 orTest():Expr{let e=this.andTest();while(this.eatKw('or'))e={line:e.line,col:e.col,k:'bool',op:'or',l:e,r:this.andTest()};return e;}
 andTest():Expr{let e=this.notTest();while(this.eatKw('and'))e={line:e.line,col:e.col,k:'bool',op:'and',l:e,r:this.notTest()};return e;}
 notTest():Expr{const t=this.tok;if(this.eatKw('not'))return {...this.at(t),k:'unary',op:'not',e:this.notTest()};return this.comparison();}
 comparison():Expr{
  const l=this.bitOr(),ops:string[]=[],rs:Expr[]=[];
  for(;;){
   const t=this.tok;let op:string;
   if(t.type==='op'&&COMPARE.has(t.value)){op=t.value;this.p++;}
   else if(this.isKw('in')){op='in';this.p++;}
   else if(this.isKw('not')&&this.isKw('in',this.peek())){op='not in';this.p+=2;}
   else if(this.isKw('is')){this.p++;op=this.eatKw('not')?'is not':'is';}
   else break;
   ops.push(op);rs.push(this.bitOr());
  }
  return ops.length?{line:l.line,col:l.col,k:'cmp',l,ops,rs}:l;
 }
 bitOr():Expr{return this.binary(0);}
 binary(level:number):Expr{
  if(level===LEVELS.length)return this.factor();
  let e=this.binary(level+1);
  while(this.tok.type==='op'&&LEVELS[level].includes(this.tok.value)){const op=this.next().value;e={line:e.line,col:e.col,k:'bin',op,l:e,r:this.binary(level+1)};}
  return e;
 }
 factor():Expr{const t=this.tok;if(t.type==='op'&&(t.value==='-'||t.value==='+'||t.value==='~')){this.p++;return {...this.at(t),k:'unary',op:t.value,e:this.factor()};}return this.power();}
 power():Expr{const base=this.primary();if(this.eatOp('**'))return {line:base.line,col:base.col,k:'bin',op:'**',l:base,r:this.factor()};return base;}
 primary():Expr{
  if(this.isKw('await'))this.unsupported('await is');
  let e=this.atom();
  for(;;){
   if(this.eatOp('('))e={line:e.line,col:e.col,k:'call',fn:e,args:this.callArgs()};
   else if(this.eatOp('[')){e={line:e.line,col:e.col,k:'sub',obj:e,index:this.subscript()};this.closeBracket(']');}
   else if(this.eatOp('.')){const n=this.tok;if(n.type!=='name')this.fail('invalid syntax',n);this.p++;e={line:e.line,col:e.col,k:'attr',obj:e,name:n.value};}
   else return e;
  }
 }
 subscript():Expr{
  const t=this.tok,first=this.sliceItem();
  if(!this.isOp(','))return first;
  const items=[first];while(this.eatOp(',')){if(this.isOp(']'))break;items.push(this.sliceItem());}
  return {...this.at(t),k:'tuple',items};
 }
 sliceItem():Expr{
  const t=this.tok,lo=this.isOp(':')?null:this.test();
  if(!this.eatOp(':'))return lo!;
  const hi=this.isOp(']')||this.isOp(',')||this.isOp(':')?null:this.test();
  let step:Expr|null=null;
  if(this.eatOp(':')&&!this.isOp(']')&&!this.isOp(','))step=this.test();
  return {...this.at(t),k:'slice',lo,hi,step};
 }
 callArgs():Arg[]{
  const args:Arg[]=[];let sawKw=false;
  while(!this.isOp(')')){
   const t=this.tok;
   if(this.eatOp('*'))args.push({kind:'star',value:this.test()});
   else if(this.eatOp('**')){args.push({kind:'dstar',value:this.test()});sawKw=true;}
   else if(t.type==='name'&&!KEYWORDS.has(t.value)&&this.isOp('=',this.peek())){
    this.p+=2;if(args.some(a=>a.kind==='kw'&&a.name===t.value))this.fail(`keyword argument repeated: ${t.value}`,t);
    args.push({kind:'kw',name:t.value,value:this.test()});sawKw=true;
   }else{
    const value=this.test();
    if(this.isKw('for'))args.push({kind:'pos',value:this.comprehension('gen',value,null,this.at(t))});
    else{
     if(this.isOp('='))this.fail('expression cannot contain assignment, perhaps you meant "=="?',t);
     if(sawKw)this.fail(args.some(a=>a.kind==='dstar')?'positional argument follows keyword argument unpacking':'positional argument follows keyword argument',t);
     args.push({kind:'pos',value});
    }
   }
   if(!this.eatOp(','))break;
  }
  this.closeBracket(')');
  return args;
 }
 targetList():Expr{
  const t=this.tok,one=()=>{const s=this.tok;return this.eatOp('*')?{...this.at(s),k:'star' as const,e:this.bitOr()}:this.bitOr();};
  const first=one();
  if(!this.isOp(','))return first;
  const items=[first];while(this.eatOp(',')){if(this.isKw('in')||this.isOp('='))break;items.push(one());}
  return {...this.at(t),k:'tuple',items};
 }
 comprehension(kind:'list'|'set'|'dict'|'gen',elt:Expr,val:Expr|null,pos:Pos):Expr{
  const gens:Gen[]=[];
  while(this.isKw('for')){
   const t=this.next(),target=this.targetList();this.checkTarget(target,t,false);
   if(!this.eatKw('in'))this.fail("expected 'in'");
   const iter=this.orTest(),ifs:Expr[]=[];
   while(this.eatKw('if'))ifs.push(this.orTest());
   gens.push({target,iter,ifs});
  }
  return {...pos,k:'comp',kind,elt,val,gens};
 }
 atom():Expr{
  const t=this.tok,pos=this.at(t);
  if(t.type==='number'){this.p++;return {...pos,k:'const',v:this.number(t)};}
  if(t.type==='string')return this.strings();
  if(t.type==='name'){
   if(t.value==='True'||t.value==='False'||t.value==='None'){this.p++;return {...pos,k:'const',v:t.value==='None'?null:t.value==='True'};}
   if(t.value==='yield')this.unsupported('generators (yield) are');
   if(KEYWORDS.has(t.value))this.fail('invalid syntax');
   this.p++;return {...pos,k:'name',id:t.value};
  }
  if(this.eatOp('(')){
   if(this.eatOp(')'))return {...pos,k:'tuple',items:[]};
   if(this.isKw('yield'))this.unsupported('generators (yield) are');
   const first=this.starOrTest(true);
   if(this.isKw('for')){const c=this.comprehension('gen',first,null,pos);this.closeBracket(')');return c;}
   if(!this.isOp(',')){this.closeBracket(')');if(first.k==='star')this.fail('cannot use starred expression here',t);return first;}
   const items=[first];while(this.eatOp(',')){if(this.isOp(')'))break;items.push(this.starOrTest(true));}
   this.closeBracket(')');return {...pos,k:'tuple',items};
  }
  if(this.eatOp('[')){
   if(this.eatOp(']'))return {...pos,k:'list',items:[]};
   const first=this.starOrTest(true);
   if(this.isKw('for')){const c=this.comprehension('list',first,null,pos);this.closeBracket(']');return c;}
   const items=[first];while(this.eatOp(',')){if(this.isOp(']'))break;items.push(this.starOrTest(true));}
   this.closeBracket(']');return {...pos,k:'list',items};
  }
  if(this.eatOp('{')){
   if(this.eatOp('}'))return {...pos,k:'dict',keys:[],values:[]};
   const keys:(Expr|null)[]=[],values:Expr[]=[];
   const entry=()=>{if(this.eatOp('**')){keys.push(null);values.push(this.bitOr());return;}keys.push(this.test());this.expectOp(':',"':' expected after dictionary key");values.push(this.dictValue());};
   if(this.isOp('**')){entry();}
   else{
    const first=this.starOrTest(true);
    if(!this.eatOp(':')){
     if(this.isKw('for')){const c=this.comprehension('set',first,null,pos);this.closeBracket('}');return c;}
     const items=[first];while(this.eatOp(',')){if(this.isOp('}'))break;items.push(this.starOrTest(true));}
     this.closeBracket('}');return {...pos,k:'set',items};
    }
    const v=this.dictValue();
    if(this.isKw('for')){const c=this.comprehension('dict',first,v,pos);this.closeBracket('}');return c;}
    keys.push(first);values.push(v);
   }
   while(this.eatOp(',')){if(this.isOp('}'))break;entry();}
   this.closeBracket('}');return {...pos,k:'dict',keys,values};
  }
  if(this.eatOp('...'))return {...pos,k:'const',v:null};
  this.fail('invalid syntax');
 }
 dictValue():Expr{if(!this.startsExpr(this.tok))this.fail("expression expected after dictionary key and ':'");return this.test();}
 number(t:Tok):Value{
  const text=t.value.replace(/_/g,'');
  if(/[jJ]$/.test(text))this.unsupported('complex numbers are',t);
  if(/^0[xXoObB]/.test(text))return BigInt(text.slice(0,2).toLowerCase()+text.slice(2));
  return /[.eE]/.test(text)?Number(text):BigInt(text);
 }
 strings():Expr{
  const t=this.tok,parts:FPart[]=[];let isF=false;
  while(this.tok.type==='string'){
   const s=this.next();
   if(s.prefix.includes('b'))this.unsupported('bytes literals are',s);
   if(s.prefix.includes('f')){isF=true;parts.push(...this.fstring(s.value,s.prefix.includes('r'),s));}
   else parts.push(s.prefix.includes('r')?s.value:decodeEscapes(s.value));
  }
  if(!isF)return {...this.at(t),k:'const',v:parts.join('')};
  const merged:FPart[]=[];
  for(const part of parts){const last=merged[merged.length-1];if(typeof part==='string'&&typeof last==='string')merged[merged.length-1]=last+part;else merged.push(part);}
  return {...this.at(t),k:'fstr',parts:merged};
 }
 fstring(raw:string,isRaw:boolean,tok:Tok):FPart[]{
  const parts:FPart[]=[];let lit='',i=0;
  const flush=()=>{if(lit){parts.push(isRaw?lit:decodeEscapes(lit));lit='';}};
  while(i<raw.length){
   const c=raw[i];
   if(c==='\\'&&!isRaw&&raw[i+1]!=='{'&&raw[i+1]!=='}'){lit+=c+(raw[i+1]??'');i+=2;continue;}
   if(c==='{'){
    if(raw[i+1]==='{'){lit+='{';i+=2;continue;}
    flush();const [part,end]=this.field(raw,i+1,tok);parts.push(part);i=end;continue;
   }
   if(c==='}'){if(raw[i+1]==='}'){lit+='}';i+=2;continue;}this.fail("f-string: single '}' is not allowed",tok);}
   lit+=c;i++;
  }
  flush();return parts;
 }
 field(raw:string,start:number,tok:Tok):[FPart,number]{
  let i=start,depth=0,quote='';
  for(;i<raw.length;i++){
   const c=raw[i];
   if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
   if(c==="'"||c==='"'){quote=c;continue;}
   if(c==='('||c==='['||c==='{'){depth++;continue;}
   if(depth>0){if(c===')'||c===']'||c==='}')depth--;continue;}
   if(c==='}'||c===':')break;
   if(c==='!'&&raw[i+1]!=='=')break;
   if(c==='='&&raw[i+1]!=='='&&!'=!<>'.includes(raw[i-1]??''))break;
  }
  if(i>=raw.length)this.fail("f-string: expecting '}'",tok);
  const text=raw.slice(start,i);
  if(!text.trim())this.fail("f-string: valid expression required before '}'",tok);
  let debug='',conv='',spec:FPart[]|null=null;
  if(raw[i]==='='){i++;while(raw[i]===' ')i++;debug=raw.slice(start,i);}
  if(raw[i]==='!'){conv=raw[i+1]??'';if(!conv||!'rsa'.includes(conv))this.fail(`f-string: invalid conversion character '${conv}': expected 's', 'r', or 'a'`,tok);i+=2;}
  if(raw[i]===':'){
   const specStart=++i;let d=0;
   for(;i<raw.length;i++){const c=raw[i];if(c==='{')d++;else if(c==='}'){if(d===0)break;d--;}}
   spec=this.fstring(raw.slice(specStart,i),true,tok);
  }
  if(raw[i]!=='}')this.fail("f-string: expecting '}'",tok);
  let toks:Tok[];
  try{toks=tokenize('('+text+')');}catch(e){if(e instanceof PySyntax)this.fail('f-string: '+e.detail.message,tok);throw e;}
  const sub=new Parser(toks.map(x=>({...x,line:tok.line+x.line-1,col:x.line===1?tok.col:x.col})));
  sub.funcs=this.funcs;
  const e=sub.exprList(false);
  if(sub.tok.type!=='newline')sub.fail('f-string: invalid syntax');
  return [{e,conv,spec,debug},i+1];
 }
}
function parsePython(source:string):Stmt[]{return new Parser(tokenize(source)).file();}

// ---------- scopes ----------
class Scope{
 vars=new Map<string,Value>();kind:'module'|'function'|'comp';parent:Scope|null;info:FuncInfo|null;
 constructor(kind:'module'|'function'|'comp',parent:Scope|null,info:FuncInfo|null=null){this.kind=kind;this.parent=parent;this.info=info;}
}
type Signal=null|{k:'break'}|{k:'continue'}|{k:'return';v:Value};
const BREAK:Signal={k:'break'},CONTINUE:Signal={k:'continue'};
type Method<T>=(self:T,args:Value[],kw:Map<string,Value>)=>Value;
type Methods<T>=Record<string,Method<T>>;

function arity(name:string,args:Value[],min:number,max=min){
 if(args.length>=min&&args.length<=max)return;
 if(min===max)throw err('TypeError',`${name}() takes ${min===0?'no arguments':min===1?'exactly one argument':`exactly ${min} arguments`} (${args.length} given)`);
 if(args.length<min)throw err('TypeError',`${name}() takes at least ${plural(min,'argument')} (${args.length} given)`);
 throw err('TypeError',`${name}() takes at most ${plural(max,'argument')} (${args.length} given)`);
}
function noKw(name:string,kw:Map<string,Value>){if(kw.size)throw err('TypeError',`${name}() takes no keyword arguments`);}
function allowKw(name:string,kw:Map<string,Value>,allowed:string[]){for(const k of kw.keys())if(!allowed.includes(k))throw err('TypeError',`'${k}' is an invalid keyword argument for ${name}()`);}
function arg(args:Value[],kw:Map<string,Value>,index:number,name:string):Value|undefined{
 if(index<args.length){if(kw.has(name))throw err('TypeError',`argument for function given by name ('${name}') and position (${index+1})`);return args[index];}
 return kw.get(name);
}
function strArg(v:Value,what:string):string{if(typeof v!=='string')throw err('TypeError',`${what} must be str, not ${typeName(v)}`);return v;}
function editDistance(a:string,b:string):number{
 const row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const cur=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:a[i-1].toLowerCase()===b[j-1].toLowerCase()?0.5:1));prev=cur;}}
 return row[b.length];
}
function suggest(name:string,candidates:Iterable<string>):string{
 let best='',score=Infinity;
 for(const c of candidates){if(c===name||c.startsWith('__'))continue;const d=editDistance(name,c);if(d<score&&d<=Math.max(1,Math.floor((name.length+c.length+3)/6))){best=c;score=d;}}
 return best?`. Did you mean: '${best}'?`:'';
}
const MODULE_NAMES=['csv','json','math','random','string'];

// ---------- interpreter ----------
class Interp{
 steps=0;out='';maxSteps:number;files:Readonly<Record<string,string>>;
 stack:{scope:string;line:number}[]=[];
 builtins=new Map<string,Value>();types=new Map<string,PyBuiltin>();modules=new Map<string,PyModule>();
 handling:PyExc[]=[];globals=new Scope('module',null);
 seed:number;
 strMethods:Methods<string>;listMethods:Methods<PyList>;tupleMethods:Methods<PyTuple>;dictMethods:Methods<PyDict>;setMethods:Methods<PySet>;fileMethods:Methods<PyFile>;
 constructor(options:PyOptions){
  this.maxSteps=options.maxSteps??LIMIT.steps;this.files=options.files??{};
  this.seed=Math.floor(Math.random()*0xffffffff)>>>0;
  this.globals.vars.set('__name__','__main__');
  this.strMethods=this.makeStrMethods();this.listMethods=this.makeListMethods();this.tupleMethods=this.makeTupleMethods();
  this.dictMethods=this.makeDictMethods();this.setMethods=this.makeSetMethods();this.fileMethods=this.makeFileMethods();
  this.installBuiltins();
 }
 tick(){if(++this.steps>this.maxSteps){this.steps=this.maxSteps;throw new PyLimit('TimeoutError',`script stopped after ${group(this.maxSteps)} steps — is a loop never ending? (simulated Python limit)`);}}
 write(text:string){this.out+=text;if(this.out.length>LIMIT.output){this.out=this.out.slice(0,LIMIT.output);throw limit(`output passed ${group(LIMIT.output)} characters`);}}
 snapshot():PyFrame[]{return this.stack.map(f=>({line:f.line,scope:f.scope}));}
 attach(e:unknown){if(e instanceof PyRaise&&!e.exc.trace)e.exc.trace=this.snapshot();else if(e instanceof PyLimit&&!e.trace)e.trace=this.snapshot();}
 run(body:Stmt[]){this.stack.push({scope:'<module>',line:1});try{this.block(body,this.globals);}catch(e){this.attach(e);throw e;}}

 // --- names ---
 lookup(name:string,scope:Scope):Value{
  let s:Scope|null=scope,innermost=true;
  while(s&&s.kind!=='module'){
   if(s.kind==='function'&&s.info!.globals.has(name))break;
   const v=s.vars.get(name);if(v!==undefined)return v;
   if(s.kind==='function'){if(innermost&&s.info!.locals.has(name))throw err('UnboundLocalError',`cannot access local variable '${name}' where it is not associated with a value`);innermost=false;}
   s=s.parent;
  }
  const g=this.globals.vars.get(name);if(g!==undefined)return g;
  const b=this.builtins.get(name);if(b!==undefined)return b;
  if(MODULE_NAMES.includes(name))throw err('NameError',`name '${name}' is not defined. Did you forget to import '${name}'?`);
  const visible=new Set<string>([...this.builtins.keys(),...this.globals.vars.keys()]);
  for(let x:Scope|null=scope;x;x=x.parent)for(const k of x.vars.keys())visible.add(k);
  throw err('NameError',`name '${name}' is not defined`+suggest(name,visible));
 }
 setName(scope:Scope,name:string,value:Value){
  if(scope.kind==='function'){
   const info=scope.info!;
   if(info.globals.has(name)){this.globals.vars.set(name,value);return;}
   if(info.nonlocals.has(name)){for(let s=scope.parent;s&&s.kind!=='module';s=s.parent)if(s.kind==='function'&&s.vars.has(name)){s.vars.set(name,value);return;}throw err('SyntaxError',`no binding for nonlocal '${name}' found`);}
  }
  scope.vars.set(name,value);
 }
 delName(scope:Scope,name:string){
  this.lookup(name,scope);
  const target=scope.kind==='function'&&scope.info!.globals.has(name)?this.globals:scope;
  if(!target.vars.delete(name))throw err('NameError',`name '${name}' is not defined`);
 }

 // --- statements ---
 block(body:Stmt[],scope:Scope):Signal{for(const st of body){const sig=this.exec(st,scope);if(sig)return sig;}return null;}
 exec(st:Stmt,scope:Scope):Signal{
  this.tick();const frame=this.stack[this.stack.length-1];frame.line=st.line;
  switch(st.k){
   case 'expr':this.eval(st.e,scope);return null;
   case 'assign':{const v=this.eval(st.value,scope);for(const t of st.targets)this.assign(t,v,scope);return null;}
   case 'aug':this.augAssign(st.target,st.op,st.value,scope);return null;
   case 'ann':if(st.value)this.assign(st.target,this.eval(st.value,scope),scope);return null;
   case 'if':return truthy(this.eval(st.test,scope))?this.block(st.body,scope):this.block(st.orelse,scope);
   case 'while':
    while(truthy(this.eval(st.test,scope))){
     const sig=this.block(st.body,scope);
     if(sig===BREAK)return null;
     if(sig&&sig!==CONTINUE)return sig;
     this.tick();frame.line=st.line;
    }
    return this.block(st.orelse,scope);
   case 'for':{
    const it=this.iter(this.eval(st.iter,scope));
    for(;;){
     frame.line=st.line;
     const v=it.next();if(v===DONE)break;
     this.tick();this.assign(st.target,v,scope);
     const sig=this.block(st.body,scope);
     if(sig===BREAK)return null;
     if(sig&&sig!==CONTINUE)return sig;
    }
    return this.block(st.orelse,scope);
   }
   case 'def':this.setName(scope,st.name,this.makeFunc(st.name,st.params,st.body,st.info,scope,st.line));return null;
   case 'return':return {k:'return',v:st.value?this.eval(st.value,scope):null};
   case 'break':return BREAK;
   case 'continue':return CONTINUE;
   case 'pass':case 'global':case 'nonlocal':return null;
   case 'import':for(const [name,as] of st.names){const m=this.module(name);this.setName(scope,as??name,m);}return null;
   case 'from':{
    const m=this.module(st.module);
    for(const [name,as] of st.names){
     if(name==='*'){for(const [k,v] of m.attrs)if(!k.startsWith('_'))this.setName(scope,k,v);continue;}
     const v=m.attrs.get(name);
     if(v===undefined)throw err('ImportError',`cannot import name '${name}' from '${m.name}' (${m.file??'unknown location'})`);
     this.setName(scope,as??name,v);
    }
    return null;
   }
   case 'with':return this.withItems(st.items,st.body,scope,0);
   case 'try':return this.tryStmt(st,scope);
   case 'raise':{
    if(!st.exc){const active=this.handling[this.handling.length-1];if(!active)throw err('RuntimeError','No active exception to reraise');throw new PyRaise(active);}
    const v=this.eval(st.exc,scope);if(st.cause)this.eval(st.cause,scope);
    if(v instanceof PyExc){v.trace=null;throw new PyRaise(v);}
    if(v instanceof PyBuiltin&&v.type&&v.type in EXC_BASE)throw new PyRaise(new PyExc(v.type,[]));
    throw err('TypeError','exceptions must derive from BaseException');
   }
   case 'del':for(const t of st.targets)this.del(t,scope);return null;
   case 'assert':if(!truthy(this.eval(st.test,scope)))throw new PyRaise(new PyExc('AssertionError',st.msg?[this.eval(st.msg,scope)]:[]));return null;
  }
 }
 withItems(items:{e:Expr;target:Expr|null}[],body:Stmt[],scope:Scope,index:number):Signal{
  if(index>=items.length)return this.block(body,scope);
  const item=items[index],ctx=this.eval(item.e,scope);
  if(!(ctx instanceof PyFile))throw err('TypeError',`'${typeName(ctx)}' object does not support the context manager protocol`);
  ctx.check();
  if(item.target)this.assign(item.target,ctx,scope);
  try{return this.withItems(items,body,scope,index+1);}finally{ctx.closed=true;}
 }
 tryStmt(st:Extract<Stmt,{k:'try'}>,scope:Scope):Signal{
  let sig:Signal=null,pending:unknown=null,failed=false;
  try{
   let raised:PyRaise|null=null;
   try{sig=this.block(st.body,scope);}catch(e){if(!(e instanceof PyRaise))throw e;this.attach(e);raised=e;}
   if(raised){
    const exc=raised.exc,handler=st.handlers.find(h=>!h.type||this.matches(exc,this.eval(h.type,scope)));
    if(!handler)throw raised;
    if(handler.name)this.setName(scope,handler.name,exc);
    this.handling.push(exc);
    try{sig=this.block(handler.body,scope);}finally{this.handling.pop();if(handler.name)scope.vars.delete(handler.name);}
   }else if(st.orelse.length)sig=this.block(st.orelse,scope);
  }catch(e){pending=e;failed=true;}
  if(st.final.length){const f=this.block(st.final,scope);if(f)return f;}
  if(failed)throw pending;
  return sig;
 }
 matches(exc:PyExc,t:Value):boolean{
  if(t instanceof PyTuple)return t.items.some(x=>this.matches(exc,x));
  if(!(t instanceof PyBuiltin)||!t.type||!(t.type in EXC_BASE))throw err('TypeError','catching classes that do not inherit from BaseException is not allowed');
  return excIs(exc.type,t.type);
 }
 assign(t:Expr,v:Value,scope:Scope){
  switch(t.k){
   case 'name':this.setName(scope,t.id,v);return;
   case 'sub':{const o=this.eval(t.obj,scope);this.setitem(o,this.eval(t.index,scope),v);return;}
   case 'attr':{const o=this.eval(t.obj,scope);throw err('AttributeError',`'${typeName(o)}' object attribute '${t.name}' is read-only`);}
   case 'tuple':case 'list':this.unpack(t.items,v,scope);return;
  }
  throw err('SyntaxError','cannot assign to expression');
 }
 unpack(targets:Expr[],v:Value,scope:Scope){
  if(!(v instanceof PyList||v instanceof PyTuple||v instanceof PyDict||v instanceof PySet||v instanceof PyView||v instanceof PyIter||v instanceof PyFile||v instanceof PyRange||typeof v==='string'))throw err('TypeError',`cannot unpack non-iterable ${typeName(v)} object`);
  const values=this.toArray(v),star=targets.findIndex(t=>t.k==='star');
  if(star<0){
   if(values.length>targets.length)throw err('ValueError',`too many values to unpack (expected ${targets.length})`);
   if(values.length<targets.length)throw err('ValueError',`not enough values to unpack (expected ${targets.length}, got ${values.length})`);
   targets.forEach((t,i)=>this.assign(t,values[i],scope));return;
  }
  const after=targets.length-star-1;
  if(values.length<targets.length-1)throw err('ValueError',`not enough values to unpack (expected at least ${targets.length-1}, got ${values.length})`);
  targets.slice(0,star).forEach((t,i)=>this.assign(t,values[i],scope));
  const starred=targets[star];if(starred.k==='star')this.assign(starred.e,new PyList(values.slice(star,values.length-after)),scope);
  targets.slice(star+1).forEach((t,i)=>this.assign(t,values[values.length-after+i],scope));
 }
 augAssign(t:Expr,op:string,value:Expr,scope:Scope){
  if(t.k==='name'){const cur=this.lookup(t.id,scope);this.setName(scope,t.id,this.inplace(op,cur,this.eval(value,scope)));return;}
  if(t.k==='sub'){const o=this.eval(t.obj,scope),idx=this.eval(t.index,scope),cur=this.getitem(o,idx);this.setitem(o,idx,this.inplace(op,cur,this.eval(value,scope)));return;}
  const o=t.k==='attr'?this.eval(t.obj,scope):null;
  throw err('AttributeError',`'${typeName(o)}' object attribute is read-only`);
 }
 inplace(op:string,a:Value,b:Value):Value{
  if(a instanceof PyList&&op==='+'){const items=this.toArray(b);checkItems(a.items.length+items.length);a.items.push(...items);return a;}
  if(a instanceof PyList&&op==='*'){const n=Math.max(0,intArg(b));checkItems(a.items.length*n);a.items=Array.from({length:n},()=>a.items).flat();return a;}
  return this.binop(op,a,b);
 }
 del(t:Expr,scope:Scope){
  if(t.k==='name'){this.delName(scope,t.id);return;}
  if(t.k==='tuple'||t.k==='list'){for(const x of t.items)this.del(x,scope);return;}
  if(t.k!=='sub')throw err('SyntaxError','cannot delete expression');
  const o=this.eval(t.obj,scope),idx=this.eval(t.index,scope);
  if(o instanceof PyDict){if(!o.delete(idx))throw keyError(idx);return;}
  if(o instanceof PyList){
   if(idx instanceof PySlice){const [start,stop,step]=this.indices(idx,o.items.length),drop=new Set<number>();for(let i=start;step>0?i<stop:i>stop;i+=step)drop.add(i);o.items=o.items.filter((_,i)=>!drop.has(i));return;}
   if(!isInt(idx))throw err('TypeError',`list indices must be integers or slices, not ${typeName(idx)}`);
   let i=Number(toBig(idx));if(i<0)i+=o.items.length;
   if(i<0||i>=o.items.length)throw err('IndexError','list assignment index out of range');
   o.items.splice(i,1);return;
  }
  throw err('TypeError',`'${typeName(o)}' object doesn't support item deletion`);
 }

 // --- expressions ---
 eval(e:Expr,scope:Scope):Value{
  switch(e.k){
   case 'const':return e.v;
   case 'name':return this.lookup(e.id,scope);
   case 'fstr':return this.fstr(e.parts,scope);
   case 'list':return new PyList(this.items(e.items,scope));
   case 'tuple':return new PyTuple(this.items(e.items,scope));
   case 'set':{const values=this.items(e.items,scope);return values.length>2&&e.items.every(constant)?PySet.constant(values):new PySet(values);}
   case 'dict':{
    const d=new PyDict();
    e.keys.forEach((k,i)=>{
     if(k===null){const src=this.eval(e.values[i],scope);if(!(src instanceof PyDict))throw err('TypeError',`'${typeName(src)}' object is not a mapping`);for(const [kk,vv] of src.map.values())d.set(kk,vv);}
     else{const key=this.eval(k,scope);d.set(key,this.eval(e.values[i],scope));}
    });
    return d;
   }
   case 'bin':{const l=this.eval(e.l,scope);return this.binop(e.op,l,this.eval(e.r,scope));}
   case 'unary':return this.unary(e.op,this.eval(e.e,scope));
   case 'bool':{const l=this.eval(e.l,scope);if(e.op==='and')return truthy(l)?this.eval(e.r,scope):l;return truthy(l)?l:this.eval(e.r,scope);}
   case 'cmp':{let l=this.eval(e.l,scope);for(let i=0;i<e.ops.length;i++){const r=this.eval(e.rs[i],scope);if(!this.compare(e.ops[i],l,r))return false;l=r;}return true;}
   case 'ifexp':return truthy(this.eval(e.test,scope))?this.eval(e.body,scope):this.eval(e.orelse,scope);
   case 'lambda':return this.makeFunc('<lambda>',e.params,e.body,e.info,scope,e.line);
   case 'call':return this.callExpr(e.fn,e.args,scope);
   case 'attr':return this.getattr(this.eval(e.obj,scope),e.name);
   case 'sub':{const o=this.eval(e.obj,scope);return this.getitem(o,this.eval(e.index,scope));}
   case 'slice':return new PySlice(e.lo?this.eval(e.lo,scope):null,e.hi?this.eval(e.hi,scope):null,e.step?this.eval(e.step,scope):null);
   case 'comp':return this.comp(e,scope);
   case 'star':throw err('SyntaxError',"can't use starred expression here");
   case 'walrus':{const v=this.eval(e.value,scope);let s=scope;while(s.kind==='comp'&&s.parent)s=s.parent;this.setName(s,e.id,v);return v;}
  }
 }
 items(list:Expr[],scope:Scope):Value[]{
  const out:Value[]=[];
  for(const e of list){if(e.k==='star')out.push(...this.toArray(this.eval(e.e,scope)));else out.push(this.eval(e,scope));}
  checkItems(out.length);return out;
 }
 fstr(parts:FPart[],scope:Scope):string{
  let out='';
  for(const p of parts){
   if(typeof p==='string'){out+=p;continue;}
   const v=this.eval(p.e,scope),spec=p.spec?this.fstr(p.spec,scope):'',conv=p.conv||(p.debug&&!p.spec?'r':'');
   out+=p.debug+formatValue(conv==='r'||conv==='a'?pyRepr(v):conv==='s'?pyStr(v):v,spec);
  }
  return checkText(out);
 }
 comp(e:Extract<Expr,{k:'comp'}>,scope:Scope):Value{
  const inner=new Scope('comp',scope),out:Value[]=[],dict=e.kind==='dict'?new PyDict():null;
  const loop=(g:number):void=>{
   if(g===e.gens.length){
    if(dict){const k=this.eval(e.elt,inner);dict.set(k,this.eval(e.val!,inner));checkItems(dict.size);}
    else{out.push(this.eval(e.elt,inner));checkItems(out.length);}
    return;
   }
   const gen=e.gens[g],it=this.iter(this.eval(gen.iter,g===0?scope:inner));
   for(let v=it.next();v!==DONE;v=it.next()){
    this.tick();this.assign(gen.target,v,inner);
    if(gen.ifs.every(c=>truthy(this.eval(c,inner))))loop(g+1);
   }
  };
  loop(0);
  if(dict)return dict;
  if(e.kind==='set')return new PySet(out);
  if(e.kind==='gen'){let i=0;return new PyIter('generator',()=>i<out.length?out[i++]:DONE);}
  return new PyList(out);
 }
 makeFunc(name:string,params:Param[],body:Stmt[]|Expr,info:FuncInfo,scope:Scope,line:number):PyFunc{
  return new PyFunc(name,params.map(p=>({name:p.name,kind:p.kind,def:p.def?this.eval(p.def,scope):undefined})),body,scope,info,line);
 }
 callExpr(fnExpr:Expr,argExprs:Arg[],scope:Scope):Value{
  const fn=this.eval(fnExpr,scope),args:Value[]=[],kw=new Map<string,Value>();
  for(const a of argExprs){
   if(a.kind==='pos')args.push(this.eval(a.value,scope));
   else if(a.kind==='star'){const v=this.eval(a.value,scope);try{args.push(...this.toArray(v));}catch(x){if(x instanceof PyRaise&&x.exc.type==='TypeError')throw err('TypeError',`${this.callName(fn)} argument after * must be an iterable, not ${typeName(v)}`);throw x;}}
   else if(a.kind==='kw')kw.set(a.name!,this.eval(a.value,scope));
   else{
    const d=this.eval(a.value,scope);
    if(!(d instanceof PyDict))throw err('TypeError',`${this.callName(fn)} argument after ** must be a mapping, not ${typeName(d)}`);
    for(const [k,v] of d.map.values()){if(typeof k!=='string')throw err('TypeError','keywords must be strings');if(kw.has(k))throw err('TypeError',`${this.callName(fn)} got multiple values for keyword argument '${k}'`);kw.set(k,v);}
   }
  }
  return this.call(fn,args,kw);
 }
 callName(fn:Value){return fn instanceof PyFunc||fn instanceof PyBuiltin?fn.name+'()':typeName(fn)+'()';}
 call(fn:Value,args:Value[],kw:Map<string,Value>=NO_KW):Value{
  if(fn instanceof PyBuiltin)return fn.fn(args,kw);
  if(fn instanceof PyFunc)return this.callFunc(fn,args,kw);
  throw err('TypeError',`'${typeName(fn)}' object is not callable`);
 }
 callFunc(f:PyFunc,args:Value[],kw:Map<string,Value>):Value{
  if(this.stack.length>=LIMIT.depth)throw err('RecursionError','maximum recursion depth exceeded');
  this.tick();
  const scope=new Scope('function',f.scope,f.info);
  this.bind(f,args,kw,scope);
  this.stack.push({scope:f.name,line:f.line});
  try{
   if(!Array.isArray(f.body))return this.eval(f.body,scope);
   const sig=this.block(f.body,scope);
   return sig&&sig.k==='return'?sig.v:null;
  }catch(e){this.attach(e);throw e;}
  finally{this.stack.pop();}
 }
 bind(f:PyFunc,args:Value[],kw:Map<string,Value>,scope:Scope){
  const extra=new Map(kw),missing:string[]=[],missingKw:string[]=[],positional=f.params.filter(p=>p.kind==='pos');
  let used=0;
  for(const p of f.params){
   if(p.kind==='pos'){
    if(used<args.length){if(extra.has(p.name))throw err('TypeError',`${f.name}() got multiple values for argument '${p.name}'`);scope.vars.set(p.name,args[used++]);}
    else if(extra.has(p.name)){scope.vars.set(p.name,extra.get(p.name)!);extra.delete(p.name);}
    else if(p.def!==undefined)scope.vars.set(p.name,p.def);
    else missing.push(p.name);
   }else if(p.kind==='star'){scope.vars.set(p.name,new PyTuple(args.slice(used)));used=args.length;}
   else if(p.kind==='kwonly'){
    if(extra.has(p.name)){scope.vars.set(p.name,extra.get(p.name)!);extra.delete(p.name);}
    else if(p.def!==undefined)scope.vars.set(p.name,p.def);else missingKw.push(p.name);
   }else{const d=new PyDict();for(const [k,v] of extra)d.set(k,v);extra.clear();scope.vars.set(p.name,d);}
  }
  const names=(list:string[])=>list.map(n=>`'${n}'`).join(list.length>2?', ':' and ').replace(/, ([^,]*)$/,', and $1');
  if(used<args.length){const given=args.length,max=positional.length,min=positional.filter(p=>p.def===undefined).length;throw err('TypeError',`${f.name}() takes ${min===max?max:`from ${min} to ${max}`} positional argument${max===1&&min===max?'':'s'} but ${given} ${given===1?'was':'were'} given`);}
  if(extra.size)throw err('TypeError',`${f.name}() got an unexpected keyword argument '${[...extra.keys()][0]}'`);
  if(missing.length)throw err('TypeError',`${f.name}() missing ${missing.length} required positional argument${missing.length===1?'':'s'}: ${names(missing)}`);
  if(missingKw.length)throw err('TypeError',`${f.name}() missing ${missingKw.length} required keyword-only argument${missingKw.length===1?'':'s'}: ${names(missingKw)}`);
 }

 // --- operators ---
 binop(op:string,a:Value,b:Value):Value{
  const x=asNum(a),y=asNum(b);
  if(x!==undefined&&y!==undefined)return this.numop(op,x,y,a,b);
  const unsupported=()=>err('TypeError',`unsupported operand type(s) for ${op==='**'?'** or pow()':op}: '${typeName(a)}' and '${typeName(b)}'`);
  switch(op){
   case '+':
    if(typeof a==='string'){if(typeof b!=='string')throw err('TypeError',`can only concatenate str (not "${typeName(b)}") to str`);return checkText(a+b);}
    if(a instanceof PyList){if(!(b instanceof PyList))throw err('TypeError',`can only concatenate list (not "${typeName(b)}") to list`);checkItems(a.items.length+b.items.length);return new PyList([...a.items,...b.items]);}
    if(a instanceof PyTuple){if(!(b instanceof PyTuple))throw err('TypeError',`can only concatenate tuple (not "${typeName(b)}") to tuple`);return new PyTuple([...a.items,...b.items]);}
    throw unsupported();
   case '*':{
    const [seq,n]=isInt(b)?[a,b]:isInt(a)?[b,a]:[null,null];
    if(seq===null||n===null){if(typeof a==='string'||a instanceof PyList||a instanceof PyTuple||typeof b==='string'||b instanceof PyList||b instanceof PyTuple)throw err('TypeError',`can't multiply sequence by non-int of type '${typeName(typeof a==='string'||a instanceof PyList||a instanceof PyTuple?b:a)}'`);throw unsupported();}
    const count=Math.max(0,Number(toBig(n)));
    if(typeof seq==='string'){if(seq.length*count>LIMIT.string)throw limit(`string grew past ${group(LIMIT.string)} characters`);return seq.repeat(count);}
    if(seq instanceof PyList||seq instanceof PyTuple){checkItems(seq.items.length*count);const items=Array.from({length:count},()=>seq.items).flat();return seq instanceof PyList?new PyList(items):new PyTuple(items);}
    throw unsupported();
   }
   case '%':if(typeof a==='string')return percentFormat(a,b);throw unsupported();
   case '|':
    if(a instanceof PySet&&b instanceof PySet){const out=PySet.copy(a);out.merge(b);return out;}
    if(a instanceof PyDict&&b instanceof PyDict){const d=new PyDict();for(const [k,v] of a.map.values())d.set(k,v);for(const [k,v] of b.map.values())d.set(k,v);return d;}
    throw unsupported();
   case '&':if(a instanceof PySet&&b instanceof PySet)return setIntersection(a,b);throw unsupported();
   case '-':if(a instanceof PySet&&b instanceof PySet)return setDifference(a,b.values());throw unsupported();
   case '^':if(a instanceof PySet&&b instanceof PySet){const out=PySet.copy(a);for(const v of b.values())if(!out.remove(v))out.add(v);return out;}throw unsupported();
  }
  throw unsupported();
 }
 numop(op:string,x:Num,y:Num,a:Value,b:Value):Value{
  if(typeof x==='bigint'&&typeof y==='bigint'){
   switch(op){
    case '+':return checkBig(x+y);
    case '-':return checkBig(x-y);
    case '*':return checkBig(x*y);
    case '/':if(y===ZERO)throw err('ZeroDivisionError','division by zero');return Number(x)/Number(y);
    case '//':if(y===ZERO)throw err('ZeroDivisionError','integer division or modulo by zero');return floorDiv(x,y);
    case '%':if(y===ZERO)throw err('ZeroDivisionError','integer modulo by zero');return floorMod(x,y);
    case '**':
     if(y<ZERO){if(x===ZERO)throw err('ZeroDivisionError','0.0 cannot be raised to a negative power');return Number(x)**Number(y);}
     if((x>ONE||x< -ONE)&&(x<ZERO?-x:x).toString(2).length*Number(y)>70000)throw limit('integer grew too large');
     return checkBig(x**y);
    case '<<':if(y<ZERO)throw err('ValueError','negative shift count');if(y>BigInt(70000))throw limit('integer grew too large');return checkBig(x<<y);
    case '>>':if(y<ZERO)throw err('ValueError','negative shift count');return x>>y;
    case '&':return typeof a==='boolean'&&typeof b==='boolean'?a&&b:x&y;
    case '|':return typeof a==='boolean'&&typeof b==='boolean'?a||b:x|y;
    case '^':return typeof a==='boolean'&&typeof b==='boolean'?a!==b:x^y;
   }
  }
  const p=Number(x),q=Number(y);
  switch(op){
   case '+':return p+q;
   case '-':return p-q;
   case '*':return p*q;
   case '/':if(q===0)throw err('ZeroDivisionError','float division by zero');return p/q;
   case '//':if(q===0)throw err('ZeroDivisionError','float floor division by zero');return Math.floor(p/q);
   case '%':{if(q===0)throw err('ZeroDivisionError','float modulo by zero');const r=p%q;return r!==0&&(r<0)!==(q<0)?r+q:r;}
   case '**':{
    if(p===0&&q<0)throw err('ZeroDivisionError','0.0 cannot be raised to a negative power');
    if(p<0&&!Number.isInteger(q))throw new PyRaise(new PyExc('NotImplementedError',['complex numbers are not supported in this simulated Python']));
    const r=p**q;if(!Number.isFinite(r)&&Number.isFinite(p)&&Number.isFinite(q))throw err('OverflowError',"(34, 'Numerical result out of range')");return r;
   }
  }
  throw err('TypeError',`unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);
 }
 unary(op:string,v:Value):Value{
  if(op==='not')return !truthy(v);
  const n=asNum(v);
  if(n===undefined||(op==='~'&&typeof n==='number'))throw err('TypeError',`bad operand type for unary ${op}: '${typeName(v)}'`);
  if(op==='-')return typeof n==='bigint'?-n:-n;
  if(op==='~')return ~(n as bigint);
  return n;
 }
 compare(op:string,a:Value,b:Value):boolean{
  switch(op){
   case '==':return pyEq(a,b);
   case '!=':return !pyEq(a,b);
   case 'is':return a===b;
   case 'is not':return a!==b;
   case 'in':return this.contains(b,a);
   case 'not in':return !this.contains(b,a);
  }
  return order(op,a,b);
 }
 contains(c:Value,x:Value):boolean{
  if(typeof c==='string'){if(typeof x!=='string')throw err('TypeError',`'in <string>' requires string as left operand, not ${typeName(x)}`);return c.includes(x);}
  if(c instanceof PyList||c instanceof PyTuple)return c.items.some(v=>v===x||pyEq(v,x));
  if(c instanceof PyDict)return c.has(x);
  if(c instanceof PySet)return c.has(x);
  if(c instanceof PyRange){const n=asNum(x);if(n===undefined||(typeof n==='number'&&!Number.isInteger(n)))return false;const v=typeof n==='number'?BigInt(n):n;const off=v-c.start;return (c.step>ZERO?v>=c.start&&v<c.stop:v<=c.start&&v>c.stop)&&off%c.step===ZERO;}
  if(c instanceof PyView){if(c.kind==='keys')return c.dict.has(x);if(c.kind==='values')return [...c.dict.map.values()].some(([,v])=>pyEq(v,x));if(!(x instanceof PyTuple)||x.items.length!==2)return false;const v=c.dict.get(x.items[0]);return v!==undefined&&pyEq(v,x.items[1]);}
  if(c instanceof PyIter||c instanceof PyFile){for(let v=c.next();v!==DONE;v=c.next())if(pyEq(v,x))return true;return false;}
  throw err('TypeError',`argument of type '${typeName(c)}' is not iterable`);
 }

 // --- items & attributes ---
 indices(sl:PySlice,n:number):[number,number,number]{
  const int=(v:Value,d:number)=>{if(v===null)return d;if(!isInt(v))throw err('TypeError','slice indices must be integers or None or have an __index__ method');return Number(toBig(v));};
  const step=int(sl.step,1);if(step===0)throw err('ValueError','slice step cannot be zero');
  const clamp=(v:Value,d:number)=>{if(v===null)return d;let i=int(v,0);if(i<0){i+=n;if(i<0)i=step<0?-1:0;}else if(i>=n)i=step<0?n-1:n;return i;};
  return [clamp(sl.lo,step<0?n-1:0),clamp(sl.hi,step<0?-1:n),step];
 }
 getitem(o:Value,idx:Value):Value{
  if(o instanceof PyDict){const v=o.get(idx);if(v===undefined)throw keyError(idx);return v;}
  if(isSeq(o)){
   const kind=typeName(o);
   if(idx instanceof PySlice){
    const [start,stop,step]=this.indices(idx,seqLen(o));
    if(o instanceof PyRange)return new PyRange(o.at(start),o.at(stop),o.step*BigInt(step));
    const picked:number[]=[];for(let i=start;step>0?i<stop:i>stop;i+=step)picked.push(i);
    if(typeof o==='string')return step===1?o.slice(start,Math.max(start,stop)):picked.map(i=>o[i]).join('');
    const items=picked.map(i=>o.items[i]);return o instanceof PyList?new PyList(items):new PyTuple(items);
   }
   if(!isInt(idx))throw err('TypeError',typeof o==='string'?`string indices must be integers, not '${typeName(idx)}'`:`${kind} indices must be integers or slices, not ${typeName(idx)}`);
   const n=seqLen(o);let i=Number(toBig(idx));if(i<0)i+=n;
   if(i<0||i>=n)throw err('IndexError',`${kind==='str'?'string':kind==='range'?'range object':kind} index out of range`);
   return seqAt(o,i);
  }
  throw err('TypeError',o instanceof PyBuiltin&&o.type?`type '${o.type}' is not subscriptable`:`'${typeName(o)}' object is not subscriptable`);
 }
 setitem(o:Value,idx:Value,v:Value){
  if(o instanceof PyDict){o.set(idx,v);checkItems(o.size);return;}
  if(o instanceof PyList){
   if(idx instanceof PySlice){
    const [start,stop,step]=this.indices(idx,o.items.length),vals=this.toArray(v);
    if(step===1){o.items.splice(start,Math.max(0,stop-start),...vals);checkItems(o.items.length);return;}
    const at:number[]=[];for(let i=start;step>0?i<stop:i>stop;i+=step)at.push(i);
    if(at.length!==vals.length)throw err('ValueError',`attempt to assign sequence of size ${vals.length} to extended slice of size ${at.length}`);
    at.forEach((i,j)=>{o.items[i]=vals[j];});return;
   }
   if(!isInt(idx))throw err('TypeError',`list indices must be integers or slices, not ${typeName(idx)}`);
   let i=Number(toBig(idx));if(i<0)i+=o.items.length;
   if(i<0||i>=o.items.length)throw err('IndexError','list assignment index out of range');
   o.items[i]=v;return;
  }
  throw err('TypeError',`'${typeName(o)}' object does not support item assignment`);
 }
 bound<T>(table:Methods<T>,self:T,name:string,owner:string):PyBuiltin|undefined{
  const m=Object.hasOwn(table,name)?table[name]:undefined;
  return m?new PyBuiltin(name,(a,k)=>m(self,a,k),null,owner):undefined;
 }
 tableFor(v:Value):[Methods<never>,string]|null{
  if(typeof v==='string')return [this.strMethods as Methods<never>,'str'];
  if(v instanceof PyList)return [this.listMethods as Methods<never>,'list'];
  if(v instanceof PyTuple)return [this.tupleMethods as Methods<never>,'tuple'];
  if(v instanceof PyDict)return [this.dictMethods as Methods<never>,'dict'];
  if(v instanceof PySet)return [this.setMethods as Methods<never>,'set'];
  if(v instanceof PyFile)return [this.fileMethods as Methods<never>,'_io.TextIOWrapper'];
  return null;
 }
 getattr(o:Value,name:string):Value{
  if(o instanceof PyModule){const v=o.attrs.get(name);if(v===undefined)throw err('AttributeError',`module '${o.name}' has no attribute '${name}'`+suggest(name,o.attrs.keys()));return v;}
  if((o instanceof PyFunc||o instanceof PyBuiltin)&&name==='__name__')return o instanceof PyBuiltin&&o.type?o.type:o.name;
  if(o instanceof PyExc&&name==='args')return new PyTuple(o.args);
  if(o instanceof PyRange&&(name==='start'||name==='stop'||name==='step'))return o[name];
  if(o instanceof PyFile&&name==='name')return o.name;
  if(o instanceof PyFile&&name==='closed')return o.closed;
  if(o instanceof PyIter){const v=o.attr(name);if(v!==undefined)return v;}
  if(typeof o==='number'&&name==='is_integer')return new PyBuiltin(name,a=>{arity('float.is_integer',a,0);return Number.isInteger(o);},null,'float');
  if(o instanceof PyBuiltin&&o.type){
   const unbound=this.tableFor(o.type==='str'?'':o.type==='list'?new PyList([]):o.type==='dict'?new PyDict():o.type==='set'?new PySet():o.type==='tuple'?new PyTuple([]):null);
   if(o.type==='dict'&&name==='fromkeys')return new PyBuiltin('fromkeys',(a)=>{arity('fromkeys',a,1,2);const d=new PyDict();for(const k of this.toArray(a[0]))d.set(k,a[1]??null);return d;});
   if(unbound&&Object.hasOwn(unbound[0],name)){const m=unbound[0][name] as Method<Value>;return new PyBuiltin(name,(a,k)=>{if(!a.length||typeName(a[0])!==o.type)throw err('TypeError',`descriptor '${name}' for '${o.type}' objects doesn't apply to a '${typeName(a[0]??null)}' object`);return m(a[0],a.slice(1),k);});}
  }
  const table=this.tableFor(o);
  if(table){const m=this.bound(table[0] as Methods<Value>,o,name,table[1]);if(m)return m;}
  const names=table?Object.keys(table[0]):[];
  throw err('AttributeError',`'${typeName(o)}' object has no attribute '${name}'`+suggest(name,names));
 }

 // --- iteration ---
 iter(v:Value):Iter{
  if(v instanceof PyList||v instanceof PyTuple){const items=v.items;let i=0;return {next:()=>i<items.length?items[i++]:DONE};}
  if(typeof v==='string'){let i=0;return {next:()=>i<v.length?v[i++]:DONE};}
  if(v instanceof PyRange){let cur=v.start;const {stop,step}=v;return {next:()=>{if(step>ZERO?cur>=stop:cur<=stop)return DONE;const r=cur;cur+=step;return r;}};}
  if(v instanceof PyDict)return this.dictIter(v,'keys');
  if(v instanceof PyView)return this.dictIter(v.dict,v.kind);
  if(v instanceof PySet){const vals=v.values(),size=v.map.size;let i=0;return {next:()=>{if(v.map.size!==size)throw err('RuntimeError','Set changed size during iteration');return i<vals.length?vals[i++]:DONE;}};}
  if(v instanceof PyIter||v instanceof PyFile)return v;
  throw err('TypeError',`'${typeName(v)}' object is not iterable`);
 }
 dictIter(d:PyDict,kind:'keys'|'values'|'items'):Iter{
  const entries=[...d.map.values()],size=d.map.size;let i=0;
  return {next:()=>{
   if(d.map.size!==size)throw err('RuntimeError','dictionary changed size during iteration');
   if(i>=entries.length)return DONE;
   const [k,v]=entries[i++];return kind==='keys'?k:kind==='values'?v:new PyTuple([k,v]);
  }};
 }
 toArray(v:Value):Value[]{
  if(v instanceof PyList||v instanceof PyTuple)return v.items.slice();
  if(v instanceof PyRange)checkItems(v.length);
  const it=this.iter(v),out:Value[]=[];
  for(let x=it.next();x!==DONE;x=it.next()){out.push(x);checkItems(out.length);}
  return out;
 }
 toSet(v:Value):PySet{
  if(v instanceof PySet)return PySet.copy(v);
  if(v instanceof PyDict||(v instanceof PyView&&v.kind==='keys'))return PySet.fromKeys(v instanceof PyDict?v.keys():v.dict.keys());
  const out=new PySet(this.toArray(v));checkItems(out.size);return out;
 }
 sortValues(items:Value[],key:Value,reverse:boolean):Value[]{
  const keys=key===null?items:items.map(v=>this.call(key,[v]));
  const order_=items.map((_,i)=>i);
  order_.sort((a,b)=>{const c=order('<',keys[a],keys[b])?-1:order('<',keys[b],keys[a])?1:0;return reverse?-c:c;});
  return order_.map(i=>items[i]);
 }
 len(v:Value):number{
  if(typeof v==='string')return v.length;
  if(v instanceof PyList||v instanceof PyTuple)return v.items.length;
  if(v instanceof PyDict)return v.size;if(v instanceof PySet)return v.map.size;
  if(v instanceof PyRange)return v.length;if(v instanceof PyView)return v.dict.size;
  throw err('TypeError',`object of type '${typeName(v)}' has no len()`);
 }

 // --- modules ---
 module(name:string):PyModule{
  const cached=this.modules.get(name);if(cached)return cached;
  const m=name==='csv'?this.csvModule():name==='json'?this.jsonModule():name==='math'?this.mathModule():name==='random'?this.randomModule():name==='string'?this.stringModule():null;
  if(!m)throw err('ModuleNotFoundError',`No module named '${name}' (${MODULE_NOTE})`);
  this.modules.set(name,m);return m;
 }
 readFile(path:string):string|undefined{
  const files=this.files,clean=path.replace(/^\.\//,'');
  return Object.hasOwn(files,path)?files[path]:Object.hasOwn(files,clean)?files[clean]:undefined;
 }
 csvRows(src:Iter,delim:string,state:{line:number}):Iter{
  return {next:()=>{
   let line=src.next();if(line===DONE)return DONE;
   const row:string[]=[];let field='',quoted=false,touched=false;
   for(;;){
    if(typeof line!=='string')throw err('_csv.Error',`iterator should return strings, not ${typeName(line)} (the file should be opened in text mode)`);
    state.line++;
    for(let i=0;i<line.length;i++){
     const c=line[i];
     if(quoted){if(c==='"'){if(line[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=c;continue;}
     if(c==='"'&&field===''){quoted=true;touched=true;continue;}
     if(c===delim){row.push(field);field='';touched=true;continue;}
     if(c==='\n'||c==='\r')continue;
     field+=c;touched=true;
    }
    if(!quoted)break;
    line=src.next();
    if(line===DONE)throw err('_csv.Error','unexpected end of data');
   }
   if(!touched)return new PyList([]);
   row.push(field);return new PyList(row);
  }};
 }
 csvModule():PyModule{
  const delimiter=(kw:Map<string,Value>)=>{const d=kw.get('delimiter')??',';if(typeof d!=='string'||d.length!==1)throw err('TypeError','"delimiter" must be a 1-character string');return d;};
  const reader=new PyBuiltin('reader',(a,k)=>{
   allowKw('reader',k,['delimiter','dialect','quotechar','skipinitialspace']);arity('reader',a,1,2);
   const state={line:0},rows=this.csvRows(this.iter(a[0]),delimiter(k),state);
   return new PyIter('_csv.reader',()=>rows.next(),n=>n==='line_num'?BigInt(state.line):undefined);
  });
  const dictReader=new PyBuiltin('DictReader',(a,k)=>{
   allowKw('DictReader',k,['fieldnames','restkey','restval','delimiter','dialect','quotechar','skipinitialspace']);arity('DictReader',a,1,2);
   const state={line:0},rows=this.csvRows(this.iter(a[0]),delimiter(k),state),given=arg(a,k,1,'fieldnames')??null,restval=k.get('restval')??null,restkey=k.get('restkey')??null;
   let names:Value[]|null=given===null?null:this.toArray(given);
   const header=():Value[]=>{if(names===null){const first=rows.next();names=first===DONE?[]:(first as PyList).items;}return names;};
   return new PyIter('csv.DictReader',()=>{
    const keys=header();
    let row=rows.next();
    while(row!==DONE&&(row as PyList).items.length===0)row=rows.next();
    if(row===DONE)return DONE;
    const values=(row as PyList).items,d=new PyDict();
    keys.forEach((key,i)=>d.set(key,i<values.length?values[i]:restval));
    if(values.length>keys.length)d.set(restkey,new PyList(values.slice(keys.length)));
    return d;
   },n=>{if(n==='fieldnames'){const h=header();return h.length?new PyList(h):null;}return n==='line_num'?BigInt(state.line):undefined;});
  });
  const writer=new PyBuiltin('writer',()=>{throw new PyRaise(new PyExc('io.UnsupportedOperation',['not writable — the simulated sandbox is read-only; print() rows instead']));});
  return new PyModule('csv','/usr/lib/python3.12/csv.py',new Map<string,Value>([['reader',reader],['DictReader',dictReader],['writer',writer],['DictWriter',writer],['Error',this.types.get('_csv.Error')!],['QUOTE_MINIMAL',ZERO],['QUOTE_ALL',ONE],['QUOTE_NONNUMERIC',BigInt(2)],['QUOTE_NONE',BigInt(3)]]));
 }
 jsonModule():PyModule{
  const dumps=new PyBuiltin('dumps',(a,k)=>{
   allowKw('dumps',k,['indent','ensure_ascii','sort_keys','separators','default']);arity('dumps',a,1);
   const ind=k.get('indent')??null,indent=ind===null?null:typeof ind==='string'?ind:' '.repeat(Math.max(0,intArg(ind)));
   const seps=k.get('separators')??null;let item=indent===null?', ':',',colon=': ';
   if(seps instanceof PyTuple&&seps.items.length===2){item=strArg(seps.items[0],'separator');colon=strArg(seps.items[1],'separator');}
   return checkText(this.jsonDump(a[0],indent,k.has('ensure_ascii')?truthy(k.get('ensure_ascii')!):true,truthy(k.get('sort_keys')??false),item,colon,0,new Set()));
  });
  const loads=new PyBuiltin('loads',(a,k)=>{arity('loads',a,1);noKw('loads',k);return jsonParse(strArg(a[0],'the JSON object'));});
  const load=new PyBuiltin('load',(a)=>{arity('load',a,1);const f=a[0];if(!(f instanceof PyFile))throw err('AttributeError',`'${typeName(f)}' object has no attribute 'read'`);f.check();const text=f.text.slice(f.pos);f.pos=f.text.length;return jsonParse(text);});
  const dump=new PyBuiltin('dump',()=>{throw new PyRaise(new PyExc('io.UnsupportedOperation',['not writable — the simulated sandbox is read-only; print(json.dumps(...)) instead']));});
  return new PyModule('json','/usr/lib/python3.12/json/__init__.py',new Map<string,Value>([['dumps',dumps],['loads',loads],['load',load],['dump',dump],['JSONDecodeError',this.types.get('json.decoder.JSONDecodeError')!]]));
 }
 jsonDump(v:Value,indent:string|null,ascii:boolean,sortKeys:boolean,item:string,colon:string,level:number,seen:Set<object>):string{
  if(v===null)return 'null';
  if(typeof v==='boolean')return v?'true':'false';
  if(typeof v==='bigint')return intStr(v);
  if(typeof v==='number')return Number.isNaN(v)?'NaN':!Number.isFinite(v)?(v>0?'Infinity':'-Infinity'):floatRepr(v);
  if(typeof v==='string')return jsonStr(v,ascii);
  const wrap=(open:string,close:string,parts:string[])=>{
   if(!parts.length)return open+close;
   if(indent===null)return open+parts.join(item)+close;
   const pad='\n'+indent.repeat(level+1);return open+pad+parts.join(item.replace(/ +$/,'')+pad)+'\n'+indent.repeat(level)+close;
  };
  if(v instanceof PyList||v instanceof PyTuple||v instanceof PyDict){
   if(seen.has(v))throw err('ValueError','Circular reference detected');
   seen.add(v);
   try{
    if(!(v instanceof PyDict))return wrap('[',']',v.items.map(x=>this.jsonDump(x,indent,ascii,sortKeys,item,colon,level+1,seen)));
    let entries=[...v.map.values()].map(([k,x]):[string,Value]=>{
     const key=typeof k==='string'?k:k===null?'null':typeof k==='boolean'?(k?'true':'false'):typeof k==='bigint'?intStr(k):typeof k==='number'?floatRepr(k):(()=>{throw err('TypeError',`keys must be str, int, float, bool or None, not ${typeName(k)}`);})();
     return [key,x];
    });
    if(sortKeys)entries=entries.sort(([p],[q])=>p<q?-1:p>q?1:0);
    return wrap('{','}',entries.map(([k,x])=>jsonStr(k,ascii)+colon+this.jsonDump(x,indent,ascii,sortKeys,item,colon,level+1,seen)));
   }finally{seen.delete(v);}
  }
  throw err('TypeError',`Object of type ${typeName(v)} is not JSON serializable`);
 }
 mathModule():PyModule{
  const real=(v:Value):number=>{const n=asNum(v);if(n===undefined)throw err('TypeError',`must be real number, not ${typeName(v)}`);return Number(n);};
  const toInt=(x:number)=>{if(Number.isNaN(x))throw err('ValueError','cannot convert float NaN to integer');if(!Number.isFinite(x))throw err('OverflowError','cannot convert float infinity to integer');return BigInt(x);};
  const f1=(name:string,fn:(x:number)=>number,ok:(x:number)=>boolean=()=>true)=>new PyBuiltin(name,a=>{arity(name,a,1);const x=real(a[0]);if(!ok(x))throw err('ValueError','math domain error');return fn(x);});
  const rounder=(name:string,fn:(x:number)=>number)=>new PyBuiltin(name,a=>{arity(name,a,1);return isInt(a[0])?toBig(a[0]):toInt(fn(real(a[0])));});
  const gcd=(x:bigint,y:bigint):bigint=>{x=x<ZERO?-x:x;y=y<ZERO?-y:y;while(y){[x,y]=[y,x%y];}return x;};
  const attrs=new Map<string,Value>([
   ['pi',Math.PI],['e',Math.E],['tau',2*Math.PI],['inf',Infinity],['nan',NaN],
   ['sqrt',f1('sqrt',Math.sqrt,x=>x>=0)],['exp',f1('exp',Math.exp)],['log10',f1('log10',Math.log10,x=>x>0)],['log2',f1('log2',Math.log2,x=>x>0)],
   ['sin',f1('sin',Math.sin)],['cos',f1('cos',Math.cos)],['tan',f1('tan',Math.tan)],['asin',f1('asin',Math.asin,x=>x>=-1&&x<=1)],['acos',f1('acos',Math.acos,x=>x>=-1&&x<=1)],['atan',f1('atan',Math.atan)],
   ['fabs',f1('fabs',Math.abs)],['degrees',f1('degrees',x=>x*180/Math.PI)],['radians',f1('radians',x=>x*Math.PI/180)],
   ['floor',rounder('floor',Math.floor)],['ceil',rounder('ceil',Math.ceil)],['trunc',rounder('trunc',Math.trunc)],
   ['isfinite',new PyBuiltin('isfinite',a=>{arity('isfinite',a,1);return Number.isFinite(real(a[0]));})],['isinf',new PyBuiltin('isinf',a=>{arity('isinf',a,1);const x=real(a[0]);return !Number.isFinite(x)&&!Number.isNaN(x);})],['isnan',new PyBuiltin('isnan',a=>{arity('isnan',a,1);return Number.isNaN(real(a[0]));})],
   ['log',new PyBuiltin('log',a=>{arity('log',a,1,2);const x=real(a[0]);if(x<=0)throw err('ValueError','math domain error');if(a.length===1)return Math.log(x);const b=real(a[1]);if(b<=0||b===1)throw err(b===1?'ZeroDivisionError':'ValueError',b===1?'float division by zero':'math domain error');return Math.log(x)/Math.log(b);})],
   ['pow',new PyBuiltin('pow',a=>{arity('pow',a,2);return real(a[0])**real(a[1]);})],
   ['hypot',new PyBuiltin('hypot',a=>Math.hypot(...a.map(real)))],
   ['atan2',new PyBuiltin('atan2',a=>{arity('atan2',a,2);return Math.atan2(real(a[0]),real(a[1]));})],
   ['copysign',new PyBuiltin('copysign',a=>{arity('copysign',a,2);const x=Math.abs(real(a[0])),y=real(a[1]);return y<0||Object.is(y,-0)?-x:x;})],
   ['isclose',new PyBuiltin('isclose',(a,k)=>{arity('isclose',a,2);const x=real(a[0]),y=real(a[1]),rel=real(k.get('rel_tol')??1e-9),abs=real(k.get('abs_tol')??0);return x===y||Math.abs(x-y)<=Math.max(rel*Math.max(Math.abs(x),Math.abs(y)),abs);})],
   ['gcd',new PyBuiltin('gcd',a=>a.map(bigArg).reduce(gcd,ZERO))],
   ['lcm',new PyBuiltin('lcm',a=>a.map(bigArg).reduce((x,y)=>x===ZERO||y===ZERO?ZERO:checkBig((x*y<ZERO?-(x*y):x*y)/gcd(x,y)),ONE))],
   ['factorial',new PyBuiltin('factorial',a=>{arity('factorial',a,1);const n=bigArg(a[0]);if(n<ZERO)throw err('ValueError','factorial() not defined for negative values');if(n>BigInt(3000))throw limit('factorial argument is too large');let r=ONE;for(let i=BigInt(2);i<=n;i++)r*=i;return r;})],
   ['isqrt',new PyBuiltin('isqrt',a=>{arity('isqrt',a,1);const n=bigArg(a[0]);if(n<ZERO)throw err('ValueError','isqrt() argument must be nonnegative');if(n<BigInt(2))return n;let x=BigInt(Math.floor(Math.sqrt(Number(n))));while(x*x>n)x-=ONE;while((x+ONE)*(x+ONE)<=n)x+=ONE;return x;})],
   ['comb',new PyBuiltin('comb',a=>{arity('comb',a,2);const n=bigArg(a[0]),r=bigArg(a[1]);if(n<ZERO||r<ZERO)throw err('ValueError','n must be a non-negative integer');if(r>n)return ZERO;let out=ONE;for(let i=ONE;i<=r;i++)out=checkBig(out*(n-r+i)/i);return out;})],
   ['prod',new PyBuiltin('prod',(a,k)=>{arity('prod',a,1);let r:Value=k.get('start')??ONE;for(const v of this.toArray(a[0]))r=this.binop('*',r,v);return r;})],
   ['fsum',new PyBuiltin('fsum',a=>{arity('fsum',a,1);let s=0,c=0;for(const v of this.toArray(a[0])){const x=real(v),t=s+x;c+=Math.abs(s)>=Math.abs(x)?(s-t)+x:(x-t)+s;s=t;}return s+c;})],
  ]);
  return new PyModule('math',null,attrs);
 }
 rand():number{let t=(this.seed=(this.seed+0x6d2b79f5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
 randomModule():PyModule{
  const below=(n:number)=>Math.floor(this.rand()*n);
  const randrange=(name:string,start:bigint,stop:bigint,step:bigint)=>{const r=new PyRange(start,stop,step);if(!r.length)throw err('ValueError',`empty range in ${name}(${start}, ${stop}${step===ONE?'':', '+step})`);return r.at(below(r.length));};
  const attrs=new Map<string,Value>([
   ['seed',new PyBuiltin('seed',a=>{let h=2166136261;for(const ch of pyRepr(a[0]??null)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}this.seed=h>>>0;return null;})],
   ['random',new PyBuiltin('random',a=>{arity('random',a,0);return this.rand();})],
   ['uniform',new PyBuiltin('uniform',a=>{arity('uniform',a,2);const x=Number(asNum(a[0])),y=Number(asNum(a[1]));return x+(y-x)*this.rand();})],
   ['randint',new PyBuiltin('randint',a=>{arity('randint',a,2);const x=bigArg(a[0]),y=bigArg(a[1]);return randrange('randrange',x,y+ONE,ONE);})],
   ['randrange',new PyBuiltin('randrange',a=>{arity('randrange',a,1,3);const n=a.map(bigArg);return a.length===1?randrange('randrange',ZERO,n[0],ONE):randrange('randrange',n[0],n[1],n[2]??ONE);})],
   ['choice',new PyBuiltin('choice',a=>{arity('choice',a,1);const s=a[0];if(!isSeq(s))throw err('TypeError',`'${typeName(s)}' object is not subscriptable`);const n=seqLen(s);if(!n)throw err('IndexError','Cannot choose from an empty sequence');return seqAt(s,below(n));})],
   ['shuffle',new PyBuiltin('shuffle',a=>{arity('shuffle',a,1);const l=a[0];if(!(l instanceof PyList))throw err('TypeError',`'${typeName(l)}' object does not support item assignment`);for(let i=l.items.length-1;i>0;i--){const j=below(i+1);[l.items[i],l.items[j]]=[l.items[j],l.items[i]];}return null;})],
   ['sample',new PyBuiltin('sample',(a,k)=>{arity('sample',a,1,2);const pool=this.toArray(a[0]),n=intArg(arg(a,k,1,'k')??ZERO);if(n<0||n>pool.length)throw err('ValueError','Sample larger than population or is negative');const out:Value[]=[];for(let i=0;i<n;i++)out.push(pool.splice(below(pool.length),1)[0]);return new PyList(out);})],
  ]);
  return new PyModule('random','/usr/lib/python3.12/random.py',attrs);
 }
 stringModule():PyModule{
  const lower='abcdefghijklmnopqrstuvwxyz',upper=lower.toUpperCase(),punct='!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
  return new PyModule('string','/usr/lib/python3.12/string.py',new Map<string,Value>([['ascii_lowercase',lower],['ascii_uppercase',upper],['ascii_letters',lower+upper],['digits','0123456789'],['hexdigits','0123456789abcdefABCDEF'],['octdigits','01234567'],['punctuation',punct],['whitespace',' \t\n\r\x0b\x0c'],['printable','0123456789'+lower+upper+punct+' \t\n\r\x0b\x0c']]));
 }

 // --- builtins ---
 typeOf(v:Value):PyBuiltin{
  const name=typeName(v),known=this.types.get(name);if(known)return known;
  const t=new PyBuiltin(name,()=>{throw err('TypeError',`cannot create '${name}' instances`);},name);this.types.set(name,t);return t;
 }
 isInstance(x:Value,t:Value):boolean{
  if(t instanceof PyTuple)return t.items.some(i=>this.isInstance(x,i));
  if(!(t instanceof PyBuiltin)||!t.type)throw err('TypeError','isinstance() arg 2 must be a type, a tuple of types, or a union');
  const name=typeName(x);
  return t.type==='object'||name===t.type||(t.type==='int'&&name==='bool')||(x instanceof PyExc&&excIs(x.type,t.type));
 }
 parseInt(text:string,base:number):bigint{
  const bad=()=>err('ValueError',`invalid literal for int() with base ${base}: ${strRepr(text)}`);
  let s=text.trim().toLowerCase(),neg=false;
  if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  const prefixes:Record<string,number>={'0x':16,'0o':8,'0b':2};
  if(base===0){const p=prefixes[s.slice(0,2)];if(p){base=p;s=s.slice(2);}else{if(/^0+[1-9]/.test(s))throw bad();base=10;}}
  else if(prefixes[s.slice(0,2)]===base)s=s.slice(2).replace(/^_/,'');
  if(base<2||base>36)throw err('ValueError','int() base must be >= 2 and <= 36, or 0');
  if(!/^[0-9a-z](?:_?[0-9a-z])*$/.test(s))throw bad();
  let n=ZERO;const b=BigInt(base);
  for(const ch of s.replace(/_/g,'')){const d=parseInt(ch,36);if(d>=base)throw bad();n=n*b+BigInt(d);}
  if(s.length>LIMIT.digits)throw err('ValueError',`Exceeds the limit (${LIMIT.digits} digits) for integer string conversion: value has ${s.length} digits; use sys.set_int_max_str_digits() to increase the limit`);
  return neg?-n:n;
 }
 installBuiltins(){
  const B=this.builtins;
  const def=(name:string,fn:Native)=>{B.set(name,new PyBuiltin(name,fn));};
  const type=(name:string,fn:Native)=>{const t=new PyBuiltin(name,fn,name);this.types.set(name,t);if(!name.includes('.'))B.set(name,t);};
  for(const name of Object.keys(EXC_BASE))type(name,(a,k)=>{noKw(name,k);return new PyExc(name,a);});
  type('int',(a,k)=>{
   allowKw('int',k,['base']);arity('int',a,0,2);
   const v=a[0]??ZERO,base=arg(a,k,1,'base');
   if(base!==undefined){if(typeof v!=='string')throw err('TypeError',"int() can't convert non-string with explicit base");return this.parseInt(v,intArg(base));}
   if(isInt(v))return toBig(v);
   if(typeof v==='number'){if(Number.isNaN(v))throw err('ValueError','cannot convert float NaN to integer');if(!Number.isFinite(v))throw err('OverflowError','cannot convert float infinity to integer');return BigInt(Math.trunc(v));}
   if(typeof v==='string')return this.parseInt(v,10);
   throw err('TypeError',`int() argument must be a string, a bytes-like object or a real number, not '${typeName(v)}'`);
  });
  type('float',(a,k)=>{
   noKw('float',k);arity('float',a,0,1);const v=a[0]??0;
   if(typeof v==='number')return v;
   if(isInt(v)){const n=Number(toBig(v));if(!Number.isFinite(n))throw err('OverflowError','int too large to convert to float');return n;}
   if(typeof v==='string'){
    const s=v.trim();
    if(/^[+-]?(?:inf|infinity)$/i.test(s))return s[0]==='-'?-Infinity:Infinity;
    if(/^[+-]?nan$/i.test(s))return NaN;
    if(/^[+-]?(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/.test(s))return Number(s.replace(/_/g,''));
    throw err('ValueError',`could not convert string to float: ${strRepr(v)}`);
   }
   throw err('TypeError',`float() argument must be a string or a real number, not '${typeName(v)}'`);
  });
  type('str',(a,k)=>{noKw('str',k);arity('str',a,0,1);return a.length?pyStr(a[0]):'';});
  type('bool',(a,k)=>{noKw('bool',k);arity('bool',a,0,1);return a.length?truthy(a[0]):false;});
  type('list',(a,k)=>{noKw('list',k);arity('list',a,0,1);return new PyList(a.length?this.toArray(a[0]):[]);});
  type('tuple',(a,k)=>{noKw('tuple',k);arity('tuple',a,0,1);return a[0] instanceof PyTuple?a[0]:new PyTuple(a.length?this.toArray(a[0]):[]);});
  type('set',(a,k)=>{noKw('set',k);arity('set',a,0,1);return this.toSet(a[0]??new PyTuple([]));});
  type('dict',(a,k)=>{arity('dict',a,0,1);const d=new PyDict();if(a.length)this.dictUpdate(d,a[0]);for(const [key,v] of k)d.set(key,v);return d;});
  type('range',(a,k)=>{
   noKw('range',k);if(!a.length)throw err('TypeError','range expected at least 1 argument, got 0');if(a.length>3)throw err('TypeError',`range expected at most 3 arguments, got ${a.length}`);
   const n=a.map(bigArg);if(n.length===3&&n[2]===ZERO)throw err('ValueError','range() arg 3 must not be zero');
   return n.length===1?new PyRange(ZERO,n[0],ONE):new PyRange(n[0],n[1],n[2]??ONE);
  });
  type('type',(a,k)=>{noKw('type',k);if(a.length!==1)throw new PyRaise(new PyExc('NotImplementedError',['type() with 3 arguments is not supported in this simulated Python']));return this.typeOf(a[0]);});
  type('object',()=>{throw new PyRaise(new PyExc('NotImplementedError',['object() is not supported in this simulated Python']));});
  def('print',(a,k)=>{
   allowKw('print',k,['sep','end','file','flush']);
   const sep=k.get('sep')??' ',end=k.get('end')??'\n',file=k.get('file')??null;
   if(typeof sep!=='string')throw err('TypeError',`sep must be None or a string, not ${typeName(sep)}`);
   if(typeof end!=='string')throw err('TypeError',`end must be None or a string, not ${typeName(end)}`);
   if(file!==null)throw new PyRaise(new PyExc('io.UnsupportedOperation',['not writable']));
   this.write(a.map(pyStr).join(sep)+end);return null;
  });
  def('input',(a)=>{arity('input',a,0,1);if(a.length)this.write(pyStr(a[0]));throw err('EOFError','EOF when reading a line');});
  def('len',(a,k)=>{noKw('len',k);arity('len',a,1);return BigInt(this.len(a[0]));});
  def('repr',(a)=>{arity('repr',a,1);return pyRepr(a[0]);});
  def('ascii',(a)=>{arity('ascii',a,1);return pyRepr(a[0]).replace(/[^\x00-\x7f]/g,c=>{const n=c.charCodeAt(0);return n<0x100?'\\x'+n.toString(16).padStart(2,'0'):'\\u'+n.toString(16).padStart(4,'0');});});
  def('format',(a)=>{arity('format',a,1,2);return formatValue(a[0],a.length>1?strArg(a[1],'format() argument 2'):'');});
  def('abs',(a)=>{arity('abs',a,1);const n=asNum(a[0]);if(n===undefined)throw err('TypeError',`bad operand type for abs(): '${typeName(a[0])}'`);return typeof n==='bigint'?(n<ZERO?-n:n):Math.abs(n);});
  def('round',(a,k)=>{
   allowKw('round',k,['ndigits']);arity('round',a,1,2);
   const x=arg(a,k,0,'number')!,nd=arg(a,k,1,'ndigits')??null;
   if(isInt(x)){
    const v=toBig(x);if(nd===null)return v;const n=intArg(nd);if(n>=0)return v;
    const p=BigInt(10)**BigInt(-n),q=floorDiv(v,p),r=v-q*p,twice=r*BigInt(2);
    return (twice>p||(twice===p&&q%BigInt(2)!==ZERO)?q+ONE:q)*p;
   }
   if(typeof x!=='number')throw err('TypeError',`type ${typeName(x)} doesn't define __round__ method`);
   if(nd===null){
    if(Number.isNaN(x))throw err('ValueError','cannot convert float NaN to integer');
    if(!Number.isFinite(x))throw err('OverflowError','cannot convert float infinity to integer');
    const f=Math.floor(x),d=x-f;return BigInt(d>0.5||(d===0.5&&f%2!==0)?f+1:f);
   }
   const n=intArg(nd);
   if(!Number.isFinite(x)||n>=17)return x;
   if(n>=0){const s=toFixedPy(Math.abs(x),n);return (x<0?-1:1)*Number(s);}
   const p=10**-n,y=x/p,f=Math.floor(y),d=y-f;return (d>0.5||(d===0.5&&f%2!==0)?f+1:f)*p;
  });
  def('divmod',(a)=>{arity('divmod',a,2);return new PyTuple([this.binop('//',a[0],a[1]),this.binop('%',a[0],a[1])]);});
  def('pow',(a,k)=>{
   allowKw('pow',k,['base','exp','mod']);arity('pow',a,2,3);
   if(a.length===3&&a[2]!==null){
    const b=bigArg(a[0]),e=bigArg(a[1]),m=bigArg(a[2]);if(m===ZERO)throw err('ValueError','pow() 3rd argument cannot be 0');if(e<ZERO)throw err('ValueError','base is not invertible for the given modulus');
    let r=ONE,x=floorMod(b,m),n=e;while(n>ZERO){if(n&ONE)r=r*x%m;x=x*x%m;n>>=ONE;}return floorMod(r,m);
   }
   return this.binop('**',a[0],a[1]);
  });
  def('sum',(a,k)=>{
   allowKw('sum',k,['start']);arity('sum',a,1,2);
   let total:Value=arg(a,k,1,'start')??ZERO;
   if(typeof total==='string')throw err('TypeError',"sum() can't sum strings [use ''.join(seq) instead]");
   let fsum:number|null=typeof total==='number'?total:null,comp=0;
   for(const v of this.toArray(a[0])){
    const n=asNum(v);
    if(fsum===null){
     if(typeof n==='number'&&asNum(total)!==undefined){fsum=Number(asNum(total))+n;continue;}
     total=this.binop('+',total,v);continue;
    }
    if(typeof n==='number'){const t=fsum+n;comp+=Math.abs(fsum)>=Math.abs(n)?(fsum-t)+n:(n-t)+fsum;fsum=t;continue;}
    if(n!==undefined){fsum+=Number(n);continue;}
    total=this.binop('+',comp&&Number.isFinite(comp)?fsum+comp:fsum,v);fsum=null;comp=0;
   }
   return fsum!==null?(comp&&Number.isFinite(comp)?fsum+comp:fsum):total;
  });
  const extreme=(name:'min'|'max')=>(a:Value[],k:Map<string,Value>):Value=>{
   allowKw(name,k,['key','default']);
   if(!a.length)throw err('TypeError',`${name} expected at least 1 argument, got 0`);
   const key=k.get('key')??null,items=a.length===1?this.toArray(a[0]):a;
   if(a.length>1&&k.has('default'))throw err('TypeError',`Cannot specify a default for ${name}() with multiple positional arguments`);
   if(!items.length){if(k.has('default'))return k.get('default')!;throw err('ValueError',`${name}() iterable argument is empty`);}
   let best=items[0],bestKey=key===null?best:this.call(key,[best]);
   for(const v of items.slice(1)){const kv=key===null?v:this.call(key,[v]);if(name==='min'?order('<',kv,bestKey):order('>',kv,bestKey)){best=v;bestKey=kv;}}
   return best;
  };
  def('min',extreme('min'));def('max',extreme('max'));
  def('sorted',(a,k)=>{
   allowKw('sorted',k,['key','reverse']);
   if(a.length!==1)throw err('TypeError',`sorted expected 1 argument, got ${a.length}`);
   return new PyList(this.sortValues(this.toArray(a[0]),k.get('key')??null,truthy(k.get('reverse')??false)));
  });
  def('reversed',(a,k)=>{
   noKw('reversed',k);arity('reversed',a,1);const s=a[0];
   const items=s instanceof PyDict?s.keys():isSeq(s)?null:(()=>{throw err('TypeError',`'${typeName(s)}' object is not reversible`);})();
   if(items){let i=items.length;return new PyIter('dict_reversekeyiterator',()=>i>0?items[--i]:DONE);}
   const seq=s as PyList|PyTuple|PyRange|string;let i=seqLen(seq);
   return new PyIter(seq instanceof PyList?'list_reverseiterator':seq instanceof PyRange?'range_iterator':'reversed',()=>{if(i>seqLen(seq))i=seqLen(seq);return i>0?seqAt(seq,--i):DONE;});
  });
  def('enumerate',(a,k)=>{
   allowKw('enumerate',k,['start']);arity('enumerate',a,1,2);
   const it=this.iter(a[0]);let n=bigArg(arg(a,k,1,'start')??ZERO);
   return new PyIter('enumerate',()=>{const v=it.next();if(v===DONE)return DONE;const t=new PyTuple([n,v]);n+=ONE;return t;});
  });
  def('zip',(a,k)=>{
   allowKw('zip',k,['strict']);const its=a.map(x=>this.iter(x));
   return new PyIter('zip',()=>{if(!its.length)return DONE;const row:Value[]=[];for(const it of its){const v=it.next();if(v===DONE)return DONE;row.push(v);}return new PyTuple(row);});
  });
  def('map',(a,k)=>{
   noKw('map',k);if(a.length<2)throw err('TypeError','map() must have at least two arguments.');
   const fn=a[0],its=a.slice(1).map(x=>this.iter(x));
   return new PyIter('map',()=>{const row:Value[]=[];for(const it of its){const v=it.next();if(v===DONE)return DONE;row.push(v);}return this.call(fn,row);});
  });
  def('filter',(a,k)=>{
   noKw('filter',k);arity('filter',a,2);const fn=a[0],it=this.iter(a[1]);
   return new PyIter('filter',()=>{for(let v=it.next();v!==DONE;v=it.next())if(truthy(fn===null?v:this.call(fn,[v])))return v;return DONE;});
  });
  def('any',(a)=>{arity('any',a,1);return this.toArray(a[0]).some(truthy);});
  def('all',(a)=>{arity('all',a,1);return this.toArray(a[0]).every(truthy);});
  def('isinstance',(a)=>{arity('isinstance',a,2);return this.isInstance(a[0],a[1]);});
  def('callable',(a)=>{arity('callable',a,1);return a[0] instanceof PyFunc||a[0] instanceof PyBuiltin;});
  def('chr',(a)=>{arity('chr',a,1);const n=intArg(a[0]);if(n<0||n>0x10ffff)throw err('ValueError','chr() arg not in range(0x110000)');return String.fromCodePoint(n);});
  def('ord',(a)=>{arity('ord',a,1);const s=a[0];if(typeof s!=='string')throw err('TypeError',`ord() expected string of length 1, but ${typeName(s)} found`);const chars=[...s];if(chars.length!==1)throw err('TypeError',`ord() expected a character, but string of length ${chars.length} found`);return BigInt(chars[0].codePointAt(0)!);});
  const radix=(name:string,base:number,prefix:string)=>def(name,(a)=>{arity(name,a,1);const n=bigArg(a[0]);return (n<ZERO?'-':'')+prefix+(n<ZERO?-n:n).toString(base);});
  radix('hex',16,'0x');radix('oct',8,'0o');radix('bin',2,'0b');
  def('iter',(a)=>{arity('iter',a,1);const v=a[0];if(v instanceof PyIter||v instanceof PyFile)return v;const it=this.iter(v);return new PyIter(v instanceof PyList?'list_iterator':v instanceof PyTuple?'tuple_iterator':typeof v==='string'?'str_ascii_iterator':v instanceof PyDict?'dict_keyiterator':typeName(v)+'_iterator',()=>it.next());});
  def('next',(a)=>{
   arity('next',a,1,2);const it=a[0];
   if(!(it instanceof PyIter||it instanceof PyFile))throw err('TypeError',`'${typeName(it)}' object is not an iterator`);
   const v=it.next();if(v!==DONE)return v;if(a.length>1)return a[1];throw new PyRaise(new PyExc('StopIteration',[]));
  });
  def('hash',(a)=>{arity('hash',a,1);const key=keyOf(a[0]);let h=0;for(let i=0;i<key.length;i++)h=Math.imul(h^key.charCodeAt(i),16777619);return BigInt(h);});
  def('id',(a)=>{arity('id',a,1);const v=a[0];return BigInt(v!==null&&typeof v==='object'?0x7f3a2c000000+objectId(v)*0x40:0x7f3a2b000000+keyOf(v).length*0x20);});
  def('open',(a,k)=>{
   allowKw('open',k,['file','mode','encoding','errors','newline','buffering']);arity('open',a,0,3);
   const file=arg(a,k,0,'file'),mode=arg(a,k,1,'mode')??'r';
   if(typeof file!=='string')throw err('TypeError',`expected str, bytes or os.PathLike object, not ${typeName(file??null)}`);
   if(typeof mode!=='string')throw err('TypeError',`open() argument 'mode' must be str, not ${typeName(mode)}`);
   if(/[wax+]/.test(mode))throw err('PermissionError',`[Errno 13] Permission denied: ${strRepr(file)} (the simulated sandbox reads files but cannot write them; print() the result instead)`);
   if(mode.includes('b'))throw new PyRaise(new PyExc('NotImplementedError',['binary file mode is not supported in this simulated Python']));
   const text=this.readFile(file);
   if(text===undefined)throw err('FileNotFoundError',`[Errno 2] No such file or directory: ${strRepr(file)}`);
   return new PyFile(file,text);
  });
  const exit=(name:string)=>def(name,(a)=>{arity(name,a,0,1);throw new PyExit(a[0]??null);});
  exit('exit');exit('quit');
  for(const name of ['globals','locals','vars','dir','eval','exec','compile','__import__','getattr','setattr','delattr','hasattr','breakpoint','help','memoryview','bytearray','bytes','frozenset','complex','super','property','classmethod','staticmethod'])
   def(name,()=>{throw new PyRaise(new PyExc('NotImplementedError',[`${name}() is not supported in this simulated Python`]));});
 }
 dictUpdate(d:PyDict,src:Value){
  if(src instanceof PyDict){for(const [k,v] of src.map.values())d.set(k,v);return;}
  this.toArray(src).forEach((pair,i)=>{
   if(!(pair instanceof PyList||pair instanceof PyTuple||typeof pair==='string'))throw err('TypeError',`cannot convert dictionary update sequence element #${i} to a sequence`);
   const kv=this.toArray(pair);if(kv.length!==2)throw err('ValueError',`dictionary update sequence element #${i} has length ${kv.length}; 2 is required`);
   d.set(kv[0],kv[1]);
  });
  checkItems(d.size);
 }

 // --- method tables ---
 makeStrMethods():Methods<string>{
  const window=(s:string,a:Value[],from:number):[string,number]=>{
   const n=s.length,start=a[from]===undefined||a[from]===null?0:intArg(a[from]),end=a[from+1]===undefined||a[from+1]===null?n:intArg(a[from+1]);
   const lo=Math.min(n,start<0?Math.max(0,start+n):start),hi=Math.min(n,end<0?Math.max(0,end+n):end);
   return [hi>lo?s.slice(lo,hi):'',lo];
  };
  const chars=(s:string,a:Value[],name:string)=>{arity(`str.${name}`,a,0,1);const c=a[0]??null;if(c!==null&&typeof c!=='string')throw err('TypeError',`${name} arg must be None or str`);return c;};
  const stripWith=(s:string,c:string|null,left:boolean,right:boolean)=>{
   if(c===null)return left&&right?s.trim():left?s.trimStart():s.trimEnd();
   let i=0,j=s.length;if(left)while(i<j&&c.includes(s[i]))i++;if(right)while(j>i&&c.includes(s[j-1]))j--;return s.slice(i,j);
  };
  const affix=(name:string,test:(s:string,p:string)=>boolean)=>(s:string,a:Value[])=>{
   arity(`str.${name}`,a,1,3);const [part]=window(s,a,1),p=a[0];
   if(p instanceof PyTuple)return p.items.some(x=>test(part,strArg(x,`tuple for ${name} must only contain str, not ${typeName(x)}`)));
   if(typeof p!=='string')throw err('TypeError',`${name} first arg must be str or a tuple of str, not ${typeName(p)}`);
   return test(part,p);
  };
  const find=(name:string,last:boolean,strict:boolean)=>(s:string,a:Value[])=>{
   arity(`str.${name}`,a,1,3);if(typeof a[0]!=='string')throw err('TypeError',`must be str, not ${typeName(a[0])}`);const sub=a[0],[part,off]=window(s,a,1);
   const at=last?part.lastIndexOf(sub):part.indexOf(sub);
   if(at<0){if(strict)throw err('ValueError','substring not found');return BigInt(-1);}
   return BigInt(at+off);
  };
  const test=(name:string,re:RegExp,empty=false)=>(s:string,a:Value[])=>{arity(`str.${name}`,a,0);return s.length?re.test(s):empty;};
  const just=(name:string,how:'<'|'>'|'^')=>(s:string,a:Value[])=>{
   arity(`str.${name}`,a,1,2);const width=intArg(a[0]),fill=a[1]===undefined?' ':strArg(a[1],'The fill character');
   if(fill.length!==1)throw err('TypeError','The fill character must be exactly one character long');
   if(how!=='^')return padText(s,width,fill,how);
   const marg=width-s.length;if(marg<=0)return s;if(width>LIMIT.string)throw limit('format width is too large');
   const left=Math.floor(marg/2)+(marg&width&1);return fill.repeat(left)+s+fill.repeat(marg-left);
  };
  const splitWs=(s:string,max:number,fromRight:boolean):string[]=>{
   const words=s.split(/\s+/).filter(Boolean);
   if(max<0||words.length<=max+1)return words;
   if(!fromRight){const out:string[]=[];let rest=s.trimStart();for(let i=0;i<max;i++){const m=/\s+/.exec(rest)!;out.push(rest.slice(0,m.index));rest=rest.slice(m.index+m[0].length);}out.push(rest);return out;}
   const out:string[]=[];let rest=s.trimEnd();for(let i=0;i<max;i++){const m=/\s+(?=\S*$)/.exec(rest)!;out.unshift(rest.slice(m.index+m[0].length));rest=rest.slice(0,m.index);}out.unshift(rest);return out;
  };
  const split=(fromRight:boolean)=>(s:string,a:Value[],k:Map<string,Value>)=>{
   allowKw(fromRight?'rsplit':'split',k,['sep','maxsplit']);arity(`str.${fromRight?'rsplit':'split'}`,a,0,2);
   const sep=arg(a,k,0,'sep')??null,max=intArg(arg(a,k,1,'maxsplit')??BigInt(-1));
   if(sep===null)return new PyList(splitWs(s,max,fromRight));
   if(typeof sep!=='string')throw err('TypeError',`must be str or None, not ${typeName(sep)}`);
   if(sep==='')throw err('ValueError','empty separator');
   const all=s.split(sep);
   if(max<0||all.length<=max+1)return new PyList(all);
   return new PyList(fromRight?[all.slice(0,all.length-max).join(sep),...all.slice(all.length-max)]:[...all.slice(0,max),all.slice(max).join(sep)]);
  };
  return {
   upper:(s,a)=>{arity('str.upper',a,0);return s.toUpperCase();},
   lower:(s,a)=>{arity('str.lower',a,0);return s.toLowerCase();},
   casefold:(s,a)=>{arity('str.casefold',a,0);return s.toLowerCase();},
   swapcase:(s,a)=>{arity('str.swapcase',a,0);return [...s].map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join('');},
   title:(s,a)=>{arity('str.title',a,0);return s.toLowerCase().replace(new RegExp('\\p{L}+','gu'),w=>w[0].toUpperCase()+w.slice(1));},
   capitalize:(s,a)=>{arity('str.capitalize',a,0);return s?s[0].toUpperCase()+s.slice(1).toLowerCase():s;},
   strip:(s,a)=>stripWith(s,chars(s,a,'strip'),true,true),
   lstrip:(s,a)=>stripWith(s,chars(s,a,'lstrip'),true,false),
   rstrip:(s,a)=>stripWith(s,chars(s,a,'rstrip'),false,true),
   split:split(false),rsplit:split(true),
   splitlines:(s,a,k)=>{allowKw('splitlines',k,['keepends']);arity('str.splitlines',a,0,1);const keep=truthy(arg(a,k,0,'keepends')??false),parts=s.match(/[^\n\r\v\f\x1c-\x1e\x85\u2028\u2029]*(?:\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]|$)/g)!.filter((p,i,all)=>p!==''||i<all.length-1);return new PyList(parts.filter(p=>p!=='').map(p=>keep?p:p.replace(/(?:\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029])$/,'')));},
   join:(s,a)=>{arity('str.join',a,1);const items=this.toArray(a[0]);items.forEach((v,i)=>{if(typeof v!=='string')throw err('TypeError',`sequence item ${i}: expected str instance, ${typeName(v)} found`);});return checkText(items.join(s));},
   replace:(s,a)=>{
    arity('str.replace',a,2,3);const old=strArg(a[0],'replace() argument 1'),rep=strArg(a[1],'replace() argument 2'),count=a.length>2?intArg(a[2]):-1;
    if(count<0)return checkText(s.split(old).join(rep));
    let out='',rest=s,n=0;
    if(old===''){const cs=[...s];for(let i=0;i<=cs.length;i++){if(n<count){out+=rep;n++;}out+=cs[i]??'';}return checkText(out);}
    while(n<count){const at=rest.indexOf(old);if(at<0)break;out+=rest.slice(0,at)+rep;rest=rest.slice(at+old.length);n++;}
    return checkText(out+rest);
   },
   startswith:affix('startswith',(s,p)=>s.startsWith(p)),endswith:affix('endswith',(s,p)=>s.endsWith(p)),
   find:find('find',false,false),rfind:find('rfind',true,false),index:find('index',false,true),rindex:find('rindex',true,true),
   count:(s,a)=>{arity('str.count',a,1,3);const sub=strArg(a[0],'count() argument 1'),[part]=window(s,a,1);return BigInt(sub===''?part.length+1:part.split(sub).length-1);},
   isdigit:test('isdigit',new RegExp('^\\p{Nd}+$','u')),isdecimal:test('isdecimal',new RegExp('^\\p{Nd}+$','u')),isnumeric:test('isnumeric',new RegExp('^\\p{N}+$','u')),
   isalpha:test('isalpha',new RegExp('^\\p{L}+$','u')),isalnum:test('isalnum',new RegExp('^[\\p{L}\\p{N}]+$','u')),isspace:test('isspace',/^\s+$/),
   isupper:(s,a)=>{arity('str.isupper',a,0);return s!==s.toLowerCase()&&s===s.toUpperCase();},
   islower:(s,a)=>{arity('str.islower',a,0);return s!==s.toUpperCase()&&s===s.toLowerCase();},
   istitle:(s,a)=>{arity('str.istitle',a,0);return s!==s.toLowerCase()&&s===this.strMethods.title(s,[],NO_KW);},
   isidentifier:(s,a)=>{arity('str.isidentifier',a,0);NAME.lastIndex=0;const m=NAME.exec(s);return !!m&&m[0]===s;},
   zfill:(s,a)=>{arity('str.zfill',a,1);const w=intArg(a[0]);if(s.length>=w)return s;if(w>LIMIT.string)throw limit('format width is too large');const sign=s[0]==='+'||s[0]==='-'?s[0]:'';return sign+'0'.repeat(w-s.length)+s.slice(sign.length);},
   center:just('center','^'),ljust:just('ljust','<'),rjust:just('rjust','>'),
   partition:(s,a)=>{arity('str.partition',a,1);const sep=strArg(a[0],'partition() argument');if(!sep)throw err('ValueError','empty separator');const at=s.indexOf(sep);return new PyTuple(at<0?[s,'','']:[s.slice(0,at),sep,s.slice(at+sep.length)]);},
   rpartition:(s,a)=>{arity('str.rpartition',a,1);const sep=strArg(a[0],'rpartition() argument');if(!sep)throw err('ValueError','empty separator');const at=s.lastIndexOf(sep);return new PyTuple(at<0?['','',s]:[s.slice(0,at),sep,s.slice(at+sep.length)]);},
   removeprefix:(s,a)=>{arity('str.removeprefix',a,1);const p=strArg(a[0],'removeprefix() argument');return p&&s.startsWith(p)?s.slice(p.length):s;},
   removesuffix:(s,a)=>{arity('str.removesuffix',a,1);const p=strArg(a[0],'removesuffix() argument');return p&&s.endsWith(p)?s.slice(0,-p.length):s;},
   expandtabs:(s,a)=>{arity('str.expandtabs',a,0,1);const size=a.length?intArg(a[0]):8;let col=0,out='';for(const c of s){if(c==='\t'){const n=size>0?size-col%size:0;out+=' '.repeat(n);col+=n;}else{out+=c;col=c==='\n'||c==='\r'?0:col+1;}}return out;},
   format:(s,a,k)=>this.strFormat(s,a,k),
   format_map:(s,a)=>{arity('str.format_map',a,1);const m=a[0];if(!(m instanceof PyDict))throw err('TypeError',`'${typeName(m)}' object is not subscriptable`);const kw=new Map<string,Value>();for(const [key,v] of m.map.values())if(typeof key==='string')kw.set(key,v);return this.strFormat(s,[],kw);},
   encode:()=>{throw new PyRaise(new PyExc('NotImplementedError',['bytes are not supported in this simulated Python']));},
  };
 }
 strFormat(fmt:string,args:Value[],kw:Map<string,Value>):string{
  let out='',i=0,auto=0,mode:''|'auto'|'manual'='';
  const resolve=(field:string):Value=>{
   const m=/^([^.[]*)((?:\.[^.[]+|\[[^\]]*\])*)$/.exec(field);
   if(!m)throw err('ValueError',`unexpected '{' in field name`);
   const head=m[1];let v:Value;
   if(head===''||/^\d+$/.test(head)){
    if(head===''){if(mode==='manual')throw err('ValueError','cannot switch from manual field specification to automatic field numbering');mode='auto';}
    else{if(mode==='auto')throw err('ValueError','cannot switch from automatic field numbering to manual field specification');mode='manual';}
    const n=head===''?auto++:Number(head);
    if(n>=args.length)throw err('IndexError',`Replacement index ${n} out of range for positional args tuple`);
    v=args[n];
   }else{const got=kw.get(head);if(got===undefined)throw keyError(head);v=got;}
   for(const part of m[2].match(/\.[^.[]+|\[[^\]]*\]/g)??[]){
    if(part[0]==='.')v=this.getattr(v,part.slice(1));
    else{const key=part.slice(1,-1);v=this.getitem(v,/^\d+$/.test(key)?BigInt(key):key);}
   }
   return v;
  };
  while(i<fmt.length){
   const c=fmt[i];
   if(c==='{'){
    if(fmt[i+1]==='{'){out+='{';i+=2;continue;}
    let depth=1,j=i+1;while(j<fmt.length){if(fmt[j]==='{')depth++;else if(fmt[j]==='}'&&--depth===0)break;j++;}
    if(depth)throw err('ValueError',"expected '}' before end of string");
    const field=fmt.slice(i+1,j);i=j+1;
    const m=/^([^!:]*)(?:!([^:]*))?(?::([\s\S]*))?$/.exec(field)!;
    const v=resolve(m[1]),conv=m[2]??'';
    const spec=(m[3]??'').replace(/\{([^{}]*)\}/g,(_,inner:string)=>pyStr(resolve(inner)));
    if(conv&&!['r','s','a'].includes(conv))throw err('ValueError',`Unknown conversion specifier ${conv}`);
    out+=formatValue(conv==='r'||conv==='a'?pyRepr(v):conv==='s'?pyStr(v):v,spec);
    continue;
   }
   if(c==='}'){if(fmt[i+1]==='}'){out+='}';i+=2;continue;}throw err('ValueError',"Single '}' encountered in format string");}
   out+=c;i++;
  }
  return checkText(out);
 }
 makeListMethods():Methods<PyList>{
  const at=(l:PyList,v:Value,start=0,end=l.items.length)=>{for(let i=Math.max(0,start);i<Math.min(end,l.items.length);i++)if(pyEq(l.items[i],v))return i;return -1;};
  return {
   append:(l,a,k)=>{noKw('list.append',k);arity('list.append',a,1);l.items.push(a[0]);checkItems(l.items.length);return null;},
   extend:(l,a)=>{arity('list.extend',a,1);const items=this.toArray(a[0]);checkItems(l.items.length+items.length);l.items.push(...items);return null;},
   insert:(l,a)=>{arity('list.insert',a,2);let i=intArg(a[0]);const n=l.items.length;if(i<0)i=Math.max(0,i+n);l.items.splice(Math.min(i,n),0,a[1]);checkItems(l.items.length);return null;},
   pop:(l,a)=>{arity('list.pop',a,0,1);if(!l.items.length)throw err('IndexError','pop from empty list');let i=a.length?intArg(a[0]):-1;if(i<0)i+=l.items.length;if(i<0||i>=l.items.length)throw err('IndexError','pop index out of range');return l.items.splice(i,1)[0];},
   remove:(l,a)=>{arity('list.remove',a,1);const i=at(l,a[0]);if(i<0)throw err('ValueError','list.remove(x): x not in list');l.items.splice(i,1);return null;},
   index:(l,a)=>{arity('list.index',a,1,3);const n=l.items.length,norm=(v:Value|undefined,d:number)=>{if(v===undefined)return d;const i=intArg(v);return i<0?Math.max(0,i+n):i;};const i=at(l,a[0],norm(a[1],0),norm(a[2],n));if(i<0)throw err('ValueError',`${pyRepr(a[0])} is not in list`);return BigInt(i);},
   count:(l,a)=>{arity('list.count',a,1);return BigInt(l.items.filter(v=>pyEq(v,a[0])).length);},
   sort:(l,a,k)=>{if(a.length)throw err('TypeError','sort() takes no positional arguments');allowKw('sort',k,['key','reverse']);l.items=this.sortValues(l.items,k.get('key')??null,truthy(k.get('reverse')??false));return null;},
   reverse:(l,a)=>{arity('list.reverse',a,0);l.items.reverse();return null;},
   clear:(l,a)=>{arity('list.clear',a,0);l.items=[];return null;},
   copy:(l,a)=>{arity('list.copy',a,0);return new PyList(l.items.slice());},
  };
 }
 makeTupleMethods():Methods<PyTuple>{
  return {
   count:(t,a)=>{arity('tuple.count',a,1);return BigInt(t.items.filter(v=>pyEq(v,a[0])).length);},
   index:(t,a)=>{arity('tuple.index',a,1,3);const i=t.items.findIndex(v=>pyEq(v,a[0]));if(i<0)throw err('ValueError','tuple.index(x): x not in tuple');return BigInt(i);},
  };
 }
 makeDictMethods():Methods<PyDict>{
  return {
   get:(d,a,k)=>{noKw('dict.get',k);arity('get',a,1,2);const v=d.get(a[0]);return v===undefined?a[1]??null:v;},
   keys:(d,a)=>{arity('dict.keys',a,0);return new PyView(d,'keys');},
   values:(d,a)=>{arity('dict.values',a,0);return new PyView(d,'values');},
   items:(d,a)=>{arity('dict.items',a,0);return new PyView(d,'items');},
   pop:(d,a)=>{arity('pop',a,1,2);const v=d.get(a[0]);if(v===undefined){if(a.length>1)return a[1];throw keyError(a[0]);}d.delete(a[0]);return v;},
   popitem:(d,a)=>{arity('dict.popitem',a,0);const last=[...d.map.entries()].pop();if(!last)throw keyError('popitem(): dictionary is empty');d.map.delete(last[0]);return new PyTuple(last[1]);},
   setdefault:(d,a)=>{arity('setdefault',a,1,2);const v=d.get(a[0]);if(v!==undefined)return v;const dflt=a[1]??null;d.set(a[0],dflt);checkItems(d.size);return dflt;},
   update:(d,a,k)=>{arity('update',a,0,1);if(a.length)this.dictUpdate(d,a[0]);for(const [key,v] of k)d.set(key,v);return null;},
   clear:(d,a)=>{arity('dict.clear',a,0);d.map.clear();return null;},
   copy:(d,a)=>{arity('dict.copy',a,0);const c=new PyDict();for(const [k,v] of d.map.values())c.set(k,v);return c;},
  };
 }
 makeSetMethods():Methods<PySet>{
  const update=(s:PySet,others:Value[])=>{
   for(const o of others){
    if(o instanceof PySet)s.merge(o);
    else if(o instanceof PyDict){if(s.slots&&(s.fill+o.size)*5>=(s.slots.length-1)*3)s.resize((s.size+o.size)*2);for(const k of o.keys())s.add(k);}
    else for(const v of this.toArray(o))s.add(v);
   }
   checkItems(s.size);
  };
  const other=(v:Value)=>v instanceof PySet?v:this.toSet(v);
  return {
   add:(s,a)=>{arity('set.add',a,1);s.add(a[0]);checkItems(s.size);return null;},
   remove:(s,a)=>{arity('set.remove',a,1);if(!s.remove(a[0]))throw keyError(a[0]);return null;},
   discard:(s,a)=>{arity('set.discard',a,1);s.remove(a[0]);return null;},
   pop:(s,a)=>{arity('set.pop',a,0);if(!s.size)throw keyError('pop from an empty set');const first=s.values()[0];s.remove(first);return first;},
   clear:(s,a)=>{arity('set.clear',a,0);s.clear();return null;},
   copy:(s,a)=>{arity('set.copy',a,0);return PySet.copy(s);},
   update:(s,a)=>{update(s,a);return null;},
   union:(s,a)=>{const out=PySet.copy(s);update(out,a);return out;},
   intersection:(s,a)=>a.reduce<PySet>((acc,o)=>setIntersection(acc,other(o)),PySet.copy(s)),
   difference:(s,a)=>a.reduce<PySet>((acc,o)=>setDifference(acc,this.toArray(o),o instanceof PySet||o instanceof PyDict),PySet.copy(s)),
   symmetric_difference:(s,a)=>{arity('set.symmetric_difference',a,1);const out=PySet.copy(s);for(const v of other(a[0]).values())if(!out.remove(v))out.add(v);return out;},
   issubset:(s,a)=>{arity('set.issubset',a,1);const o=other(a[0]);return s.values().every(v=>o.has(v));},
   issuperset:(s,a)=>{arity('set.issuperset',a,1);return other(a[0]).values().every(v=>s.has(v));},
   isdisjoint:(s,a)=>{arity('set.isdisjoint',a,1);return other(a[0]).values().every(v=>!s.has(v));},
  };
 }
 makeFileMethods():Methods<PyFile>{
  const unwritable=()=>{throw new PyRaise(new PyExc('io.UnsupportedOperation',['not writable']));};
  return {
   read:(f,a)=>{arity('read',a,0,1);f.check();const n=a.length&&a[0]!==null?intArg(a[0]):-1,end=n<0?f.text.length:Math.min(f.text.length,f.pos+n),out=f.text.slice(f.pos,end);f.pos=end;return out;},
   readline:(f,a)=>{arity('readline',a,0,1);return f.readline();},
   readlines:(f,a)=>{arity('readlines',a,0,1);const out:Value[]=[];for(let v=f.next();v!==DONE;v=f.next())out.push(v);return new PyList(out);},
   close:(f,a)=>{arity('close',a,0);f.closed=true;return null;},
   seek:(f,a)=>{arity('seek',a,1,2);f.check();f.pos=Math.max(0,Math.min(f.text.length,intArg(a[0])));return BigInt(f.pos);},
   tell:(f,a)=>{arity('tell',a,0);f.check();return BigInt(f.pos);},
   write:unwritable,writelines:unwritable,
  };
 }
}

// ---------- JSON helpers ----------
function jsonStr(s:string,ascii:boolean):string{
 const short:Record<string,string>={'"':'\\"','\\':'\\\\','\n':'\\n','\r':'\\r','\t':'\\t','\b':'\\b','\f':'\\f'};
 return '"'+s.replace(ascii?/[\\"\u0000-\u001f\u007f-\uffff]/g:/[\\"\u0000-\u001f]/g,c=>short[c]??'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))+'"';
}
function jsonParse(text:string):Value{
 let i=0;
 const fail=(msg:string,at=i):never=>{const before=text.slice(0,at);throw err('json.decoder.JSONDecodeError',`${msg}: line ${before.split('\n').length} column ${at-before.lastIndexOf('\n')} (char ${at})`);};
 const ws=()=>{while(i<text.length&&' \t\n\r'.includes(text[i]))i++;};
 const str=():string=>{
  const start=i++;let out='';
  for(;;){
   if(i>=text.length)fail('Unterminated string starting at',start);
   const c=text[i++];
   if(c==='"')return out;
   if(c==='\\'){
    const e=text[i++],map:Record<string,string>={'"':'"','\\':'\\','/':'/',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'};
    if(e==='u'){const h=text.slice(i,i+4);if(!/^[\da-fA-F]{4}$/.test(h))fail('Invalid \\uXXXX escape',i-1);out+=String.fromCharCode(parseInt(h,16));i+=4;}
    else if(e!==undefined&&e in map)out+=map[e];else fail('Invalid \\escape',i-2);
    continue;
   }
   if(c<' ')fail('Invalid control character at',i-1);
   out+=c;
  }
 };
 const value=():Value=>{
  ws();const c=text[i];
  if(c==='{'){
   i++;const d=new PyDict();ws();if(text[i]==='}'){i++;return d;}
   for(;;){ws();if(text[i]!=='"')fail('Expecting property name enclosed in double quotes');const k=str();ws();if(text[i]!==':')fail("Expecting ':' delimiter");i++;d.set(k,value());ws();if(text[i]===','){i++;continue;}if(text[i]==='}'){i++;return d;}fail("Expecting ',' delimiter");}
  }
  if(c==='['){
   i++;const items:Value[]=[];ws();if(text[i]===']'){i++;return new PyList(items);}
   for(;;){items.push(value());checkItems(items.length);ws();if(text[i]===','){i++;continue;}if(text[i]===']'){i++;return new PyList(items);}fail("Expecting ',' delimiter");}
  }
  if(c==='"')return str();
  const m=/^-?(?:0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i,i+400));
  if(m){i+=m[0].length;return m[1]||m[2]?Number(m[0]):BigInt(m[0]);}
  for(const [word,v] of [['true',true],['false',false],['null',null],['NaN',NaN],['Infinity',Infinity],['-Infinity',-Infinity]] as const)if(text.startsWith(word,i)){i+=word.length;return v;}
  return fail('Expecting value');
 };
 const result=value();ws();if(i<text.length)fail('Extra data');
 return result;
}

// ---------- entry points ----------
function sourceLine(source:string,line:number):string|undefined{return source.replace(/\r\n?/g,'\n').split('\n')[line-1];}
export function runPython(source:string,options:PyOptions={}):PyResult{
 nextId=1;
 const interp=new Interp(options);
 let error:PyError|null=null;
 const framed=(type:string,message:string,trace:PyFrame[]|null):PyError=>{
  const frames=(trace??[]).map(f=>({...f,text:sourceLine(source,f.line)?.trim()}));
  return {type,message,...(frames.length?{line:frames[frames.length-1].line,trace:frames}:{})};
 };
 try{
  if(source.length>LIMIT.source)throw new PySyntax('MemoryError',`script is longer than ${group(LIMIT.source)} characters (simulated Python limit)`,1);
  interp.run(parsePython(source));
 }catch(e){
  if(e instanceof PySyntax){error={...e.detail};const text=sourceLine(source,e.detail.line??0);if(text!==undefined)error.text=text;}
  else if(e instanceof PyRaise)error=framed(e.exc.type,pyStr(e.exc),e.exc.trace);
  else if(e instanceof PyLimit)error=framed(e.type,e.message,e.trace);
  else if(e instanceof PyExit){const code=e.code;if(code!==null&&code!==ZERO&&code!==false)error={type:'SystemExit',message:typeof code==='string'?code:pyStr(code)};}
  else if(e instanceof RangeError)error=framed(/call stack/i.test(e.message)?'RecursionError':'MemoryError',/call stack/i.test(e.message)?'maximum recursion depth exceeded':'value grew too large (simulated Python limit)',interp.snapshot());
  else error={type:'SystemError',message:'internal error in the simulated Python: '+(e instanceof Error?e.message:String(e))};
 }
 return {ok:!error,stdout:interp.out,error,steps:interp.steps};
}

/** CPython-style report: traceback for runtime errors, caret block for syntax errors. */
export function formatPyError(error:PyError,filename='<string>'):string{
 const lines:string[]=[],showSource=filename!=='<string>';
 if(error.type==='SystemExit')return error.message;
 if(!error.trace&&error.line){
  lines.push(`  File "${filename}", line ${error.line}`);
  if(showSource&&error.text!==undefined&&error.text.trim()){
   const stripped=error.text.trimStart();lines.push('    '+stripped.trimEnd());
   if(error.column)lines.push('    '+' '.repeat(Math.max(0,error.column-1-(error.text.length-stripped.length)))+'^');
  }
 }else if(error.trace?.length){
  lines.push('Traceback (most recent call last):');
  let repeat=0;
  error.trace.forEach((f,i)=>{
   const prev=error.trace![i-1];
   if(prev&&prev.line===f.line&&prev.scope===f.scope){repeat++;if(repeat>=3)return;}
   else{if(repeat>=3)lines.push(`  [Previous line repeated ${repeat-2} more time${repeat-2===1?'':'s'}]`);repeat=0;}
   lines.push(`  File "${filename}", line ${f.line}, in ${f.scope}`);
   if(showSource&&f.text)lines.push('    '+f.text);
  });
  if(repeat>=3)lines.push(`  [Previous line repeated ${repeat-2} more time${repeat-2===1?'':'s'}]`);
 }
 lines.push(error.message?`${error.type}: ${error.message}`:error.type);
 return lines.join('\n');
}
