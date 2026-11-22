// Read-only beginner subset of SQLite 3 for the in-game `sqlite3` simulator.
// Pure and deterministic: tokenizer -> recursive-descent parser -> AST -> tree-walking evaluator.
// Nothing here evaluates host code; value text, result layout and error wording follow the sqlite3 3.45 CLI.

export type SqlValue=null|number|string;
export type SqlColumnType='INTEGER'|'REAL'|'TEXT';
export type SqlTable={name:string;columns:{name:string;type:SqlColumnType;primaryKey?:boolean}[];rows:SqlValue[][]};
export type SqlDatabase={tables:SqlTable[]};
export type SqlCell={value:SqlValue;kind:'null'|'integer'|'real'|'text'};
export type SqlResult={columns:string[];rows:SqlCell[][]};
export type SqlOutcome={ok:true;results:SqlResult[]}|{ok:false;error:string;results:SqlResult[]};

const LIMITS={sql:4000,statements:20,rows:500,work:200000,text:100000,nesting:100,depth:1000,like:50000};

type Cell=SqlCell;
type Aff='INTEGER'|'REAL'|'NUMERIC'|'TEXT'|null;
type Coll='BINARY'|'NOCASE'|'RTRIM';
type AggFn='count'|'sum'|'total'|'avg'|'min'|'max'|'group_concat';
type Expr=
 |{k:'lit';v:Cell}
 |{k:'name';table:string|null;name:string;quote:string}
 |{k:'ref';src:number;col:number;aff:Aff}
 |{k:'agg';i:number}
 |{k:'un';op:'-'|'+'|'~'|'NOT';e:Expr}
 |{k:'and'|'or';l:Expr;r:Expr}
 |{k:'bin';op:string;l:Expr;r:Expr}
 |{k:'cmp';op:string;l:Expr;r:Expr;aff:Aff;coll:Coll}
 |{k:'isnull';e:Expr;not:boolean}
 |{k:'truth';e:Expr;not:boolean;val:boolean}
 |{k:'in';e:Expr;list:Expr[];not:boolean;aff:Aff;coll:Coll}
 |{k:'between';e:Expr;lo:Expr;hi:Expr;not:boolean;aff:[Aff,Aff];coll:[Coll,Coll]}
 |{k:'like';e:Expr;pat:Expr;esc:Expr|null;not:boolean}
 |{k:'case';base:Expr|null;whens:{w:Expr;t:Expr;aff:Aff;coll:Coll}[];els:Expr|null}
 |{k:'cast';e:Expr;aff:Aff}
 |{k:'collate';e:Expr;coll:Coll}
 |{k:'fn';name:string;args:Expr[];star:boolean;distinct:boolean}
 |{k:'call';fn:string;args:Expr[];coll:Coll};
type ResultCol={star:true;table:string|null}|{star:false;expr:Expr;alias:string|null;span:string};
type TableRef={name:string;alias:string|null};
type JoinClause={kind:'inner'|'left'|'cross';natural:boolean;table:TableRef;on:Expr|null;using:string[]|null};
type OrderTerm={e:Expr;desc:boolean;nulls:'first'|'last'|null};
type Select={distinct:boolean;cols:ResultCol[];from:TableRef|null;joins:JoinClause[];where:Expr|null;group:Expr[];having:Expr|null;order:OrderTerm[];limit:Expr|null;offset:Expr|null};

class SqlError extends Error{}
const parseErr=(message:string)=>new SqlError(`Parse error: ${message}`);
const runErr=(message:string)=>new SqlError(`Runtime error: ${message}`);

// ---------- values ----------
const NULL:Cell=Object.freeze({value:null,kind:'null'}) as Cell;
const real=(n:number):Cell=>Number.isNaN(n)?NULL:{value:n===0?0:n,kind:'real'};
const int=(n:number):Cell=>Number.isSafeInteger(n)?{value:n===0?0:n,kind:'integer'}:real(n);
const bool=(b:boolean):Cell=>({value:b?1:0,kind:'integer'});
const textCell=(s:string):Cell=>({value:s,kind:'text'});
const num=(c:Cell)=>c.value as number;
const str=(c:Cell)=>c.value as string;
const isSpace=(ch:string|undefined)=>ch===' '||ch==='\t'||ch==='\n'||ch==='\r'||ch==='\f'||ch==='\v';
const isDigit=(ch:string|undefined)=>ch!==undefined&&ch>='0'&&ch<='9';

// sqlite3AtoF: rc 1 = whole text is an integer, 2 = whole text is a real,
// 0 = not a number (value holds the integer prefix or 0), -1 = real prefix followed by junk.
function atof(s:string):{value:number;rc:number}{
 let i=0;const n=s.length;
 while(i<n&&isSpace(s[i]))i++;
 const start=i;
 if(s[i]==='+'||s[i]==='-')i++;
 let digits=0,isReal=false;
 while(isDigit(s[i])){i++;digits++;}
 if(s[i]==='.'){let k=i+1;while(isDigit(s[k]))k++;if(digits>0||k>i+1){digits+=k-i-1;isReal=true;i=k;}}
 if(digits===0)return{value:0,rc:0};
 if(s[i]==='e'||s[i]==='E'){let k=i+1;if(s[k]==='+'||s[k]==='-')k++;if(isDigit(s[k])){while(isDigit(s[k]))k++;isReal=true;i=k;}}
 const value=Number(s.slice(start,i));
 let j=i;while(j<n&&isSpace(s[j]))j++;
 return{value,rc:j===n?(isReal?2:1):(isReal?-1:0)};
}
// sqlite3Atoi64 on a prefix (CAST AS INTEGER, integer arguments).
function atoi(s:string):number{
 let i=0;while(isSpace(s[i]))i++;
 const neg=s[i]==='-';if(s[i]==='+'||s[i]==='-')i++;
 const start=i;while(isDigit(s[i]))i++;
 if(i===start)return 0;
 const v=Number(s.slice(start,i));return neg?-v:v;
}
const finiteInt=(v:number)=>Number.isNaN(v)?0:v>=9223372036854775807?9223372036854775807:v<=-9223372036854775808?-9223372036854775808:Math.trunc(v);
function intValue(c:Cell):number{
 if(c.kind==='null')return 0;
 if(c.kind==='text')return finiteInt(atoi(str(c)));
 return finiteInt(num(c));
}
function realValue(c:Cell):number{
 if(c.kind==='null')return 0;
 if(c.kind==='text')return atof(str(c)).value;
 return num(c);
}
function truth(c:Cell):boolean|null{
 if(c.kind==='null')return null;
 return realValue(c)!==0;
}
// Arithmetic operand conversion (computeNumericType): '12abc' -> 12, '3.5x' -> 3.5, 'abc' -> 0.
function numeric(c:Cell):Cell{
 if(c.kind!=='text')return c;
 const {value,rc}=atof(str(c));
 return rc===0||rc===1?int(value):real(value);
}
// NUMERIC affinity (comparisons, column storage): only text that is entirely a number converts.
function numericAffinity(c:Cell):Cell{
 if(c.kind!=='text')return c;
 const {value,rc}=atof(str(c));
 if(rc<=0)return c;
 return rc===1?int(value):real(value);
}
// SQLite renders REAL with "%!.15g": 15 significant digits, always a decimal point, 2+ digit exponent.
function formatReal(r:number):string{
 if(!Number.isFinite(r))return Number.isNaN(r)?'':r<0?'-Inf':'Inf';
 if(r===0)return '0.0';
 const sign=r<0?'-':'';
 const [mantissa,expText]=Math.abs(r).toExponential(14).split('e');
 const exp=Number(expText);
 const digits=mantissa.replace('.','').replace(/0+$/,'');
 if(exp<-4||exp>14){
  const e=Math.abs(exp);
  return `${sign}${digits[0]}.${digits.slice(1)||'0'}e${exp<0?'-':'+'}${e<10?'0':''}${e}`;
 }
 if(exp<0)return `${sign}0.${'0'.repeat(-exp-1)}${digits}`;
 return `${sign}${digits.slice(0,exp+1).padEnd(exp+1,'0')}.${digits.slice(exp+1)||'0'}`;
}
function cellText(c:Cell):string{
 if(c.kind==='null')return '';
 if(c.kind==='real')return formatReal(num(c));
 return String(c.value);
}
const asciiLower=(s:string)=>s.replace(/[A-Z]+/g,m=>m.toLowerCase());
const asciiUpper=(s:string)=>s.replace(/[a-z]+/g,m=>m.toUpperCase());
// UTF-16 code units remapped so comparison follows code point (= UTF-8 byte, SQLite BINARY) order.
const fixUnit=(u:number)=>u>=0xd800?(u<=0xdfff?u+0x2000:u-0x800):u;
function compareText(a:string,b:string,coll:Coll):number{
 if(coll==='NOCASE'){a=asciiLower(a);b=asciiLower(b);}
 else if(coll==='RTRIM'){a=a.replace(/ +$/,'');b=b.replace(/ +$/,'');}
 const n=Math.min(a.length,b.length);
 for(let i=0;i<n;i++){const x=a.charCodeAt(i),y=b.charCodeAt(i);if(x!==y)return fixUnit(x)<fixUnit(y)?-1:1;}
 return a.length===b.length?0:a.length<b.length?-1:1;
}
const rank=(c:Cell)=>c.kind==='null'?0:c.kind==='text'?2:1;
// Storage-class order: NULL < INTEGER/REAL < TEXT.
function compareCells(a:Cell,b:Cell,coll:Coll):number{
 const ra=rank(a),rb=rank(b);
 if(ra!==rb)return ra<rb?-1:1;
 if(ra===0)return 0;
 if(ra===1){const x=num(a),y=num(b);return x<y?-1:x>y?1:0;}
 return compareText(str(a),str(b),coll);
}
const keyOf=(c:Cell)=>c.kind==='null'?'N':c.kind==='text'?`t${str(c)}`:`n${String(c.value)}`;
const isNumAff=(a:Aff)=>a==='INTEGER'||a==='REAL'||a==='NUMERIC';
function exprAff(e:Expr):Aff{
 if(e.k==='ref'||e.k==='cast')return e.aff;
 if(e.k==='collate')return exprAff(e.e);
 return null;
}
function compareAff(a:Aff,b:Aff):Aff{
 if(a!==null&&b!==null)return isNumAff(a)||isNumAff(b)?'NUMERIC':null;
 return a??b;
}
function applyAff(c:Cell,aff:Aff):Cell{
 if(aff===null||c.kind==='null')return c;
 if(aff==='TEXT')return c.kind==='text'?c:textCell(cellText(c));
 return numericAffinity(c);
}
function explicitColl(e:Expr):Coll|null{
 if(e.k==='collate')return e.coll;
 if(e.k==='cast'||(e.k==='un'&&e.op==='+'))return explicitColl(e.e);
 return null;
}
const collOf=(l:Expr,r:Expr):Coll=>explicitColl(l)??explicitColl(r)??'BINARY';
const cmpNode=(op:string,l:Expr,r:Expr):Expr=>({k:'cmp',op,l,r,aff:compareAff(exprAff(l),exprAff(r)),coll:collOf(l,r)});
function typeAffinity(type:string):Aff{
 const u=type.toUpperCase();
 if(u.includes('INT'))return 'INTEGER';
 if(u.includes('CHAR')||u.includes('CLOB')||u.includes('TEXT'))return 'TEXT';
 if(u===''||u.includes('BLOB'))return null;
 if(u.includes('REAL')||u.includes('FLOA')||u.includes('DOUB'))return 'REAL';
 return 'NUMERIC';
}
function storeCell(v:unknown,type:SqlColumnType):Cell{
 if(typeof v==='boolean')v=v?1:0;
 if(typeof v==='number'){
  if(Number.isNaN(v))return NULL;
  if(type==='REAL')return real(v);
  const cell=Number.isSafeInteger(v)?int(v):real(v);
  return type==='TEXT'?textCell(cellText(cell)):cell;
 }
 if(typeof v==='string'){
  if(type==='TEXT')return textCell(v);
  const n=numericAffinity(textCell(v));
  if(n.kind==='text')return n;
  if(type==='REAL')return real(num(n));
  return Number.isSafeInteger(num(n))?int(num(n)):n;
 }
 return NULL;
}

