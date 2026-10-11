import test from 'node:test';
import assert from 'node:assert/strict';
import {columnNames,describeSchema,executeSql,formatSqlCell,formatSqlResult,listTables,type SqlDatabase,type SqlResult} from './sql-engine.ts';

const deepFreeze=<T,>(value:T):T=>{if(value&&typeof value==='object'){for(const item of Object.values(value))deepFreeze(item);Object.freeze(value);}return value;};
// Same data as the sqlite3 fixture the expectations were checked against.
const db:SqlDatabase=deepFreeze({tables:[
 {name:'menu',columns:[{name:'id',type:'INTEGER',primaryKey:true},{name:'name',type:'TEXT'},{name:'price',type:'INTEGER'},{name:'category',type:'TEXT'},{name:'stock',type:'INTEGER'}],rows:[[1,'americano',3000,'coffee',12],[2,'latte',4500,'coffee',0],[3,'카페라떼',4000,'coffee',5],[4,'green tea',3500,'tea',8],[5,'유자차',3800,'tea',0],[6,'cookie',2500,'dessert',20],[7,'cheesecake',6000,'dessert',null],[8,'iced tea',3500,'tea',3]]},
 {name:'patients',columns:[{name:'id',type:'INTEGER',primaryKey:true},{name:'name',type:'TEXT'},{name:'dept',type:'TEXT'},{name:'priority',type:'INTEGER'},{name:'arrived',type:'TEXT'},{name:'status',type:'TEXT'}],rows:[[1,'김민준','내과',3,'09:10','waiting'],[2,'Alice Kim','정형외과',5,'09:05','waiting'],[3,'이서연','내과',5,'09:20','waiting'],[4,'Bob Lee','소아과',2,'08:55','done'],[5,'박지호','내과',4,'09:00','waiting'],[6,'Chloe Park','정형외과',3,'09:15','waiting'],[7,'최유나','소아과',1,'09:30','waiting'],[8,'Daniel Choi','내과',2,'08:40','done'],[9,'정하은','정형외과',4,'09:25','waiting'],[10,'Eve Han','소아과',null,'09:35','waiting']]},
 {name:'sales',columns:[{name:'booth',type:'TEXT'},{name:'amount',type:'INTEGER'},{name:'day',type:'TEXT'}],rows:[['떡볶이',12000,'sat'],['lemonade',8000,'sat'],['떡볶이',30000,'sun'],['photo',25000,'sat'],['lemonade',15000,'sun'],['photo',30000,'sun'],['떡볶이',9000,'sun'],['bracelet',5000,'sat'],['bracelet',null,'sun']]},
 {name:'doctors',columns:[{name:'id',type:'INTEGER',primaryKey:true},{name:'name',type:'TEXT'},{name:'dept',type:'TEXT'}],rows:[[1,'Dr. Han','내과'],[2,'Dr. Yoon','정형외과'],[3,'Dr. Seo','피부과']]},
]});
const snapshot=JSON.stringify(db);

const run=(sql:string,source:SqlDatabase=db):SqlResult=>{const out=executeSql(source,sql);assert.ok(out.ok,out.ok?sql:`${sql} -> ${out.error}`);return out.results[out.results.length-1];};
const table=(sql:string,source?:SqlDatabase)=>run(sql,source).rows.map(r=>r.map(formatSqlCell));
const column=(sql:string)=>run(sql).rows.map(r=>r[0].value);
const failure=(sql:string,options?:{maxRows?:number;maxWork?:number},source:SqlDatabase=db)=>{const out=executeSql(source,sql,options);assert.equal(out.ok,false,sql);return out.ok?'':out.error;};

test('curriculum reference queries return exactly the expected rows',()=>{
 assert.deepEqual(table('SELECT name, price FROM menu WHERE price < 4000 AND stock > 0 ORDER BY price;'),[['cookie','2500'],['americano','3000'],['green tea','3500'],['iced tea','3500']]);
 assert.deepEqual(table("SELECT name, priority, arrived FROM patients WHERE status = 'waiting' ORDER BY priority DESC, arrived LIMIT 5;"),[['Alice Kim','5','09:05'],['이서연','5','09:20'],['박지호','4','09:00'],['정하은','4','09:25'],['김민준','3','09:10']]);
 const waiting=run("SELECT dept, COUNT(*) AS waiting FROM patients WHERE status = 'waiting' GROUP BY dept ORDER BY waiting DESC, dept;");
 assert.deepEqual(waiting.columns,['dept','waiting']);
 assert.deepEqual(waiting.rows,[[{value:'내과',kind:'text'},{value:3,kind:'integer'}],[{value:'정형외과',kind:'text'},{value:3,kind:'integer'}],[{value:'소아과',kind:'text'},{value:2,kind:'integer'}]]);
 const totals=run('SELECT booth, SUM(amount) AS total FROM sales GROUP BY booth HAVING total >= 50000 ORDER BY total DESC;');
 assert.deepEqual(totals.columns,['booth','total']);
 assert.deepEqual(totals.rows.map(r=>r.map(formatSqlCell)),[['photo','55000'],['떡볶이','51000']]);
});

