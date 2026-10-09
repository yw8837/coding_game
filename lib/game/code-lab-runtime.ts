import {parse} from 'acorn';

export type CodeValue=null|boolean|number|string|CodeValue[]|{[key:string]:CodeValue};
export type CodeError={kind:'syntax'|'unsupported'|'runtime'|'budget';message:string;line?:number};
export type CodeResult={value:CodeValue|null;steps:number;error:CodeError|null};

// These limits apply to parsed syntax, input, every intermediate container and output.
const LIMIT={source:12000,steps:5000,nodes:2500,array:500,string:4000,keys:200,depth:16,cells:5000,output:20000};
type Node={type:string;loc?:{start:{line:number}};[key:string]:unknown};
const node=(value:unknown)=>value as Node;
const nodes=(value:unknown)=>value as Node[];
const forbidden=new Set([...Object.getOwnPropertyNames(Object.prototype),'prototype']);
const lambdaTag=Symbol('interpreted-arrow');
type Lambda={[lambdaTag]:true;params:string[];body:Node;scope:Scope};
type Value=CodeValue|Lambda;
type Binding={value:Value;mutable:boolean;ready:boolean};
type Flow={kind:'normal'}|{kind:'return';value:Value}|{kind:'break'|'continue'};
type Reference={get:()=>Value;set:(value:Value)=>void};
const normal:Flow={kind:'normal'};
const lambda=(value:Value):value is Lambda=>typeof value==='object'&&value!==null&&Object.hasOwn(value,lambdaTag);
const diagnostic=(message:string)=>message.length>800?message.slice(0,797)+'...':message;

class Fault extends Error{
 readonly detail:CodeError;
 constructor(kind:CodeError['kind'],message:string,where?:Node){super(diagnostic(message));this.detail={kind,message:diagnostic(message),...(where?.loc?{line:where.loc.start.line}:{})};}
}
class Scope{
 readonly bindings=new Map<string,Binding>();
 readonly parent:Scope|null;
 constructor(parent:Scope|null=null){this.parent=parent;}
 declare(name:string,mutable:boolean,where:Node){if(this.bindings.has(name))throw new Fault('runtime',`Variable ${name} is already declared in this scope.`,where);this.bindings.set(name,{value:null,mutable,ready:false});}
 resolve(name:string,where:Node):Binding{
  const binding=this.bindings.get(name);if(binding){if(!binding.ready)throw new Fault('runtime',`Variable ${name} is used before its declaration.`,where);return binding;}
  if(this.parent)return this.parent.resolve(name,where);
  throw new Fault('unsupported',`Unknown variable ${name}. Only local variables and the supplied input are available.`,where);
 }
 has(name:string):boolean{return this.bindings.has(name)||!!this.parent?.has(name);}
}

