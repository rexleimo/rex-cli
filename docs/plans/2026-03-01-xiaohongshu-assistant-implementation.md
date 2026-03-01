# 小红书运营助手 - 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 搭建我作为小红书运营助手的基础框架，包括记忆系统初始化、技能模板、规范定义。

**架构:** 基于文件系统的记忆系统 + 任务跟踪 + Chrome DevTools MCP 浏览器控制

**技术栈:** JSON 文件存储、Chrome DevTools MCP

---

## Task 1: 初始化配置文件

**Files:**
- Create: `config/settings.json`

**Step 1: 创建设置文件**

```json
{
  "assistant": {
    "name": "小红书运营助手",
    "version": "1.0.0"
  },
  "limits": {
    "daily_posts": 3,
    "daily_interactions": 50,
    "min_interval_seconds": 5,
    "max_interval_seconds": 30
  },
  "behavior": {
    "randomize_interval": true,
    "auto_pause_on_error": true,
    "log_level": "detailed"
  },
  "chrome": {
    "headless": false,
    "viewport": {"width": 1280, "height": 720}
  }
}
```

**Step 2: 保存文件**

```bash
# 自动完成，无需命令
```

---

## Task 2: 创建初始技能模板

**Files:**
- Create: `memory/skills/publish笔记.json`
- Create: `memory/skills/互动操作.json`
- Create: `memory/skills/数据分析.json`

**Step 1: 创建发布笔记技能模板**

```json
{
  "name": "publish笔记",
  "description": "发布小红书笔记",
  "version": "1.0.0",
  "steps": [
    {
      "action": "navigate",
      "target": "https://creator.xiaohongshu.com/creator/post"
    },
    {
      "action": "wait_for_selector",
      "selector": ".publish-btn"
    },
    {
      "action": "fill",
      "target": ".title-input",
      "value": "{title}"
    },
    {
      "action": "fill",
      "target": ".content-editor",
      "value": "{content}"
    },
    {
      "action": "click",
      "target": ".publish-btn"
    },
    {
      "action": "wait_for_navigation"
    }
  ],
  "required_params": ["title", "content"],
  "notes": "可根据实际页面结构调整选择器"
}
```

**Step 2: 创建互动操作技能模板**

```json
{
  "name": "互动操作",
  "description": "点赞、评论、关注",
  "version": "1.0.0",
  "actions": {
    "点赞": {
      "steps": [
        {"action": "click", "target": ".like-btn"},
        {"action": "wait", "seconds": 3}
      ]
    },
    "评论": {
      "steps": [
        {"action": "click", "target": ".comment-btn"},
        {"action": "wait_for_selector", "selector": ".comment-input"},
        {"action": "fill", "target": ".comment-input", "value": "{comment_text}"},
        {"action": "click", "target": ".submit-comment"}
      ],
      "required_params": ["comment_text"]
    },
    "关注": {
      "steps": [
        {"action": "click", "target": ".follow-btn"},
        {"action": "wait", "seconds": 2}
      ]
    }
  },
  "notes": "根据实际页面结构调整选择器"
}
```

**Step 3: 创建数据分析技能模板**

```json
{
  "name": "数据分析",
  "description": "获取账号和笔记数据",
  "version": "1.0.0",
  "metrics": {
    "账号数据": ["粉丝数", "点赞数", "收藏数", "评论数", "分享数"],
    "笔记数据": ["浏览量", "点赞数", "收藏数", "评论数", "转化率"]
  },
  "steps": [
    {"action": "navigate", "target": "https://creator.xiaohongshu.com/"},
    {"action": "wait_for_selector", "selector": ".data-overview"},
    {"action": "evaluate_script", "script": "return document.querySelector('.data-overview').innerText"}
  ],
  "notes": "可根据实际分析需求扩展"
}
```

---

## Task 3: 创建安全操作规范

**Files:**
- Create: `memory/specs/行为规范.json`
- Create: `memory/specs/风险检测.json`

**Step 1: 创建行为规范**

