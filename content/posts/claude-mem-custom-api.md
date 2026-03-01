---
title: Claude-Mem 自定义API支持：突破速率限制的解决方案
date: 2026-02-13T15:30:00+08:00
categories: ["技术", "AI"]
tags: ["claude-code"]
cover:
  image: "https://files.ciphermagic.cn/1.png"
---

## 前言

在AI辅助编程实践中，Claude Code已成为开发者的得力助手。然而，Claude Code的对话历史无法持久化保存，每次新会话都无法访问之前的上下文信息，这影响了开发效率。

为解决这个问题，Claude-Mem作为一个专门为Claude Code设计的插件应运而生，提供持久化记忆能力。但Claude-Mem原生支持的GEMINI和OPENROUTER等AI提供商存在速率和额度限制，成为新的瓶颈。

本文介绍Claude-Mem如何通过自定义API支持功能突破这些限制，并修复因Claude平台升级导致的上下文显示问题，具有实际应用价值。

## 问题分析

### 速率和额度限制问题

Claude-Mem原生支持Anthropic、GEMINI、OPENROUTER等多种AI提供商，但存在以下限制：

- 用户无法使用自己的模型部署（如本地模型、企业模型）
- 无法使用其他AI提供商的API（如OpenAI、Azure OpenAI等）
- 不同地区访问官方API可能面临网络或合规性问题
- 原生提供商的速率和额度限制影响高频使用场景

### 上下文显示问题

由于Claude平台升级，原有的上下文处理机制出现兼容性问题，导致：

- 对话历史无法正常显示
- 上下文注入功能失效
- 用户无法查看和管理会话记忆
- 降低整体用户体验

## 解决方案

### 自定义API代理实现

Claude-Mem引入了`CustomApiAgent`类，这是自定义API支持的核心实现。通过配置参数动态选择API端点，包含速率限制、错误处理等重要功能。

```typescript
// src/services/worker/CustomApiAgent.ts
export class CustomApiAgent {
  private dbManager: DatabaseManager;
  private sessionManager: SessionManager;
  private fallbackAgent: FallbackAgent | null = null;

  // Rate limiting implementation
  private requestQueue: Array<{
    config: CustomApiConfig;
    history: ConversationMessage[];
    resolve: (value: { content: string; tokensUsed?: number }) => void;
    reject: (reason: any) => void;
  }> = [];
  private isProcessing: boolean = false;
  private readonly rateLimitDelay: number = 1000; // 1 second delay between requests

  constructor(dbManager: DatabaseManager, sessionManager: SessionManager) {
    this.dbManager = dbManager;
    this.sessionManager = sessionManager;
  }

  // ... 其他实现细节
}
```

这个实现包含多个关键特性：

#### 1. 队列管理与速率限制

CustomApiAgent使用队列机制管理API请求频率，避免请求过于频繁：

```typescript
private async processQueue(): Promise<void> {
  if (this.isProcessing || this.requestQueue.length === 0) {
    return;
  }

  this.isProcessing = true;

  while (this.requestQueue.length > 0) {
    const { config, history, resolve, reject } = this.requestQueue.shift()!;

    try {
      const result = await this.executeCustomApiRequest(config, history);
      resolve(result);
    } catch (error) {
      reject(error);
    }

    // Wait before processing the next request to implement rate limiting
    if (this.requestQueue.length > 0) {
      await this.delay(this.rateLimitDelay);
    }
  }

  this.isProcessing = false;
}
```

**注意事项：** 通过1秒的延迟机制，有效防止API调用超限。

#### 2. 多格式API适配

CustomApiAgent支持Anthropic和OpenAI兼容的API格式，可动态识别不同提供商的API端点：

```typescript
private async executeCustomApiRequest(
  config: CustomApiConfig,
  history: ConversationMessage[]
): Promise<{ content: string; tokensUsed?: number }> {
  const messages = this.conversationToOpenAIMessages(history);

  // Determine the correct API endpoint based on provider name
  let apiUrl: string;
  if (config.providerName.toLowerCase() === 'anthropic') {
    // For Anthropic-compatible API
    apiUrl = `${config.baseUrl}/v1/messages`;
  } else if (config.providerName.toLowerCase() === 'openai') {
    // For OpenAI-compatible API
    apiUrl = `${config.baseUrl}/v1/chat/completions`;
  } else {
    // Default to Anthropic-compatible API
    apiUrl = `${config.baseUrl}/v1/messages`;
  }

  let requestBody: any;
  if (config.providerName.toLowerCase() === 'anthropic') {
    // Anthropic-compatible request format
    requestBody = {
      model: config.model,
      messages,
      max_tokens: 4096,
      temperature: 0.3,
    };
  } else {
    // OpenAI-compatible request format (default)
    requestBody = {
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    };
  }

  // ... 请求执行和响应处理
}
```

### 配置同步功能

Claude-Mem新增配置同步功能，自动从Claude Code的设置文件中读取API配置并应用到Claude-Mem中：

