# product-video-pipeline

从一个产品点子到 AI 演示视频的完整工作流插件。

## 技能一览

| 技能 | 作用 | 交付物 |
|------|------|--------|
| product-video | 统一入口，判断起点、串联四阶段、设检查点 | 全链路 |
| idea-to-prd | 问答把点子收敛成 PRD | PRD markdown |
| prd-to-hifi | 按 PRD 页面清单生成可点击交互稿 | 单文件 HTML |
| hifi-to-storyboard | 截图、规划分镜、seedream 生成分镜图 | 截图 + 分镜表 + 分镜图 |
| storyboard-to-video | seedance 逐镜生成、加速拼接 | 成片 mp4 + 质检图 |

## 安装

任意支持 Agent Skills 规范的 agent（Claude Code、Codex、Cursor、OpenCode 等 70+）：

```bash
npx skills add losdwind/product-video-pipeline
```

Claude Cowork 用户：下载本仓库 Releases 里的 `product-video-pipeline.plugin`，或把仓库目录打包为 .plugin 后在对话中安装。

## 用法

说"把这个 idea 做成演示视频"走全流程，或直接把 PRD / 交互稿 / 分镜表丢给对应阶段技能单独使用。

## 依赖

- 即梦 dreamina CLI（阶段 3、4 使用，安装命令 `curl -s https://jimeng.jianying.com/cli | bash`，首次需 OAuth 登录，生成消耗即梦积分）
- ffmpeg、Python3 + PIL（校验与后期）
- headless 浏览器任一（puppeteer / playwright / Chrome），仅阶段 3 截图用

## 交付物衔接约定

页面 id 在 PRD 页面清单里定义，交互稿 DOM 用 `#s-<页面id>`，截图与分镜帧文件名沿用同一 id，四个阶段可无缝续跑。