test('SELECT *, column lists, aliases and sqlite-style default column names',()=>{
 const star=run('SELECT * FROM menu WHERE id = 3');
 assert.deepEqual(star.columns,['id','name','price','category','stock']);
 assert.deepEqual(star.rows,[[{value:3,kind:'integer'},{value:'카페라떼',kind:'text'},{value:4000,kind:'integer'},{value:'coffee',kind:'text'},{value:5,kind:'integer'}]]);
 const named=run("SELECT NAME, menu.Name AS N2, (price), 'abc', 1+1,  price  *  2 , price p FROM menu WHERE id = 1");
 assert.deepEqual(named.columns,['name','N2','price',"'abc'",'1+1','price  *  2','p']);
 assert.deepEqual(named.rows.map(r=>r.map(formatSqlCell)),[['americano','americano','3000','abc','2','6000','3000']]);
 assert.deepEqual(run('SELECT COUNT(*), count( * ) FROM menu').columns,['COUNT(*)','count( * )']);
 assert.deepEqual(run(`SELECT name AS "Menu Name", price [가격], stock '재고' FROM menu WHERE id = 2`).columns,['Menu Name','가격','재고']);
 assert.deepEqual(table('select NAME from MENU where ID = 3'),[['카페라떼']]);
 assert.deepEqual(table('/* lead */ SELECT name FROM /* mid */ menu WHERE id = 2 -- tail'),[['latte']]);
 assert.deepEqual(table("SELECT 1 + 1 AS two, 'x' || 'y', 'O''Brien'"),[['2','xy',"O'Brien"]]);
 assert.deepEqual(run('SELECT menu.* FROM menu WHERE id = 8').columns,['id','name','price','category','stock']);
});

test('WHERE supports every comparison, IN, BETWEEN, IS NULL, LIKE and three-valued logic',()=>{
 assert.deepEqual(column('SELECT id FROM menu WHERE price = 3500'),[4,8]);
 assert.deepEqual(column('SELECT id FROM menu WHERE price != 3500 AND price <> 4500 AND price >= 3800 AND price <= 6000'),[3,5,7]);
 assert.deepEqual(column('SELECT id FROM menu WHERE price > 4000 OR price < 3000'),[2,6,7]);
 assert.deepEqual(column("SELECT id FROM menu WHERE category IN ('tea', 'dessert') AND id NOT IN (4, 7)"),[5,6,8]);
 assert.deepEqual(column('SELECT id FROM menu WHERE price BETWEEN 3000 AND 3800'),[1,4,5,8]);
 assert.deepEqual(column('SELECT id FROM menu WHERE price NOT BETWEEN 3000 AND 3800'),[2,3,6,7]);
 assert.deepEqual(column('SELECT id FROM menu WHERE stock IS NOT NULL AND stock < 5'),[2,5,8]);
 assert.deepEqual(column('SELECT id FROM menu WHERE stock IS NULL'),[7]);
 assert.deepEqual(column('SELECT id FROM menu WHERE stock = NULL'),[]);
 assert.deepEqual(column('SELECT id FROM menu WHERE NOT (stock > 5)'),[2,3,5,8]);
 assert.deepEqual(column('SELECT id FROM menu WHERE stock > 5 OR stock IS NULL'),[1,4,6,7]);
 const logic=run('SELECT NULL AND 0, NULL AND 1, NULL OR 1, NULL OR 0, NOT NULL, 1 IN (2, NULL), 1 NOT IN (2, NULL), NULL IN (), 2 IS TRUE, 0 IS NOT FALSE').rows[0];
 assert.deepEqual(logic.map(c=>c.kind),['integer','null','integer','null','null','null','null','integer','integer','integer']);
 assert.deepEqual(logic.map(formatSqlCell),['0','','1','','','','','0','1','0']);
 assert.deepEqual(table("SELECT name FROM menu WHERE name LIKE '%TEA'"),[['green tea'],['iced tea']]);
 assert.deepEqual(table("SELECT name FROM menu WHERE name NOT LIKE '%e%'"),[['카페라떼'],['유자차']]);
 assert.deepEqual(table("SELECT name FROM menu WHERE name LIKE '_atte' OR name LIKE '카페%'"),[['latte'],['카페라떼']]);
 assert.deepEqual(table("SELECT 'ÉCOLE' LIKE 'école', 'ABC' LIKE 'abc', '100%' LIKE '100!%' ESCAPE '!', '1000' LIKE '100!%' ESCAPE '!', 'abc' LIKE NULL"),[['0','1','1','0','']]);
});