// ---------- tokenizer ----------
type Tok={t:'num'|'str'|'id'|'word'|'op'|'err'|'eof';s:number;e:number;text:string;v:string;up:string;cell:Cell|null};
const idStart=(c:number)=>(c>=65&&c<=90)||(c>=97&&c<=122)||c===95||c>=0x80;
const idChar=(c:number)=>idStart(c)||(c>=48&&c<=57)||c===36;
const isHex=(c:number)=>(c>=48&&c<=57)||(c>=65&&c<=70)||(c>=97&&c<=102);
const TWO_CHAR_OPS=new Set(['||','<=','>=','<>','!=','==','<<','>>']);
function tokenize(src:string):Tok[]{
 const out:Tok[]=[];const n=src.length;let i=0;
 const push=(t:Tok['t'],s:number,e:number,v:string,cell:Cell|null=null)=>{out.push({t,s,e,text:src.slice(s,e),v,up:t==='word'?v.toUpperCase():'',cell});};
 const stop=(s:number,message:string)=>{push('err',s,n,message);push('eof',n,n,'');return out;};
 while(i<n){
  const c=src.charCodeAt(i),s=i;
  if(c===32||(c>=9&&c<=13)){i++;continue;}
  if(c===45&&src.charCodeAt(i+1)===45){const j=src.indexOf('\n',i);i=j<0?n:j+1;continue;}
  if(c===47&&src.charCodeAt(i+1)===42){const j=src.indexOf('*/',i+2);i=j<0?n:j+2;continue;}
  if(isDigit(src[i])||(c===46&&isDigit(src[i+1]))){
   let cell:Cell;
   if(c===48&&(src[i+1]==='x'||src[i+1]==='X')&&isHex(src.charCodeAt(i+2))){
    i+=2;while(i<n&&isHex(src.charCodeAt(i)))i++;
    const hex=src.slice(s+2,i);
    if(hex.length>16)return stop(s,`hex literal too big: ${src.slice(s,i)}`);
    cell=int(Number(BigInt.asIntN(64,BigInt(`0x${hex}`))));
   }else{
    let isReal=false;
    while(isDigit(src[i]))i++;
    if(src[i]==='.'){isReal=true;i++;while(isDigit(src[i]))i++;}
    if((src[i]==='e'||src[i]==='E')&&(isDigit(src[i+1])||((src[i+1]==='+'||src[i+1]==='-')&&isDigit(src[i+2])))){isReal=true;i+=2;while(isDigit(src[i]))i++;}
    const value=Number(src.slice(s,i));
    cell=isReal?real(value):int(value);
   }
   if(i<n&&idChar(src.charCodeAt(i))){while(i<n&&idChar(src.charCodeAt(i)))i++;return stop(s,`unrecognized token: "${src.slice(s,i)}"`);}
   push('num',s,i,'',cell);continue;
  }
  if(c===39||c===34||c===96){
   const q=src[i];let value='';let j=i+1;
   for(;;){
    const k=src.indexOf(q,j);
    if(k<0)return stop(s,`unrecognized token: "${src.slice(s)}"`);
    value+=src.slice(j,k);
    if(src[k+1]===q){value+=q;j=k+2;continue;}
    i=k+1;break;
   }
   push(c===39?'str':'id',s,i,value);continue;
  }
  if(c===91){
   const k=src.indexOf(']',i+1);
   if(k<0)return stop(s,`unrecognized token: "${src.slice(s)}"`);
   i=k+1;push('id',s,i,src.slice(s+1,k));continue;
  }
  if(idStart(c)){while(i<n&&idChar(src.charCodeAt(i)))i++;push('word',s,i,src.slice(s,i));continue;}
  const two=src.slice(i,i+2);
  if(TWO_CHAR_OPS.has(two)){i+=2;push('op',s,i,two);continue;}
  if('=<>+-*/%(),.;&|~'.includes(src[i])){i++;push('op',s,i,src[s]);continue;}
  if('?:@$'.includes(src[i]))return stop(s,'query parameters (?, :name, @name, $name) are not supported in this simulator');
  return stop(s,`unrecognized token: "${src[i]}"`);
 }
 push('eof',n,n,'');
 return out;
}

// ---------- parser ----------
const RESERVED=new Set('ALL AND AS ASC BETWEEN BY CASE CAST COLLATE CROSS DESC DISTINCT ELSE END ESCAPE EXCEPT EXISTS FILTER FROM FULL GLOB GROUP HAVING IN INNER INTERSECT IS ISNULL JOIN LEFT LIKE LIMIT MATCH NATURAL NOT NOTNULL NULL OFFSET ON OR ORDER OUTER OVER REGEXP RIGHT SELECT THEN UNION USING WHEN WHERE WINDOW'.split(' '));
const WRITES=new Set(['INSERT','UPDATE','DELETE','REPLACE','CREATE','DROP','ALTER','VACUUM','REINDEX']);
const UNSUPPORTED=new Set(['PRAGMA','ATTACH','DETACH','BEGIN','COMMIT','END','ROLLBACK','SAVEPOINT','RELEASE','ANALYZE','EXPLAIN','WITH','VALUES']);
const COLLATIONS=new Set<string>(['BINARY','NOCASE','RTRIM']);

