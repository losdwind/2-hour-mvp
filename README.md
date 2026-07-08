<div align="center">

<img src="assets/banner.jpg" alt="2-hour-mvp" width="100%">

# 2-hour-mvp

**从产品点子到演示视频，约 2 小时。**

四阶段流水线，中间产物依次为 PRD、可点击高保真原型、分镜图。

[![skills.sh](https://skills.sh/b/losdwind/2-hour-mvp)](https://skills.sh/losdwind/2-hour-mvp)
[![Release](https://img.shields.io/github/v/release/losdwind/2-hour-mvp?color=F08A50&label=release)](https://github.com/losdwind/2-hour-mvp/releases)
[![License](https://img.shields.io/github/license/losdwind/2-hour-mvp?color=8A6F5C)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/agent%20skills-70%2B%20agents-5C4432)](https://agentskills.io)

```bash
npx skills add losdwind/2-hour-mvp
```

</div>

---

## 示例

以「猫咖背单词」为例，初始输入为一句话描述：

> 在猫咖里背单词的 App，背词就是营业，猫是学习搭子，有断签回归安抚

<div align="center">

流水线输出的成片（4 倍速预览，原片 60 秒 20 镜，覆盖全部 19 个页面）：

<img src="assets/demo-catcafe-60s-4x.gif" alt="60 秒成片 4 倍速预览" width="280">

</div>

本页所有产物图均出自该案例的同一次运行。

## 流水线

```mermaid
graph LR
    A["💡 点子"] -->|"① idea-to-prd"| B["📋 PRD<br/>页面清单 + 用户旅程"]
    B -->|"② prd-to-hifi"| C["📱 高保真 HTML<br/>19 页可点击"]
    C -->|"③ hifi-to-storyboard"| D["🎬 分镜表 + 分镜图<br/>seedream 标准帧"]
    D -->|"④ storyboard-to-video"| E["🎞️ 演示视频<br/>seedance + ffmpeg"]
```

入口技能 `product-video` 根据已有输入决定起点：仅有点子从阶段 ① 开始，已有 PRD 或交互稿则从对应阶段进入。四个阶段技能相互独立，可单独使用。

| 技能 | 作用 | 交付物 |
| ------------------- | ---------------------- | -------------- |
| **product-video**   | 入口，判断起点、调度阶段、阶段间设检查点 | 全链路            |
| **idea-to-prd**     | 通过问答把点子收敛成 PRD         | PRD markdown   |
| **prd-to-hifi**     | 按 PRD 页面清单生成可点击交互稿     | 单文件 HTML       |
| **hifi-to-storyboard**  | 截图、规划分镜、seedream 生成分镜图 | 截图 + 分镜表 + 分镜图 |
| **storyboard-to-video** | seedance 逐镜生成、加速拼接     | 成片 mp4 + 质检图   |

## 各阶段交付物

### ① PRD，页面清单为下游直接输入

```markdown
| 页面 id      | 页面名     | 业务分组 | 核心元素                               | 进入方式      |
| home        | 猫咖首页   | 主界面   | 场景背景、今日营业进度、开门营业大按钮   | 引导完成后默认 |
| quiz-wrong  | 答错安抚   | 每日学习 | 弹层"没关系再看一眼"、词义回看、继续按钮 | 答错任意题目   |
| streak-back | 断签回归态 | 主界面   | 安抚卡"昨天休息了一天"、重新开门按钮     | 断签后次日启动 |
```

页面清单必须完整。答错安抚、断签回归等状态页容易被遗漏，而它们往往是演示视频中信息量最大的镜头。

### ② 可点击高保真原型，单文件 HTML

<img src="assets/stage2-hifi-catcafe.jpg" alt="猫咖背单词 19 页高保真总览" width="100%">

<sub>19 页：引导 5 页、主界面 3 页、每日学习 5 页、结算 2 页、周边 4 页。配色与风格在生成前通过问答确认。file:// 打开即可交互，跳转遵循真实业务流</sub>

### ③ 分镜图，每页一张统一风格标准帧

<img src="assets/stage3-frames-catcafe.jpg" alt="猫咖背单词分镜图" width="100%">

<sub>seedream 将每页截图置入同一环境（本例为 soft 3D 猫咖），界面文字保持可读</sub>

### ④ 演示视频，3 秒一镜按业务逻辑推进

<img src="assets/stage4-film-strip-catcafe.jpg" alt="60 秒成片 20 镜抽帧" width="100%">

<sub>20 镜逐镜抽帧：空镜入场、引导五连、开门营业、学词答题、结算礼物、周边页面、断签回归、片尾标题</sub>

## 关键约束

以下规则固化在技能中，是成片一致性的来源。

**剪辑点零跳变。** 每页只生成一张标准帧，镜 k 的尾帧即镜 k+1 的首帧。剪辑点两侧为同一张图像，不依赖转场遮挡。

**机身静止。** 运动 prompt 固定设备机身不动，全片仅屏幕内容切换；开场入场与片尾退场是仅有的两处例外。

**成本控制。** 生成前给出即梦积分预估，试跑 2-3 镜确认节奏后再批量提交。下载自动校验，损坏文件可免费重取，中断后从断点恢复。参考成本：60 秒成片约 1500 积分，12 秒短片约 500 积分。

## 安装

**Claude Code / Codex / Cursor / OpenCode 等 70+ agent**

```bash
npx skills add losdwind/2-hour-mvp
```

**Claude Cowork** 下载 [Releases](https://github.com/losdwind/2-hour-mvp/releases) 中的 `2-hour-mvp.plugin`，拖入对话安装。

<details>
<summary><b>依赖</b></summary>

- 即梦 dreamina CLI，第 ③④ 步使用：`curl -s https://jimeng.jianying.com/cli | bash`，首次需 OAuth 登录，生成消耗即梦积分
- ffmpeg、Python3 + PIL，用于校验与后期
- headless 浏览器任一（puppeteer / playwright / Chrome），仅第 ③ 步截图使用

</details>

<details>
<summary><b>交付物衔接</b></summary>

页面 id 在 PRD 页面清单中定义，交互稿 DOM 使用 `#s-<页面id>`，截图与分镜帧文件名沿用同一 id。四个阶段可无缝续跑，也可从任一中间产物进入。

</details>

---

<div align="center">

MIT © [losdwind](https://github.com/losdwind)

</div>