test('ORDER BY handles multiple keys, DESC, aliases, ordinals, NULL placement and stable ties',()=>{
 assert.deepEqual(table('SELECT name, stock FROM menu ORDER BY stock'),[['cheesecake',''],['latte','0'],['유자차','0'],['iced tea','3'],['카페라떼','5'],['green tea','8'],['americano','12'],['cookie','20']]);
 assert.deepEqual(table('SELECT name, stock FROM menu ORDER BY stock DESC'),[['cookie','20'],['americano','12'],['green tea','8'],['카페라떼','5'],['iced tea','3'],['latte','0'],['유자차','0'],['cheesecake','']]);
 assert.deepEqual(column('SELECT name FROM menu ORDER BY stock DESC NULLS FIRST LIMIT 2'),['cheesecake','cookie']);
 assert.deepEqual(table('SELECT category, name FROM menu ORDER BY category DESC, price, name'),[['tea','green tea'],['tea','iced tea'],['tea','유자차'],['dessert','cookie'],['dessert','cheesecake'],['coffee','americano'],['coffee','카페라떼'],['coffee','latte']]);
 assert.deepEqual(table('SELECT name, price * 2 AS doubled FROM menu ORDER BY doubled DESC LIMIT 3'),[['cheesecake','12000'],['latte','9000'],['카페라떼','8000']]);
 assert.deepEqual(table('SELECT name, price FROM menu ORDER BY 2, 1 LIMIT 4'),[['cookie','2500'],['americano','3000'],['green tea','3500'],['iced tea','3500']]);
 assert.deepEqual(column("SELECT name FROM menu WHERE category = 'tea' ORDER BY name"),['green tea','iced tea','유자차']);
 assert.deepEqual(column('SELECT name FROM menu ORDER BY name COLLATE NOCASE DESC LIMIT 3'),['카페라떼','유자차','latte']);
});

test('LIMIT, OFFSET and DISTINCT',()=>{
 assert.deepEqual(column('SELECT id FROM menu ORDER BY id LIMIT 2 OFFSET 1'),[2,3]);
 assert.deepEqual(column('SELECT id FROM menu ORDER BY id LIMIT 1, 2'),[2,3]);
 assert.deepEqual(column('SELECT id FROM menu LIMIT -1 OFFSET 6'),[7,8]);
 assert.deepEqual(column("SELECT id FROM menu LIMIT '2'"),[1,2]);
 assert.deepEqual(column('SELECT id FROM menu LIMIT 0'),[]);
 assert.deepEqual(column('SELECT DISTINCT category FROM menu'),['coffee','tea','dessert']);
 assert.deepEqual(table('SELECT DISTINCT dept, status FROM patients ORDER BY dept, status'),[['내과','done'],['내과','waiting'],['소아과','done'],['소아과','waiting'],['정형외과','waiting']]);
 assert.deepEqual(column('SELECT DISTINCT price FROM menu ORDER BY price DESC LIMIT 3'),[6000,4500,4000]);
});

test('GROUP BY with COUNT/SUM/AVG/MIN/MAX/TOTAL/GROUP_CONCAT and HAVING',()=>{
 const grouped=run('SELECT category, COUNT(*), SUM(price), AVG(price), MIN(price), MAX(price), TOTAL(stock), COUNT(stock) FROM menu GROUP BY category');
 assert.deepEqual(grouped.rows.map(r=>r.map(formatSqlCell)),[['coffee','3','11500','3833.33333333333','3000','4500','17.0','3'],['dessert','2','8500','4250.0','2500','6000','20.0','1'],['tea','3','10800','3600.0','3500','3800','11.0','3']]);
 assert.deepEqual(grouped.rows[1].map(c=>c.kind),['text','integer','integer','real','integer','integer','real','integer']);
 assert.deepEqual(table('SELECT category, COUNT(*) AS n FROM menu GROUP BY category HAVING n >= 3'),[['coffee','3'],['tea','3']]);
 assert.deepEqual(table('SELECT category, ROUND(AVG(price), 1) AS avg_price FROM menu GROUP BY category HAVING MAX(price) > 4000 ORDER BY avg_price'),[['coffee','3833.3'],['dessert','4250.0']]);
 assert.deepEqual(table("SELECT category, GROUP_CONCAT(name, ', ') FROM menu GROUP BY category ORDER BY COUNT(*) DESC, category"),[['coffee','americano, latte, 카페라떼'],['tea','green tea, 유자차, iced tea'],['dessert','cookie, cheesecake']]);
 assert.deepEqual(table('SELECT COUNT(DISTINCT category), GROUP_CONCAT(DISTINCT category), SUM(DISTINCT price) FROM menu'),[['3','coffee,tea,dessert','27300']]);
 assert.deepEqual(table('SELECT booth, COUNT(amount), COUNT(*), SUM(amount), AVG(amount) FROM sales GROUP BY booth ORDER BY booth'),[['bracelet','1','2','5000','5000.0'],['lemonade','2','2','23000','11500.0'],['photo','2','2','55000','27500.0'],['떡볶이','3','3','51000','17000.0']]);
 // Bare columns follow SQLite: the min()/max() row, otherwise the first row of the group.
 assert.deepEqual(table('SELECT dept, name, MIN(priority) FROM patients GROUP BY dept'),[['내과','Daniel Choi','2'],['소아과','최유나','1'],['정형외과','Chloe Park','3']]);
 assert.deepEqual(table('SELECT category, name, COUNT(*) FROM menu GROUP BY 1'),[['coffee','americano','3'],['dessert','cookie','2'],['tea','green tea','3']]);
});

