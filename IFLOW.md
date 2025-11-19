# iFlow 上下文文件

## 项目概述

这是一个使用 Hugo 静态网站生成器构建的个人博客项目，名为 "Cipher's Blog"。博客使用 PaperMod 主题，内容主要以中文撰写，涵盖了技术和生活两个主要类别。项目托管在 GitHub 上，域名是 https://www.ciphermagic.cn/。

## 项目结构

- `hugo.toml`: Hugo 站点的主配置文件
- `archetypes/`: 文章模板目录
- `assets/`: CSS、JavaScript 等静态资源
- `content/`: 博客文章内容，按分类组织
  - `posts/`: 博客文章（Markdown 格式）
- `draft/`: 草稿文章
- `layouts/`: 网站模板布局
- `static/`: 静态文件（图片、字体等）
- `themes/`: Hugo 主题（使用 PaperMod）

## 博客内容

博客内容主要包括以下类别：

1. 技术文章：涵盖 Java、Spring Boot、Go、Python、数据库、Web 开发等技术主题
2. 生活文章：个人思考、读书笔记等

已发布的文章包括：
- Spring Boot 参数校验实现
- Java 并发编程
- Go 语言特性
- Dubbo 框架使用
- 机器学习相关内容
- 区块链技术等

## 技术特性

- 使用 Hugo 静态站点生成器
- PaperMod 主题（支持深色/浅色模式切换）
- 支持中文内容
- 包含目录(TOC)、代码高亮、社交分享等功能
- 响应式设计

## 开发和部署

- 使用 Hugo 命令行工具进行本地开发和构建
- 文章使用 Markdown 格式撰写
- 可通过 `hugo` 命令构建静态网站
- 可通过 `hugo server` 命令启动本地开发服务器

## 配置选项

根据 `hugo.toml` 配置:
- 默认主题为自动（根据系统主题）
- 启用代码复制按钮
- 显示阅读时间和字数统计
- 启用社交图标链接（GitHub、Twitter、Telegram、邮箱）
- 自定义日期格式为中文格式
- 启用站点地图