import {INITIAL_FILES} from './content.ts';
import type {Language} from './translations.ts';

const COPY:[string,string,string,string][]=[
 ['우리 동네 카페','Our neighborhood cafe','街のカフェ','街角咖啡馆'],
 ['오늘도 당신의 속도로. 모노에서 잠깐 쉬어 가세요.','Take a little break at Mono, at your own pace.','今日もあなたのペースで。モノでひと休み。','按照自己的节奏，在莫诺稍作休息。'],
 ['아메리카노','Americano','アメリカーノ','美式咖啡'],
 ['카페 라테','Cafe Latte','カフェラテ','咖啡拿铁'],
 ['바닐라 라테','Vanilla Latte','バニララテ','香草拿铁'],
 ['고소하고 깔끔한 매일의 커피','A smooth, clean everyday coffee','香ばしくすっきりした毎日のコーヒー','醇香清爽的日常咖啡'],
 ['부드러운 우유와 진한 에스프레소','Soft milk and rich espresso','やさしいミルクと濃いエスプレッソ','柔滑牛奶与浓郁意式浓缩'],
 ['달콤한 바닐라가 필요한 오후','For an afternoon that needs sweet vanilla','甘いバニラがほしい午後に','献给需要香甜香草的午后'],
 ['담기','Add','追加','加入'],
 ['입문 실습: 아래 width의 960px을 100%로 바꿔 보세요.','First exercise: change the width below from 960px to 100%.','入門実習：下のwidthを960pxから100%に変えましょう。','入门练习：将下面的width从960px改为100%。'],
 [' 한 잔은 4,500원입니다.',' costs 4,500 per cup.','は1杯4,500です。','每杯4,500。'],
 ['수량을 바꾸면 합계도 달라져야 해요.','The total must change with the quantity.','杯数に合わせて合計も変わるはずです。','总价应随数量变化。'],
 ['의뢰: /api/menu 에서 메뉴를 제공하고 주문을 보관하세요.','Request: serve the menu at /api/menu and keep incoming orders.','依頼：/api/menuでメニューを提供し、注文を保存してください。','委托：通过/api/menu提供菜单并保存订单。'],
];

const README:Record<Language,string>={
 ko:INITIAL_FILES['README.md'],
 en:'# Mono Cafe / menu-site — first project\n\nRepair two values and publish your first website.\n\n## Your task\n1. index.html: put Mono Cafe between the h1 tags.\n2. style.css: change the menu width from 960px to 100%.\n\n## Start\n1. Install Node.js and npm.\n2. Run npm install in the project folder.\n3. Run npm run dev.\n4. Open http://localhost:5173 in Ghrom.\n\n## Files\nindex.html — page structure\nstyle.css — colors and layout\napp.js — order total\nserver.py — menu API and order storage\n\n## Deliver\nRun checks → git add . → git commit -m "Describe your change" → git push\nCreate a PR in CatHub → review and merge → release\n\nAll installs and servers run inside the simulated game PC.\n',
 ja:'# モノカフェ / menu-site — 最初のプロジェクト\n\n2か所を直して初めてのホームページを公開しましょう。\n\n## 今日の作業\n1. index.html：h1タグの間の店名をモノカフェに変更。\n2. style.css：メニューのwidthを960pxから100%に変更。\n\n## 起動\n1. Node.jsとnpmを用意します。\n2. プロジェクトのフォルダーでnpm install。\n3. npm run dev。\n4. Ghromでhttp://localhost:5173を開きます。\n\n## ファイル\nindex.html — ページの構造\nstyle.css — 色とレイアウト\napp.js — 注文の合計\nserver.py — メニューAPIと注文の保存\n\n## 提出\n検査 → git add . → git commit -m "修正の説明" → git push\nCatHubでPR作成 → レビュー・マージ → 公開\n\nインストールとサーバーはすべてゲーム内の仮想PCで動きます。\n',
 zh:'# 莫诺咖啡馆 / menu-site — 第一个项目\n\n修正两处内容，发布你的第一个网站。\n\n## 今天的任务\n1. index.html：将h1标签之间的店名改为莫诺咖啡馆。\n2. style.css：将菜单的width从960px改为100%。\n\n## 启动\n1. 准备Node.js和npm。\n2. 在项目文件夹中运行npm install。\n3. 运行npm run dev。\n4. 在Ghrom中打开http://localhost:5173。\n\n## 文件\nindex.html — 页面结构\nstyle.css — 颜色和布局\napp.js — 订单总价\nserver.py — 菜单API与订单保存\n\n## 交付\n检查 → git add . → git commit -m "修改说明" → git push\n在CatHub创建PR → 审核与合并 → 发布\n\n所有安装和服务器操作都在游戏内的虚拟电脑中运行。\n',
};

/** Translate authored starter files once, when cloned. Never rewrite a player's saved code. */
export function starterFiles(language:Language='ko'):Record<string,string>{
 const files={...INITIAL_FILES};
 if(language==='ko')return files;
 const column=language==='en'?1:language==='ja'?2:3;
 for(const file of Object.keys(files)){
  for(const row of COPY)files[file]=files[file].replaceAll(row[0],row[column]);
 }
 files['README.md']=README[language];
 return files;
}
