'use client';
import {Children,cloneElement,isValidElement,useSyncExternalStore,type ReactNode,type ReactElement} from 'react';
import {translate,type Language} from './translations';
export type {Language};
let language:Language='ko';
const listeners=new Set<()=>void>();
export const getLanguage=()=>language;
export const t=(text:string)=>translate(text,language);
export function setLanguage(next:Language){language=next;try{localStorage.setItem('codeshift-language',next);}catch{}document.documentElement.lang=next;listeners.forEach(fn=>fn());}
export function restoreLanguage(){try{const saved=localStorage.getItem('codeshift-language');if(saved==='en'||saved==='ja'||saved==='ko')setLanguage(saved);}catch{}}
export function useLanguage(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},getLanguage,()=> 'ko' as Language);}

/** Translate display text only. State, commands, code and form values stay untouched.
 * Component boundaries opt in explicitly; no DOM mutation or HTML substitution.
 */
export function localizeUI(node:ReactNode):ReactNode{
 if(typeof node==='string')return t(node);
 if(Array.isArray(node))return Children.map(node,localizeUI);
 if(!isValidElement(node))return node;
 const el=node as ReactElement<Record<string,unknown>>;
 if(el.props['data-no-translate'])return el;
 const opaque=['pre','code','textarea','script','style','svg'].includes(String(el.type));
 const props:Record<string,unknown>={};
 for(const key of ['title','aria-label','placeholder','alt'])if(typeof el.props[key]==='string')props[key]=t(el.props[key] as string);
 if(!opaque&&el.props.children!==undefined)props.children=localizeUI(el.props.children as ReactNode);
 return cloneElement(el,props);
}
