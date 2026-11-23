'use client';
import {useState} from 'react';
import Image from 'next/image';

type Translate=(ko:string,en:string,ja:string,zh:string)=>string;

export function PhotoCounter({lioAlbum,tr}:{lioAlbum:string;tr:Translate}){
 const [account,setAccount]=useState<'Mina'|'Lio'>('Mina');
 const owner=account==='Mina'?'Mina':lioAlbum;
 return <section className="customer-evidence" data-testid="photo-counter">
  <h4>{tr('사진관 공용 태블릿','Photo studio shared tablet','写真館の共用タブレット','照相馆的共用平板')}</h4>
  <p>{tr('미나가 사진을 본 뒤 로그아웃했어요. 같은 태블릿에서 리오로 로그인해 보세요.','Mina just signed out after viewing her photos. Sign in as Lio on the same tablet.','ミナが写真を見てログアウトしました。同じ端末でリオとしてログインしてみましょう。','米娜看完照片后退出了。在同一台平板上登录利奥的账号。')}</p>
  <div className="evidence-accounts">{(['Mina','Lio'] as const).map(name=><button type="button" key={name} className="outline-button" aria-pressed={account===name} onClick={()=>setAccount(name)}>{name}</button>)}</div>
  <figure aria-live="polite">
   <Image unoptimized src={owner==='Mina'?'/game-art/wallpaper-garden.png':'/game-art/wallpaper-coast.png'} alt="" width={400} height={105}/>
   <figcaption data-testid="album-owner">{tr('개인 앨범','Private album','個人アルバム','私人相册')} · {owner}</figcaption>
  </figure>
 </section>;
}

export function TransitDesk({source,tr}:{source:string;tr:Translate}){
 const rows=source.trim().split(/\r?\n/);
 const [marked,setMarked]=useState<number[]>([]);
 const [checked,setChecked]=useState(false);
 const isOutage=(row:string)=>/^\S+\s+ERROR\s+\S+\s+503$/.test(row.trim());
 const wrong=marked.filter(i=>!isOutage(rows[i]));
 const missing=rows.filter((row,i)=>isOutage(row)&&!marked.includes(i));
 const feedback=wrong.length
  ?tr('다른 종류의 사건도 골랐어요. 이 시각의 상태를 확인하세요.','One marked event is a different kind of incident. Recheck this timestamp.','別種の記録も含まれています。この時刻の状態を確認してください。','选中的记录里有其他事件。请检查这个时间点。')+' '+rows[wrong[0]].split(' ')[0]
  :missing.length?tr('아직 보고서에서 빠진 장애가 있어요.','The report is still missing an outage.','まだ報告に入っていない障害があります。','报告中还有遗漏的故障。')
  :tr('장애 기록을 모두 찾았어요. 내 보고서 파일도 같은 요청을 집계하는지 확인하세요.','You found every outage. Check whether your report file counts the same requests.','障害記録がそろいました。自分の報告ファイルも同じリクエストを数えるか確かめましょう。','你找出了全部故障。检查报告文件是否统计了相同的请求。');
 return <section className="customer-evidence" data-testid="transit-desk">
  <h4>{tr('관제실 근무 일지','Dispatch shift log','運行管理室の日誌','调度值班日志')}</h4>
  <p>{tr('일시적으로 운행 조회가 끊긴 시각을 골라 하루에게 건넬 메모를 만드세요. 404는 주소를 찾지 못함, 500은 내부 오류, 503은 일시 중단이에요.','Mark the requests that went temporarily offline for Haru’s handover. 404 means not found, 500 is an internal error, and 503 means temporarily unavailable.','ハルへの引き継ぎ用に一時停止の記録を選びます。404は該当なし、500は内部エラー、503は一時停止です。','为小春的交班记录标出暂时中断的请求。404 表示未找到，500 是内部错误，503 是暂时不可用。')}</p>
  <fieldset><legend>{tr('승객 신고와 대조할 기록','Records to match with passenger reports','乗客の連絡と照合する記録','与乘客反馈核对的记录')}</legend>
   {rows.map((row,i)=><label key={i}><input type="checkbox" checked={marked.includes(i)} onChange={e=>{setChecked(false);setMarked(e.target.checked?[...marked,i]:marked.filter(n=>n!==i));}}/><code>{row}</code></label>)}
  </fieldset>
  <button type="button" className="outline-button" disabled={!marked.length} onClick={()=>setChecked(true)}>{tr('인계 메모 확인','Check handover note','引き継ぎメモを確認','核对交班记录')}</button>
  <div role="status">{checked&&feedback}</div>
 </section>;
}
