import {OPS_JOBS} from './ops-content.ts';

type Pair=readonly [string,string];
type Rule=readonly [RegExp,(match:RegExpExecArray)=>Pair];
/** Static authored lines for python3/sqlite3 and the typo helper (ko → [en, ja]). */
export const OPS_LINES:Record<string,Pair>={
 '대화형 모드 대신 python3 파일.py 또는 python3 -c "코드"를 사용하세요.':['Interactive mode is not simulated. Use python3 file.py or python3 -c "code".','対話モードの代わりにpython3 ファイル.pyまたはpython3 -c "コード"を使ってください。'],
 '── 의뢰 검사 ──':['── Job check ──','── 依頼チェック ──'],
 '★ 이미 완료한 의뢰예요. 마음껏 더 고쳐 보세요.':['★ Job already complete. Feel free to keep improving it.','★ 完了済みの依頼です。自由に改良を続けてください。'],
 '사용법: sqlite3 <db 파일> "SELECT ...;"  또는  sqlite3 <db 파일> < query.sql':['Usage: sqlite3 <db file> "SELECT ...;"  or  sqlite3 <db file> < query.sql','使用方法: sqlite3 <dbファイル> "SELECT ...;"  または  sqlite3 <dbファイル> < query.sql'],
 '.help            이 도움말':['.help            This help','.help            このヘルプ'],
 '.tables          표 목록':['.tables          List tables','.tables          テーブル一覧'],
 '.schema [표]      표 구조(CREATE TABLE)':['.schema [table]   Table structure (CREATE TABLE)','.schema [表]      テーブル構造(CREATE TABLE)'],
 '.read FILE       파일의 SQL 실행':['.read FILE       Run the SQL in a file','.read FILE       ファイルのSQLを実行'],
 'E: 이 실습에서는 nodejs, npm, git, python3, python3-pip, sqlite3을 지원합니다.':['E: This simulator supports nodejs, npm, git, python3, python3-pip and sqlite3.','E: このシミュレーターはnodejs、npm、git、python3、python3-pip、sqlite3に対応しています。'],
};
const label=(text:string):Pair=>{const hidden=/^숨은 데이터 #(\d+)$/.exec(text);return hidden?[`hidden data #${hidden[1]}`,`隠しデータ #${hidden[1]}`]:text==='공개 데이터'?['visible data','公開データ']:[text,text];};
const SUMMARIES:Rule[]=[
 [/^(\d+)번째 줄이 달라요$/,m=>[`line ${m[1]} differs`,`${m[1]}行目が違います`]],
 [/^줄 수가 달라요 \(기대 (\d+)줄, 실제 (\d+)줄\)$/,m=>[`line count differs (expected ${m[1]}, got ${m[2]})`,`行数が違います（期待 ${m[1]}行、実際 ${m[2]}行）`]],
 [/^실행 중 오류 — (.+)$/,m=>[`error while running — ${m[1]}`,`実行中のエラー — ${m[1]}`]],
 [/^쿼리 오류 — (.+)$/,m=>[`query error — ${m[1]}`,`クエリのエラー — ${m[1]}`]],
 [/^SELECT 결과가 없어요$/,()=>['no SELECT result','SELECTの結果がありません']],
 [/^열 개수가 달라요 \(기대 (\d+)개, 실제 (\d+)개\)$/,m=>[`column count differs (expected ${m[1]}, got ${m[2]})`,`列の数が違います（期待 ${m[1]}、実際 ${m[2]}）`]],
 [/^행 개수가 달라요 \(기대 (\d+)행, 실제 (\d+)행\)$/,m=>[`row count differs (expected ${m[1]}, got ${m[2]})`,`行の数が違います（期待 ${m[1]}行、実際 ${m[2]}行）`]],
 [/^행은 맞지만 순서가 달라요$/,()=>['right rows, wrong order','行は合っていますが順番が違います']],
 [/^(\d+)번째 행이 달라요$/,m=>[`row ${m[1]} differs`,`${m[1]}行目のデータが違います`]],
];
const summary=(text:string):Pair=>{for(const [pattern,build] of SUMMARIES){const m=pattern.exec(text);if(m)return build(m);}return [text,text];};
const hints=new Map<string,Pair>(OPS_JOBS.flatMap(job=>job.hints.map(hint=>[hint.ko,[hint.en,hint.ja] as Pair] as const)));
const RULES:Rule[]=[
 [/^✔ (공개 데이터|숨은 데이터 #\d+) 결과 일치$/,m=>{const [en,ja]=label(m[1]);return [`✔ ${en}: output matches`,`✔ ${ja}: 結果が一致`];}],
 [/^✘ (공개 데이터|숨은 데이터 #\d+): (.+)$/,m=>{const [en,ja]=label(m[1]),[sen,sja]=summary(m[2]);return [`✘ ${en}: ${sen}`,`✘ ${ja}: ${sja}`];}],
 [/^ {2}기대: ([\s\S]*)$/,m=>[`  expected: ${m[1]}`,`  期待: ${m[1]}`]],
 [/^ {2}실제: ([\s\S]*)$/,m=>[`  actual:   ${m[1]}`,`  実際: ${m[1]}`]],
 [/^힌트: (.+)$/,m=>{const pair=hints.get(m[1]);return pair?[`Hint: ${pair[0]}`,`ヒント: ${pair[1]}`]:[`Hint: ${m[1]}`,`ヒント: ${m[1]}`];}],
 [/^★ 의뢰 완료! \+(\d+) cr · \+(\d+) XP$/,m=>[`★ Job complete! +${m[1]} cr · +${m[2]} XP`,`★ 依頼完了！ +${m[1]} cr · +${m[2]} XP`]],
 [/^✔ 결과가 맞아요! 이 쿼리를 (\S+)에 저장하고 sqlite3 (\S+) < (\S+) 로 납품하세요\.$/,m=>[`✔ Correct result! Save this query in ${m[1]} and deliver it with sqlite3 ${m[2]} < ${m[3]}.`,`✔ 結果は正解です！このクエリを${m[1]}に保存し、sqlite3 ${m[2]} < ${m[3]}で納品しましょう。`]],
 [/^대화형 모드 대신 sqlite3 (\S+) "SELECT \.\.\.;" 또는 sqlite3 (\S+) < query\.sql을 사용하세요\.$/,m=>[`Interactive mode is not simulated. Use sqlite3 ${m[1]} "SELECT ...;" or sqlite3 ${m[2]} < query.sql.`,`対話モードの代わりにsqlite3 ${m[1]} "SELECT ...;"またはsqlite3 ${m[2]} < query.sqlを使ってください。`]],
 [/^혹시 이거였나요\? → (.+) {2}\(Tab 키로 채우기\)$/,m=>[`Did you mean → ${m[1]}  (press Tab to fill it in)`,`もしかして → ${m[1]}  （Tabキーで入力）`]],
];
/** Returns the translated line, or null when the line is not an authored pattern. */
export function translateOpsLine(line:string,language:'en'|'ja'):string|null{
 const fixed=OPS_LINES[line];if(fixed)return fixed[language==='en'?0:1];
 for(const [pattern,build] of RULES){const m=pattern.exec(line);if(m)return build(m)[language==='en'?0:1];}
 return null;
}
