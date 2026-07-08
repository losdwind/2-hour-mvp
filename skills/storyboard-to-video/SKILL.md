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

先跑 2-3 镜给用户确认节奏与画面语言，确认后再批量。返工一镜的成本远低于返工全片。

每镜 prompt = 业务动作 + 运动公共约束。公共约束原文（机身静止是成片质感的关键，缺了它设备会乱飞）：

```
The device body stays perfectly still and upright, never rotates, flips or moves; only the content displayed inside the screen changes. Camera locked, UI text stays sharp and legible, quick snappy screen transition, no scene cut, no extra text.
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

拼完必做：`ffprobe` 核对总时长；按每镜中点抽帧拼 montage，逐镜核对页面覆盖、机身稳定、结尾标题。抽帧图随成片一起交付。

发现某镜机身翻转或内容错误时，只重跑该镜（检查两端标准帧是否竖直、prompt 是否带公共约束），报单镜重跑成本，别整片重来。

## 费用纪律

动手前报预估（段数 × 单价，先按一段实测校准单价），试跑后再批量，交付时报实际消耗与余额。中断恢复：tasklog/ 里有 submit_id 的任务积分已花，先 query_result 免费取回再考虑重生成。
