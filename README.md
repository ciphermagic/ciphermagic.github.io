# Cipher's Blog

![Hugo](https://img.shields.io/badge/hugo-%23FF4088.svg?style=for-the-badge&logo=hugo&logoColor=white)
![GitHub repo size](https://img.shields.io/github/repo-size/ciphermagic/ciphermagic.github.io?style=for-the-badge)
![GitHub Language Count](https://img.shields.io/github/languages/count/ciphermagic/ciphermagic.github.io?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/ciphermagic/ciphermagic.github.io?style=for-the-badge)
![GitHub License](https://img.shields.io/github/license/ciphermagic/ciphermagic.github.io?style=for-the-badge)

一个基于 Hugo 的静态博客网站，使用 PaperMod 主题，专注于编程、安全和区块链技术分享。


## 项目概览

Cipher's Blog 是一个技术博客网站，主要分享编程、网络安全和区块链相关的技术文章。项目使用 Hugo 静态网站生成器和 PaperMod 主题构建，使用中文内容，部署在 https://www.ciphermagic.cn/ 上。

## 现有内容类型

本博客涵盖了多个技术领域的深度文章，主要包括：

### 区块链技术
- **以太坊开发**: 包含 Foundry 框架、Gas 优化、中继服务等技术详解
- **闪电贷和套利**: 深入分析 Flash Swap 套利策略和实现方法
- **数字钱包**: HD 钱包生成原理和实现机制
- **去中心化金融 (DeFi)**: 包括无常损失 (Impermanent Loss) 等核心概念
- **现实世界资产 (RWA)**: RWA实操指南系列，从资产筛选、SPV设立到通证化落地
- **NFT**: 艺术家 NFT 发行和交易机制

### Java 相关
- **Dubbo 框架**: Proguard 代码混淆、代理机制等高级特性
- **Spring Boot 相关**: 调试技巧、XSD 配置等实用内容
- **Java 8 新特性**: Builder 模式的最佳实践
- **代码质量**: SIMON 代码质量评估工具和方法
- **算法实践**: LeetCode 算法题解与优化思路

### Go 语言
- **Go 语言特性**: Slice 底层实现和性能优化
- **Go 实践项目**: Dubbo Proxy 实现方案

### 网络安全
- **系统安全**: CentOS 安全防护策略
- **漏洞防护**: Log4j 安全配置最佳实践
- **威胁检测**: ELK 威胁检测系统构建

### 其他技术
- **数据库技术**: Elasticsearch、Logstash、Kibana 应用实践
- **开发工具**: IntelliJ IDEA 使用技巧

## 运行项目

### 本地开发

1. **安装 Hugo**（如果尚未安装）：

```bash
# 对于 macOS (使用 Homebrew)
brew install hugo

# 对于 Ubuntu/Debian (使用 apt)
sudo apt-get install hugo

# 对于其他系统，请参考：https://gohugo.io/getting-started/installing/
```

2. **克隆项目**：

```bash
git clone <项目URL>
cd Cipher's Blog
```

3. **启动本地开发服务器**：

```bash
hugo server -D
```

4. **在浏览器中访问**：http://localhost:1313/

### 生成静态文件

```bash
hugo
```

生成的静态文件将位于 `public/` 目录中，可以直接部署到任何静态文件服务器。

### 创建新的博客文章

```bash
hugo new posts/文章标题.md
```


## 技术栈

- [Hugo](https://gohugo.io/) - 静态网站生成器
- [PaperMod](https://github.com/adityatelange/hugo-PaperMod) - 主题框架
- Markdown - 内容编写格式
- Git - 版本控制


## 项目结构

```text
Cipher's Blog/
├── content/                 # 博客内容目录
│   ├── posts/              # 博客文章
│   ├── about/             # 关于页面
│   ├── archives/          # 归档页面
│   ├── categories/        # 分类页面
│   └── tags/             # 标签页面
├── themes/                # 主题目录
│   └── PaperMod/         # PaperMod 主题
├── static/                # 静态资源
├── layouts/               # 自定义布局
├── hugo.toml              # Hugo 配置文件
├── .gitignore             # Git 忽略文件配置
├── archetypes/            # 内容模板
├── assets/                # 资源文件
├── i18n/                  # 国际化配置
├── draft/                 # 草稿目录
├── public/                # 生成的静态网站（构建输出）
├── CLAUDE.md              # Claude 指令配置
├── template.md            # 文章模板
├── write-guide.md         # 写作指导
└── README.md              # 项目说明
```

## 主要特性

### 1. 中文支持
- 项目使用简体中文编写
- 支持 CJK 语言，适合中文内容展示

### 2. 功能特性
- 自动代码复制按钮
- 阅读时间统计
- 文字计数
- 响应式设计
- 深色/浅色主题自动切换
- 目录显示 (Toc)
- 社交媒体图标
- 分页功能

### 3. 内容管理
- 按日期归档
- 分类和标签系统
- 搜索功能
- 导航菜单

## 配置详情

### 主要配置 (hugo.toml)

```toml
baseURL = "https://www.ciphermagic.cn/"
title = "Cipher's Blog"
languageCode = "zh-cn"
defaultContentLanguage = "zh"
theme = "PaperMod"
contentDir = "content"
publishDir = "public"
hasCJKLanguage = true
IsProduction = false
uglyURLs = true

[pagination]
  pagerSize = 10

[permalinks]
  posts = "/:contentbasename"

[menu]
  [[menu.main]]
    identifier = "home"
    name = "首页"
    url = "/"
    weight = 1
  [[menu.main]]
    identifier = "archives"
    name = "归档"
    url = "/archives/"
    weight = 2
  [[menu.main]]
    identifier = "categories"
    name = "分类"
    url = "/categories/"
    weight = 3
  [[menu.main]]
    identifier = "tags"
    name = "标签"
    url = "/tags/"
    weight = 4
  [[menu.main]]
    identifier = "about"
    name = "关于"
    url = "/about/"
    weight = 5

[params]
  defaultTheme = "auto"
  showShareButtons = false
  showReadingTime = true
  showWordCount = true
  dateFormat = "2006年1月2日"
  ShowPostOnHomePage = "list"
  ShowCodeCopyButtons = true
  ShowSocialIcons = true
  SocialIconPosition = "footer"
  googleAnalytics = ""
  ShowToc = true
  TocOpen = true
  disableSpecial1stPost = true

[[params.socialIcons]]
  name = "github"
  url = "https://github.com/ciphermagic"
[[params.socialIcons]]
  name = "twitter"
  url  = "https://x.com/0xCipherMagic"
[[params.socialIcons]]
  name = "telegram"
  url  = "https://t.me/ciphermagic"
[[params.socialIcons]]
  name = "email"
  url  = "mailto:ciphermagic@gmail.com"

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
  [markup.highlight]
    codeFences = true
    guessSyntax = false
    lineNos = true
    lineNumbersInTable = false
    noClasses = false
    style = "catppuccin-mocha"
```


## 内容规范

项目遵循特定的写作指导，确保内容质量：

### 文章结构
- **前言部分**：阐述写作动机和问题
- **主体内容**：问题分析和解决方案
- **总结**：回顾内容并提供延伸思考

### 写作要点
- 使用简洁直接的中文表达
- 保持技术专业性的同时兼顾可读性
- 提供完整、可运行的代码示例
- 包含必要的理论说明和实践指导

### 标签和分类
- **分类**：按主题分类（如 "技术"、"web3"、"区块链"）
- **标签**：按具体技术关键词标记（如 "java"、"redis"、"go"）

## 主要功能页面

### 导航菜单
- **首页**：博客主页
- **归档**：按时间归档的文章列表
- **分类**：按照分类组织的文章
- **标签**：按照标签组织的文章
- **关于**：作者和网站信息

### 社交连接
- GitHub: https://github.com/ciphermagic
- Twitter: https://x.com/0xCipherMagic
- Telegram: https://t.me/ciphermagic
- Email: ciphermagic@gmail.com


## 开发贡献

### 文章编写规范
1. 使用提供的模板 `template.md` 创建新文章
2. 遵循 `write-guide.md` 中的写作指导
3. 正确配置 frontmatter 元数据
4. 保证代码示例的完整性和可运行性

### 本地测试
- 使用 Hugo 的内置服务器进行本地开发
- 测试文章的显示效果和功能完整性

## 部署

静态生成的网站文件可在 `public/` 目录中找到，可部署到以下平台：
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- 任何支持静态文件服务的主机

## 许可

本项目遵循 [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) 许可，用于内容分享。代码部分可能遵循各自的许可证。

## 联系我

- 邮箱：ciphermagic@gmail.com
- GitHub：[@ciphermagic](https://github.com/ciphermagic)
- Twitter：[@0xCipherMagic](https://x.com/0xCipherMagic)
- Telegram：[@ciphermagic](https://t.me/ciphermagic)

如果你觉得这些技术分享有帮助，请给我一个 star！⭐️

## 故障排除

### 常见问题及解决方案

1. **Hugo 未找到命令**
   - 问题: 运行 `hugo` 命令时出现 "command not found" 错误
   - 解决方案: 确保已正确安装 Hugo 并添加到系统 PATH 中，或者使用完整路径调用

2. **本地服务器启动失败**
   - 问题: 运行 `hugo server -D` 时服务器无法启动
   - 解决方案: 检查端口是否被占用，尝试使用 `hugo server -D -p 1314` 指定其他端口

## 常见问题

### Q: 如何安装和配置 Hugo？
A: Hugo 可以通过多种方式安装，对于 macOS 用户推荐使用 Homebrew: `brew install hugo`。安装后可通过 `hugo version` 验证安装成功。

### Q: 如何创建新的博客文章？
A: 使用命令 `hugo new posts/文章标题.md`，然后在 `content/posts/` 目录下编辑生成的 Markdown 文件。