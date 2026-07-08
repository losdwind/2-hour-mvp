# dreamina（即梦）CLI 参考

即梦官方 AIGC 命令行工具。本文覆盖安装、登录、本技能用到的子命令与实测坑。所有 flag 以 `dreamina <子命令> -h` 实时输出为准，别依赖本文写死的取值范围。

## 安装

```bash
curl -s https://jimeng.jianying.com/cli | bash
export PATH="$HOME/.local/bin:$PATH"   # 每个独立 bash 调用都要重新 export
dreamina -h
```

安装器按平台下载对应二进制（macOS / Linux，arm64 / x64 均有），装到 `~/.local/bin/dreamina`。

## 登录（OAuth Device Flow）

交互终端直接 `dreamina login`。无头环境（沙盒、CI）用两段式：

```bash
dreamina login --headless
# 输出 verification_uri / user_code / device_code
# 把 verification_uri 原样发给用户，让用户浏览器打开并确认授权
dreamina login checklogin --device_code=<device_code> --poll=40
# 轮询直到输出 "OAuth 登录成功"；单次 bash 有 45s 上限就多次调用轮询
```

登录成功后确认余额：

```bash
dreamina user_credit   # total_credit 字段
```

## 生成子命令

所有生成命令都是异步的。`--poll=0` 提交后立即返回 JSON（含 submit_id 与 gen_status），判定提交成功的标准是 submit_id 存在且 gen_status 为 querying 或 success，不要只看退出码。

### image2image（生成标准帧用）

```bash
dreamina image2image --images "<图1,图2,...>" --prompt="..." --ratio=9:16 --poll=0
```

- 支持多图输入。本技能约定图 1 为 UI 截图、图 2 为环境风格参考，并在 prompt 里说明各图角色。
- ratio 支持 21:9 到 9:16 各档；resolution_type 2k/4k，默认即可。
- 实测单张 2k 图约 5 积分（2026-07）。

### text2image（无现成环境参考图时生成一张）

```bash
dreamina text2image --prompt="<统一风格前缀 + 环境空镜描述>" --ratio=9:16 --poll=0
```

### frames2video（逐镜生成用）

```bash
dreamina frames2video --first=<首帧> --last=<尾帧> --duration=4 --prompt="..." --poll=0
```

- 比例由首帧图片尺寸推断，不需要也不能传 ratio。
- 时长下限实测为 4 秒（seedance1.5pro 4-12s，seedance2.0 系 4-15s，以 -h 为准）。要 3 秒节奏就生成 4 秒后期加速。
- 模型：默认 seedance2.0_vip（720p/1080p/4k）；fast 系便宜且快，画质要求不高时优先。
- 实测 seedance2.0_vip 720p 4 秒一段约 80 积分、10 秒约 500 积分（2026-07，会变，动手前自己按一段实测）。
- 首次用高风险模型可能返回 AigcComplianceConfirmationRequired，让用户去即梦 Web 完成授权确认后重试。

### query_result（取回结果）

```bash
dreamina query_result --submit_id=<id> --download_dir=<目录>
```

- gen_status 为 success 时附带下载。fail 时读 fail_reason 并主动告知用户。
- 排队中会长时间 querying，视频通常 1-3 分钟，批量提交后统一轮询效率最高。

## 实测坑

1. **下载截断**。`--download_dir` 落盘的 png/mp4 偶发尾部缺失。每次下载后必须校验（用本技能 `scripts/check_media.py`），坏文件重跑同一条 query_result 会覆盖修复，无需重新生成。
2. **PATH 不持久**。每个独立 bash 调用都要重新 `export PATH="$HOME/.local/bin:$PATH"`。
3. **挂载目录删除受限**。Cowork 挂载盘上 rm 可能报 Operation not permitted，改用覆盖写。
4. **submit_id 必须落盘**。每个任务的提交输出存成 tasklog/<任务名>.txt，断线、超时、跨会话续跑全靠它。
5. **bash 45 秒上限**（Cowork 沙盒）。提交按 2-3 个一批；轮询用短 sleep 多次调用；超时的调用可能仍在后台完成了，先查文件再决定重跑。
6. **积分先问后花**。生成前 user_credit + 预估 + 用户确认，生成后报实际消耗。
