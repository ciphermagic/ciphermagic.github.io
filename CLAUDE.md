# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo-based static blog site using the PaperMod theme. The blog is written in Chinese and contains technical articles about programming, security, and blockchain topics.

## Repository Structure

- `content/` - Blog posts and pages
  - `posts/` - Individual blog articles (Markdown files)
  - `about/` - About page content
  - `archives/` - Archive page content
- `themes/` - Hugo themes (PaperMod theme)
- `layouts/` - Custom layout templates
- `static/` - Static assets (images, CSS, JS)
- `hugo.toml` - Main configuration file
- `.spec-workflow/` - Spec workflow configuration (for requirements/design documentation)

## Common Commands

### Development

To serve the site locally for development:
```bash
hugo server -D
```

To build the site for production:
```bash
hugo
```

To create a new blog post:
```bash
hugo new posts/post-title.md
```

### Git Workflow

The repository uses a branch named "hexo" (though this is actually a Hugo site) which is kept in sync with "ciphermagic.github.io/hexo".

Common git operations:
```bash
git add .
git commit -m "docs: brief description of changes"
git push origin hexo
```

## Code Architecture

### Content Structure

Blog posts are written in Markdown with frontmatter metadata:
- Title, date, categories, and tags are defined in the frontmatter
- Content follows standard Markdown syntax
- Template for new posts is in `template.md`

### Configuration

The main configuration is in `hugo.toml`:
- Site metadata (title, baseURL, language)
- Menu navigation structure
- Theme parameters (PaperMod settings)
- Taxonomy configuration (categories, tags)

### Theme Customization

The site uses the PaperMod theme with customizations in:
- `layouts/` - Custom page layouts
- `static/` - Custom CSS/JS assets

## Important Notes

1. Posts are organized by date in the filename and frontmatter
2. The site uses Chinese language content (zh-cn)
3. The .gitignore excludes build artifacts and some development files
4. Recent activity shows focus on RWA (Real World Assets) content
5. The site was migrated from Hexo to Hugo (as evidenced by branch name and .gitignore entries)