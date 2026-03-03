# AIOS：面向 Codex、Claude Code、Gemini CLI 的 MCP Agent 工作流系统

AIOS 是一套本地优先（local-first）的 AI agent framework，核心目标是把 `MCP automation`、浏览器任务自动化、技能复用（`SKILL.md`）和人机协作审批整合到同一个工程里。

SEO 关键词：`AI agent framework`、`MCP`、`Codex`、`Claude Code`、`Gemini CLI`、`OpenClaw alternative`、`OpenFang alternative`、`human-in-the-loop security`。

## 项目定位（对标 OpenClaw / OpenFang）

如果你在关注 OpenClaw、OpenFang 这类项目，AIOS 的目标能力是一致的：

- 多 Agent 客户端协作（Codex / Claude Code / Gemini CLI）
- 基于 MCP 的工具调用与浏览器流程编排
- 可复用的技能化工作流（skill + runbook）
- 对高风险动作执行显式的人类确认

差异点在于：AIOS 更强调“直接在现有仓库内落地”，通过本地配置、MCP server、技能目录和审批边界实现可控自动化。

## 核心能力

- 统一浏览器 MCP 工具链：`browser_launch`、`browser_navigate`、`browser_click`、`browser_type`、`browser_snapshot`、`browser_screenshot`
- CDP 优先连接模式，便于会话复用与稳定调试
- 长流程任务可拆解为技能，支持持续执行与故障恢复
- 登录态/权限墙识别（`browser_auth_check`）与人工接管
- 对敏感动作设置审批门（approval gate）

## 安全与敏感数据策略

这套系统的默认原则是：敏感操作必须由用户确认。

- Google / Meta / 即梦等登录墙场景，默认走人工协作接管
- 工具层返回 `requiresHumanAction` / `auth` 信号
- 在技能中明确“未登录即暂停，提示用户协作”
- 凭据只放环境变量或密钥管理，不写入 prompt/技能文件
- 对外发消息、发帖、提交类操作保留审计记录

## 是否能做出和 OpenClaw / OpenFang 同级功能？

可以做到同类型的核心能力，但不是“默认一键完全同构”。

可对齐的能力：

- Agent 驱动的工具编排
- 浏览器工作流自动化（MCP + CDP/Playwright）
- 技能化知识沉淀与跨客户端复用
- 人机协作审批和高风险动作拦截

需要按场景补齐的能力：

- 某些平台级内置 channel/runtime 能力需要通过 MCP adapter 自行实现
- 复杂组织级权限模型需要在你自己的配置层扩展

## OpenClaw 的 `channel send`，AIOS 能做到吗？

结论：能做，而且路径清晰。

当前仓库还没有内置等价于 `openclaw message send` 的一组一等命令，但可通过 MCP 扩展实现：

1. 增加 channel 适配层（Slack / Telegram / Discord / WhatsApp 等）。
2. 暴露工具：`channel_send`、`channel_read`、`channel_react`、`channel_thread`。
3. 对目标频道、目标用户做 allowlist 校验。
4. 对敏感目标执行二次确认（human approval）。
5. 全量记录 outbound 事件用于审计与回放。

## 快速开始

### 1. 构建浏览器 MCP 服务

```bash
cd mcp-server
npm install
npm run build
```

### 2. 配置浏览器 profile（推荐 CDP 优先）

`config/browser-profiles.json` 示例：

```json
{
  "profiles": {
    "default": { "name": "default", "cdpPort": 9222 },
    "local": {
      "name": "local",
      "userDataDir": ".browser-profiles/local",
      "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
  }
}
```

### 3. 仅为 Codex + Claude Code 安装 `find-skills`

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent codex claude-code --yes
```

说明：这里显式限制为 `codex` 和 `claude-code`，不会给其他 agent 客户端安装。

### 4. 重启客户端生效

重启 Codex 与 Claude Code，让新技能与工具定义加载完成。

## 统一 Context DB（面向所有 CLI）

为解决 Gemini CLI / Claude Code 等工具缺少“共享任务记忆”的问题，仓库新增了文件系统 context DB：

- 路径：`memory/context-db/`
- 分层：`L0 摘要` + `L1 checkpoint` + `L2 原始事件`
- 用法：由 `mcp-server` 内的 `contextdb` CLI 统一读写

示例：

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- session:new --agent gemini-cli --project rex-ai-boot --goal "持续任务上下文"
npm run contextdb -- context:pack --session <session_id>
```

将导出的 context 包作为新会话首段上下文喂给各 CLI，可实现跨工具连续记忆。

也可以直接用统一启动脚本（仓库根目录）：

```bash
scripts/ctx-agent.sh --agent claude-code --project rex-ai-boot
scripts/ctx-agent.sh --agent gemini-cli --project rex-ai-boot --prompt "延续上一轮任务"
```

## 参考项目

- OpenClaw: https://github.com/openclaw/openclaw
- OpenClaw CLI Message: https://docs.openclaw.ai/cli/message
- OpenClaw Agent Send: https://docs.openclaw.ai/tools/agent-send
- OpenFang: https://github.com/RightNow-AI/openfang
- OpenFang 官网: https://www.openfang.sh/