test('aggregates over an empty set return one row without GROUP BY and none with it',()=>{
 const empty=run('SELECT COUNT(*), SUM(price), AVG(price), MIN(price), MAX(price), TOTAL(price), GROUP_CONCAT(name), name FROM menu WHERE price > 99999');
 assert.deepEqual(empty.rows.map(r=>r.map(c=>c.kind)),[['integer','null','null','null','null','real','null','null']]);
 assert.deepEqual(empty.rows.map(r=>r.map(formatSqlCell)),[['0','','','','','0.0','','']]);
 assert.deepEqual(run('SELECT category, COUNT(*) FROM menu WHERE price > 99999 GROUP BY category').rows,[]);
 assert.deepEqual(table('SELECT COUNT(*), SUM(1)'),[['1','1']]);
});

test('INNER, LEFT, comma, USING and NATURAL joins',()=>{
 assert.deepEqual(table('SELECT p.name, d.name AS doctor FROM patients p JOIN doctors d ON p.dept = d.dept WHERE p.id <= 4 ORDER BY p.id'),[['김민준','Dr. Han'],['Alice Kim','Dr. Yoon'],['이서연','Dr. Han']]);
 const left=run('SELECT p.name, d.name AS doctor FROM patients AS p LEFT JOIN doctors AS d ON d.dept = p.dept WHERE p.id IN (4, 7) ORDER BY p.id');
 assert.deepEqual(left.rows,[[{value:'Bob Lee',kind:'text'},{value:null,kind:'null'}],[{value:'최유나',kind:'text'},{value:null,kind:'null'}]]);
 assert.deepEqual(table('SELECT d.name, COUNT(p.id) AS patients FROM doctors d LEFT JOIN patients p ON p.dept = d.dept GROUP BY d.id ORDER BY d.id'),[['Dr. Han','4'],['Dr. Yoon','3'],['Dr. Seo','0']]);
 assert.deepEqual(table('SELECT patients.name, doctors.name FROM patients, doctors WHERE patients.dept = doctors.dept AND patients.id > 7'),[['Daniel Choi','Dr. Han'],['정하은','Dr. Yoon']]);
 assert.deepEqual(table('SELECT COUNT(*) FROM patients CROSS JOIN doctors'),[['30']]);
 const using=run('SELECT * FROM patients JOIN doctors USING (dept) ORDER BY patients.id LIMIT 1');
 assert.deepEqual(using.columns,['id','name','dept','priority','arrived','status','id','name']);
 assert.deepEqual(using.rows[0].map(formatSqlCell),['1','김민준','내과','3','09:10','waiting','1','Dr. Han']);
 assert.deepEqual(table('SELECT a.name, b.name FROM menu a JOIN menu b ON a.price = b.price AND a.id < b.id'),[['green tea','iced tea']]);
 assert.deepEqual(table('SELECT COUNT(*) FROM menu NATURAL JOIN menu AS m2'),[['7']]);
 const natural=run('SELECT * FROM menu NATURAL LEFT JOIN doctors WHERE menu.id = 1');
 assert.deepEqual(natural.columns,['id','name','price','category','stock','dept']);
 assert.deepEqual(natural.rows.map(r=>r.map(formatSqlCell)),[['1','americano','3000','coffee','12','']]);
});

