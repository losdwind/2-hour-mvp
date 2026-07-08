---
name: storyboard-to-video
description: 按分镜表与分镜图用即梦 dreamina seedance frames2video 逐镜生成视频，ffmpeg 加速拼接成 AI 产品演示成片。当用户拿着分镜表/分镜图说"开始生成视频""把分镜变成成片""继续做视频"时，务必使用本技能。本技能是「点子 → PRD → 高保真交互稿 → 分镜表 → AI 演示视频」四步工作流的最后一步，输入为 hifi-to-storyboard 技能的产物（分镜表 md + frames/ 标准帧）。
---

# 分镜表 + 分镜图 → 视频成片

输入是分镜表 markdown 和每页标准帧图。产出为成片 mp4 与逐镜质检抽帧图。

先读 `references/dreamina-cli.md` 完成 CLI 安装、登录、积分确认。这一步是全流程最大的积分支出，动手前必须报预估并让用户确认。

## 第 1 步 · 开工检查

1. 读分镜表，核对每镜的首尾帧文件都存在且完好（`python3 scripts/check_media.py frames/`）。
2. `dreamina frames2video -h` 核对时长范围与模型选项；`dreamina user_credit` 查余额。
3. 分镜表没写运动 prompt 的镜头，按下面模板补齐。

## 第 2 步 · 试跑

先跑 2-3 镜给用户确认节奏与画面语言，确认后再批量。返工一镜的成本远低于返工全片。试跑确认三个点：动作是否在镜内完成、动作后的静止拖尾是否超过 1.5 秒、构图档位是否与分镜表的节律规划一致。

每镜 prompt = 业务动作 + 运动公共约束。公共约束原文（机身静止是成片质感的关键，缺了它设备会乱飞）：

```
The device body stays perfectly still and upright, never rotates, flips or moves; only the content displayed inside the screen changes. Camera locked, UI text stays sharp and legible, status bar time and icons stay unchanged, quick snappy screen transition, no scene cut, no extra text.
```

业务动作写实（指尖点了什么、界面怎么响应）：

```
On the phone screen a fingertip taps the orange 继续 button, the comfort dialog closes and a new quiz appears with Chinese headline 谈判，协商 and four choices.
```

入场镜（设备浮入）与收尾镜（设备退场、标题淡入）例外，允许机身运动，prompt 单独写。

## 第 3 步 · 批量生成

```bash
dreamina frames2video --first=frames/<A>.png --last=frames/<B>.png --duration=4 --prompt="<动作> <公共约束>" --poll=0
```

- 比例由首帧推断。生成时长用模型下限（通常 4s），目标节奏靠后期加速实现。
- 用户在乎速度选 fast 系模型，在乎质量才用旗舰系。
- 每条提交输出存 tasklog/，`query_result --submit_id=<id> --download_dir=clips` 取回。
- 单次 bash 有 45 秒上限时提交按 2-3 个一批，轮询拆多次调用；超时的调用可能已在后台完成，先查文件再决定重跑。
- 每段下载后 `check_media.py clips/`。ffmpeg 报 Invalid NAL unit / Packet corrupt 即下载截断，重跑同条 query_result 覆盖，不重复扣积分。

## 第 4 步 · 后期与质检

```bash
# 生成时长 → 目标时长（如 4s → 3s，速率 1.3333）
ffmpeg -y -i clips/wNN.mp4 -vf "setpts=PTS/1.3333" -af "atempo=1.3333" -r 60 -c:v libx264 -preset fast -crf 18 clips/wNN_3s.mp4
# 按分镜顺序拼接
printf "file 'clips/w01_3s.mp4'\n..." > concat.txt
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy 成片.mp4
```

拼完必做，五查（抽帧图随成片一起交付）：

```bash
# 每个剪辑点两侧各 1 秒的连续帧条，专查跳变
ffmpeg -ss <剪辑点秒数-1> -t 2 -i 成片.mp4 -vf "fps=5,scale=216:-1,tile=10x1" -frames:v 1 cut_NN.png
```

1. `ffprobe` 核对总时长；每镜中点抽帧拼 montage，核对页面覆盖、机身稳定、结尾品牌标题露出 ≥4s。
2. 小字放大抽查：音标、例句、按钮文案逐镜看，生成会改坏拼写（实测 negotiate 变 negoliate、音标变 /nɪgeolian/），坏帧只重跑该镜。
3. 一致性：状态栏时钟全片一致（实测同片内 9:41 → 9:57 → 9:20 乱跳）；统计数字单调递增、与剧情不矛盾（刚演答错别紧接 85% 答对率）。
4. 剪辑点帧条两侧设备占比与位置一致，跳变说明该点没执行"镜 k 尾帧 = 镜 k+1 首帧"。
5. 响度：交付前 `ffmpeg -af loudnorm=I=-14:TP=-1.5:LRA=11` 归一（seedance 自带音轨峰值实测到 -0.6dB，平台二次归一会发闷），或整轨替换配乐后再归一。

发现某镜机身翻转或内容错误时，只重跑该镜（检查两端标准帧是否竖直、prompt 是否带公共约束），报单镜重跑成本，别整片重来。

## 费用纪律

动手前报预估（段数 × 单价，先按一段实测校准单价），试跑后再批量，交付时报实际消耗与余额。中断恢复：tasklog/ 里有 submit_id 的任务积分已花，先 query_result 免费取回再考虑重生成。
