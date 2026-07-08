---
name: hifi-to-storyboard
description: 把高保真 HTML 交互稿（或一组页面截图）变成演示视频分镜表与分镜图。产出为页面截图、分镜表 markdown（镜头序列 + 三段式 prompt + 可执行命令 + 积分预估）以及用即梦 dreamina seedream 生成的每页标准帧分镜图。当用户提到"分镜""storyboard""规划展示视频 / demo 视频 / 宣传片"或拿着交互稿想做视频时，务必使用本技能。本技能是「点子 → PRD → 高保真交互稿 → 分镜表 → AI 演示视频」四步工作流的第三步，产物直接喂给 storyboard-to-video 技能。
---

# 高保真交互稿 → 分镜表 + 分镜图

三个交付物：页面截图、分镜表 markdown、seedream 生成的标准帧分镜图。到分镜图为止，视频生成交给 storyboard-to-video。

先读 `references/dreamina-cli.md` 完成 CLI 安装、登录、积分确认（生成分镜图要花积分，动手前报预估让用户确认）。

## 第 1 步 · 读稿与定盘

1. 读 HTML，列出全部页面并按业务逻辑排出用户旅程（引导 → 核心操作 → 结算 → 周边页面 → 收尾）。交互稿来自 prd-to-hifi 技能时，侧边栏 `data-s` 顺序即旅程顺序。排完把各镜首尾帧连成一条链自检：同一页面不得重复入链，引导页必须排在首页之前（反例实测过：开场镜以首页收尾、下一镜又跳回引导，首页出现两次，叙事倒流）。
2. 用 AskUserQuestion 确认：目标时长、节奏（默认 3 秒一镜）、是否覆盖全部页面、画面环境风格一句话（如"soft 3D 温暖咖啡馆"）。
3. 镜数 = 目标秒数 / 单镜秒数。3 秒一镜覆盖 N 页通常是 N+1 镜（开场空镜入场，末镜兼收尾）。

## 第 2 步 · 页面截图

优先级：已有整套截图直接用 → `scripts/capture_screens.mjs`（配置驱动，读 HTML 后写 capture-config.json，含 HTML 路径、screen id 列表、跳转表达式模板如 `go('{screen}')`、选择器模板如 `#s-{screen}`；脚本依次尝试 puppeteer → playwright → chromePath）→ Chrome MCP 逐页截。

沙盒装浏览器：arm64 Linux 上 puppeteer 无 Chrome 构建，用 playwright（`npm install playwright && npx playwright install chromium`）；报缺共享库且无 root 时 `apt-get download <包> && dpkg -x <deb> extracted/`，运行时挂 `LD_LIBRARY_PATH`。

截完拼 montage 自查：页面齐全、内容正确、演示态纯净。屏幕里出现"(答对 → 下一题)"这类原型标注就先改交互稿再重截，标注进了标准帧必进成片（实测教训）。整套截图状态栏时钟必须一致（惯例统一 9:41）。

## 第 3 步 · 分镜表

写分镜表 markdown 交用户确认，必须包含：每页标准帧清单（帧文件、页面、截图素材、一句话画面）、镜头序列表（编号、时间码、首帧 → 尾帧、业务动作与运动 prompt 原文、构图档位）、构图节律规划（设备占比分档、视觉标点插入位置）、三段式 prompt 原文、下一阶段命令清单与积分预估。

硬规则与理由：

- **每页只做一张标准帧，镜 k 尾帧 = 镜 k+1 首帧**。剪辑点两侧同一张图，零跳变，免转场补偿。这是成片顺滑的第一要素。
- **切换只发生在屏幕内容上，设备机身静止**。观众看的是产品交互；入场镜与收尾镜是仅有的机身运动例外。
- **单镜按 seedance 时长下限生成（通常 4s），后期加速到目标节奏**，先 `dreamina frames2video -h` 核对当前范围。
- **产品 3 秒内入画**。空镜开场最多占开场镜的前半段；反例实测前 8.5 秒无产品，观众留存窗口全空。
- **负向状态必须闭环**。答错、报错类页面出现后，同镜或下一镜给出正向收尾（重答答对、按下继续）；反例是安抚弹层静置 6.5 秒、按钮从未被按、硬切结算页。
- **统计数字不交给视频模型动**。计数器会非单调乱跳（实测 8→0→5→8、答对率闪 75%），数字页用静态尾帧或本地合成；数字还不得与剧情矛盾，刚演完答错就别展示 85% 答对率。
- **末镜品牌露出 ≥4 秒**。标题居中，配 slogan 或应用图标；反例是标题最后 1.5 秒才在右上角一闪，观众记不住名字。
- **每镜一个动作，动作完成即切，静止拖尾 ≤1.5 秒**。反例实测安抚弹层静置 6.5 秒、结算页停留 7 秒；10 秒一镜的容量撑不满，正是单镜时长该压到 3 秒的根本原因。
- **构图要有节律**。锁机位是为保护 UI，但连续 4 镜以上同构图会钝化注意力（反例实测中段连续 40 秒同机位同占比）。按叙事段落给设备占比分 2-3 档（如引导 70%、核心 78%、收尾拉远），或每 4-6 镜插 1 秒环境特写（IP、猫、咖啡）作视觉标点；标点镜属于整画面切走再切回，返回帧沿用原链同一张标准帧，不破坏"镜 k 尾帧 = 镜 k+1 首帧"。

## 第 4 步 · seedream 生成分镜图

三段式 prompt，全英文更稳：

统一风格前缀（全项目一字不改复用，跨帧一致性的唯一保障）：

```
<Soft 3D render / flat illustration / …> style matching the reference, <环境一句话>, <配色>, <光线>, portrait 9:16 (或 16:9) showcase frame, clean composition, no watermark.
```

有点击演示时，把手指形态也写死进前缀（如 `a small cream cartoon 3D fingertip`），全片只用一种；反例实测同一片子混进真人手和两种卡通手。

设备模板（放 UI 截图的帧都用）：

```
Image 1 is an exact app UI screenshot. Image 2 is the environment style reference. A modern <device> floats perfectly upright and centered in the softly blurred environment, absolutely vertical with no tilt, the screen displays exactly the UI of image 1, keep every UI element and all text pixel-accurate and legible, device occupies ~70 percent of frame height.
```

执行：

```bash
# 无现成环境参考图时，先 text2image 生成环境空镜（兼任开场帧）
dreamina text2image --prompt="<前缀> <环境空镜一句话>" --ratio=9:16 --poll=0
# 每页标准帧
dreamina image2image --images "<UI截图>,<环境参考图>" --prompt="<前缀> <设备模板> <该页一句话>" --ratio=9:16 --poll=0
```

要点：环境参考图全程同一张；submit_id 逐个存 tasklog/；`query_result --download_dir=frames` 取回后必跑 `python3 scripts/check_media.py frames/`（下载偶发截断，重跑同条命令覆盖修复）；拼 montage 自查文字可读、设备竖直、状态栏时钟全套一致，歪帧单独重生成，一张歪帧会污染相邻两镜；音标、整句例句、密集小字的页面默认先用 PIL 把原截图合成回屏幕区域再交给下游（实测音标被重绘成 /nɪgeolian/、negotiate 拼成 negoliate），其余页面发现变形再兜底。

## 第 5 步 · 交付与衔接

交付分镜表 md、frames/ 分镜图、montage 自查图，报实际积分消耗。告诉用户下一步用 storyboard-to-video 生成视频成片，并附该阶段积分预估。