test('integer division, REAL arithmetic and sqlite3 value text',()=>{
 assert.deepEqual(table('SELECT 7 / 2, 7.0 / 2, 7 / 2.0, 1.0 / 3, 6.0 / 2, 10 % 3, 2 * 1.5, 5 / 0, -7 / 2, 5.5 % 2, 7 % -3'),[['3','3.5','3.5','0.333333333333333','3.0','1','3.0','','-3','1.0','1']]);
 assert.deepEqual(table("SELECT '3.0' + 1, '12abc' + 1, 'abc' + 1, '1e3' + 0, '3' * '4', -'abc'"),[['4.0','13','1','1000.0','12','0']]);
 assert.deepEqual(table("SELECT AVG(price) FROM menu WHERE category = 'dessert'"),[['4250.0']]);
 const real=(value:number)=>formatSqlCell({value,kind:'real'});
 assert.deepEqual([3,2.5,1/3,1e20,1.5e-7,123456789012345678,0.0001,-0,1e15,1e14,4250,-12.5,Infinity].map(real),['3.0','2.5','0.333333333333333','1.0e+20','1.5e-07','1.23456789012346e+17','0.0001','0.0','1.0e+15','100000000000000.0','4250.0','-12.5','Inf']);
 assert.equal(formatSqlCell({value:42,kind:'integer'}),'42');
 assert.equal(formatSqlCell({value:null,kind:'null'}),'');
 assert.equal(formatSqlCell({value:'한글 text',kind:'text'}),'한글 text');
 const reals:SqlDatabase={tables:[{name:'metrics',columns:[{name:'label',type:'TEXT'},{name:'ratio',type:'REAL'}],rows:[['x',3],['y',0.5],['z',null],['w','2']]}]};
 assert.deepEqual(table('SELECT ratio, typeof(ratio) FROM metrics',reals),[['3.0','real'],['0.5','real'],['','null'],['2.0','real']]);
});

test('ROUND rounds half away from zero and scalar functions follow SQLite',()=>{
 assert.deepEqual(table('SELECT ROUND(2.5), ROUND(-2.5), ROUND(0.5), ROUND(3.14159, 2), ROUND(2.675, 2), ROUND(7), typeof(ROUND(7)), ROUND(NULL), ROUND(1234.5678, -1)'),[['3.0','-3.0','1.0','3.14','2.67','7.0','real','','1235.0']]);
 assert.deepEqual(table("SELECT UPPER('abc한'), LOWER('ÀBC'), LENGTH('카페라떼'), SUBSTR('hello', -3), SUBSTR('hello', 2, 2), SUBSTR('한국어테스트', 2, 2), SUBSTR('hello', 0, 2), TRIM('  a  '), LTRIM('xxaxx', 'x'), RTRIM('xxaxx', 'x'), REPLACE('a-b-c', '-', '+'), INSTR('hello', 'l')"),[['ABC한','Àbc','4','llo','el','국어','h','a','axx','xxa','a+b+c','3']]);
 assert.deepEqual(table("SELECT COALESCE(NULL, NULL, 'z'), IFNULL(NULL, 3), NULLIF(5, 5), NULLIF(1, '1'), ABS(-3), ABS(-3.5), TYPEOF(1), TYPEOF(1.0), TYPEOF('a'), TYPEOF(NULL), MAX(1, 7, 3), MIN(2, NULL), IIF(1 > 2, 'yes', 'no')"),[['z','3','','1','3','3.5','integer','real','text','null','7','','no']]);
 assert.deepEqual(table("SELECT CAST('3.9' AS INTEGER), CAST(3.7 AS INTEGER), CAST(-3.7 AS INTEGER), CAST(3 AS REAL), CAST(2.50 AS TEXT), CAST('12abc' AS INTEGER), CAST('abc' AS REAL), typeof(CAST(5 AS TEXT)), CAST('3.0' AS NUMERIC)"),[['3','3','-3','3.0','2.5','12','0.0','text','3']]);
 assert.deepEqual(table("SELECT name || ' (' || dept || ')' AS label, 'a' || NULL FROM patients WHERE priority >= 5"),[['Alice Kim (정형외과)',''],['이서연 (내과)','']]);
});

test('CASE in both forms',()=>{
 assert.deepEqual(table("SELECT name, CASE WHEN stock IS NULL THEN 'unknown' WHEN stock = 0 THEN 'sold out' WHEN stock < 5 THEN 'low' ELSE 'ok' END AS state, CASE category WHEN 'coffee' THEN 'C' WHEN 'tea' THEN 'T' END AS code FROM menu ORDER BY id"),[['americano','ok','C'],['latte','sold out','C'],['카페라떼','ok','C'],['green tea','ok','T'],['유자차','sold out','T'],['cookie','ok',''],['cheesecake','unknown',''],['iced tea','low','T']]);
 assert.deepEqual(table("SELECT CASE 3 WHEN 3.0 THEN 'match' ELSE 'no' END, CASE NULL WHEN NULL THEN 'n' ELSE 'e' END, CASE WHEN 1 > 2 THEN 'a' END"),[['match','e','']]);
});