function children(e:Expr):Expr[]{
 switch(e.k){
  case 'un':case 'isnull':case 'truth':case 'cast':case 'collate':return [e.e];
  case 'and':case 'or':case 'bin':case 'cmp':return [e.l,e.r];
  case 'in':return [e.e,...e.list];
  case 'between':return [e.e,e.lo,e.hi];
  case 'like':return e.esc?[e.e,e.pat,e.esc]:[e.e,e.pat];
  case 'case':return [...(e.base?[e.base]:[]),...e.whens.flatMap(w=>[w.w,w.t]),...(e.els?[e.els]:[])];
  case 'fn':case 'call':return e.args;
  default:return [];
 }
}
function checkDepth(e:Expr,depth:number){
 if(depth>LIMITS.depth)throw parseErr(`Expression tree is too large (maximum depth ${LIMITS.depth})`);
 for(const child of children(e))checkDepth(child,depth+1);
}
const hasAgg=(e:Expr):boolean=>e.k==='agg'||children(e).some(hasAgg);

class Parser{
 readonly toks:Tok[];readonly src:string;i=0;nest=0;
 constructor(toks:Tok[],src:string){this.toks=toks;this.src=src;}
 peek(offset=0):Tok{return this.toks[Math.min(this.i+offset,this.toks.length-1)];}
 next():Tok{const t=this.peek();if(t.t!=='eof'&&t.t!=='err')this.i++;return t;}
 isOp(v:string,offset=0){const t=this.peek(offset);return t.t==='op'&&t.v===v;}
 eatOp(v:string){if(!this.isOp(v))return false;this.i++;return true;}
 expectOp(v:string){if(!this.eatOp(v))this.fail();}
 isWord(up:string,offset=0){const t=this.peek(offset);return t.t==='word'&&t.up===up;}
 eatWord(up:string){if(!this.isWord(up))return false;this.i++;return true;}
 expectWord(up:string){if(!this.eatWord(up))this.fail();}
 atEnd(){return this.peek().t==='eof';}
 isName(t:Tok){return t.t==='id'||t.t==='str'||(t.t==='word'&&!RESERVED.has(t.up));}
 name():string{const t=this.peek();if(!this.isName(t))this.fail();this.i++;return t.v;}
 enter(){if(++this.nest>LIMITS.nesting)throw parseErr('parser stack overflow');}
 fail(t=this.peek()):never{
  if(t.t==='err')throw parseErr(t.v);
  if(t.t==='eof')throw parseErr('incomplete input');
  throw parseErr(`near "${t.text}": syntax error`);
 }
 skipStatement(){while(!this.atEnd()&&!this.isOp(';')){if(this.peek().t==='err')this.fail();this.i++;}}
 statement():Select{
  const t=this.peek();
  if(t.t==='word'&&t.up==='SELECT'){
   const q=this.select();
   if(!this.atEnd()&&!this.isOp(';'))this.fail();
   for(const col of q.cols)if(!col.star)checkDepth(col.expr,1);
   for(const e of [q.where,q.having,q.limit,q.offset,...q.group,...q.order.map(o=>o.e),...q.joins.map(j=>j.on)])if(e)checkDepth(e,1);
   return q;
  }
  if(t.t==='word'&&WRITES.has(t.up)){this.skipStatement();throw runErr('attempt to write a readonly database (8)');}
  if(t.t==='word'&&UNSUPPORTED.has(t.up)){this.skipStatement();throw parseErr(`${t.up} is not supported in this simulator; only SELECT queries can run`);}
  return this.fail();
 }
 select():Select{
  this.expectWord('SELECT');
  const distinct=this.eatWord('DISTINCT');if(!distinct)this.eatWord('ALL');
  const q:Select={distinct,cols:[],from:null,joins:[],where:null,group:[],having:null,order:[],limit:null,offset:null};
  do q.cols.push(this.resultColumn());while(this.eatOp(','));
  if(this.eatWord('FROM'))this.from(q);
  if(this.eatWord('WHERE'))q.where=this.expr();
  if(this.eatWord('GROUP')){this.expectWord('BY');do q.group.push(this.expr());while(this.eatOp(','));}
  if(this.eatWord('HAVING'))q.having=this.expr();
  if(this.eatWord('ORDER')){
   this.expectWord('BY');
   do{
    const e=this.expr();const desc=this.eatWord('DESC');if(!desc)this.eatWord('ASC');
    let nulls:OrderTerm['nulls']=null;
    if(this.eatWord('NULLS')){if(this.eatWord('FIRST'))nulls='first';else{this.expectWord('LAST');nulls='last';}}
    q.order.push({e,desc,nulls});
   }while(this.eatOp(','));
  }
  if(this.eatWord('LIMIT')){
   q.limit=this.expr();
   if(this.eatWord('OFFSET'))q.offset=this.expr();
   else if(this.eatOp(',')){q.offset=q.limit;q.limit=this.expr();}
  }
  const t=this.peek();
  if(t.t==='word'&&(t.up==='UNION'||t.up==='INTERSECT'||t.up==='EXCEPT'))throw parseErr(`${t.up} is not supported in this simulator`);
  return q;
 }
 resultColumn():ResultCol{
  const t=this.peek();
  if(this.eatOp('*'))return{star:true,table:null};
  if((t.t==='id'||(t.t==='word'&&!RESERVED.has(t.up)))&&this.isOp('.',1)&&this.isOp('*',2)){this.i+=3;return{star:true,table:t.v};}
  const expr=this.expr();
  const span=this.src.slice(t.s,this.toks[this.i-1].e);
  let alias:string|null=null;
  if(this.eatWord('AS'))alias=this.name();
  else if(this.isName(this.peek()))alias=this.name();
  return{star:false,expr,alias,span};
 }
 tableRef():TableRef{
  if(this.isOp('('))throw parseErr('subqueries are not supported in this simulator');
  let name=this.name();
  if(this.eatOp('.')){
   if(name.toLowerCase()!=='main')throw parseErr(`unknown database ${name}`);
   name=this.name();
  }
  let alias:string|null=null;
  if(this.eatWord('AS'))alias=this.name();
  else if(this.isName(this.peek()))alias=this.name();
  return{name,alias};
 }
 from(q:Select){
  q.from=this.tableRef();
  for(;;){
   let kind:JoinClause['kind']='inner';let natural=false;
   if(this.eatOp(','))kind='cross';
   else{
    natural=this.eatWord('NATURAL');
    if(this.eatWord('LEFT')){this.eatWord('OUTER');kind='left';}
    else if(this.eatWord('INNER'))kind='inner';
    else if(this.eatWord('CROSS'))kind='cross';
    else if(this.isWord('RIGHT')||this.isWord('FULL'))throw parseErr('RIGHT and FULL OUTER JOIN are not supported in this simulator');
    else if(!natural&&!this.isWord('JOIN'))return;
    this.expectWord('JOIN');
   }
   const table=this.tableRef();let on:Expr|null=null,using:string[]|null=null;
   if(this.eatWord('ON'))on=this.expr();
   else if(this.eatWord('USING')){this.expectOp('(');using=[];do using.push(this.name());while(this.eatOp(','));this.expectOp(')');}
   q.joins.push({kind,natural,table,on,using});
  }
 }
 expr():Expr{this.enter();const e=this.or();this.nest--;return e;}
 or():Expr{let l=this.and();while(this.eatWord('OR'))l={k:'or',l,r:this.and()};return l;}
 and():Expr{let l=this.not();while(this.eatWord('AND'))l={k:'and',l,r:this.not()};return l;}
 not():Expr{
  if(!this.eatWord('NOT'))return this.equality();
  this.enter();const e=this.not();this.nest--;
  return{k:'un',op:'NOT',e};
 }
 equality():Expr{
  let l=this.relational();
  for(;;){
   const t=this.peek();
   if(t.t==='op'&&(t.v==='='||t.v==='=='||t.v==='!='||t.v==='<>')){this.i++;l=cmpNode(t.v==='=='?'=':t.v==='<>'?'!=':t.v,l,this.relational());continue;}
   if(t.t!=='word')return l;
   if(t.up==='ISNULL'||t.up==='NOTNULL'){this.i++;l={k:'isnull',e:l,not:t.up==='NOTNULL'};continue;}
   if(t.up==='IS'){
    this.i++;let not=this.eatWord('NOT');
    if(this.eatWord('DISTINCT')){this.expectWord('FROM');not=!not;}
    else{
     const v=this.peek();
     if(v.t==='word'&&(v.up==='TRUE'||v.up==='FALSE')&&!this.isOp('.',1)&&!this.isOp('(',1)){this.i++;l={k:'truth',e:l,not,val:v.up==='TRUE'};continue;}
    }
    l=cmpNode(not?'ISNOT':'IS',l,this.relational());continue;
   }
   let not=false;
   if(t.up==='NOT'){
    const after=this.peek(1).up;
    if(after==='NULL'){this.i+=2;l={k:'isnull',e:l,not:true};continue;}
    if(!['IN','BETWEEN','LIKE','GLOB','REGEXP','MATCH'].includes(after))return l;
    this.i++;not=true;
   }
   const op=this.peek().up;
   if(op==='IN'){
    this.i++;this.expectOp('(');
    if(this.isWord('SELECT'))throw parseErr('subqueries are not supported in this simulator');
    const list:Expr[]=[];
    if(!this.eatOp(')')){do list.push(this.expr());while(this.eatOp(','));this.expectOp(')');}
    l={k:'in',e:l,list,not,aff:null,coll:'BINARY'};continue;
   }
   if(op==='BETWEEN'){
    this.i++;const lo=this.relational();this.expectWord('AND');const hi=this.relational();
    l={k:'between',e:l,lo,hi,not,aff:[null,null],coll:['BINARY','BINARY']};continue;
   }
   if(op==='LIKE'){
    this.i++;const pat=this.relational();const esc=this.eatWord('ESCAPE')?this.bitwise():null;
    l={k:'like',e:l,pat,esc,not};continue;
   }
   if(op==='GLOB'||op==='REGEXP'||op==='MATCH')throw parseErr(`${op} is not supported in this simulator`);
   return l;
  }
 }
 relational():Expr{
  let l=this.bitwise();
  for(;;){const t=this.peek();if(t.t!=='op'||!['<','<=','>','>='].includes(t.v))return l;this.i++;l=cmpNode(t.v,l,this.bitwise());}
 }
 binaryLevel(ops:string[],next:()=>Expr):Expr{
  let l=next();
  for(;;){const t=this.peek();if(t.t!=='op'||!ops.includes(t.v))return l;this.i++;l={k:'bin',op:t.v,l,r:next()};}
 }
 bitwise():Expr{return this.binaryLevel(['&','|','<<','>>'],()=>this.additive());}
 additive():Expr{return this.binaryLevel(['+','-'],()=>this.multiplicative());}
 multiplicative():Expr{return this.binaryLevel(['*','/','%'],()=>this.concat());}
 concat():Expr{return this.binaryLevel(['||'],()=>this.collate());}
 collate():Expr{
  let e=this.unary();
  while(this.eatWord('COLLATE')){
   const t=this.peek();if(t.t!=='word'&&t.t!=='id')this.fail();this.i++;
   const coll=t.v.toUpperCase();
   if(!COLLATIONS.has(coll))throw parseErr(`no such collation sequence: ${t.v}`);
   e={k:'collate',e,coll:coll as Coll};
  }
  return e;
 }
 unary():Expr{
  const t=this.peek();
  if(t.t==='op'&&(t.v==='-'||t.v==='+'||t.v==='~')){this.i++;this.enter();const e=this.unary();this.nest--;return{k:'un',op:t.v,e};}
  return this.primary();
 }
 primary():Expr{
  const t=this.peek();
  if(t.t==='num'){this.i++;return{k:'lit',v:t.cell??NULL};}
  if(t.t==='str'){this.i++;return{k:'lit',v:textCell(t.v)};}
  if(t.t==='op'&&t.v==='('){
   this.i++;
   if(this.isWord('SELECT'))throw parseErr('subqueries are not supported in this simulator');
   const e=this.expr();
   if(this.isOp(','))throw parseErr('row value misused');
   this.expectOp(')');return e;
  }
  if(t.t==='id')return this.nameOrCall();
  if(t.t!=='word')return this.fail();
  if(t.up==='NULL'){this.i++;return{k:'lit',v:NULL};}
  if(t.up==='CASE')return this.caseExpr();
  if(t.up==='CAST')return this.castExpr();
  if(t.up==='EXISTS')throw parseErr('subqueries are not supported in this simulator');
  if(RESERVED.has(t.up))return this.fail();
  return this.nameOrCall();
 }
 nameOrCall():Expr{
  const t=this.next();
  if(this.eatOp('(')){
   let star=false,distinct=false;const args:Expr[]=[];
   if(this.eatOp('*'))star=true;
   else if(!this.isOp(')')){distinct=this.eatWord('DISTINCT');if(!distinct)this.eatWord('ALL');do args.push(this.expr());while(this.eatOp(','));}
   this.expectOp(')');
   if(this.isWord('FILTER')||this.isWord('OVER'))throw parseErr('window functions and FILTER are not supported in this simulator');
   return{k:'fn',name:t.v,args,star,distinct};
  }
  if(this.eatOp('.')){
   let table=t.v;let c=this.peek();
   if(c.t!=='id'&&c.t!=='word')this.fail();
   this.i++;
   if(this.eatOp('.')){
    if(table.toLowerCase()!=='main')throw parseErr(`no such column: ${table}.${c.v}`);
    table=c.v;c=this.peek();
    if(c.t!=='id'&&c.t!=='word')this.fail();
    this.i++;
   }
   return{k:'name',table,name:c.v,quote:c.t==='id'?c.text[0]:''};
  }
  return{k:'name',table:null,name:t.v,quote:t.t==='id'?t.text[0]:''};
 }
 caseExpr():Expr{
  this.i++;
  const base=this.isWord('WHEN')?null:this.expr();
  const whens:{w:Expr;t:Expr;aff:Aff;coll:Coll}[]=[];
  while(this.eatWord('WHEN')){const w=this.expr();this.expectWord('THEN');whens.push({w,t:this.expr(),aff:null,coll:'BINARY'});}
  if(!whens.length)this.fail();
  const els=this.eatWord('ELSE')?this.expr():null;
  this.expectWord('END');
  return{k:'case',base,whens,els};
 }
 castExpr():Expr{
  this.i++;this.expectOp('(');
  const e=this.expr();this.expectWord('AS');
  const words:string[]=[];
  while(this.isName(this.peek())&&this.peek().t!=='str')words.push(this.next().v);
  if(this.eatOp('(')){
   do{this.eatOp('-');this.eatOp('+');if(this.peek().t!=='num')this.fail();this.i++;}while(this.eatOp(','));
   this.expectOp(')');
  }
  this.expectOp(')');
  return{k:'cast',e,aff:typeAffinity(words.join(' '))};
 }
}

