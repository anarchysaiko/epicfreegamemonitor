# Epic 免费游戏监控

一个简单的 Web 应用，用于实时监控 Epic 游戏商店的免费游戏信息。使用 Deno 和原生 JavaScript 构建。

## 功能特点

- 实时显示当前可领取的免费游戏
- 自动每 5 分钟更新一次游戏信息
- 显示游戏详细信息（标题、描述、原价等）
- 倒计时显示距离下次更新的时间
- 支持直接跳转到 Epic 商店领取页面
- 响应式设计，支持移动端访问

## 技术栈

- Deno
- Oak (Web 框架)
- 原生 JavaScript
- HTML5 + CSS3

## 本地开发

1. 安装 Deno:
   ```bash
   # macOS (使用 Homebrew)
   brew install deno

   # Windows (使用 PowerShell)
   irm https://deno.land/install.ps1 | iex
   ```

2. 克隆项目:
   ```bash
   git clone https://github.com/your-username/epicfreegamemonitor.git
   cd epicfreegamemonitor
   ```

3. 运行项目:
   ```bash
   deno task dev
   ```

4. 访问 http://localhost:8080 查看应用

## 部署

本项目可以直接部署到 Deno Deploy 平台：

1. 访问 [Deno Deploy](https://dash.deno.com)
2. 创建新项目并关联 GitHub 仓库
3. 选择 `server.ts` 作为入口文件
4. 完成部署

## 配置

项目配置在 `deno.json` 文件中：

```json
{
    "tasks": {
        "dev": "deno run --allow-net --allow-read server.ts"
    },
    "imports": {
        "oak": "https://deno.land/x/oak@v17.1.4/mod.ts"
    }
}
```

## 许可证

MIT License
