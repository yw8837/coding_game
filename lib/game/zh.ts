import {zhCatalog} from './zh-catalog.ts';
import {zhUICatalog} from './zh-ui-catalog.ts';
import {zhContentCatalog} from './zh-content-catalog.ts';

/** Authored display text only. Never apply this to source files or player input. */
export function translateZh(korean:string,english?:string):string{
 const key=korean.trim(),normalized=key.replace(/\s+/g,' ');
 const lookup=(catalog:Record<string,string>,value:string)=>Object.hasOwn(catalog,value)&&typeof catalog[value]==='string'?catalog[value]:undefined;
 const found=lookup(zhUICatalog,key)??lookup(zhUICatalog,normalized)??lookup(zhContentCatalog,key)??lookup(zhContentCatalog,normalized)??lookup(zhCatalog,key)??lookup(zhCatalog,normalized);
 if(found)return korean.replace(key,found);
 return english??korean;
}

/** Keep the existing three-language content definitions and resolve Chinese lazily. */
export function localizedCopy(ko:string,en:string,ja:string,zh?:string){
 return {ko,en,ja,get zh(){return zh??translateZh(ko,en);}};
}