// ---------- evaluation ----------
type Source={key:string;cols:{name:string;lname:string;aff:Aff}[];hidden:Set<number>;rows:Cell[][]};
type Ctx={rows:(Cell[]|null)[];aggs:Cell[]|null};
type AggSpec={fn:AggFn;args:Expr[];distinct:boolean;coll:Coll};
type AggState={n:number;isum:number;rsum:number;rerr:number;approx:boolean;overflow:boolean;best:Cell|null;text:string|null;seen:Set<string>};
// aggMode decides which SQLite message an aggregate gets where it is not allowed.
type Scope={sources:Source[];count:number;aliases:Map<string,Expr>|null;aggMode:'allow'|'misuse'|'function'|'group';aggs:AggSpec[];inAgg:boolean};
type OrderKey={col:number;e:Expr|null;coll:Coll;desc:boolean;nulls:'first'|'last'|null};
type OutRow={cells:Cell[];keys:Cell[]};
const AGG_ARITY=new Map<string,[number,number]>([['count',[0,1]],['sum',[1,1]],['total',[1,1]],['avg',[1,1]],['min',[1,1]],['max',[1,1]],['group_concat',[1,2]],['string_agg',[2,2]]]);
const SCALAR_ARITY=new Map<string,[number,number]>([['abs',[1,1]],['round',[1,2]],['upper',[1,1]],['lower',[1,1]],['length',[1,1]],['substr',[2,3]],['substring',[2,3]],['trim',[1,2]],['ltrim',[1,2]],['rtrim',[1,2]],['replace',[3,3]],['coalesce',[2,Infinity]],['ifnull',[2,2]],['nullif',[2,2]],['instr',[2,2]],['typeof',[1,1]],['iif',[3,3]],['min',[2,Infinity]],['max',[2,Infinity]]]);
const nth=(n:number)=>{const t=n%100;return `${n}${t>=11&&t<=13?'th':['th','st','nd','rd'][n%10]??'th'}`;};
function ordinal(e:Expr):number|null{
 if(e.k==='lit'&&e.v.kind==='integer')return num(e.v);
 if(e.k==='un'&&(e.op==='-'||e.op==='+')&&e.e.k==='lit'&&e.e.v.kind==='integer')return e.op==='-'?-num(e.e.v):num(e.e.v);
 return null;
}

class Runner{
 work=0;
 readonly maxWork:number;readonly maxRows:number;
 readonly tables=new Map<string,SqlTable>();
 readonly cells=new Map<SqlTable,Cell[][]>();
 constructor(db:SqlDatabase,maxWork:number,maxRows:number){
  this.maxWork=maxWork;this.maxRows=maxRows;
  for(const table of db?.tables??[]){const key=String(table.name).toLowerCase();if(!this.tables.has(key))this.tables.set(key,table);}
 }
 tick(amount=1){
  this.work+=amount;
  if(this.work>this.maxWork)throw runErr('interrupted (query is too expensive for this simulator)');
 }
 text(s:string):Cell{
  if(s.length>LIMITS.text)throw runErr('string or blob too big (18)');
  this.tick(s.length>>6);
  return textCell(s);
 }
 source(ref:TableRef):Source{
  const table=this.tables.get(ref.name.toLowerCase());
  if(!table)throw parseErr(`no such table: ${ref.name}`);
  let rows=this.cells.get(table);
  if(!rows){rows=table.rows.map(row=>table.columns.map((c,i)=>storeCell(row[i],c.type)));this.cells.set(table,rows);}
  return{key:(ref.alias??ref.name).toLowerCase(),cols:table.columns.map(c=>({name:c.name,lname:c.name.toLowerCase(),aff:c.type})),hidden:new Set<number>(),rows};
 }