class Interpreter{
 steps=0;
 private active=new Set<Lambda>();
 tick(where?:Node){if(++this.steps>LIMIT.steps){this.steps=LIMIT.steps;throw new Fault('budget',`Execution exceeded ${LIMIT.steps} steps. Check loop conditions and data growth.`,where);}}
 fault(kind:CodeError['kind'],message:string,where?:Node):never{throw new Fault(kind,message,where);}
 number(value:Value,where:Node):number{if(typeof value!=='number'||!Number.isFinite(value))this.fault('runtime','This operation requires a finite number.',where);return value;}
 data(value:Value,where?:Node):CodeValue{if(lambda(value))this.fault('unsupported','Functions can be called locally or used as callbacks, but cannot be returned or stored in data.',where);return value;}
 size(value:Value,where?:Node):Value{
  if(typeof value==='number'&&!Number.isFinite(value))this.fault('runtime','The calculation produced a non-finite number.',where);
  if(typeof value==='string'&&value.length>LIMIT.string)this.fault('budget',`Strings are limited to ${LIMIT.string} characters.`,where);
  if(Array.isArray(value)&&value.length>LIMIT.array)this.fault('budget',`Arrays are limited to ${LIMIT.array} items.`,where);
  return value;
 }
 key(value:Value,where?:Node):string{if(typeof value!=='string'&&typeof value!=='number')this.fault('runtime','Property names must be strings or numbers.',where);const key=String(value);if(forbidden.has(key))this.fault('unsupported',`Property ${key} is not accessible.`,where);if(key.length>LIMIT.string)this.fault('budget','Property name is too long.',where);return key;}
 guard(value:CodeValue,where:Node):CodeValue{
  let cells=0;const active=new Set<object>();const visit=(item:CodeValue,depth:number)=>{
   this.tick(where);if(++cells>LIMIT.cells||depth>LIMIT.depth)this.fault('budget','Intermediate data is too large or deeply nested.',where);this.size(item,where);
   if(item===null||typeof item!=='object')return;
   if(active.has(item))this.fault('runtime','Data cannot contain cyclic references.',where);
   active.add(item);if(Array.isArray(item)){for(const value of item)visit(value,depth+1);}else{const keys=Object.keys(item);if(keys.length>LIMIT.keys)this.fault('budget',`Objects are limited to ${LIMIT.keys} properties.`,where);for(const key of keys)visit(item[key],depth+1);}active.delete(item);
  };visit(value,0);return value;
 }
 clone(value:unknown,label:string):CodeValue{
  let cells=0;const seen=new Set<object>();
  const copy=(item:unknown,depth:number):CodeValue=>{
   this.tick();if(++cells>LIMIT.cells||depth>LIMIT.depth)this.fault('budget',`${label} is too large or deeply nested.`);
   if(item===null||typeof item==='boolean')return item;
   if(typeof item==='number'){if(!Number.isFinite(item))this.fault('runtime',`${label} must contain only finite JSON numbers.`);return item;}
   if(typeof item==='string'){this.size(item);return item;}
   if(typeof item!=='object')this.fault('runtime',`${label} must contain only JSON values; functions, undefined and symbols are not supported.`);
   if(seen.has(item))this.fault('runtime',`${label} cannot contain cyclic references.`);
   const array=Array.isArray(item),prototype=Object.getPrototypeOf(item);
   if(prototype!==(array?Array.prototype:Object.prototype)&&!(prototype===null&&!array))this.fault('runtime',`${label} must contain plain objects and arrays.`);
   if(array&&item.length>LIMIT.array)this.fault('budget',`${label} arrays are limited to ${LIMIT.array} items.`);
   if(!array&&Reflect.ownKeys(item).length>LIMIT.keys)this.fault('budget',`${label} objects are limited to ${LIMIT.keys} properties.`);
   const descriptors=Object.getOwnPropertyDescriptors(item),names=Reflect.ownKeys(descriptors);
   if(names.some(name=>typeof name!=='string'))this.fault('runtime',`${label} cannot contain symbol properties.`);
   for(const name of names as string[]){const descriptor=descriptors[name];if(!Object.hasOwn(descriptor,'value'))this.fault('runtime',`${label} cannot contain getters or setters.`);if(!(array&&name==='length')&&(!descriptor.enumerable||forbidden.has(name)))this.fault('unsupported',`${label} contains a forbidden or non-JSON property.`);}
   seen.add(item);let result:CodeValue;
   if(array){
    if(item.length>LIMIT.array)this.fault('budget',`${label} arrays are limited to ${LIMIT.array} items.`);
    if(names.length!==item.length+1)this.fault('runtime',`${label} arrays cannot contain holes or named properties.`);
    const values:CodeValue[]=[];for(let i=0;i<item.length;i++){if(!Object.hasOwn(descriptors,String(i)))this.fault('runtime',`${label} arrays cannot contain holes.`);values.push(copy(descriptors[i].value,depth+1));}result=values;
   }else{
    if(names.length>LIMIT.keys)this.fault('budget',`${label} objects are limited to ${LIMIT.keys} properties.`);
    const values:Record<string,CodeValue>=Object.create(null);for(const name of names as string[])values[name]=copy(descriptors[name].value,depth+1);result=values;
   }
   seen.delete(item);return result;
  };
  return copy(value,0);
 }
 validate(entry:Node){
  const allowed=new Set(['FunctionDeclaration','Identifier','BlockStatement','VariableDeclaration','VariableDeclarator','ReturnStatement','ExpressionStatement','IfStatement','ForOfStatement','ForStatement','WhileStatement','DoWhileStatement','BreakStatement','ContinueStatement','EmptyStatement','Literal','ArrayExpression','ObjectExpression','Property','UnaryExpression','BinaryExpression','LogicalExpression','ConditionalExpression','MemberExpression','AssignmentExpression','UpdateExpression','CallExpression','ArrowFunctionExpression','SequenceExpression']);
  let count=0;const walk=(current:Node,depth=0)=>{
   if(depth>256)this.fault('budget','Syntax nesting is limited to 256 levels.',current);
   if(++count>LIMIT.nodes)this.fault('budget','The program contains too many syntax nodes.',current);
   if(!allowed.has(current.type))this.fault('unsupported',`Syntax ${current.type} is not supported.`,current);
   if(current.type==='FunctionDeclaration'&&current!==entry)this.fault('unsupported','Declare local arrow functions instead of nested function declarations.',current);
   if(current.type==='Property'&&(current.kind!=='init'||current.method||current.shorthand&&node(current.value).type!=='Identifier'))this.fault('unsupported','Object methods, getters and setters are not supported.',current);
   if(current.type==='VariableDeclaration'&&!['const','let'].includes(String(current.kind)))this.fault('unsupported','Use const or let for local variables.',current);
   if(current.type==='VariableDeclarator'&&node(current.id).type!=='Identifier')this.fault('unsupported','Declare one named variable instead of destructuring.',current);
   if(current.type==='ArrowFunctionExpression'&&(current.async||current.generator||nodes(current.params).some(p=>p.type!=='Identifier')))this.fault('unsupported','Callbacks require simple named parameters and synchronous code.',current);
   if(current.type==='MemberExpression'&&current.optional||current.type==='CallExpression'&&current.optional)this.fault('unsupported','Optional chaining is not supported; check the value with if first.',current);
   if(current.type==='MemberExpression'&&!current.computed)this.key(String(node(current.property).name),current);
   if(current.type==='Property'&&!current.computed)this.key(node(current.key).type==='Identifier'?String(node(current.key).name):node(current.key).value as Value,current);
   if(current.type==='Literal'&&(current.regex||current.bigint!==undefined))this.fault('unsupported','Regular expressions and BigInt literals are not supported.',current);
   for(const [key,value] of Object.entries(current)){if(['loc','start','end','raw'].includes(key))continue;if(Array.isArray(value)){for(const child of value)if(child&&typeof child==='object'&&typeof child.type==='string')walk(child,depth+1);}else if(value&&typeof value==='object'&&typeof (value as Node).type==='string')walk(value as Node,depth+1);}
  };walk(entry);
 }
 prepare(statements:Node[],scope:Scope){for(const statement of statements)if(statement.type==='VariableDeclaration')for(const declaration of nodes(statement.declarations))scope.declare(String(node(declaration.id).name),statement.kind==='let',declaration);}
 block(body:Node,scope:Scope,loops=0):Flow{
  this.tick(body);const local=new Scope(scope),statements=nodes(body.body);this.prepare(statements,local);
  for(const statement of statements){const result=this.statement(statement,local,loops);if(result.kind!=='normal')return result;}return normal;
 }
 declaration(current:Node,scope:Scope,predeclared=false){
  for(const declaration of nodes(current.declarations)){
   this.tick(declaration);const name=String(node(declaration.id).name);if(!predeclared)scope.declare(name,current.kind==='let',declaration);
   const binding=scope.bindings.get(name)!;if(!declaration.init)this.fault('unsupported','Initialize local variables explicitly, for example let total = 0.',declaration);
   binding.value=this.expression(node(declaration.init),scope);if(!lambda(binding.value))this.guard(binding.value,declaration);binding.ready=true;
  }
 }
 statement(current:Node,scope:Scope,loops:number):Flow{
  this.tick(current);
  switch(current.type){
   case 'BlockStatement':return this.block(current,scope,loops);
   case 'EmptyStatement':return normal;
   case 'VariableDeclaration':this.declaration(current,scope,true);return normal;
   case 'ExpressionStatement':this.expression(node(current.expression),scope);return normal;
   case 'ReturnStatement':if(!current.argument)this.fault('unsupported','Return an explicit JSON value. A bare return produces undefined, which is not supported.',current);return {kind:'return',value:this.expression(node(current.argument),scope)};
   case 'IfStatement':return this.expression(node(current.test),scope)?this.statement(node(current.consequent),scope,loops):current.alternate?this.statement(node(current.alternate),scope,loops):normal;
   case 'BreakStatement':case 'ContinueStatement':if(!loops||current.label)this.fault('unsupported','break and continue require an enclosing loop and cannot use labels.',current);return {kind:current.type==='BreakStatement'?'break':'continue'};
   case 'ForOfStatement':{
    if(current.await)this.fault('unsupported','Async iteration is not supported.',current);
    const left=node(current.left),rightScope=new Scope(scope);
    if(left.type==='VariableDeclaration')for(const declaration of nodes(left.declarations))rightScope.declare(String(node(declaration.id).name),left.kind==='let',left);
    const iterable=this.data(this.expression(node(current.right),rightScope),current);if(!Array.isArray(iterable)&&typeof iterable!=='string')this.fault('runtime','for...of requires an array or string.',current);
    const values=typeof iterable==='string'?Array.from(iterable):iterable;
    for(let index=0;index<values.length;index++){
     this.tick(current);const local=new Scope(scope);
     if(left.type==='VariableDeclaration'){const declarations=nodes(left.declarations);if(declarations.length!==1||declarations[0].init)this.fault('unsupported','for...of requires one const or let variable.',left);const name=String(node(declarations[0].id).name);local.declare(name,left.kind==='let',left);local.bindings.set(name,{value:values[index],mutable:left.kind==='let',ready:true});}
     else this.reference(left,scope).set(values[index]);
     const flow=this.statement(node(current.body),local,loops+1);if(flow.kind==='return')return flow;if(flow.kind==='break')break;
    }return normal;
   }
   case 'ForStatement':case 'WhileStatement':case 'DoWhileStatement':{
    let local=current.type==='ForStatement'?new Scope(scope):scope;
    if(current.init){const init=node(current.init);if(init.type==='VariableDeclaration')this.declaration(init,local);else this.expression(init,local);}
    const perIteration=current.type==='ForStatement'&&current.init&&node(current.init).type==='VariableDeclaration'&&node(current.init).kind==='let';
    const forkIteration=()=>{const next=new Scope(local.parent);for(const [name,binding] of local.bindings)next.bindings.set(name,{...binding});local=next;};
    if(perIteration)forkIteration();
    let first=true;for(;;){
     this.tick(current);if(current.type!=='DoWhileStatement'||!first){if(current.test&&!this.expression(node(current.test),local))break;}first=false;
     const flow=this.statement(node(current.body),local,loops+1);if(flow.kind==='return')return flow;if(flow.kind==='break')break;
     if(perIteration)forkIteration();
     if(current.update)this.expression(node(current.update),local);
    }return normal;
   }
   default:return this.fault('unsupported',`Statement ${current.type} is not supported.`,current);
  }
 }
 property(current:Node,scope:Scope):{object:CodeValue;key:string}{return {object:this.data(this.expression(node(current.object),scope),current),key:this.key(current.computed?this.expression(node(current.property),scope):String(node(current.property).name),current)};}
 read(object:CodeValue,key:string,where:Node):CodeValue{
  if(Array.isArray(object)||typeof object==='string'){
   if(key==='length')return object.length;
   if(!/^(?:0|[1-9]\d*)$/.test(key)||Number(key)>=object.length)this.fault('runtime',`No own item or supported property ${key}.`,where);
   return object[Number(key)];
  }
  if(object===null||typeof object!=='object')this.fault('runtime','Property access requires an object, array or string.',where);
  if(!Object.hasOwn(object,key))this.fault('runtime',`Object has no own property ${key}.`,where);return object[key];
 }
 reference(current:Node,scope:Scope):Reference{
  if(current.type==='Identifier'){
   const name=String(current.name),binding=scope.resolve(name,current);return {get:()=>binding.value,set:value=>{if(!binding.mutable)this.fault('runtime',`Cannot reassign const variable ${name}.`,current);binding.value=this.size(value,current);if(!lambda(binding.value))this.guard(binding.value,current);}};
  }
  if(current.type!=='MemberExpression')this.fault('unsupported','Assignments require a local variable or an own data property.',current);
  const {object,key}=this.property(current,scope);return {get:()=>this.read(object,key,current),set:value=>{
   const data=this.data(this.size(value,current),current);
   if(Array.isArray(object)){
    if(!/^(?:0|[1-9]\d*)$/.test(key)||Number(key)>object.length)this.fault('runtime','Array assignments require an existing index or the next index; length and sparse arrays are not writable.',current);
    if(Number(key)>=LIMIT.array)this.fault('budget',`Arrays are limited to ${LIMIT.array} items.`,current);object[Number(key)]=data;this.guard(object,current);
   }else if(object!==null&&typeof object==='object'){
    if(!Object.hasOwn(object,key)&&Object.keys(object).length>=LIMIT.keys)this.fault('budget',`Objects are limited to ${LIMIT.keys} properties.`,current);object[key]=data;this.guard(object,current);
   }else this.fault('runtime','Only arrays and objects have writable properties.',current);
  }};
 }
 primitive(value:Value,where:Node):null|boolean|number|string{if(value!==null&&typeof value==='object')this.fault('runtime','Use a primitive value for this operation.',where);return value as null|boolean|number|string;}
 binary(operator:string,left:Value,right:Value,where:Node):Value{
  if(operator==='==='||operator==='!==')return operator==='==='?left===right:left!==right;
  if(operator==='=='||operator==='!='){
   let equal=left===right;if(!equal&&left!==null&&right!==null&&typeof left!=='object'&&typeof right!=='object')equal=typeof left===typeof right?left===right:Number(left)===Number(right);
   return operator==='=='?equal:!equal;
  }
  if(['<','<=','>','>='].includes(operator)){
   const a=this.primitive(left,where),b=this.primitive(right,where);if(a===null||b===null)this.fault('runtime','Compare numbers or strings explicitly.',where);
   if(typeof a==='string'&&typeof b==='string')return operator==='<'?a<b:operator==='<='?a<=b:operator==='>'?a>b:a>=b;
   const x=this.number(left,where),y=this.number(right,where);return operator==='<'?x<y:operator==='<='?x<=y:operator==='>'?x>y:x>=y;
  }
  if(operator==='+'&&(typeof left==='string'||typeof right==='string'))return this.size(String(this.primitive(left,where))+String(this.primitive(right,where)),where);
  const a=this.number(left,where),b=this.number(right,where);let value:number;
  switch(operator){case '+':value=a+b;break;case '-':value=a-b;break;case '*':value=a*b;break;case '/':value=a/b;break;case '%':value=a%b;break;case '**':value=a**b;break;default:return this.fault('unsupported',`Operator ${operator} is not supported.`,where);}return this.size(value,where);
 }
 expression(current:Node,scope:Scope):Value{
  this.tick(current);
  switch(current.type){
   case 'Literal':return this.size(current.value as CodeValue,current);
   case 'Identifier':return scope.resolve(String(current.name),current).value;
   case 'ArrayExpression':{const values:CodeValue[]=[];for(const element of nodes(current.elements)){if(!element)this.fault('unsupported','Array holes are not supported.',current);values.push(this.data(this.expression(element,scope),element));this.size(values,current);}return this.guard(values,current);}
   case 'ObjectExpression':{const value:Record<string,CodeValue>=Object.create(null);for(const property of nodes(current.properties)){
    const key=this.key(property.computed?this.expression(node(property.key),scope):node(property.key).type==='Identifier'?String(node(property.key).name):node(property.key).value as Value,property);
    if(!Object.hasOwn(value,key)&&Object.keys(value).length>=LIMIT.keys)this.fault('budget',`Objects are limited to ${LIMIT.keys} properties.`,current);value[key]=this.data(this.expression(node(property.value),scope),property);
   }return this.guard(value,current);}
   case 'MemberExpression':{const {object,key}=this.property(current,scope);return this.read(object,key,current);}
   case 'ArrowFunctionExpression':return {[lambdaTag]:true,params:nodes(current.params).map(p=>String(p.name)),body:node(current.body),scope};
   case 'CallExpression':return this.call(current,scope);
   case 'UnaryExpression':{
    const value=this.expression(node(current.argument),scope);switch(current.operator){case '!':return !value;case '+':return this.number(value,current);case '-':return this.size(-this.number(value,current),current);case 'typeof':return value===null?'object':lambda(value)?'function':typeof value;default:return this.fault('unsupported',`Unary operator ${String(current.operator)} is not supported.`,current);}
   }
   case 'BinaryExpression':return this.binary(String(current.operator),this.expression(node(current.left),scope),this.expression(node(current.right),scope),current);
   case 'LogicalExpression':{const left=this.expression(node(current.left),scope);return current.operator==='&&'?left?this.expression(node(current.right),scope):left:current.operator==='||'?left?left:this.expression(node(current.right),scope):current.operator==='??'?left===null?this.expression(node(current.right),scope):left:this.fault('unsupported','Unsupported logical operator.',current);}
   case 'ConditionalExpression':return this.expression(node(current.test),scope)?this.expression(node(current.consequent),scope):this.expression(node(current.alternate),scope);
   case 'AssignmentExpression':{
    const reference=this.reference(node(current.left),scope),operator=String(current.operator);
    if(operator==='='){const value=this.expression(node(current.right),scope);reference.set(value);return value;}
    const previous=reference.get();if(operator==='&&='&&!previous||operator==='||='&&previous||operator==='??='&&previous!==null)return previous;
    const right=this.expression(node(current.right),scope),value=['&&=','||=','??='].includes(operator)?right:this.binary(operator.slice(0,-1),previous,right,current);reference.set(value);return value;
   }
   case 'UpdateExpression':{const reference=this.reference(node(current.argument),scope),previous=this.number(reference.get(),current),value=this.size(previous+(current.operator==='++'?1:-1),current);reference.set(value);return current.prefix?value:previous;}
   case 'SequenceExpression':{let result:Value=null;for(const expression of nodes(current.expressions))result=this.expression(expression,scope);return result;}
   default:return this.fault('unsupported',`Expression ${current.type} is not supported.`,current);
  }
 }
 invoke(callback:Value,args:CodeValue[],where:Node):Value{
  this.tick(where);if(!lambda(callback))this.fault('runtime','This operation requires an arrow function callback.',where);
  if(this.active.has(callback))this.fault('unsupported','Recursive function calls are not supported.',where);
  if(this.active.size>=64)this.fault('budget','Callback nesting is limited to 64 calls.',where);
  if(callback.params.length>args.length)this.fault('runtime','Callback declares more parameters than the operation supplies.',where);
  const scope=new Scope(callback.scope);callback.params.forEach((name,index)=>scope.bindings.set(name,{value:args[index],mutable:true,ready:true}));
  this.active.add(callback);try{if(callback.body.type!=='BlockStatement')return this.expression(callback.body,scope);const result=this.block(callback.body,scope);if(result.kind!=='return')this.fault('unsupported','This callback returned undefined. Return an explicit JSON value.',callback.body);return result.value;}finally{this.active.delete(callback);}
 }
 arity(args:Value[],min:number,max:number,where:Node){if(args.length<min||args.length>max)this.fault('runtime',`Expected ${min===max?min:min+'–'+max} arguments, received ${args.length}.`,where);}
 call(current:Node,scope:Scope):Value{
  const callee=node(current.callee);
  // Resolve the receiver before evaluating arguments, as JavaScript does.
  let receiver:CodeValue|null=null,method='',math=false;
  if(callee.type==='MemberExpression'){
   if(node(callee.object).type==='Identifier'&&node(callee.object).name==='Math'&&!scope.has('Math')){math=true;method=this.key(callee.computed?this.expression(node(callee.property),scope):String(node(callee.property).name),callee);}
   else{const property=this.property(callee,scope);receiver=property.object;method=property.key;}
  }
  const localCall=callee.type==='Identifier'&&scope.has(String(callee.name)),callback=localCall?scope.resolve(String(callee.name),callee).value:null;
  const args=nodes(current.arguments).map(argument=>this.expression(argument,scope));
  if(math){
   if(!['min','max','floor','round'].includes(method))this.fault('unsupported',`Math.${method} is not supported.`,current);this.arity(args,1,method==='floor'||method==='round'?1:100,current);
   const values=args.map(value=>this.number(value,current));return this.size(method==='min'?Math.min(...values):method==='max'?Math.max(...values):method==='floor'?Math.floor(values[0]):Math.round(values[0]),current);
  }
  if(callee.type==='Identifier'){
   if(localCall)return this.invoke(callback,args.map(value=>this.data(value,current)),current);
   const name=String(callee.name);if(['Number','String'].includes(name)){this.arity(args,1,1,current);const value=this.primitive(args[0],current);return this.size(name==='Number'?Number(value):String(value),current);}
   this.fault('unsupported',`Function ${name} is not available. Use local arrow functions or the listed built-ins.`,current);
  }
  if(callee.type!=='MemberExpression')this.fault('unsupported','Only local arrow functions and supported data methods can be called.',current);
  if(Array.isArray(receiver))return this.arrayCall(receiver,method,args,current);
  if(typeof receiver==='string')return this.stringCall(receiver,method,args,current);
  this.fault('unsupported',`Method ${method} is not available on this data value.`,current);
 }
 arrayCall(array:CodeValue[],method:string,args:Value[],where:Node):Value{
  if(method==='push'){
   if(array.length+args.length>LIMIT.array)this.fault('budget',`Arrays are limited to ${LIMIT.array} items.`,where);
   const values=args.map(value=>this.data(value,where));array.push(...values);this.guard(array,where);return array.length;
  }
  if(method==='includes'){this.arity(args,1,2,where);const start=args.length===2?Math.trunc(this.number(args[1],where)):0,index=start<0?Math.max(array.length+start,0):start;for(let i=index;i<array.length;i++){this.tick(where);if(array[i]===args[0])return true;}return false;}
  if(method==='slice'){
   this.arity(args,0,2,where);const bound=(value:Value)=>value===null?0:Math.trunc(this.number(value,where));const a=args.length?bound(args[0]):0,b=args.length>1?bound(args[1]):array.length;return this.guard(array.slice(a,b),where);
  }
  if(method==='join'){
   this.arity(args,0,1,where);const separator=args.length?String(this.primitive(args[0],where)):',';let result='';for(let i=0;i<array.length;i++){this.tick(where);const text=array[i]===null?'':String(this.primitive(array[i],where));result+=i?separator+text:text;this.size(result,where);}return result;
  }
  if(!['map','filter','reduce'].includes(method))this.fault('unsupported',`Array.${method} is not supported. Use push, includes, slice, map, filter, reduce or join.`,where);
  this.arity(args,1,method==='reduce'?2:1,where);if(!lambda(args[0]))this.fault('runtime',`${method} requires an arrow function callback.`,where);
  const length=array.length;
  if(method==='reduce'){
   if(!length&&args.length===1)this.fault('runtime','reduce on an empty array requires an initial value.',where);
   let accumulator:Value=args.length===2?this.data(args[1],where):array[0];for(let i=args.length===2?0:1;i<length;i++){this.tick(where);accumulator=this.data(this.invoke(args[0],[this.data(accumulator,where),array[i],i,array],where),where);}return accumulator;
  }
  const result:CodeValue[]=[];for(let i=0;i<length;i++){this.tick(where);const element=array[i],value=this.invoke(args[0],[element,i,array],where);if(method==='map')result.push(this.data(value,where));else if(value)result.push(element);this.size(result,where);}return this.guard(result,where);
 }
 stringCall(text:string,method:string,args:Value[],where:Node):Value{
  if(method==='trim'||method==='toLowerCase'){this.arity(args,0,0,where);return this.size(method==='trim'?text.trim():text.toLowerCase(),where);}
  if(method==='includes'){this.arity(args,1,2,where);const search=this.primitive(args[0],where),start=args.length===2?this.number(args[1],where):0;return text.includes(String(search),start);}
  if(method==='split'){
   this.arity(args,0,2,where);if(!args.length)return [text];const separator=this.primitive(args[0],where),limit=args.length===2?this.number(args[1],where):undefined;
   if(limit!==undefined&&(!Number.isInteger(limit)||limit<0||limit>LIMIT.array))this.fault('budget',`split limit must be an integer from 0 to ${LIMIT.array}.`,where);
   return this.size(text.split(String(separator),limit),where);
  }
  this.fault('unsupported',`String.${method} is not supported. Use trim, toLowerCase, split or includes.`,where);
 }
 execute(entry:Node,input:CodeValue):CodeValue{
  const scope=new Scope();scope.bindings.set(String(nodes(entry.params)[0].name),{value:this.clone(input,'Input'),mutable:true,ready:true});
  const flow=this.block(node(entry.body),scope);if(flow.kind!=='return')this.fault('runtime','solve must return a result.',entry);
  const result=this.clone(this.data(flow.value,entry),'Output');
  // clone uses null prototypes internally. JSON parsing produces ordinary caller data.
  const serialized=JSON.stringify(result);if(serialized.length>LIMIT.output)this.fault('budget',`Serialized output is limited to ${LIMIT.output} characters.`,entry);return JSON.parse(serialized) as CodeValue;
 }
}

