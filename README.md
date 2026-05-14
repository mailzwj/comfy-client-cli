# ComfyUI CLI (ccc)

> 🚀 一个现代化的 ComfyUI 命令行工具，让你轻松管理、配置和运行工作流

## ✨ 特性

- 📦 **工作流注册** - 一键注册 ComfyUI 工作流文件，自动检测可配置参数
- ⚙️ **参数配置** - 交互式配置提示词、采样步数等参数，并绑定到工作流
- 🚀 **命令行直传参数** - `run` 时通过 `--nodeId-field` 格式直接传入参数值，无需交互
- 🔍 **查看工作流详情** - `view` 命令展示工作流的所有可配置参数及用法示例
- 🏃 **快速运行** - 使用预设参数快速生成图像，`-y` 跳过所有交互
- 🔄 **更新配置** - 随时更新工作流参数默认值


## 📦 安装

### 方式一：从源码安装（推荐）

```bash
git clone https://github.com/mailzwj/comfy-client-cli.git
cd comfy-client-cli
npm install
npm run build
npm link
```

### 方式二：直接运行

```bash
cd comfy-client-cli
npm install
npx tsx src/index.ts --help
```

## 🚀 快速开始

### 1. 注册工作流

```bash
ccc add /path/to/your/workflow.json
```

交互式设置：
- 工作流名称和描述
- 自动检测可配置参数（提示词、采样步数、CFG 等）
- 为每个参数设置显示名称和默认值

### 2. 查看已注册的工作流

```bash
ccc list   # 或 ccc ls
```

### 3. 查看工作流详情（新功能）

```bash
ccc view <workflow-id>
```

显示内容：
- 工作流基本信息（名称、描述、文件路径、注册时间）
- 所有可配置参数（选项名、类型、默认值、对应节点）
- 完整的命令行使用示例

### 4. 运行工作流

```bash
# 交互式运行
ccc run <workflow-id>

# 快速运行（使用默认值）
ccc run <workflow-id> -y

# 命令行直接传参（新功能）
ccc run <workflow-id> --6-text "a beautiful cat" --3-steps 30 --3-cfg 7.5
```

### 5. 更新工作流配置

```bash
ccc update <workflow-id> --params
```

## 📚 命令参考

### add - 注册工作流

```
ccc add <workflow-file> [options]

options:
  -n, --name <name>        工作流名称
  -d, --description <desc> 工作流描述
```

### run - 运行工作流（升级版）

```
ccc run <workflow-id> [options] [动态参数...]

options:
  -o, --output <path>  输出目录（默认：./output）
  -y, --yes            跳过交互，使用默认值
  -s, --server <url>   ComfyUI 服务器地址（默认：http://127.0.0.1:8188）

动态参数（通过 ccc view 查看可用参数）：
  --<nodeId>-<field> <value>   直接设置指定节点的字段值
```

**命令行参数的优先级高于交互式输入**，也就是说：通过 `--nodeId-field` 传入的值会直接使用，不再询问；未传入的参数仍会交互式询问（除非加了 `-y`）。

### view - 查看工作流详情（新命令）

```
ccc view <workflow-id> [options]

options:
  -j, --json  以 JSON 格式输出完整配置
```

### list - 列出工作流

```
ccc list [options]

options:
  -j, --json  以 JSON 格式输出
```

### update - 更新配置

```
ccc update <workflow-id> [options]

options:
  -n, --name <name>    新的工作流名称
  -d, --description    新的工作流描述
  -p, --params         更新参数默认值
```

### delete - 删除工作流

```
ccc delete <workflow-id> [options]

options:
  -y, --yes  跳过确认
```

## 🎯 使用示例

### 示例 1: 注册工作流并绑定参数