 // ----- name resolution (prepare-time errors are "Parse error") -----
 bind(e:Expr,s:Scope):Expr{
  switch(e.k){
   case 'lit':case 'ref':case 'agg':case 'call':return e;
   case 'name':return this.resolve(e,s);
   case 'un':return{k:'un',op:e.op,e:this.bind(e.e,s)};
   case 'and':case 'or':return{k:e.k,l:this.bind(e.l,s),r:this.bind(e.r,s)};
   case 'bin':return{k:'bin',op:e.op,l:this.bind(e.l,s),r:this.bind(e.r,s)};
   case 'cmp':return cmpNode(e.op,this.bind(e.l,s),this.bind(e.r,s));
   case 'isnull':return{k:'isnull',e:this.bind(e.e,s),not:e.not};
   case 'truth':return{k:'truth',e:this.bind(e.e,s),not:e.not,val:e.val};
   case 'in':{const x=this.bind(e.e,s);return{k:'in',e:x,list:e.list.map(i=>this.bind(i,s)),not:e.not,aff:exprAff(x),coll:explicitColl(x)??'BINARY'};}
   case 'between':{
    const x=this.bind(e.e,s),lo=this.bind(e.lo,s),hi=this.bind(e.hi,s);
    return{k:'between',e:x,lo,hi,not:e.not,aff:[compareAff(exprAff(x),exprAff(lo)),compareAff(exprAff(x),exprAff(hi))],coll:[collOf(x,lo),collOf(x,hi)]};
   }
   case 'like':return{k:'like',e:this.bind(e.e,s),pat:this.bind(e.pat,s),esc:e.esc?this.bind(e.esc,s):null,not:e.not};
   case 'case':{
    const base=e.base?this.bind(e.base,s):null;
    return{k:'case',base,whens:e.whens.map(w=>{const x=this.bind(w.w,s);return{w:x,t:this.bind(w.t,s),aff:base?compareAff(exprAff(base),exprAff(x)):null,coll:base?collOf(base,x):'BINARY'};}),els:e.els?this.bind(e.els,s):null};
   }
   case 'cast':return{k:'cast',e:this.bind(e.e,s),aff:e.aff};
   case 'collate':return{k:'collate',e:this.bind(e.e,s),coll:e.coll};
   case 'fn':return this.bindFunction(e,s);
  }
 }
 resolve(e:{table:string|null;name:string;quote:string},s:Scope):Expr{
  const lname=e.name.toLowerCase();
  let found:Expr|null=null,count=0;
  const qualified=e.table===null?null:e.table.toLowerCase();
  for(let si=0;si<s.count;si++){
   const src=s.sources[si];
   if(qualified!==null&&src.key!==qualified)continue;
   for(let ci=0;ci<src.cols.length;ci++){
    const col=src.cols[ci];
    if(col.lname!==lname||(qualified===null&&src.hidden.has(ci)))continue;
    count++;
    if(!found)found={k:'ref',src:si,col:ci,aff:col.aff};
   }
  }
  const label=e.table===null?e.name:`${e.table}.${e.name}`;
  if(count>1)throw parseErr(`ambiguous column name: ${label}`);
  if(found)return found;
  if(qualified===null){
   const alias=s.aliases?.get(lname);
   if(alias)return this.bind(alias,{...s,aliases:null});
   if(e.quote===''&&(lname==='true'||lname==='false'))return{k:'lit',v:int(lname==='true'?1:0)};
   if(e.quote==='"')throw parseErr(`no such column: "${e.name}" - should this be a string literal in single-quotes?`);
  }
  throw parseErr(`no such column: ${label}`);
 }
 bindFunction(e:{name:string;args:Expr[];star:boolean;distinct:boolean},s:Scope):Expr{
  const name=e.name.toLowerCase();const n=e.star?0:e.args.length;
  const aggArity=AGG_ARITY.get(name);
  if(aggArity&&!((name==='min'||name==='max')&&n!==1)){
   if(n<aggArity[0]||n>aggArity[1]||(e.star&&name!=='count'))throw parseErr(`wrong number of arguments to function ${e.name}()`);
   if(s.inAgg||s.aggMode==='function')throw parseErr(`misuse of aggregate function ${e.name}()`);
   if(e.distinct&&n!==1)throw parseErr('DISTINCT aggregates must have exactly one argument');
   const args=e.star?[]:e.args.map(a=>this.bind(a,{...s,inAgg:true}));
   // SQLite reports these two only after the arguments resolved, so nested misuse wins.
   if(s.aggMode==='misuse')throw parseErr(`misuse of aggregate: ${e.name}()`);
   if(s.aggMode==='group')throw parseErr('aggregate functions are not allowed in the GROUP BY clause');
   s.aggs.push({fn:(name==='string_agg'?'group_concat':name) as AggFn,args,distinct:e.distinct,coll:args.length?explicitColl(args[0])??'BINARY':'BINARY'});
   return{k:'agg',i:s.aggs.length-1};
  }
  const arity=SCALAR_ARITY.get(name);
  if(!arity)throw parseErr(`no such function: ${e.name}`);
  if(e.star||n<arity[0]||n>arity[1])throw parseErr(`wrong number of arguments to function ${e.name}()`);
  const args=e.args.map(a=>this.bind(a,s));
  return{k:'call',fn:name,args,coll:args.map(explicitColl).find(c=>c!==null)??'BINARY'};
 }

