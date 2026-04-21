# ComfyUI CLI (ccc)

> 🚀 一个现代化的 ComfyUI 命令行工具，让你轻松管理、配置和运行工作流

## ✨ 特性

- 📦 **工作流注册** - 一键注册 ComfyUI 工作流文件
- ⚙️ **参数配置** - 交互式配置提示词、采样步数等参数
- 🏃 **快速运行** - 使用预设参数快速生成图像
- 📝 **参数模板** - 支持提示词模板变量，便于复用
- 🔄 **更新配置** - 随时更新工作流参数默认值

## 📦 安装

### 方式一：从源码安装（推荐）

```bash
cd comfy-client-cli
npm install
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
- 工作流名称
- 工作流描述
- 各参数的默认值（提示词、采样步数、CFG 等）

### 2. 查看已注册的工作流

```bash
ccc list
# 或
ccc ls
```

### 3. 运行工作流

```bash
ccc run <workflow-id>
```

选项：
- `-o, --output <path>` - 输出目录（默认：`./output`）
- `-y, --yes` - 跳过交互，使用默认值
- `-s, --server <url>` - ComfyUI 服务器地址（默认：`http://127.0.0.1:8188`）

### 4. 更新工作流配置

```bash
ccc update <workflow-id> --params
```

## 📚 命令参考

### add - 注册工作流

```bash
ccc add <workflow-file> [options]

options:
  -n, --name <name>        工作流名称
  -d, --description <desc> 工作流描述
```

### run - 运行工作流

```bash
ccc run <workflow-id> [options]

options:
  -o, --output <path>  输出目录
  -y, --yes            跳过交互，使用默认值
  -s, --server <url>   ComfyUI 服务器地址
```

### list - 列出工作流

```bash
ccc list [options]

options:
  -j, --json  以 JSON 格式输出
```

### update - 更新配置

```bash
ccc update <workflow-id> [options]

options:
  -n, --name <name>    新的工作流名称
  -d, --description    新的工作流描述
  -p, --params         更新参数默认值
```

### delete - 删除工作流

```bash
ccc delete <workflow-id> [options]

options:
  -y, --yes  跳过确认
```

## 🎯 使用示例

### 示例 1: 注册 Flux 工作流

```bash
$ ccc add ~/downloads/flux_portrait.json

? 请输入工作流名称：flux-dev-portrait
? 请输入工作流描述（可选）: 高质量人像生成
? 提示词的默认值：a beautiful woman, photorealistic, 8k
? 采样步数的默认值：20
? CFG Scale 的默认值：7.5

✓ 工作流注册成功!
  ID: flux-dev-001
  名称：flux-dev-portrait

💡 提示：运行此工作流使用:
  ccc run flux-dev-001
```

### 示例 2: 运行工作流

```bash
$ ccc run flux-dev-001

📋 工作流：flux-dev-portrait
   高质量人像生成

? 提示词：a young man, cyberpunk style, neon lights
? 采样步数 (1-100): 25
? CFG Scale (1-20): 8.0

⣾ 正在提交任务到 ComfyUI...
✔ 任务已提交!

⣾ 正在生成中...
✔ 生成完成!

✓ 工作流执行成功!
  输出目录：./output
  生成图像：1 张
```

### 示例 3: 快速模式（使用默认值）

```bash
$ ccc run flux-dev-001 -y -o ./marketing-images
```

## 🔧 配置

### ComfyUI 服务器地址

默认：`http://127.0.0.1:8188`

可以通过 `-s` 参数指定：

```bash
ccc run flux-dev-001 -s http://192.168.1.100:8188
```

### 数据存储位置

工作流配置存储在：`~/.comfy-client-cli/workflows/`

## 🛠️ 开发

### 本地开发

```bash
npm install
npm run dev
```

### 构建

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## 📝 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **Commander** - CLI 框架
- **Inquirer** - 交互式输入
- **Axios** - HTTP 客户端
- **WebSocket** - 实时进度跟踪
- **Chalk** - 终端着色
- **Ora** - Loading 动画

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

Apache License

---

 Made with ❤️ by ComfyUI CLI Team
