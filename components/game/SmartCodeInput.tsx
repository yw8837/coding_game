'use client';
import {localizeUI} from '@/lib/game/i18n';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState,type UIEvent} from 'react';
import {codeCompletions,indentSelection,type Completion} from '@/lib/game/input-tools';
export type SmartCodeHandle={undo:()=>void;redo:()=>void;complete:()=>void};
type Edit={text:string;start:number;end:number};
export const SmartCodeInput=forwardRef<SmartCodeHandle,{file:string;value:string;onChange:(value:string)=>void;onTest:()=>void;onScroll:(event:UIEvent<HTMLTextAreaElement>)=>void}>(function SmartCodeInput({file,value,onChange,onTest,onScroll},ref){
 const field=useRef<HTMLTextAreaElement>(null),histories=useRef<Record<string,{undo:Edit[];redo:Edit[]}>>({}),composing=useRef(false);
 const [options,setOptions]=useState<Completion[]>([]),[active,setActive]=useState(0);
 const stack=()=>histories.current[file]??(histories.current[file]={undo:[],redo:[]});
 const selection=()=>({text:value,start:field.current?.selectionStart??0,end:field.current?.selectionEnd??0});
 const restore=(e:Edit)=>{onChange(e.text);setOptions([]);requestAnimationFrame(()=>{field.current?.focus();field.current?.setSelectionRange(e.start,e.end);});};
 const edit=(e:Edit)=>{if(e.text.length>60000)return;const h=stack();h.undo.push(selection());h.undo=h.undo.slice(-80);h.redo=[];restore(e);};
 const undo=()=>{const h=stack(),previous=h.undo.pop();if(previous){h.redo.push(selection());restore(previous);}};
 const redo=()=>{const h=stack(),next=h.redo.pop();if(next){h.undo.push(selection());restore(next);}};
 const complete=()=>{setOptions(codeCompletions(file,value,field.current?.selectionStart??0));setActive(0);field.current?.focus();};
 const accept=(c:Completion)=>edit({text:value.slice(0,c.start)+c.text+value.slice(c.end),start:c.start+c.text.length,end:c.start+c.text.length});
 useImperativeHandle(ref,()=>({undo,redo,complete}));
 useEffect(()=>setOptions([]),[file]);
 return localizeUI(<><textarea ref={field} value={value} aria-label={`${file} 코드 편집`} spellCheck={false} autoCapitalize="off" autoComplete="off" onCompositionStart={()=>{composing.current=true;setOptions([]);}} onCompositionEnd={()=>{composing.current=false;}} onClick={()=>setOptions([])} onScroll={onScroll} onChange={e=>{const text=e.target.value;if(text.length>60000)return;const h=stack();h.undo.push({text:value,start:Math.max(0,e.target.selectionStart-1),end:Math.max(0,e.target.selectionStart-1)});h.undo=h.undo.slice(-80);h.redo=[];onChange(text);setActive(0);setOptions(!composing.current&&(text.slice(0,e.target.selectionStart).match(/[\w.-]+$/)?.[0].length??0)>=2?codeCompletions(file,text,e.target.selectionStart):[]);}} onKeyDown={e=>{
  if(composing.current||e.nativeEvent.isComposing||e.keyCode===229)return;
  const el=e.currentTarget,start=el.selectionStart,end=el.selectionEnd,mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
  if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();setOptions([]);return;}
  if(mod&&e.key==='Enter'){e.preventDefault();setOptions([]);onTest();return;}
  if(e.ctrlKey&&e.code==='Space'){e.preventDefault();complete();return;}
  if(options.length){
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOptions([]);return;}
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(n=>(n+(e.key==='ArrowDown'?1:options.length-1))%options.length);return;}
   if((e.key==='Tab'&&!e.shiftKey)||e.key==='Enter'){e.preventDefault();accept(options[active]);return;}
  }
  if(e.key==='Tab'){
   if(e.shiftKey&&start===end)return;
   e.preventDefault();edit(indentSelection(value,start,end,e.shiftKey));return;
  }
  if(e.key==='Enter'){
   e.preventDefault();const line=value.slice(0,start).split('\n').at(-1)??'',indent=line.match(/^\s*/)?.[0]??'',extra=/[{[:]\s*$/.test(line)?'  ':'';
   const paired=extra&&value[end]==='}',insert='\n'+indent+extra+(paired?'\n'+indent:'');
   edit({text:value.slice(0,start)+insert+value.slice(end),start:start+1+indent.length+extra.length,end:start+1+indent.length+extra.length});return;
  }
  const pairs:Record<string,string>={'(' : ')','[':']','{':'}','"':'"',"'":"'"};
  if(!mod&&!e.altKey&&pairs[e.key]){
   if(start===end&&value[start]===e.key&&['"',"'"].includes(e.key)){e.preventDefault();el.setSelectionRange(start+1,start+1);return;}
   e.preventDefault();const chosen=value.slice(start,end);edit({text:value.slice(0,start)+e.key+chosen+pairs[e.key]+value.slice(end),start:start+1,end:end+1});return;
  }
  if(!mod&&start===end&&[')',']','}'].includes(e.key)&&value[start]===e.key){e.preventDefault();el.setSelectionRange(start+1,start+1);return;}
  if(e.key==='Backspace'&&start===end&&pairs[value[start-1]]===value[start]){e.preventDefault();edit({text:value.slice(0,start-1)+value.slice(start+1),start:start-1,end:start-1});}
 }}/>{!!options.length&&<div className="editor-completions" aria-label="코드 자동완성 후보">{options.map((c,i)=><button key={c.label} className={active===i?'selected':''} onMouseDown={e=>e.preventDefault()} onClick={()=>accept(c)}>{c.label}</button>)}</div>}</>);
});