 // ----- SELECT -----
 select(q:Select):SqlResult{
  const refs=q.from?[q.from,...q.joins.map(j=>j.table)]:[];
  const sources=refs.map(r=>this.source(r));
  const conds:(Expr|null)[]=sources.map(()=>null);
  const kinds:JoinClause['kind'][]=sources.map(()=>'inner');
  q.joins.forEach((join,index)=>{
   const r=index+1;kinds[r]=join.kind;
   const visible=(ln:string)=>sources.slice(0,r).some(src=>src.cols.some((c,ci)=>c.lname===ln&&!src.hidden.has(ci)));
   const using=join.natural?sources[r].cols.filter(c=>visible(c.lname)).map(c=>c.name):join.using;
   for(const name of using??[]){
    const ln=name.toLowerCase();
    const rc=sources[r].cols.findIndex(c=>c.lname===ln);
    let left:Expr|null=null;
    for(let si=0;si<r&&!left;si++){const lc=sources[si].cols.findIndex((c,ci)=>c.lname===ln&&!sources[si].hidden.has(ci));if(lc>=0)left={k:'ref',src:si,col:lc,aff:sources[si].cols[lc].aff};}
    if(rc<0||!left)throw parseErr(`cannot join using column ${name} - column not present in both tables`);
    const eq=cmpNode('=',left,{k:'ref',src:r,col:rc,aff:sources[r].cols[rc].aff});
    const prev=conds[r];conds[r]=prev?{k:'and',l:prev,r:eq}:eq;
    sources[r].hidden.add(rc);
   }
  });

  const aggs:AggSpec[]=[];
  const base:Scope={sources,count:sources.length,aliases:null,aggMode:'allow',aggs,inAgg:false};
  const out:{e:Expr;name:string}[]=[];
  const aliasIndex=new Map<string,number>(),aliases=new Map<string,Expr>();
  for(const col of q.cols){
   if(col.star){
    if(col.table===null&&!sources.length)throw parseErr('no tables specified');
    const wanted=col.table===null?null:col.table.toLowerCase();
    if(wanted!==null&&!sources.some(src=>src.key===wanted))throw parseErr(`no such table: ${col.table}`);
    sources.forEach((src,si)=>{
     if(wanted!==null&&src.key!==wanted)return;
     src.cols.forEach((c,ci)=>{if(wanted===null&&src.hidden.has(ci))return;out.push({e:{k:'ref',src:si,col:ci,aff:c.aff},name:c.name});});
    });
    continue;
   }
   const e=this.bind(col.expr,base);
   if(col.alias!==null){const key=col.alias.toLowerCase();if(!aliases.has(key)){aliases.set(key,col.expr);aliasIndex.set(key,out.length);}}
   out.push({e,name:col.alias??(col.expr.k==='name'&&e.k==='ref'?sources[e.src].cols[e.col].name:col.span)});
  }
  const isAgg=q.group.length>0||aggs.length>0;
  let having:Expr|null=null;
  if(q.having){
   if(!isAgg)throw parseErr('HAVING clause on a non-aggregate query');
   having=this.bind(q.having,{...base,aliases});
  }
  const filterMode=isAgg?'misuse':'function';
  const where=q.where?this.bind(q.where,{...base,aliases,aggMode:filterMode}):null;
  q.joins.forEach((join,index)=>{
   if(!join.on)return;
   const cond=this.bind(join.on,{...base,count:index+2,aggMode:filterMode});
   const prev=conds[index+1];conds[index+1]=prev?{k:'and',l:prev,r:cond}:cond;
  });
  const order:OrderKey[]=q.order.map((term,ti)=>{
   const n=ordinal(term.e);
   if(n!==null){
    if(n<1||n>out.length)throw parseErr(`${nth(ti+1)} ORDER BY term out of range - should be between 1 and ${out.length}`);
    return{col:n-1,e:null,coll:explicitColl(out[n-1].e)??'BINARY',desc:term.desc,nulls:term.nulls};
   }
   if(term.e.k==='name'&&term.e.table===null){
    const i=aliasIndex.get(term.e.name.toLowerCase());
    if(i!==undefined)return{col:i,e:null,coll:explicitColl(out[i].e)??'BINARY',desc:term.desc,nulls:term.nulls};
   }
   const e=this.bind(term.e,{...base,aliases,aggMode:isAgg?'allow':'misuse'});
   return{col:-1,e,coll:explicitColl(e)??'BINARY',desc:term.desc,nulls:term.nulls};
  });
  const group=q.group.map((g,gi)=>{
   const n=ordinal(g);
   if(n===null)return this.bind(g,{...base,aliases,aggMode:'group'});
   if(n<1||n>out.length)throw parseErr(`${nth(gi+1)} GROUP BY term out of range - should be between 1 and ${out.length}`);
   if(hasAgg(out[n-1].e))throw parseErr('aggregate functions are not allowed in the GROUP BY clause');
   return out[n-1].e;
  });
  const limit=q.limit?this.limitValue(q.limit):-1;
  const offset=q.offset?Math.max(0,this.limitValue(q.offset)):0;

  // ----- scan (nested loops, LEFT JOIN emits a NULL row when nothing matched) -----
  const rows:OutRow[]=[];
  const cur:(Cell[]|null)[]=sources.map(()=>null);
  const ctx:Ctx={rows:cur,aggs:null};
  const emit=(c:Ctx)=>{const cells=out.map(o=>this.ev(o.e,c));rows.push({cells,keys:order.map(o=>o.e?this.ev(o.e,c):cells[o.col])});};
  type Group={key:Cell[];bare:(Cell[]|null)[];states:AggState[];fresh:boolean};
  const groups=new Map<string,Group>();let groupList:Group[]=[];
  const newGroup=(key:Cell[]):Group=>({key,bare:sources.map(()=>null),states:aggs.map(()=>({n:0,isum:0,rsum:0,rerr:0,approx:false,overflow:false,best:null,text:null,seen:new Set<string>()})),fresh:true});
  const visit=()=>{
   if(where&&truth(this.ev(where,ctx))!==true)return;
   if(!isAgg){emit(ctx);return;}
   const key=group.map(g=>this.ev(g,ctx));
   const id=JSON.stringify(key.map(keyOf));
   const found=groups.get(id);
   const g=found??newGroup(key);
   if(!found){groups.set(id,g);groupList.push(g);}
   // Bare columns: first row of the group, or the row picked by the last min()/max() (SQLite behaviour).
   let skip=!g.fresh;
   aggs.forEach((spec,i)=>{const skipped=this.step(spec,g.states[i],ctx);if(spec.fn==='min'||spec.fn==='max')skip=skipped;});
   if(!skip)g.bare=cur.slice();
   g.fresh=false;
  };
  const scan=(j:number)=>{
   if(j===sources.length){visit();return;}
   const cond=conds[j];let matched=false;
   for(const row of sources[j].rows){
    this.tick();cur[j]=row;
    if(cond&&truth(this.ev(cond,ctx))!==true)continue;
    matched=true;scan(j+1);
   }
   if(!matched&&kinds[j]==='left'){cur[j]=null;scan(j+1);}
   cur[j]=null;
  };
  scan(0);

  if(isAgg){
   if(!group.length&&!groupList.length)groupList.push(newGroup([]));
   if(group.length)groupList=groupList.slice().sort((a,b)=>{this.tick();for(let i=0;i<a.key.length;i++){const c=compareCells(a.key[i],b.key[i],'BINARY');if(c)return c;}return 0;});
   for(const g of groupList){
    const c:Ctx={rows:g.bare,aggs:aggs.map((spec,i)=>this.finish(spec,g.states[i]))};
    if(having&&truth(this.ev(having,c))!==true)continue;
    emit(c);
   }
  }
  let result=rows;
  if(q.distinct){const seen=new Set<string>();result=result.filter(r=>{const id=JSON.stringify(r.cells.map(keyOf));if(seen.has(id))return false;seen.add(id);return true;});}
  if(order.length)result=result.slice().sort((a,b)=>this.compareRows(a,b,order));
  result=result.slice(offset,limit<0?undefined:offset+limit);
  if(result.length>this.maxRows)throw runErr(`result has more than ${this.maxRows} rows; add a LIMIT`);
  return{columns:out.map(o=>o.name),rows:result.map(r=>r.cells.map(c=>({value:c.value,kind:c.kind})))};
 }
 compareRows(a:OutRow,b:OutRow,order:OrderKey[]):number{
  this.tick();
  for(let i=0;i<order.length;i++){
   const o=order[i],x=a.keys[i],y=b.keys[i];
   if(x.kind==='null'||y.kind==='null'){
    if(x.kind===y.kind)continue;
    const nullsFirst=o.nulls?o.nulls==='first':!o.desc;
    return (x.kind==='null')===nullsFirst?-1:1;
   }
   const c=compareCells(x,y,o.coll);
   if(c)return o.desc?-c:c;
  }
  return 0;
 }
 limitValue(e:Expr):number{
  const bound=this.bind(e,{sources:[],count:0,aliases:null,aggMode:'function',aggs:[],inAgg:false});
  const v=numericAffinity(this.ev(bound,{rows:[],aggs:null}));
  if(v.kind==='integer'||(v.kind==='real'&&Number.isInteger(num(v))))return num(v);
  throw runErr('datatype mismatch (20)');
 }

 // ----- aggregates -----
 step(spec:AggSpec,st:AggState,ctx:Ctx):boolean{
  const args=spec.args.map(a=>this.ev(a,ctx));
  const v=args[0];
  if(spec.distinct&&v.kind!=='null'){const id=keyOf(v);if(st.seen.has(id))return true;st.seen.add(id);}
  switch(spec.fn){
   case 'count':if(!args.length||v.kind!=='null')st.n++;return false;
   case 'min':case 'max':{
    if(v.kind==='null')return st.best!==null;
    if(st.best===null){st.best=v;return false;}
    const c=compareCells(st.best,v,spec.coll);
    if(spec.fn==='max'?c<0:c>0){st.best=v;return false;}
    return true;
   }
   case 'group_concat':{
    if(v.kind==='null')return false;
    const piece=(st.text===null?'':args.length>1?cellText(args[1]):',')+cellText(v);
    const joined=(st.text??'')+piece;
    if(joined.length>LIMITS.text)throw runErr('string or blob too big (18)');
    this.tick(piece.length>>6);
    st.text=joined;
    return false;
   }
   default:{
    if(v.kind==='null')return false;
    const t=numericAffinity(v);st.n++;
    const kbn=(r:number)=>{const s=st.rsum,sum=s+r;st.rerr+=Math.abs(s)>Math.abs(r)?(s-sum)+r:(r-sum)+s;st.rsum=sum;};
    if(!st.approx&&t.kind==='integer'){
     const next=st.isum+num(t);
     if(Number.isSafeInteger(next)){st.isum=next;return false;}
     st.overflow=true;
    }
    if(!st.approx){st.approx=true;st.rsum=st.isum;st.rerr=0;}
    if(t.kind!=='integer')st.overflow=false;
    kbn(t.kind==='integer'?num(t):realValue(t));
    return false;
   }
  }
 }
 finish(spec:AggSpec,st:AggState):Cell{
  const approx=()=>Number.isFinite(st.rerr)?st.rsum+st.rerr:st.rsum;
  switch(spec.fn){
   case 'count':return int(st.n);
   case 'min':case 'max':return st.best??NULL;
   case 'group_concat':return st.text===null?NULL:textCell(st.text);
   case 'total':return real(st.approx?approx():st.isum);
   case 'avg':return st.n?real((st.approx?approx():st.isum)/st.n):NULL;
   case 'sum':
    if(!st.n)return NULL;
    if(!st.approx)return int(st.isum);
    if(st.overflow)throw runErr('integer overflow');
    return real(approx());
  }
 }

