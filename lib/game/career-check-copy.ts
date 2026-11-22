import {L,type Localized} from './career-content.ts';

const weekdays:Record<string,string>={mon:'周一',tue:'周二',wed:'周三',thu:'周四',fri:'周五',sat:'周六',sun:'周日'};

/** Only authored check-label formats are translated. Captured names remain verbatim. */
export function careerCheckCopy(ko:string,en:string,ja:string):Localized {
 let m:RegExpExecArray|null,zh:string|undefined;
 if((m=/^(\d+)개 합계$/.exec(ko)))zh=`${m[1]}个的总价`;
 else if((m=/^([\s\S]+) 판매 가능$/.exec(ko)))zh=`${m[1]}可售`;
 else if((m=/^([\s\S]+) 예약 수량$/.exec(ko)))zh=`${m[1]}预订数量`;
 else if((m=/^([\s\S]+) 09시 접수$/.exec(ko)))zh=`${Object.hasOwn(weekdays,m[1])?weekdays[m[1]]:m[1]}09:00接收`;
 else if((m=/^순위 (\d+)$/.exec(ko)))zh=`第${m[1]}名`;
 else if((m=/^([\s\S]+) 수업 길이$/.exec(ko)))zh=`${m[1]}课程时长`;
 else if((m=/^(\d+)px 전체 너비$/.exec(ko)))zh=`${m[1]}px下的总宽度`;
 return L(ko,en,ja,zh);
}