test('comparisons apply SQLite column affinity; literals compare by storage class',()=>{
 assert.deepEqual(column("SELECT id FROM menu WHERE price > '3500'"),[2,3,5,7]);
 assert.deepEqual(table("SELECT id, name FROM menu WHERE id = '3'"),[['3','카페라떼']]);
 assert.deepEqual(table("SELECT 3 = '3', 3 = 3.0, '3' = 3.0, 'a' < 'b', 'B' < 'a', NULL = NULL, NULL IS NULL, 1 IS NOT 2, 1 < 'a', '2' > '10'"),[['0','1','0','1','1','','1','1','1','1']]);
 assert.deepEqual(table("SELECT name, priority FROM patients WHERE priority IN ('5', 4) ORDER BY id"),[['Alice Kim','5'],['이서연','5'],['박지호','4'],['정하은','4']]);
 assert.deepEqual(table("SELECT COUNT(*) FROM menu WHERE name > 5"),[['8']]);
 assert.deepEqual(column("SELECT name FROM patients WHERE arrived BETWEEN '09:00' AND '09:15' ORDER BY arrived DESC"),['Chloe Park','김민준','Alice Kim','박지호']);
});

test('errors use sqlite3 CLI wording on a single line',()=>{
 const cases:[string,string][]=[
  ['SELECT nme FROM patients','Parse error: no such column: nme'],
  ['SELECT * FROM nope','Parse error: no such table: nope'],
  ['SELECT * FORM menu','Parse error: near "FORM": syntax error'],
  ['SELECT * FROM','Parse error: incomplete input'],
  ['SELECT name FROM menu WHERE','Parse error: incomplete input'],
  ['SELECT * FROM menu WHERE;','Parse error: near ";": syntax error'],
  ['SELECT 1 2','Parse error: near "2": syntax error'],
  ['HELLO','Parse error: near "HELLO": syntax error'],
  ['SELECT id FROM patients JOIN doctors ON patients.dept = doctors.dept','Parse error: ambiguous column name: id'],
  ['SELECT COUNT(*) FROM menu WHERE COUNT(*) > 1','Parse error: misuse of aggregate: COUNT()'],
  ['SELECT name FROM menu WHERE COUNT(*) > 1','Parse error: misuse of aggregate function COUNT()'],
  ['SELECT SUM(COUNT(*)) FROM menu','Parse error: misuse of aggregate function COUNT()'],
  ['SELECT name FROM menu ORDER BY count(*)','Parse error: misuse of aggregate: count()'],
  ['SELECT count(*) AS c FROM menu GROUP BY c','Parse error: aggregate functions are not allowed in the GROUP BY clause'],
  ['SELECT name FROM menu HAVING price > 1','Parse error: HAVING clause on a non-aggregate query'],
  ['SELECT ROUND() FROM menu','Parse error: wrong number of arguments to function ROUND()'],
  ['SELECT round(1, 2, 3)','Parse error: wrong number of arguments to function round()'],
  ['SELECT COUNT(DISTINCT price, name) FROM menu','Parse error: wrong number of arguments to function COUNT()'],
  ['SELECT FOO(1)','Parse error: no such function: FOO'],
  ['SELECT name FROM menu ORDER BY 3','Parse error: 1st ORDER BY term out of range - should be between 1 and 1'],
  ['SELECT name FROM menu ORDER BY name, 5','Parse error: 2nd ORDER BY term out of range - should be between 1 and 1'],
  ['SELECT name FROM menu GROUP BY 3','Parse error: 1st GROUP BY term out of range - should be between 1 and 1'],
  ['SELECT x.name FROM menu','Parse error: no such column: x.name'],
  ['SELECT name FROM menu m WHERE menu.id = 1','Parse error: no such column: menu.id'],
  ['SELECT x.* FROM menu','Parse error: no such table: x'],
  ['SELECT *','Parse error: no tables specified'],
  ["SELECT 'abc",`Parse error: unrecognized token: "'abc"`],
  ['SELECT 1abc','Parse error: unrecognized token: "1abc"'],
  ['SELECT #','Parse error: unrecognized token: "#"'],
  ['SELECT name FROM patients WHERE status = "waiting"','Parse error: no such column: "waiting" - should this be a string literal in single-quotes?'],
  ['SELECT 1 FROM menu JOIN doctors USING (nope)','Parse error: cannot join using column nope - column not present in both tables'],
  ['SELECT (1, 2)','Parse error: row value misused'],
  ["SELECT 'a' LIKE 'a' ESCAPE 'xy'",'Runtime error: ESCAPE expression must be a single character'],
  ["SELECT 1 LIMIT 'abc'",'Runtime error: datatype mismatch (20)'],
  ['SELECT 1 LIMIT 2.5','Runtime error: datatype mismatch (20)'],
  ['SELECT name FROM menu WHERE price IN (SELECT price FROM menu)','Parse error: subqueries are not supported in this simulator'],
  ['SELECT name FROM menu UNION SELECT name FROM doctors','Parse error: UNION is not supported in this simulator'],
  ["SELECT name FROM menu WHERE name GLOB 'a*'",'Parse error: GLOB is not supported in this simulator'],
  ['SELECT ?','Parse error: query parameters (?, :name, @name, $name) are not supported in this simulator'],
  ["SELECT 'line one\nline two",`Parse error: unrecognized token: "'line one line two"`],
 ];
 for(const [sql,error] of cases){const got=failure(sql);assert.equal(got,error,sql);assert.ok(!got.includes('\n'),sql);}
});