 // ----- expressions -----
 ev(e:Expr,c:Ctx):Cell{
  this.tick();
  switch(e.k){
   case 'lit':return e.v;
   case 'ref':{const row=c.rows[e.src];return row?row[e.col]??NULL:NULL;}
   case 'agg':return c.aggs?.[e.i]??NULL;
   case 'un':{
    const v=this.ev(e.e,c);
    if(e.op==='+')return v;
    if(v.kind==='null')return NULL;
    if(e.op==='NOT')return bool(!truth(v));
    if(e.op==='~')return int(Number(BigInt.asIntN(64,~BigInt(intValue(v)))));
    const n=numeric(v);
    return n.kind==='integer'?int(-num(n)):real(-num(n));
   }
   case 'and':{
    const l=truth(this.ev(e.l,c));if(l===false)return bool(false);
    const r=truth(this.ev(e.r,c));if(r===false)return bool(false);
    return l===null||r===null?NULL:bool(true);
   }
   case 'or':{
    const l=truth(this.ev(e.l,c));if(l===true)return bool(true);
    const r=truth(this.ev(e.r,c));if(r===true)return bool(true);
    return l===null||r===null?NULL:bool(false);
   }
   case 'bin':return this.binary(e.op,this.ev(e.l,c),this.ev(e.r,c));
   case 'cmp':{
    const l=applyAff(this.ev(e.l,c),e.aff),r=applyAff(this.ev(e.r,c),e.aff);
    if(e.op==='IS'||e.op==='ISNOT'){
     const same=l.kind==='null'||r.kind==='null'?l.kind===r.kind:compareCells(l,r,e.coll)===0;
     return bool(e.op==='IS'?same:!same);
    }
    if(l.kind==='null'||r.kind==='null')return NULL;
    const d=compareCells(l,r,e.coll);
    switch(e.op){
     case '=':return bool(d===0);
     case '!=':return bool(d!==0);
     case '<':return bool(d<0);
     case '<=':return bool(d<=0);
     case '>':return bool(d>0);
     default:return bool(d>=0);
    }
   }
   case 'isnull':{const isNull=this.ev(e.e,c).kind==='null';return bool(e.not?!isNull:isNull);}
   case 'truth':{const t=truth(this.ev(e.e,c));const hit=t===e.val;return bool(e.not?!hit:hit);}
   case 'in':{
    const v=this.ev(e.e,c);
    if(!e.list.length)return bool(e.not);
    if(v.kind==='null')return NULL;
    const left=applyAff(v,e.aff);let sawNull=false;
    for(const item of e.list){
     const x=this.ev(item,c);
     if(x.kind==='null'){sawNull=true;continue;}
     if(compareCells(left,applyAff(x,e.aff),e.coll)===0)return bool(!e.not);
    }
    return sawNull?NULL:bool(e.not);
   }
   case 'between':{
    const v=this.ev(e.e,c),lo=this.ev(e.lo,c),hi=this.ev(e.hi,c);
    const a=v.kind==='null'||lo.kind==='null'?null:compareCells(applyAff(v,e.aff[0]),applyAff(lo,e.aff[0]),e.coll[0])>=0;
    const b=v.kind==='null'||hi.kind==='null'?null:compareCells(applyAff(v,e.aff[1]),applyAff(hi,e.aff[1]),e.coll[1])<=0;
    const r=a===false||b===false?false:a===null||b===null?null:true;
    return r===null?NULL:bool(e.not?!r:r);
   }
   case 'like':{
    const v=this.ev(e.e,c),p=this.ev(e.pat,c);
    let esc:string|null=null;
    if(e.esc){
     const x=this.ev(e.esc,c);
     if(x.kind==='null')return NULL;
     const chars=Array.from(cellText(x));
     if(chars.length!==1)throw runErr('ESCAPE expression must be a single character');
     esc=chars[0];
    }
    if(v.kind==='null'||p.kind==='null')return NULL;
    const pattern=cellText(p);
    if(pattern.length>LIMITS.like)throw runErr('LIKE or GLOB pattern too complex');
    const hit=this.like(pattern,cellText(v),esc);
    return bool(e.not?!hit:hit);
   }
   case 'case':{
    if(e.base){
     const b=this.ev(e.base,c);
     for(const w of e.whens){
      const x=this.ev(w.w,c);
      if(b.kind!=='null'&&x.kind!=='null'&&compareCells(applyAff(b,w.aff),applyAff(x,w.aff),w.coll)===0)return this.ev(w.t,c);
     }
    }else{
     for(const w of e.whens)if(truth(this.ev(w.w,c))===true)return this.ev(w.t,c);
    }
    return e.els?this.ev(e.els,c):NULL;
   }
   case 'cast':{
    const v=this.ev(e.e,c);
    if(v.kind==='null')return NULL;
    switch(e.aff){
     case 'INTEGER':return int(intValue(v));
     case 'REAL':return real(realValue(v));
     case 'TEXT':return v.kind==='text'?v:this.text(cellText(v));
     case 'NUMERIC':{
      if(v.kind!=='text')return v;
      const {value,rc}=atof(str(v));
      if(rc===0||rc===1||value===0||(Number.isInteger(value)&&Math.abs(value)<2251799813685248))return int(value);
      return real(value);
     }
     default:return v;
    }
   }
   case 'collate':return this.ev(e.e,c);
   case 'call':return this.call(e.fn,e.args,e.coll,c);
   case 'name':case 'fn':throw new Error('unresolved expression');
  }
 }
 binary(op:string,a:Cell,b:Cell):Cell{
  if(a.kind==='null'||b.kind==='null')return NULL;
  if(op==='||'){
   const l=cellText(a),r=cellText(b);
   if(l.length+r.length>LIMITS.text)throw runErr('string or blob too big (18)');
   return this.text(l+r);
  }
  if(op==='&'||op==='|'||op==='<<'||op==='>>'){
   const x=BigInt(intValue(a));let y=intValue(b);let o=op;
   if((o==='<<'||o==='>>')&&y<0){o=o==='<<'?'>>':'<<';y=-y;}
   let r:bigint;
   if(o==='&')r=x&BigInt(y);
   else if(o==='|')r=x|BigInt(y);
   else if(y>=64)r=o==='<<'||x>=BigInt(0)?BigInt(0):BigInt(-1);
   else r=o==='<<'?x<<BigInt(y):x>>BigInt(y);
   return int(Number(BigInt.asIntN(64,r)));
  }
  const x=numeric(a),y=numeric(b);
  if(x.kind==='integer'&&y.kind==='integer'){
   const l=num(x),r=num(y);
   switch(op){
    case '+':return int(l+r);
    case '-':return int(l-r);
    case '*':return int(l*r);
    case '/':return r===0?NULL:int(Number(BigInt(l)/BigInt(r)));
    default:return r===0?NULL:int(l%r);
   }
  }
  const l=realValue(x),r=realValue(y);
  switch(op){
   case '+':return real(l+r);
   case '-':return real(l-r);
   case '*':return real(l*r);
   case '/':return r===0?NULL:real(l/r);
   default:{
    let divisor=intValue(y);
    if(divisor===0)return NULL;
    if(divisor===-1)divisor=1;
    return real(intValue(x)%divisor);
   }
  }
 }
 like(pattern:string,value:string,esc:string|null):boolean{
  const fold=(ch:string)=>{const cp=ch.codePointAt(0)??0;return cp>=65&&cp<=90?cp+32:cp;};
  const kinds:number[]=[],cps:number[]=[];// kind 0 = '%', 1 = '_', 2 = literal
  const p=Array.from(pattern);
  for(let i=0;i<p.length;i++){
   const ch=p[i];
   if(esc!==null&&ch===esc){if(i+1>=p.length)return false;kinds.push(2);cps.push(fold(p[++i]));}
   else if(ch==='%'){if(kinds[kinds.length-1]!==0){kinds.push(0);cps.push(0);}}
   else if(ch==='_'){kinds.push(1);cps.push(0);}
   else{kinds.push(2);cps.push(fold(ch));}
  }
  const s=Array.from(value).map(fold);
  let pi=0,si=0,starP=-1,starS=0;
  while(si<s.length){
   this.tick();
   if(pi<kinds.length&&(kinds[pi]===1||(kinds[pi]===2&&cps[pi]===s[si]))){pi++;si++;}
   else if(pi<kinds.length&&kinds[pi]===0){starP=pi++;starS=si;}
   else if(starP>=0){pi=starP+1;si=++starS;}
   else return false;
  }
  while(pi<kinds.length&&kinds[pi]===0)pi++;
  return pi===kinds.length;
 }
 call(fn:string,argExprs:Expr[],coll:Coll,c:Ctx):Cell{
  if(fn==='coalesce'||fn==='ifnull'){for(const a of argExprs){const v=this.ev(a,c);if(v.kind!=='null')return v;}return NULL;}
  if(fn==='iif')return truth(this.ev(argExprs[0],c))===true?this.ev(argExprs[1],c):this.ev(argExprs[2],c);
  const args=argExprs.map(a=>this.ev(a,c));
  const [x,y,z]=args;
  switch(fn){
   case 'abs':return x.kind==='null'?NULL:x.kind==='integer'?int(Math.abs(num(x))):real(Math.abs(realValue(x)));
   case 'round':{
    let digits=0;
    if(y){if(y.kind==='null')return NULL;digits=Math.min(30,Math.max(0,intValue(y)));}
    if(x.kind==='null')return NULL;
    let r=realValue(x);
    // SQLite: half away from zero for ROUND(x); printf("%.*f") (exact decimal value) when digits are given.
    if(r>=-4503599627370496&&r<=4503599627370496)r=digits===0?Math.trunc(r+(r<0?-0.5:0.5)):Number(r.toFixed(digits));
    return real(r);
   }
   case 'upper':return x.kind==='null'?NULL:this.text(asciiUpper(cellText(x)));
   case 'lower':return x.kind==='null'?NULL:this.text(asciiLower(cellText(x)));
   case 'length':return x.kind==='null'?NULL:int(Array.from(cellText(x)).length);
   case 'typeof':return textCell(x.kind);
   case 'substr':case 'substring':{
    if(x.kind==='null'||y.kind==='null'||(z&&z.kind==='null'))return NULL;
    const chars=Array.from(cellText(x));
    let p1=intValue(y),p2=z?intValue(z):1000000000,negative=false;
    if(z&&p2<0){p2=-p2;negative=true;}
    if(p1<0){p1+=chars.length;if(p1<0){p2+=p1;if(p2<0)p2=0;p1=0;}}
    else if(p1>0)p1--;
    else if(p2>0)p2--;
    if(negative){p1-=p2;if(p1<0){p2+=p1;p1=0;}}
    return this.text(chars.slice(p1,p1+p2).join(''));
   }
   case 'trim':case 'ltrim':case 'rtrim':{
    if(x.kind==='null'||(y&&y.kind==='null'))return NULL;
    const set=new Set(y?Array.from(cellText(y)):[' ']);
    const chars=Array.from(cellText(x));let i=0,j=chars.length;
    if(fn!=='rtrim')while(i<j&&set.has(chars[i]))i++;
    if(fn!=='ltrim')while(j>i&&set.has(chars[j-1]))j--;
    return this.text(chars.slice(i,j).join(''));
   }
   case 'replace':{
    if(x.kind==='null'||y.kind==='null')return NULL;
    const find=cellText(y);
    if(find==='')return x;
    if(z.kind==='null')return NULL;
    const parts=cellText(x).split(find),by=cellText(z);
    const size=parts.reduce((sum,part)=>sum+part.length,0)+(parts.length-1)*by.length;
    if(size>LIMITS.text)throw runErr('string or blob too big (18)');
    return this.text(parts.join(by));
   }
   case 'nullif':return compareCells(x,y,coll)===0?NULL:x;
   case 'instr':{
    if(x.kind==='null'||y.kind==='null')return NULL;
    const hay=cellText(x),at=hay.indexOf(cellText(y));
    return int(at<0?0:Array.from(hay.slice(0,at)).length+1);
   }
   default:{// scalar min()/max() with 2+ arguments
    if(args.some(a=>a.kind==='null'))return NULL;
    let best=0;
    for(let i=1;i<args.length;i++){const d=compareCells(args[best],args[i],coll);if(fn==='min'?d>=0:d<0)best=i;}
    return args[best];
   }
  }
 }
}