```typescript
// src/utils/config-sync.ts
export function syncClaudeCodeSettingsToCustomApi(): void {
  try {
    const claudeCodeSettingsPath = join(homedir(), '.claude', 'settings.json');

    if (!existsSync(claudeCodeSettingsPath)) {
      logger.info('CONFIG', 'Claude Code settings file not found, skipping sync', {
        path: claudeCodeSettingsPath
      });
      return;
    }

    const settingsContent = readFileSync(claudeCodeSettingsPath, 'utf-8');
    const settings: ClaudeCodeSettings = JSON.parse(settingsContent);

    // Extract environment variables from Claude Code settings
    const env = settings.env || {};

    // Map Claude Code env variables to claude-mem custom API settings
    const customApiSettings = {
      CLAUDE_MEM_CUSTOM_API_BASE_URL: env.ANTHROPIC_BASE_URL || '',
      CLAUDE_MEM_CUSTOM_API_KEY: env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || '',
      CLAUDE_MEM_CUSTOM_API_MODEL: env.CLAUDE_MEM_CUSTOM_API_MODEL || 'iflow,qwen3-coder-plus',
      CLAUDE_MEM_CUSTOM_API_PROVIDER_NAME: env.ANTHROPIC_BASE_URL ? 'anthropic' : 'custom'
    };

    // Update claude-mem settings if custom provider is selected
    const currentSettingsPath = join(homedir(), '.claude-mem', 'settings.json');
    const currentSettings = SettingsDefaultsManager.loadFromFile(currentSettingsPath);

    if (currentSettings.CLAUDE_MEM_PROVIDER === 'custom') {
      // Only update if custom API settings are not already configured
      // This prevents overwriting user's manual settings
      if (!currentSettings.CLAUDE_MEM_CUSTOM_API_BASE_URL) {
        logger.info('CONFIG', 'Syncing Claude Code settings to claude-mem custom API', {
          ANTHROPIC_BASE_URL: customApiSettings.CLAUDE_MEM_CUSTOM_API_BASE_URL,
          ANTHROPIC_API_KEY: customApiSettings.CLAUDE_MEM_CUSTOM_API_KEY ? '[HIDDEN]' : '[NOT SET]'
        });

        // Write updated settings to claude-mem settings file
        updateClaudeMemSettings(customApiSettings, currentSettingsPath);
      }
    }
  } catch (error) {
    logger.error('CONFIG', 'Failed to sync Claude Code settings to custom API', {}, error as Error);
  }
}
```

**注意事项：** 配置同步会先检查是否已有手动配置，避免覆盖用户设置。

### 会话路由重构

Claude-Mem实现智能代理选择机制，根据设置自动选择合适的AI提供商：

```typescript
private getActiveAgent(): SDKAgent | GeminiAgent | OpenRouterAgent | CustomApiAgent {
  if (isCustomApiSelected()) {
    if (isCustomApiAvailable()) {
      logger.debug('SESSION', 'Using Custom API agent');
      return this.customApiAgent;
    } else {
      throw new Error('Custom API provider selected but no base URL configured. Set CLAUDE_MEM_CUSTOM_API_BASE_URL in settings.');
    }
  }
  if (isOpenRouterSelected()) {
    if (isOpenRouterAvailable()) {
      logger.debug('SESSION', 'Using OpenRouter agent');
      return this.openRouterAgent;
    } else {
      throw new Error('OpenRouter provider selected but no API key configured. Set CLAUDE_MEM_OPENROUTER_API_KEY in settings or OPENROUTER_API_KEY environment variable.');
    }
  }
  if (isGeminiSelected()) {
    if (isGeminiAvailable()) {
      logger.debug('SESSION', 'Using Gemini agent');
      return this.geminiAgent;
    } else {
      throw new Error('Gemini provider selected but no API key configured. Set CLAUDE_MEM_GEMINI_API_KEY in settings or GEMINI_API_KEY environment variable.');
    }
  }
  return this.sdkAgent;
}
```

### 上下文处理修复

针对Claude升级导致的上下文显示问题，Claude-Mem修改了上下文传递方式：

```typescript
// src/cli/adapters/claude-code.ts
formatOutput(result) {
  if (result.hookSpecificOutput) {
    if (result.hookSpecificOutput.additionalContext) {
        return { hookSpecificOutput: result.hookSpecificOutput, systemMessage: result.hookSpecificOutput.additionalContext };
    } else {
        return { hookSpecificOutput: result.hookSpecificOutput };
    }
  }
  return { continue: result.continue ?? true, suppressOutput: result.suppressOutput ?? true };
}
```

**关键改进：** 通过添加`systemMessage`字段，确保上下文信息正确注入Claude会话。

## 使用说明

### 配置自定义API

用户可以通过以下方式配置自定义API：

#### 方式一：通过Claude Code设置文件（推荐）

在 `~/.claude/settings.json` 中添加配置：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-custom-endpoint.com/v1",
    "ANTHROPIC_API_KEY": "your-api-key",
    "CLAUDE_MEM_CUSTOM_API_MODEL": "your-model-name"
  }
}
```

#### 方式二：直接配置Claude-Mem设置

在 `~/.claude-mem/settings.json` 中配置：

```json
{
  "CLAUDE_MEM_PROVIDER": "custom",
  "CLAUDE_MEM_CUSTOM_API_BASE_URL": "https://your-custom-endpoint.com/v1",
  "CLAUDE_MEM_CUSTOM_API_KEY": "your-api-key",
  "CLAUDE_MEM_CUSTOM_API_MODEL": "your-model-name",
  "CLAUDE_MEM_CUSTOM_API_PROVIDER_NAME": "anthropic"
}
```

配置更改后，重启Claude-Mem服务：

```bash
# 停止服务
claude-mem stop

# 启动服务
claude-mem start
```

## 总结

Claude-Mem的自定义API支持功能解决了原生API提供商的速率和额度限制问题。通过CustomApiAgent实现多格式API适配，配置同步功能简化设置流程，上下文处理修复确保兼容性。

该功能为开发者提供了更灵活的AI编程助手，可根据需求选择合适的API提供商，专注于创造性工作。