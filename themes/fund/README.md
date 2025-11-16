# Fund

一款写给小猫黄基金做生日礼物的Hugo主题。

看了几个主题觉得都挺喜欢的，改着改着觉得不如直接自己写一个，所以有了这个主题。

主题名字来自我的小猫，**基金（fund）**。

替小猫黄基金祝各位万事胜意，平安喜乐。

[站点案例](https://www.zanks.link)

## Features

- [x] 多作者
- [x] 关于
- [x] 友链
- [x] 标签与分类
- [x] 碎碎念(类似朋友圈、微博)
- [x] 主题切换
- [x] 代码渲染优化
- [x] 一些ShortCode

## 安装

### Git Submodule (推荐)

#### 安装

在博客源码目录的根目录执行 `git submodule add <repository> [path] `

Example:

```bach
git submodule add git@github.com:ZaNksC/hugo-theme-fund.git themes/fund
```

如果分支对于不上，在 `.gitmodules` 文件中的 `[submodule "themes/fund"]` 节点下添加 `branch = main`

#### 更新

```
git submodule update --remote
```

#### 卸载

```
rm -rf .git/modules/themes/fund
git submodule deinit -f themes/fund
```

删除 `.gitmodules` 文件中的 `[submodule "themes/fund"]` 节点

### 下载源码后安装

#### 安装

从github下载主题源码后，将所有文件夹放到 `themes/fund` 目录下

#### 更新

使用最新的代码覆盖

#### 卸载

删除 `themes/fund` 目录即可

## 配置

配置案例

```yaml
baseUrl: https://zanks.link/
title: 乱话三千
theme: fund
enableRobotsTXT: true # 允许爬虫协议
enableEmoji: true # 允许使用Emoji表情
buildDrafts: false
buildFuture: false
buildExpired: false
defaultContentLanguage: zh
enableGitInfo: true
frontmatter:
  lastmod: ['lastmod', ':git', 'date', 'publishDate']
params:
  icon: '/assets/favicon.ico'
  categoriesTitle: 🔖 分类 🔖
  tagsTitle: 🏷️ 标签 🏷️
  paginator:
    perPage: 6
    perPageGroup: 5
  authorInfo:
    - name: 恶魔毛毛大王
      summary: '可爱又迷人的恶魔毛毛大王'
      avatar: '/images/example/amaomao.jpg'
    - name: Za_Nks
      summary: '剥龙虾大王、剥柚子也还可以'
      social:
        - name: "github"
          url: "https://github.com/ZaNksC"
        - name: "mail"
          url: "mailto:za_nks@hotmail.com"
    - name: 小猫黄基金
      summary: 坠可爱的小猫黄基金
      avatar: '/images/example/hjj.jpg'
  comments:
    defaultInPost: true
    discussionTitle: 欢迎来到评论区
    discussionSubtitle: 感谢您的耐心阅读！如需交流，请留个评论吧！
    twikoo:
      enable: true
      envId: ''
  license:
    name: CC BY-NC 4.0
    url: https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans
  feature:
    comments: true # 评论功能特性开关
    cover: true # 封面图功能特性开关
    wordCount: true # 字数统计功能特性开关
    articleWordCount: true # 单篇文章的字数统计，界面显示开关
    articleMetrics: true # 单篇文章的访问统计，界面显示开关
    metrics: true # 访问统计功能的特性开关
    runningTime:
      enabled: true # 运行时长功能特性开关
      startTime: '2025-01-01 00:00:00'
markup:
  tableOfContents:  # 目录层级
    startLevel: 1 
    endLevel: 6
  highlight:
    noClasses: false           
    lineNoStart: 1              # 行号起始值
    lineNos: true               # 是否显示行号
    lineNumbersInTable: false    # 是否以表格形式显示行号,必须为false，true的情况未适配
menu:
  main:
    - identifier: post
      name: 📖 文章
      url: /posts/
      weight: 10
    - identifier: tag
      name: 🏷️ 标签
      url: /tags/
      parent: post
      weight: 2
    - identifier: category
      name: 🔖 分类
      url: /categories/
      parent: post
      weight: 3
    - identifier: friends
      name: 🤝 友链
      url: /friends/
      weight: 21
    - identifier: chirp
      name: 💬 碎碎念
      url: /chirp/
      weight: 22
    - identifier: about
      name: 😾 关于
      url: /about/
      weight: 30
```