/** Parses real JavaScript syntax and interprets a bounded, synchronous subset.
 * No eval, Function, VM, host globals, native code or user-created JS callback runs. */
export function runCode(source:string,input:CodeValue):CodeResult{
 const interpreter=new Interpreter();try{
  if(typeof source!=='string'||source.length>LIMIT.source)throw new Fault('budget',`Source is limited to ${LIMIT.source} characters.`);
  let program:Node;try{program=parse(source,{ecmaVersion:2022,sourceType:'script',locations:true}) as unknown as Node;}catch(error){if(error instanceof RangeError)return {value:null,steps:0,error:{kind:'budget',message:'Syntax is too deeply nested to parse safely.'}};const info=error as {message?:string;loc?:{line:number}};return {value:null,steps:0,error:{kind:'syntax',message:diagnostic(info.message??'Invalid JavaScript syntax.'),...(info.loc?{line:info.loc.line}:{})}};}
  const body=nodes(program.body),entry=body[0];
  if(body.length!==1||entry?.type!=='FunctionDeclaration'||node(entry.id).name!=='solve'||entry.async||entry.generator||nodes(entry.params).length!==1||nodes(entry.params)[0].type!=='Identifier')throw new Fault('unsupported','Provide exactly one function solve(input) { ... } with one named parameter and no other top-level code.',entry);
  interpreter.validate(entry);const value=interpreter.execute(entry,input);return {value,steps:interpreter.steps,error:null};
 }catch(error){return {value:null,steps:interpreter.steps,error:error instanceof Fault?error.detail:{kind:'runtime',message:'The program could not evaluate this data safely.'}};}
}
