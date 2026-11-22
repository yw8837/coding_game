import {OPS_JOBS} from './ops-content.ts';

const fixed:Record<string,string>={
 '대화형 모드 대신 python3 파일.py 또는 python3 -c "코드"를 사용하세요.':'不模拟交互模式，请使用python3 文件.py或python3 -c "代码"。',
 '── 의뢰 검사 ──':'── 委托检查 ──',
 '★ 이미 완료한 의뢰예요. 마음껏 더 고쳐 보세요.':'★ 此委托已完成，可以继续自由修改。',
 '사용법: sqlite3 <db 파일> "SELECT ...;"  또는  sqlite3 <db 파일> < query.sql':'用法：sqlite3 <数据库文件> "SELECT ...;" 或 sqlite3 <数据库文件> < query.sql',
 '.help            이 도움말':'.help            显示帮助',
 '.tables          표 목록':'.tables          列出数据表',
 '.schema [표]      표 구조(CREATE TABLE)':'.schema [表]      数据表结构（CREATE TABLE）',
 '.read FILE       파일의 SQL 실행':'.read FILE       执行文件中的SQL',
 'E: 이 실습에서는 nodejs, npm, git, python3, python3-pip, sqlite3을 지원합니다.':'E: 此模拟环境支持nodejs、npm、git、python3、python3-pip与sqlite3。',
};
const label=(text:string)=>text==='공개 데이터'?'可见数据':text.replace(/^숨은 데이터 #(\d+)$/,'隐藏数据 #$1');
const summaries:[RegExp,(m:RegExpExecArray)=>string][]=[
 [/^(\d+)번째 줄이 달라요$/,m=>`第${m[1]}行不同`],
 [/^줄 수가 달라요 \(기대 (\d+)줄, 실제 (\d+)줄\)$/,m=>`行数不同（预期${m[1]}行，实际${m[2]}行）`],
 [/^실행 중 오류 — (.+)$/,m=>`运行错误 — ${m[1]}`],
 [/^쿼리 오류 — (.+)$/,m=>`查询错误 — ${m[1]}`],
 [/^SELECT 결과가 없어요$/,()=>`没有SELECT结果`],
 [/^열 개수가 달라요 \(기대 (\d+)개, 실제 (\d+)개\)$/,m=>`列数不同（预期${m[1]}列，实际${m[2]}列）`],
 [/^행 개수가 달라요 \(기대 (\d+)행, 실제 (\d+)행\)$/,m=>`行数不同（预期${m[1]}行，实际${m[2]}行）`],
 [/^행은 맞지만 순서가 달라요$/,()=>`数据行正确，但顺序不同`],
 [/^(\d+)번째 행이 달라요$/,m=>`第${m[1]}行数据不同`],
];
const summary=(text:string)=>{for(const [pattern,build] of summaries){const match=pattern.exec(text);if(match)return build(match);}return text;};
/** Translate authored diagnostics while leaving captured source/output untouched. */
export function translateOpsChinese(line:string):string|null{
 if(Object.hasOwn(fixed,line))return fixed[line];
 let m:RegExpExecArray|null;
 if((m=/^✔ (공개 데이터|숨은 데이터 #\d+) 결과 일치$/.exec(line)))return `✔ ${label(m[1])}：结果匹配`;
 if((m=/^✘ (공개 데이터|숨은 데이터 #\d+): (.+)$/.exec(line)))return `✘ ${label(m[1])}：${summary(m[2])}`;
 if((m=/^ {2}기대: ([\s\S]*)$/.exec(line)))return `  预期：${m[1]}`;
 if((m=/^ {2}실제: ([\s\S]*)$/.exec(line)))return `  实际：${m[1]}`;
 if((m=/^힌트: (.+)$/.exec(line))){const text=m[1],hint=OPS_JOBS.flatMap(job=>job.hints).find(hint=>hint.ko===text);return `提示：${hint?.zh??text}`;}
 if((m=/^★ 의뢰 완료! \+(\d+) cr · \+(\d+) XP$/.exec(line)))return `★ 委托完成！+${m[1]} cr · +${m[2]} XP`;
 if((m=/^✔ 결과가 맞아요! 이 쿼리를 (\S+)에 저장하고 sqlite3 (\S+) < (\S+) 로 납품하세요\.$/.exec(line)))return `✔ 结果正确！将查询保存到${m[1]}，再使用sqlite3 ${m[2]} < ${m[3]}交付。`;
 if((m=/^대화형 모드 대신 sqlite3 (\S+) "SELECT \.\.\.;" 또는 sqlite3 (\S+) < query\.sql을 사용하세요\.$/.exec(line)))return `不模拟交互模式，请使用sqlite3 ${m[1]} "SELECT ...;"或sqlite3 ${m[2]} < query.sql。`;
 if((m=/^혹시 이거였나요\? → (.+) {2}\(Tab 키로 채우기\)$/.exec(line)))return `你是否想输入 → ${m[1]}  （按Tab填入）`;
 return null;
}
