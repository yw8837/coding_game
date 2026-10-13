'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import {MAX_ASSETS,MAX_IMAGE_DATA_TOTAL,validateAuthoredAssets} from '@/lib/game/release-authored';

type Asset={name?:string;dataUrl:string;alt?:string};
type Assets=Record<string,Asset>;
const LIMIT=150_000;

/** Decode pixels, discard metadata, and store a bounded raster. No disk path is retained. */
async function importPhoto(file:File):Promise<string>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('type');
 if(file.size>15*1024*1024)throw Error('size');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>40_000_000)throw Error('size');
  for(const max of [960,720,480,320]){
   const ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
   const context=canvas.getContext('2d');if(!context)throw Error('decode');
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.85,.65,.45]){const data=canvas.toDataURL('image/webp',quality);if(data.length<=LIMIT)return data;}
  }
  throw Error('size');
 }finally{bitmap.close();}
}

export function ProjectImageLibrary({source,disabled,onChange,onInsert}:{source?:string;disabled:boolean;onChange:(source:string)=>boolean;onInsert:(id:string,alt:string)=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const input=useRef<HTMLInputElement>(null),busyRef=useRef(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const {assets,valid}=validateAuthoredAssets(source);
 const current=useRef({source,disabled});
 useEffect(()=>{current.current={source,disabled};return()=>{current.current.disabled=true;};},[source,disabled]);
 const total=Object.values(assets).reduce((sum,a)=>sum+a.dataUrl.length,0);
 const save=(next:Assets)=>onChange(JSON.stringify(next,null,2)+'\n');
 async function pick(file:File){
  if(busyRef.current||disabled||!valid)return;busyRef.current=true;setBusy(true);setNotice('');
  const before=source;
  try{
   const dataUrl=await importPhoto(file);
   if(current.current.source!==before||current.current.disabled)throw Error('changed');
   if(Object.keys(assets).length>=MAX_ASSETS||total+dataUrl.length>MAX_IMAGE_DATA_TOTAL)throw Error('budget');
   let index=1;while(assets['photo'+index])index++;
   const id='photo'+index;if(!save({...assets,[id]:{name:file.name.slice(0,100),dataUrl,alt:''}}))return;
   setNotice(tr('이미지를 저장했어요. 설명을 적고 ‘HTML에 넣기’를 누르세요.','Image saved. Add a description, then choose Insert into HTML.','画像を保存しました。説明を書き「HTMLに挿入」を押してください。'));
  }catch(error){
   const reason=error instanceof Error?error.message:'';
   setNotice(reason==='type'?tr('PNG, JPG, WebP 이미지를 골라 주세요.','Choose a PNG, JPG or WebP image.','PNG・JPG・WebP画像を選んでください。'):reason==='budget'?tr('이미지 공간이 부족해요. 사용하지 않는 이미지를 지운 뒤 다시 가져오세요.','Image storage is full. Remove an unused image and try again.','画像の保存容量が足りません。不要な画像を削除してください。'):reason==='changed'?tr('작업 내용이 바뀌었어요. 다시 가져와 주세요.','Your project changed. Please import the image again.','作業内容が変わりました。もう一度取り込んでください。'):tr('이미지를 읽을 수 없거나 너무 큽니다. 15MB 이하의 작은 사진으로 다시 시도하세요.','The image could not be read or is too large. Try a smaller photo under 15 MB.','画像を読み込めないか、大きすぎます。15MB以下の小さい画像で試してください。'));
  }finally{busyRef.current=false;setBusy(false);if(input.current)input.current.value='';}
 }
 return <section className="project-images" data-testid="project-images">
  <header><h3>{tr('내 PC의 이미지','Images from my PC','PCの画像')}</h3><span>{Object.keys(assets).length} / {MAX_ASSETS}</span></header>
  <p>{tr('사진은 크기를 줄여 게임 저장에 포함합니다. 원본 파일을 옮겨도 유지되며, 내보낸 HTML에도 들어갑니다.','Photos are resized and included in your game save and exported HTML. Moving the original file will not break them.','画像は縮小してゲーム保存とHTMLに含めます。元のファイルを移動しても消えません。')}</p>
  {!valid&&<p role="alert">{tr('assets.json 형식을 먼저 수정해 주세요.','Fix the assets.json format first.','先にassets.jsonの形式を直してください。')}</p>}
  <input ref={input} data-testid="project-image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={disabled||busy||!valid} onChange={event=>{const file=event.target.files?.[0];if(file)void pick(file);}}/>
  {!disabled&&<button className="outline-button" data-testid="project-image-import" disabled={busy||!valid||Object.keys(assets).length>=MAX_ASSETS} onClick={()=>input.current?.click()}>{busy?tr('이미지 처리 중…','Processing image…','画像を処理中…'):tr('PC에서 이미지 가져오기','Import image from PC','PCから画像を取り込む')}</button>}
  <ul>{Object.entries(assets).map(([id,asset])=><li key={id}>
   {/* eslint-disable-next-line @next/next/no-img-element -- The source is a player-imported raster data URL, not a network asset. */}
   <img src={/^data:image\/(png|jpeg|webp);base64,/.test(asset.dataUrl)?asset.dataUrl:undefined} alt={asset.alt||asset.name||id}/>
   <div><strong>{asset.name||id}</strong><code>asset:{id}</code><label>{tr('이미지 설명 (alt)','Image description (alt)','画像の説明 (alt)')}<input data-testid={'project-image-alt-'+id} value={asset.alt||''} maxLength={120} disabled={disabled||busy} onChange={event=>save({...assets,[id]:{...asset,alt:event.target.value}})}/></label>
   {!disabled&&<div className="project-actions"><button className="outline-button" disabled={busy} data-testid={'project-image-insert-'+id} onClick={()=>onInsert(id,asset.alt||'')}>{tr('HTML에 넣기','Insert into HTML','HTMLに挿入')}</button><button className="career-text-button" disabled={busy} onClick={()=>{const next={...assets};delete next[id];save(next);setNotice(tr('이미지를 지웠어요. HTML의 해당 img 줄도 지우거나 다른 이미지로 바꿔 주세요.','Image removed. Remove its img tag or choose another image in your HTML.','画像を削除しました。HTMLのimg行も削除するか別の画像に変えてください。'));}}>{tr('삭제','Remove','削除')}</button></div>}</div>
  </li>)}</ul>
  {notice&&<p role="status" data-testid="project-image-status">{notice}</p>}
 </section>;
}
