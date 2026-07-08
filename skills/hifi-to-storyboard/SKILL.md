---
name: hifi-to-storyboard
description: 把高保真 HTML 交互稿（或一组页面截图）变成演示视频分镜表与分镜图。产出为页面截图、分镜表 markdown（镜头序列 + 三段式 prompt + 可执行命令 + 积分预估）以及用即梦 dreamina seedream 生成的每页标准帧分镜图。当用户提到"分镜""storyboard""规划展示视频 / demo 视频 / 宣传片"或拿着交互稿想做视频时，务必使用本技能。本技能是「点子 → PRD → 高保真交互稿 → 分镜表 → AI 演示视频」四步工作流的第三步，产物直接喂给 storyboard-to-video 技能。
---

# 高保真交互稿 → 分镜表 + 分镜图

三个交付物：页面截图、分镜表 markdown、seedream 生成的标准帧分镜图。到分镜图为止，视频生成交给 storyboard-to-video。

先读 `references/dreamina-cli.md` 完成 CLI 安装、登录、积分确认（生成分镜图要花积分，动手前报预估让用户确认）。

## 第 1 步 · 读稿与定盘

1. 读 HTML，列出全部页面并按业务逻辑排出用户旅程（引导 → 核心操作 → 结算 → 周边页面 → 收尾）。交互稿来自 prd-to-hifi 技能时，侧边栏 `data-s` 顺序即旅程顺序。
2. 用 AskUserQuestion 确认：目标时长、节奏（默认 3 秒一镜）、是否覆盖全部页面、画面环境风格一句话（如"soft 3D 温暖咖啡馆"）。
3. 镜数 = 目标秒数 / 单镜秒数。3 秒一镜覆盖 N 页通常是 N+1 镜（开场空镜入场，末镜兼收尾）。

## 第 2 步 · 页面截图

优先级：已有整套截图直接用 → `scripts/capture_screens.mjs`（配置驱动，读 HTML 后写 capture-config.json，含 HTML 路径、screen id 列表、跳转表达式模板如 `go('{screen}')`、选择器模板如 `#s-{screen}`；脚本依次尝试 puppeteer → playwright → chromePath）→ Chrome MCP 逐页截。

沙盒装浏览器：arm64 Linux 上 puppeteer 无 Chrome 构建，用 playwright（`npm install playwright && npx playwright install chromium`）；报缺共享库且无 root 时 `apt-get download <包> && dpkg -x <deb> extracted/`，运行时挂 `LD_LIBRARY_PATH`。

截完拼 montage 自查页面齐全、内容正确。

## 第 3 步 · 分镜表

写分镜表 markdown 交用户确认，必须包含：每页标准帧清单（帧文件、页面、截图素材、一句话画面）、镜头序列表（编号、时间码、首帧 → 尾帧、业务动作与运动 prompt 原文）、三段式 prompt 原文、下一阶段命令清单与积分预估。

硬规则与理由：

- **每页只做一张标准帧，镜 k 尾帧 = 镜 k+1 首帧**。剪辑点两侧同一张图，零跳变，免转场补偿。这是成片顺滑的第一要素。
- **切换只发生在屏幕内容上，设备机身静止**。观众看的是产品交互；入场镜与收尾镜是仅有的机身运动例外。
- **单镜按 seedance 时长下限生成（通常 4s），后期加速到目标节奏**，先 `dreamina frames2video -h` 核对当前范围。

## 第 4 步 · seedream 生成分镜图

三段式 prompt，全英文更稳：

统一风格前缀（全项目一字不改复用，跨帧一致性的唯一保障）：

```
<Soft 3D render / flat illustration / …> style matching the reference, <环境一句话>, <配色>, <光线>, portrait 9:16 (或 16:9) showcase frame, clean composition, no watermark.
```

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

要点：环境参考图全程同一张；submit_id 逐个存 tasklog/；`query_result --download_dir=frames` 取回后必跑 `python3 scripts/check_media.py frames/`（下载偶发截断，重跑同条命令覆盖修复）；拼 montage 自查文字可读、设备竖直，歪帧单独重生成，一张歪帧会污染相邻两镜；小字严重变形时用 PIL 把原截图合成回屏幕区域兜底。

## 第 5 步 · 交付与衔接

交付分镜表 md、frames/ 分镜图、montage 自查图，报实际积分消耗。告诉用户下一步用 storyboard-to-video 生成视频成片，并附该阶段积分预估。