test('the database is read-only: writes are rejected and earlier results are kept',()=>{
 for(const sql of ["INSERT INTO menu VALUES (9, 'x', 1, 'y', 1)",'UPDATE menu SET price = 0','DELETE FROM menu','DROP TABLE menu','CREATE TABLE x (a)','ALTER TABLE menu ADD COLUMN y','REPLACE INTO menu VALUES (1)','VACUUM'])assert.equal(failure(sql),'Runtime error: attempt to write a readonly database (8)',sql);
 assert.equal(failure('PRAGMA table_info(menu)'),'Parse error: PRAGMA is not supported in this simulator; only SELECT queries can run');
 assert.equal(failure("ATTACH 'x.db' AS x"),'Parse error: ATTACH is not supported in this simulator; only SELECT queries can run');
 const mixed=executeSql(db,'SELECT name FROM menu WHERE id = 1; DELETE FROM menu; SELECT 1');
 assert.equal(mixed.ok,false);
 assert.deepEqual(mixed.results.map(r=>r.rows.map(row=>row.map(formatSqlCell))),[[['americano']]]);
 const later=executeSql(db,"SELECT 1;\nSELECT 'x");
 assert.deepEqual(later,{ok:false,error:`Parse error: unrecognized token: "'x"`,results:[{columns:['1'],rows:[[{value:1,kind:'integer'}]]}]});
 const many=executeSql(db,'SELECT 1; SELECT 2;; SELECT 3');
 assert.ok(many.ok);
 assert.deepEqual(many.results.map(r=>r.rows[0][0].value),[1,2,3]);
 assert.equal(JSON.stringify(db),snapshot);
});

test('limits: query length, statement count, result rows and work budget',()=>{
 assert.equal(failure(`SELECT 1${' '.repeat(3993)}`),'Parse error: query is too long for this simulator');
 assert.ok(executeSql(db,`SELECT 1${' '.repeat(3992)}`).ok);
 assert.equal(executeSql(db,'SELECT 1;'.repeat(20)).results.length,20);
 assert.equal(failure('SELECT 1;'.repeat(21)),'Parse error: too many statements for this simulator (max 20)');
 const big:SqlDatabase={tables:[{name:'t',columns:[{name:'id',type:'INTEGER'},{name:'s',type:'TEXT'}],rows:Array.from({length:600},(_,i)=>[i+1,`row-${i%10}`])}]};
 assert.equal(failure('SELECT * FROM t',undefined,big),'Runtime error: result has more than 500 rows; add a LIMIT');
 assert.equal(run('SELECT * FROM t LIMIT 500',big).rows.length,500);
 assert.equal(run('SELECT s, COUNT(*) FROM t GROUP BY s',big).rows.length,10);
 assert.equal(failure('SELECT id FROM menu',{maxRows:5}),'Runtime error: result has more than 5 rows; add a LIMIT');
 assert.equal(failure('SELECT * FROM menu',{maxWork:20}),'Runtime error: interrupted (query is too expensive for this simulator)');
 const started=Date.now();
 assert.equal(failure('SELECT COUNT(*) FROM t a, t b, t c',undefined,big),'Runtime error: interrupted (query is too expensive for this simulator)');
 assert.equal(failure('SELECT * FROM t a JOIN t b ON a.s = b.s JOIN t c ON b.s = c.s',undefined,big),'Runtime error: interrupted (query is too expensive for this simulator)');
 assert.ok(Date.now()-started<2000,'cartesian joins must stop quickly');
 const grow=(levels:number)=>Array.from({length:levels}).reduce<string>(inner=>`replace(${inner}, '-', '----------')`,"'----------'");
 assert.equal(run(`SELECT length(${grow(4)})`).rows[0][0].value,100000);
 assert.equal(failure(`SELECT ${grow(5)}`),'Runtime error: string or blob too big (18)');
 assert.equal(failure('SELECT GROUP_CONCAT(a.s || b.s || a.s || b.s) FROM t a, t b',{maxWork:10000000},big),'Runtime error: string or blob too big (18)');
 assert.equal(failure(`SELECT ${'('.repeat(150)}1${')'.repeat(150)}`),'Parse error: parser stack overflow');
 assert.equal(failure(`SELECT ${'- '.repeat(150)}1`),'Parse error: parser stack overflow');
 assert.equal(failure(`SELECT ${Array(1100).fill('1').join('+')}`),'Parse error: Expression tree is too large (maximum depth 1000)');
 assert.deepEqual(table(`SELECT ${Array(900).fill('1').join('+')}`),[['900']]);
});

