# OpenViking ContextDB Simplification (AIOS)

## Goal
在本仓库里落地一个可被 **Codex CLI / Claude Code / Gemini CLI** 共用的、文件系统驱动的上下文数据库能力，不依赖某个单一客户端的内置记忆。

## OpenViking 关键思路（提炼）
从 `OpenViking README_CN`（https://github.com/volcengine/OpenViking/blob/main/README_CN.md）提炼出 4 个可直接借鉴点：

1. 文件系统范式：上下文应可被 `ls/find/grep` 直接观察和操作。  
2. 分层上下文：摘要层 + 检查点层 + 原始层，按需加载。  
3. 检索可观察：检索/回放轨迹应落地到目录和文件。  
4. 会话自迭代：每次任务后沉淀下一轮可复用记忆。

## 简化原则（本次实现）
不引入向量库、不引入独立服务、不做复杂插件，仅用本地文件系统实现“够用的上下文闭环”：

- **L0**: `l0-summary.md`（最新摘要）  
- **L1**: `l1-checkpoints.jsonl`（结构化检查点）  
- **L2**: `l2-events.jsonl`（完整事件流）  

目录：

```text
memory/context-db/
  manifest.json
  index/sessions.jsonl
  sessions/<sessionId>/
    meta.json
    l0-summary.md
    l1-checkpoints.jsonl
    l2-events.jsonl
    state.json
  exports/<sessionId>-context.md
```

## 统一 CLI 工作流（非外挂单点）
1. `session:new` 建立会话（按 agent/project/goal）。  
2. `event:add` 记录用户输入、模型输出、工具调用。  
3. `checkpoint` 写入阶段结论和下一步动作。  
4. `context:pack` 导出跨客户端可消费的上下文包。  

同一份 `memory/context-db` 可被所有 CLI 工具共享，因此即使 Gemini/Claude 没有“内置 context db”，也能通过统一上下文包实现连续记忆。

## 已落地
- 核心实现：`mcp-server/src/contextdb/core.ts`
- CLI 实现：`mcp-server/src/contextdb/cli.ts`
- 自动化测试：`mcp-server/tests/contextdb.test.ts`
- 跨 CLI 统一入口：`scripts/ctx-agent.sh`（Claude/Gemini）
