# AIOS 长运行 Harness + 工作流规范 + 即梦实测修复（最终版）

## 1. 目标
在 `2026-03-02` 完成三件事：
1. 基于 Anthropic《Effective harnesses for long-running agents》沉淀 AIOS 的长运行 harness。
2. 将项目系统知识沉淀为 `.codex` 技能。
3. 实操即梦文生图并修复现有技能的不稳定点。

## 2. 本次实测（即梦）

### 2.1 实测入口
- 页面：`https://jimeng.jianying.com/ai-tool/generate?ai_feature_name=image`
- 方式：真实浏览器自动化逐步执行（进入页面 -> 输入 -> 提交 -> 轮询结果）

### 2.2 结果 A（失败样本）
- 提示词：`小红书封面，清新治愈风，淡粉和暖黄色渐变背景，简约留白，手写风标题区域，无文字，无人物，3:4竖图`
- 平台返回：`你输入的文字不符合平台规则，请修改后重试`
- 判定：内容策略拦截，不是“录屏权限”问题。

### 2.3 结果 B（成功样本）
- 提示词：`春日花园插画风景，樱花树、草地、小路、蓝天白云，柔和阳光，高清，3:4竖版，无人物无文字`
- 结果：成功生成，预览弹窗出现 `下载` 按钮。
- 证据：
  - `images/jimeng-run-2026-03-02.png`
  - `images/jimeng-run-modal-2026-03-02.png`

## 3. 根因分析（为什么“经常不准”）
1. 旧技能流程从首页卡片入口点击，误点概率高。
2. 旧提交按钮依赖文本选择器，实际按钮可能是无文字图标。
3. 旧流程依赖固定等待，不按页面状态轮询。
4. 未把“策略拦截”作为一类明确失败分支来处理。
5. 技能描述与当前工具能力不完全对齐（例如截图落盘方式）。

## 4. 已修复项

### 4.1 即梦技能修复
已更新：`memory/skills/即梦AI生成图片.json`（版本 `1.1.0`）
- 改为直接进入文生图 URL。
- 使用稳定输入框选择器：
  - `textarea[placeholder*='请描述你想生成的图片']`
- 生成按钮改为类名策略（含回退选择器）：
  - `button[class*='submit-button'][class*='lv-btn-primary']:not([disabled])`
  - `button[class*='submit-button']:not([disabled])`
- 增加快照轮询与失败分类（策略拦截/超时/选择器失败）。
- 增加安全提示词改写策略和一次重试规则。

### 4.2 新增 `.codex` 技能体系
新增目录：`.codex/skills/`
- `aios-project-system`
- `aios-long-running-harness`
- `aios-jimeng-image-ops`

每个技能包含 `SKILL.md`，并补充对应 `references/`，覆盖：
- 项目架构与关键文件定位。
- 长运行任务的 checkpoint/retry/handoff 规范。
- 即梦执行与排障 runbook（含 2026-03-02 实测记录）。

## 5. AIOS 长运行 Harness（落地版本）
1. Preflight：锁定目标、预算、停止条件、证据要求。
2. Plan：拆成可重入步骤，每步定义成功信号。
3. Execute：单步执行，记录工具输出。
4. Verify：基于页面证据验证，而非主观判断。
5. Checkpoint：持久化当前状态和下一步。
6. Recover：按失败类型做单变量重试。
7. Human Gate：登录/验证码/策略冲突时人工接管。
8. Complete：补齐证据、回写 runbook、形成总结文档。

## 6. 关于“是否必须开启系统录屏权限”
结论：**不是必须条件**（针对当前这次问题）。
- 本次失败由平台内容策略拦截触发，非系统录屏权限缺失。
- 是否需要录屏权限取决于你使用的自动化栈：
  - DOM/MCP 操作（当前主路径）通常不依赖系统录屏权限。
  - 纯视觉/屏幕识别类自动化才可能需要系统录屏权限。

## 7. 外部方法论来源
- Anthropic Engineering: Effective harnesses for long-running agents  
  https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

