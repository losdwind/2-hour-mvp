# 2-hour-mvp

[![skills.sh](https://skills.sh/b/losdwind/2-hour-mvp)](https://skills.sh/losdwind/2-hour-mvp)

2 小时从一个点子做出可演示的 MVP。四个交付物一条流水线：**PRD → 可点击高保真 → 分镜图 → AI 演示视频**，视频生成基于即梦 seedream / seedance。

下面所有产物来自同一个真实项目「猫咖背单词」——治愈系猫咖经营 + 背单词 App，19 个页面，60 秒成片。

<table>
<tr>
<td width="62%" valign="top">

**输入** · 一句话点子，或一份多页高保真交互稿

> "在猫咖里背单词的 App，背词就是营业，猫是学习搭子，有断签回归安抚"

流水线自动完成 PRD 问答收敛、界面生成、逐页截图、分镜规划、AI 帧生成与视频合成。

<img src="assets/input-hifi-catcafe.jpg" alt="猫咖背单词高保真三页" width="100%">

</td>
<td width="38%" valign="top">

**输出** · AI 演示视频成片

<img src="assets/demo-catcafe-60s-4x.gif" alt="60 秒成片 4 倍速预览" width="100%">

<sub>60 秒成片 4 倍速预览 · 20 镜覆盖全部 19 页</sub>

</td>
</tr>
</table>

## 工作流

```
 点子 ──▶ ① idea-to-prd ──▶ ② prd-to-hifi ──▶ ③ hifi-to-storyboard ──▶ ④ storyboard-to-video
           PRD 文档          可点击 HTML         分镜表 + 分镜图            视频成片 mp4
```

统一入口技能 `product-video` 自动判断你手里的东西处于哪一步，从那一步接着跑；每个阶段技能也可以单独使用。

| 技能 | 作用 | 交付物 |
| ------------------- | ---------------------- | -------------- |
| product-video       | 统一入口，判断起点、串联四阶段、设检查点   | 全链路            |
| idea-to-prd         | 问答把点子收敛成 PRD           | PRD markdown   |
| prd-to-hifi         | 按 PRD 页面清单生成可点击交互稿     | 单文件 HTML       |
| hifi-to-storyboard  | 截图、规划分镜、seedream 生成分镜图 | 截图 + 分镜表 + 分镜图 |
| storyboard-to-video | seedance 逐镜生成、加速拼接     | 成片 mp4 + 质检图   |

## 各阶段产物 · 猫咖背单词

### ① PRD · 页面清单直接喂给下一阶段

```markdown
| 页面 id      | 页面名        | 业务分组 | 核心元素                                  | 进入方式        |
| home        | 猫咖首页      | 主界面   | 场景背景、今日营业进度、开门营业大按钮      | 引导完成后默认   |
| quiz-wrong  | 答错安抚      | 每日学习 | 弹层"没关系再看一眼"、词义回看、继续按钮    | 答错任意题目     |
| streak-back | 断签回归态    | 主界面   | 安抚卡"昨天休息了一天"、重新开门按钮        | 断签后次日启动   |
```

<sub>页面清单宁全勿缺，答错安抚、断签回归这类状态页是演示视频里的亮点</sub>

### ② 可点击高保真 · 单文件 HTML，真文案真状态

<img src="assets/stage2-hifi-catcafe.jpg" alt="猫咖背单词 19 页高保真总览" width="100%">

<sub>19 页全览：引导 5 页、主界面 3 页、每日学习 5 页、结算 2 页、周边 4 页。奶油粉彩风由问答选定，页面间按真实业务流跳转，file:// 直接打开可点</sub>

### ③ 分镜图 · 每页一张统一风格标准帧

<img src="assets/stage3-frames-catcafe.jpg" alt="猫咖背单词分镜图" width="100%">

<sub>seedream 把每页截图放进统一环境（soft 3D 猫咖），UI 文字保持像素级可读。镜 k 尾帧 = 镜 k+1 首帧，剪辑点零跳变</sub>

### ④ 成片 · 3 秒一镜按业务逻辑走完全部页面

<img src="assets/stage4-film-strip-catcafe.jpg" alt="60 秒成片 20 镜抽帧" width="100%">

<sub>60 秒 20 镜逐镜抽帧：开场空镜入场 → 引导五连 → 开门营业 → 学词答题 → 结算礼物 → 周边页面 → 断签回归 → 品牌帧收尾。手机机身全程静止只切屏幕内容</sub>

## 安装

任意支持 Agent Skills 规范的 agent（Claude Code、Codex、Cursor、OpenCode 等 70+）：

```bash
npx skills add losdwind/2-hour-mvp
```

Claude Cowork 用户：下载 [Releases](https://github.com/losdwind/2-hour-mvp/releases) 里的 `2-hour-mvp.plugin` 直接安装。

## 用法

对 agent 说"把这个 idea 做成演示视频"走全流程；或把 PRD / 交互稿 / 分镜表直接丢给对应阶段技能。每进入花钱阶段前会先报即梦积分预估并等你确认（参考成本：上图 60s 成片约 1500 积分，12s 短片约 500）。

## 依赖

- 即梦 dreamina CLI（阶段 ③④ 使用，`curl -s https://jimeng.jianying.com/cli | bash`，首次 OAuth 登录，生成消耗即梦积分）
- ffmpeg、Python3 + PIL（校验与后期）
- headless 浏览器任一（puppeteer / playwright / Chrome），仅阶段 ③ 截图用

## 交付物衔接约定

页面 id 在 PRD 页面清单里定义，交互稿 DOM 用 `#s-<页面id>`，截图与分镜帧文件名沿用同一 id，四个阶段可无缝续跑，也可从任意中间产物进场。

## License

MIT