```bash
$ ccc add ~/downloads/flux_portrait.json

📋 工作流基本信息

? 请输入工作流名称：flux-dev-portrait
? 请输入工作流描述（可选）：高质量人像生成

⚙️  检测到 5 个可配置参数

? 是否绑定参数 提示词 (节点 6 · CLIPTextEncode)？ Yes
? 参数显示名称：提示词
? 默认值（当前：beautiful scenery nature）：a beautiful woman, photorealistic, 8k

? 是否绑定参数 采样步数 (节点 3 · KSampler)？ Yes
? 参数显示名称：采样步数
? 默认值（当前：20）：20

✓ 工作流注册成功!
  ID:   ab12cd34
  名称：flux-dev-portrait
  参数：2 个可配置参数

💡 提示：运行此工作流使用:
  ccc run ab12cd34
  ccc run ab12cd34 --6-text "你的提示词" --3-steps 25
```

### 示例 2: 查看工作流详情

```bash
$ ccc view ab12cd34

━━━ 工作流信息 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ID:     ab12cd34
  名称：   flux-dev-portrait
  描述：   高质量人像生成
  文件：   /Users/xxx/downloads/flux_portrait.json
  注册时间：2026/5/14 10:00:00
  更新时间：2026/5/14 10:00:00

━━━ 可配置参数 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────┬────────────┬──────┬──────────────────────┬──────────┬──────────────────┐
│ 选项名                      │ 显示名称    │ 类型  │ 默认值               │ 节点 ID  │ 字段             │
├────────────────────────────┼────────────┼──────┼──────────────────────┼──────────┼──────────────────┤
│ --6-text                   │ 提示词      │ string│ a beautiful woman... │ 6        │ text             │
│ --3-steps                  │ 采样步数    │ number│ 20                   │ 3        │ steps            │
└────────────────────────────┴────────────┴──────┴──────────────────────┴──────────┴──────────────────┘

━━━ 使用示例 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # 交互式运行
  ccc run ab12cd34

  # 快速运行（使用所有默认值）
  ccc run ab12cd34 -y

  # 命令行直接传参
  ccc run ab12cd34 \
      --6-text "a young man, cyberpunk style" \
      --3-steps 30
```

### 示例 3: 命令行直传参数运行

```bash
# 只传部分参数，其余交互询问
$ ccc run ab12cd34 --6-text "a young man, cyberpunk style"

📋 工作流：flux-dev-portrait
   高质量人像生成

  提示词: a young man, cyberpunk style (来自命令行)
? 采样步数 (采样迭代步数)：30

✔ 已连接到服务器: http://127.0.0.1:8188
✔ 任务已提交！ ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✔ 生成完成！
✓ 工作流执行成功!
  输出目录：./output
  生成图像：1 张

# 全部命令行传参 + 跳过交互
$ ccc run ab12cd34 -y --6-text "a young man" --3-steps 25 -o ./my-outputs
```

## 🔧 配置

### ComfyUI 服务器地址

默认：`http://127.0.0.1:8188`

通过 `-s` 参数指定：

```bash
ccc run flux-dev-001 -s http://192.168.1.100:8188
```

### 数据存储位置

工作流配置存储在：`~/.comfy-client-cli/workflows.json`

## 🛠️ 自动识别的参数类型

注册工作流时会自动检测以下节点字段：

| 字段名 | 显示名 | 类型 |
|--------|--------|------|
| `text` | 提示词 | string |
| `steps` | 采样步数 | number |
| `cfg` / `cfg_scale` | CFG Scale | number |
| `seed` / `noise_seed` | 随机种子 | number |
| `sampler_name` | 采样器 | string |
| `scheduler` | 调度器 | string |
| `denoise` | 去噪强度 | number |
| `width` / `height` | 图像尺寸 | number |
| `batch_size` | 批量大小 | number |
| `ckpt_name` | 模型文件 | string |
| `lora_name` | LoRA 文件 | string |
| `guidance` | 引导系数 | number |
| `filename_prefix` | 文件名前缀 | string |

## 📝 技术栈

- **TypeScript** - 类型安全
- **Commander** - CLI 框架
- **Inquirer** - 交互式输入
- **Axios** - HTTP 客户端
- **WebSocket** - 实时进度跟踪
- **cli-table3** - 表格展示
- **Chalk** - 终端着色
- **Ora** - Loading 动画

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

Apache License 2.0