test('input is never mutated, prototype-like names are plain data, results are deterministic',()=>{
 const sql="SELECT category, COUNT(*), GROUP_CONCAT(name) FROM menu GROUP BY category ORDER BY 2 DESC; SELECT * FROM patients p LEFT JOIN doctors d USING (dept)";
 const first=executeSql(db,sql),second=executeSql(db,sql);
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(db),snapshot);
 first.results[0].rows[0][0].value='changed';
 assert.deepEqual(executeSql(db,sql),second);
 const odd:SqlDatabase=deepFreeze({tables:[{name:'__proto__',columns:[{name:'constructor',type:'TEXT'},{name:'toString',type:'INTEGER'}],rows:[['a',1],['b',2]]}]});
 assert.deepEqual(table('SELECT constructor, toString FROM __proto__ WHERE toString > 1',odd),[['b','2']]);
 assert.deepEqual(table('SELECT __proto__.constructor AS hasOwnProperty FROM __proto__ ORDER BY hasOwnProperty DESC',odd),[['b'],['a']]);
 assert.equal(failure('SELECT * FROM constructor',undefined,odd),'Parse error: no such table: constructor');
 assert.equal(failure('SELECT valueOf(1)'),'Parse error: no such function: valueOf');
 assert.equal(failure('SELECT __proto__ FROM menu'),'Parse error: no such column: __proto__');
 assert.equal(({} as Record<string,unknown>).constructor,Object);
 assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype,'toString'),true);
});

test('formatSqlResult renders sqlite3 column, list and box layouts with wide-character alignment',()=>{
 const result=run('SELECT name, price, stock FROM menu WHERE id IN (3, 6, 7)');
 assert.equal(formatSqlResult(result),['name        price  stock','----------  -----  -----','카페라떼    4000   5','cookie      2500   20','cheesecake  6000'].join('\n'));
 assert.equal(formatSqlResult(result,'column'),formatSqlResult(result));
 assert.equal(formatSqlResult(result,'list'),'카페라떼|4000|5\ncookie|2500|20\ncheesecake|6000|');
 assert.equal(formatSqlResult(result,'box'),[
  '┌────────────┬───────┬───────┐',
  '│    name    │ price │ stock │',
  '├────────────┼───────┼───────┤',
  '│ 카페라떼   │ 4000  │ 5     │',
  '│ cookie     │ 2500  │ 20    │',
  '│ cheesecake │ 6000  │       │',
  '└────────────┴───────┴───────┘',
 ].join('\n'));
 const korean=run('SELECT name AS 이름 FROM menu WHERE id IN (1, 3)');
 assert.equal(formatSqlResult(korean,'box'),['┌───────────┐','│   이름    │','├───────────┤','│ americano │','│ 카페라떼  │','└───────────┘'].join('\n'));
 assert.equal(formatSqlResult(korean),['이름','---------','americano','카페라떼'].join('\n'));
 assert.equal(formatSqlResult(run('SELECT 1.0 / 3 AS third, 2.5 AS half')),['third              half','-----------------  ----','0.333333333333333  2.5'].join('\n'));
 assert.equal(formatSqlResult(run('SELECT name FROM menu WHERE 0')),'');
});

test('describeSchema, listTables and columnNames mirror .schema/.tables',()=>{
 assert.equal(describeSchema(db,'PATIENTS'),'CREATE TABLE patients (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  dept TEXT,\n  priority INTEGER,\n  arrived TEXT,\n  status TEXT\n);');
 assert.equal(describeSchema(db).split('\n').filter(line=>line.startsWith('CREATE TABLE')).join('|'),'CREATE TABLE menu (|CREATE TABLE patients (|CREATE TABLE sales (|CREATE TABLE doctors (');
 assert.ok(describeSchema(db).includes('CREATE TABLE sales (\n  booth TEXT,\n  amount INTEGER,\n  day TEXT\n);'));
 assert.equal(describeSchema(db,'nope'),'');
 const composite:SqlDatabase={tables:[{name:'enroll',columns:[{name:'student',type:'TEXT',primaryKey:true},{name:'course',type:'TEXT',primaryKey:true},{name:'grade',type:'REAL'}],rows:[]}]};
 assert.equal(describeSchema(composite),'CREATE TABLE enroll (\n  student TEXT,\n  course TEXT,\n  grade REAL,\n  PRIMARY KEY (student, course)\n);');
 assert.equal(listTables(db),'doctors   menu      patients  sales');
 const long:SqlDatabase={tables:['e','d','c','b','a'].map(ch=>({name:ch.repeat(30),columns:[],rows:[]}))};
 assert.equal(listTables(long),[`${'a'.repeat(30)}  ${'d'.repeat(30)}`,`${'b'.repeat(30)}  ${'e'.repeat(30)}`,'c'.repeat(30)].join('\n'));
 assert.equal(listTables({tables:[]}),'');
 assert.deepEqual(columnNames(db),['menu','patients','sales','doctors','id','name','price','category','stock','dept','priority','arrived','status','booth','amount','day']);
});