const positive=(v:number|undefined,fallback:number)=>typeof v==='number'&&Number.isFinite(v)&&v>0?Math.floor(v):fallback;
const oneLine=(message:string)=>{const line=message.replace(/\s*[\r\n]+\s*/g,' ');return line.length>300?`${line.slice(0,297)}...`:line;};

export function executeSql(db:SqlDatabase,sql:string,options:{maxRows?:number;maxWork?:number}={}):SqlOutcome{
 const results:SqlResult[]=[];
 if(typeof sql!=='string')return{ok:false,error:'Parse error: query must be text',results};
 if(sql.length>LIMITS.sql)return{ok:false,error:'Parse error: query is too long for this simulator',results};
 const runner=new Runner(db,positive(options.maxWork,LIMITS.work),positive(options.maxRows,LIMITS.rows));
 const parser=new Parser(tokenize(sql),sql);
 let statements=0;
 try{
  for(;;){
   while(parser.eatOp(';')){/* empty statement */}
   if(parser.atEnd())break;
   if(++statements>LIMITS.statements)throw parseErr(`too many statements for this simulator (max ${LIMITS.statements})`);
   results.push(runner.select(parser.statement()));
  }
 }catch(error){
  const message=error instanceof SqlError?error.message:`Runtime error: ${error instanceof RangeError?'query is too complex for this simulator':'internal simulator error'}`;
  return{ok:false,error:oneLine(message),results};
 }
 return{ok:true,results};
}

// ---------- CLI-style output ----------
export function formatSqlCell(cell:SqlCell):string{
 if(cell.value===null)return '';
 if(cell.kind==='real'&&typeof cell.value==='number')return formatReal(cell.value);
 return String(cell.value);
}
const WIDE:[number,number][]=[[0x1100,0x115f],[0x2e80,0x303e],[0x3041,0x33ff],[0x3400,0x4dbf],[0x4e00,0x9fff],[0xa000,0xa4cf],[0xa960,0xa97f],[0xac00,0xd7a3],[0xf900,0xfaff],[0xfe10,0xfe19],[0xfe30,0xfe6f],[0xff00,0xff60],[0xffe0,0xffe6],[0x1f300,0x1f64f],[0x1f900,0x1f9ff],[0x20000,0x3fffd]];
function charWidth(cp:number):number{
 if((cp>=0x300&&cp<=0x36f)||(cp>=0x200b&&cp<=0x200f)||(cp>=0x20d0&&cp<=0x20ff)||(cp>=0xfe00&&cp<=0xfe0f))return 0;
 for(const [lo,hi] of WIDE)if(cp>=lo&&cp<=hi)return 2;
 return 1;
}
function displayWidth(s:string):number{let w=0;for(const ch of s)w+=charWidth(ch.codePointAt(0)??0);return w;}
const padRight=(s:string,width:number)=>s+' '.repeat(Math.max(0,width-displayWidth(s)));

export function formatSqlResult(result:SqlResult,mode:'column'|'list'|'box'='column'):string{
 if(!result.rows.length)return '';
 const body=result.rows.map(r=>result.columns.map((_,i)=>r[i]?formatSqlCell(r[i]):''));
 if(mode==='list')return body.map(r=>r.join('|')).join('\n');
 const widths=result.columns.map((h,i)=>body.reduce((w,r)=>Math.max(w,displayWidth(r[i])),displayWidth(h)));
 if(mode==='column'){
  const line=(cells:string[])=>cells.map((s,i)=>padRight(s,widths[i])).join('  ').replace(/ +$/,'');
  return [line(result.columns),line(widths.map(w=>'-'.repeat(w))),...body.map(line)].join('\n');
 }
 const rule=(left:string,mid:string,right:string)=>left+widths.map(w=>'─'.repeat(w+2)).join(mid)+right;
 const header=`│ ${result.columns.map((h,i)=>{const gap=widths[i]-displayWidth(h),before=Math.floor(gap/2);return ' '.repeat(before)+h+' '.repeat(gap-before);}).join(' │ ')} │`;
 return [rule('┌','┬','┐'),header,rule('├','┼','┤'),...body.map(r=>`│ ${r.map((s,i)=>padRight(s,widths[i])).join(' │ ')} │`),rule('└','┴','┘')].join('\n');
}

export function describeSchema(db:SqlDatabase,table?:string):string{
 const wanted=table===undefined?null:table.toLowerCase();
 return db.tables.filter(t=>wanted===null||t.name.toLowerCase()===wanted).map(t=>{
  const keys=t.columns.filter(c=>c.primaryKey);
  const lines=t.columns.map(c=>`  ${c.name} ${c.type}${keys.length===1&&c.primaryKey?' PRIMARY KEY':''}`);
  if(keys.length>1)lines.push(`  PRIMARY KEY (${keys.map(c=>c.name).join(', ')})`);
  return `CREATE TABLE ${t.name} (\n${lines.join(',\n')}\n);`;
 }).join('\n');
}

export function listTables(db:SqlDatabase):string{
 const names=[...new Set(db.tables.map(t=>t.name))].sort((a,b)=>compareText(a,b,'BINARY'));
 if(!names.length)return '';
 const width=Math.max(...names.map(displayWidth));
 const perLine=Math.max(1,Math.floor(80/(width+2))),lines=Math.ceil(names.length/perLine);
 const out:string[]=[];
 for(let i=0;i<lines;i++){
  let line='';
  for(let j=i;j<names.length;j+=lines)line+=(j<lines?'':'  ')+padRight(names[j],width);
  out.push(line.replace(/ +$/,''));
 }
 return out.join('\n');
}

export function columnNames(db:SqlDatabase):string[]{
 return [...new Set([...db.tables.map(t=>t.name),...db.tables.flatMap(t=>t.columns.map(c=>c.name))])];
}
