'use client';
import {useEffect,useState} from 'react';

/** 잔액은 즉시 표시하고 변화량만 연출한다. 보상이나 저장 상태는 수정하지 않는다. */
export function CreditReadout({amount}:{amount:number}){
 const [previous,setPrevious]=useState(amount);
 const [change,setChange]=useState<{amount:number;id:number}|null>(null);
 if(previous!==amount){setPrevious(amount);setChange({amount:amount-previous,id:(change?.id??0)+1});}
 useEffect(()=>{if(!change)return;const timer=setTimeout(()=>setChange(null),1800);return()=>clearTimeout(timer);},[change]);
 return <span className="credit-readout"><b data-testid="credit-balance">{amount.toLocaleString()} cr</b>{change&&<span key={change.id} data-testid="credit-change" data-kind={change.amount>0?'earned':'spent'} className="credit-change" aria-hidden="true">{change.amount>0?'+':'−'}{Math.abs(change.amount).toLocaleString()} cr</span>}</span>;
}