```json
{
  "name": "行为规范",
  "version": "1.0.0",
  "description": "小红书安全操作规范",
  "rules": {
    "操作频率": {
      "发布笔记": "每天最多 3 篇",
      "点赞": "每小时最多 20 次",
      "评论": "每小时最多 10 次",
      "关注": "每小时最多 5 次",
      "私信": "每天最多 50 条"
    },
    "时间间隔": {
      "最小间隔": 5,
      "最大间隔": 30,
      "单位": "秒"
    },
    "内容规范": {
      "敏感词过滤": true,
      "图片水印检测": true,
      "字数限制": "10-1000字"
    }
  },
  "forbidden_actions": [
    "频繁删除笔记",
    "短时间内大量点赞后取消",
    "使用非官方工具批量操作",
    "发布违规内容"
  ],
  "error_handling": {
    "登录失效": "立即暂停并通知",
    "操作频繁": "自动延长等待时间",
    "内容违规": "记录并跳过该内容"
  }
}
```

**Step 2: 创建风险检测规范**

```json
{
  "name": "风险检测",
  "version": "1.0.0",
  "description": "异常情况检测与处理",
  "risk_signals": {
    "账号异常": [
      "登录状态失效",
      "无法发布内容",
      "功能被限制"
    ],
    "操作异常": [
      "频繁提示操作失败",
      "页面加载超时",
      "元素找不到"
    ]
  },
  "actions": {
    "暂停所有操作": "立即停止并记录",
    "延长间隔": "将间隔时间延长2-3倍",
    "通知用户": "告知具体异常情况"
  }
}
```

---

## Task 4: 创建任务跟踪模板

**Files:**
- Create: `tasks/task_template.json`

**Step 1: 创建任务模板**

```json
{
  "id": "task_{timestamp}",
  "title": "任务标题",
  "description": "任务详细描述",
  "type": "publish | interaction | analysis",
  "status": "pending | in_progress | done | failed",
  "params": {},
  "result": {},
  "created_at": "",
  "started_at": "",
  "completed_at": "",
  "error": null
}
```

---

## Task 5: 创建操作记录模板

**Files:**
- Create: `memory/history/操作记录模板.json`

**Step 1: 创建记录模板**

```json
{
  "id": "action_{timestamp}",
  "type": "publish | like | comment | follow | analysis",
  "target": "笔记ID/用户ID/URL",
  "status": "success | failed | paused",
  "duration_seconds": 0,
  "details": {},
  "timestamp": "",
  "error": null,
  "learning": []
}
```

---

## Task 6: 创建知识库初始化

**Files:**
- Create: `memory/knowledge/敏感词库.json`
- Create: `memory/knowledge/热门话题.json`

**Step 1: 创建敏感词库模板**

```json
{
  "name": "敏感词库",
  "version": "1.0.0",
  "categories": {
    "政治敏感": [],
    "违规内容": ["永久封禁", "刷量", "作弊"],
    "广告违规": [],
    "其他": []
  },
  "last_updated": "",
  "update_frequency": "manual"
}
```

**Step 2: 创建热门话题模板**

```json
{
  "name": "热门话题",
  "version": "1.0.0",
  "topics": [],
  "trending_tags": [],
  "last_updated": "",
  "source": "manual"
}
```

---

## Task 7: 验证目录结构

**Step 1: 验证创建的文件**

```bash
find /Users/molei/codes/aios -type f -name "*.json" | sort
```

预期输出：
```
aios/config/settings.json
aios/memory/skills/publish笔记.json
aios/memory/skills/互动操作.json
aios/memory/skills/数据分析.json
aios/memory/specs/行为规范.json
aios/memory/specs/风险检测.json
aios/memory/knowledge/敏感词库.json
aios/memory/knowledge/热门话题.json
aios/tasks/task_template.json
aios/memory/history/操作记录模板.json
```

---

## 执行选项

**计划完成并保存到 `docs/plans/2026-03-01-xiaohongshu-assistant-implementation.md`。两个执行选项：**

**1. Subagent-Driven (当前会话)** - 我每个任务派一个新子代理，任务间审查，快速迭代

**2. Parallel Session (新会话)** - 在新会话中使用 executing-plans，带检查点的批量执行

**选择哪种方式？**
