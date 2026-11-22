export const zhGuides:Record<string,[string,string,string]>={
 terminal:['在终端中找到方向','使用pwd、ls与cd查看当前位置和附近的文件。',`命令以当前文件夹为起点运行。

pwd                 显示当前文件夹
ls                  列出文件与文件夹
cd menu-site        进入项目
cd ..               返回上一级
cat README.md       阅读说明
mkdir practice      创建文件夹

含空格的路径需用引号括起来。Linux是操作系统，此窗口使用Shell命令。`],
 npm:['为什么npm无法运行？','检查已安装工具、项目依赖和当前文件夹。',`1. 在此电脑安装工具
sudo apt update
sudo apt install nodejs npm

2. 进入项目
cd ~/menu-site

3. 安装package.json中列出的依赖
npm install

4. 启动开发服务器
npm run dev

Command not found：缺少工具。
ENOENT：此文件夹中没有所需文件。
vite: not found：请安装项目依赖。

这些命令仅修改游戏内虚拟电脑。`],
 css:['修好第一个页面','更改标题，让菜单宽度适应屏幕。',`在index.html中，将<h1>与</h1>之间的文字改为客户的店名：
<h1>莫诺咖啡馆</h1>

也可使用Mono Cafe或モノカフェ等支持的店名。
HTML负责结构，CSS负责外观。

在style.css中，将width: 960px改为width: 100%。
.menu-grid {
  width: 100%;
}

已有媒体查询会在小屏幕上将卡片改为单列。
@media (max-width: 600px) {
  .menu-grid { grid-template-columns: 1fr; }
}

运行检查会测试360px与1024px屏幕。隐藏菜单卡片无法通过检查。`],
 git:['从你的工作区到CatHub','编辑→暂存→提交→推送→检查→发布。',`克隆仓库：
git clone https://cathub.dev/mono/menu-site.git

检查修改：
git status

暂存当前文件：
git add .

写下说明并记录快照：
git commit -m "Fix mobile menu"

发送到CatHub：
git push origin main

之后的编辑不会改变既有提交，需要重新add、commit与push。PR会检查远程的某个特定提交。游戏采用简化流程，在main上检查修改后发布。`],
 javascript:['用单价与数量计算总价','尝试修改函数输入、返回值与运算符。',`calculateTotal(price, quantity)接收两个数字，返回总价。

+  加法
-  减法
*  乘法
/  除法

function calculateTotal(price, quantity) {
  return price * quantity;
}

return返回计算结果。请测试数量0、1、3，以及不同单价。

此计算练习的运行器支持数字、四则运算、括号、const/let与return，不支持循环、DOM或异步代码。`],
 server:['在Ubuntu上运行API','配置Python，准备虚拟服务器并发送HTTP请求。',`MENU_PATH是菜单地址，SAVE_ORDERS控制订单存储。

MENU_PATH = "/api/menu"
SAVE_ORDERS = True

在本地保存文件，执行add、commit与push。在服务器应用中准备Ubuntu，然后运行：

ssh dev@mono-server
sudo apt update
sudo apt install git python3 python3-pip
git clone https://cathub.dev/mono/menu-site.git
cd menu-site
pip install -r requirements.txt
python3 server.py

后续修改使用git pull更新。运行中的API使用启动时的快照，修改后需用pkill python3停止并重新启动。输入exit返回你的电脑。

在API应用中发送GET http://mono-server:8000/api/menu与POST /api/orders。

咖啡馆服务器练习模拟此模板中的两个设置。订单保存在服务器内存，进程重启后会清空。`],
};
