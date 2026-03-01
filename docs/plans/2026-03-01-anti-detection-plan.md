# 反检测优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现浏览器反检测功能，让小红书操作不被识别为机器人

**Architecture:** 通过 JSON 配置文件定义反检测参数，创建独立的反检测技能文件，在浏览器操作时注入反检测脚本

**Tech Stack:** Chrome DevTools MCP, JSON 配置系统, JavaScript 注入脚本

---

## Task 1: 更新 settings.json 添加反检测配置

**Files:**
- Modify: `config/settings.json`

**Step 1: 添加反检测配置项**

```json
{
  "anti_detection": {
    "enabled": true,
    "stealth_mode": {
      "hide_webdriver": true,
      "randomize_plugins": true,
      "modify_navigator": true,
      "modify_permissions": true
    },
    "behavior_simulation": {
      "random_delay": {
        "min_ms": 3000,
        "max_ms": 15000
      },
      "human_scroll": true,
      "human_click": true,
      "human_type": true,
      "mouse_trajectory": true
    }
  }
}
```

**Step 2: 运行验证**

确认 JSON 格式正确

---

## Task 2: 创建反检测脚本文件

**Files:**
- Create: `memory/skills/反检测脚本.json`

**Step 1: 写入脚本内容**

```json
{
  "name": "反检测脚本",
  "description": "浏览器反检测脚本，隐藏 WebDriver 特征并模拟人类行为",
  "version": "1.0.0",
  "stealth_scripts": {
    "webdriver_hide": "Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true, writable: true });",
    "plugins_fix": "Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5], configurable: true });",
    "languages_fix": "Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'], configurable: true });",
    "chrome_fix": "window.chrome = { runtime: {} };",
    "permissions_fix": "const originalQuery = window.navigator.permissions.query; window.navigator.permissions.query = (parameters) => parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters);",
    "automation_fix": "window.navigator.__defineGetter__('webdriver', () => false);"
  },
  "behavior_functions": {
    "human_delay": "function getRandomDelay(min = 3000, max = 15000) { const u = Math.random(); return Math.floor(min + (max - min) * Math.pow(u, 2)); }",
    "human_scroll": "async function humanScroll() { const amount = window.innerHeight * (0.3 + Math.random() * 0.5); window.scrollBy({ top: amount, behavior: 'smooth' }); await new Promise(r => setTimeout(r, 500 + Math.random() * 2000)); }",
    "human_click_offset": "function getClickOffset(width, height) { return { x: (Math.random() - 0.5) * width * 0.6, y: (Math.random() - 0.5) * height * 0.6 }; }"
  },
  "injection_guide": {
    "when": "在页面加载完成后立即执行",
    "how": "使用 CDP 的 Page.addScriptToEvaluateOnNewDocument 或在控制台执行",
    "verification": "执行后检查 navigator.webdriver === false"
  }
}
```

**Step 2: 运行验证**

确认 JSON 格式正确

---

## Task 3: 创建人类行为模拟技能

**Files:**
- Create: `memory/skills/人类行为模拟.json`

**Step 1: 写入技能内容**

```json
{
  "name": "人类行为模拟",
  "description": "模拟人类浏览行为的随机化操作",
  "version": "1.0.0",
  "actions": {
    "随机滚动": {
      "steps": [
        {
          "action": "evaluate",
          "script": "window.scrollTo({ top: Math.random() * (document.body.scrollHeight - window.innerHeight), behavior: 'smooth' })"
        },
        {
          "action": "wait_random",
          "min_ms": 1000,
          "max_ms": 3000
        }
      ]
    },
    "随机等待": {
      "steps": [
        {
          "action": "wait_random",
          "min_ms": 3000,
          "max_ms": 15000
        }
      ]
    },
    "模拟阅读": {
      "steps": [
        {
          "action": "scroll_to_bottom",
          "behavior": "smooth"
        },
        {
          "action": "wait_random",
          "min_ms": 2000,
          "max_ms": 5000
        },
        {
          "action": "scroll_to_top",
          "behavior": "smooth"
        }
      ]
    },
    "随机点击": {
      "steps": [
        {
          "action": "move_to_element",
          "selector": "{target}"
        },
        {
          "action": "wait_random",
          "min_ms": 200,
          "max_ms": 800
        },
        {
          "action": "click_with_offset"
        }
      ]
    }
  },
  "timing_patterns": {
    "between_actions": {
      "min": 5,
      "max": 30,
      "unit": "seconds",
      "distribution": "beta"
    },
    "between_pages": {
      "min": 10,
      "max": 60,
      "unit": "seconds"
    }
  }
}
```

**Step 2: 运行验证**

确认 JSON 格式正确

---

## Task 4: 更新行为规范添加反检测要求

**Files:**
- Modify: `memory/specs/行为规范.json`

**Step 1: 添加反检测要求**

在 rules 中添加:

```json
"反检测要求": {
  "启用反检测": true,
  "隐藏WebDriver": true,
  "随机化操作": true,
  "最小操作间隔秒": 5,
  "最大操作间隔秒": 30,
  "必需行为": [
    "每次操作前注入反检测脚本",
    "操作间隔随机化",
    "模拟人类滚动行为",
    "点击位置随机偏移"
  ]
}
```

---

## Task 5: 更新互动操作技能添加随机延迟

**Files:**
- Modify: `memory/skills/互动操作.json`

**Step 1: 添加随机延迟机制**

修改每个 action 的等待时间：

```json
"点赞": {
  "steps": [
    {
      "action": "click",
      "target": ".like-btn"
    },
    {
      "action": "wait_random",
      "min_seconds": 3,
      "max_seconds": 15
    }
  ]
}
```

添加新函数：

```json
"utils": {
  "wait_random": "在 min_seconds 和 max_seconds 之间随机等待"
}
```

---

## Task 6: 创建 Chrome 启动参数配置

**Files:**
- Create: `config/stealth-chrome-args.json`

**Step 1: 写入启动参数**

```json
{
  "name": "Stealth Chrome Arguments",
  "description": "反检测 Chrome 启动参数",
  "version": "1.0.0",
  "args": [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--disable-browser-side-navigation",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--ignore-certificate-errors",
    "--disable-extensions",
    "--disable-plugins",
    "--disable-default-apps",
    "--disable-background-networking",
    "--disable-sync",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-first-run",
    "--safebrowsing-disable-auto-update"
  ],
  "notes": "使用这些参数启动 Chrome 可以减少被检测为自动化的概率"
}
```

---

## Task 7: 更新 CLAUDE.md 添加反检测说明

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 添加反检测章节**

在安全限制后添加：

```
## Anti-Detection

- Always use anti-detection scripts before any browser operation
- Enable random delays between actions (5-30 seconds)
- Use human behavior simulation skills
- Key files:
  - `config/settings.json` - anti_detection config
  - `memory/skills/反检测脚本.json` - stealth scripts
  - `memory/skills/人类行为模拟.json` - human behavior
  - `config/stealth-chrome-args.json` - Chrome args
```

---

## 执行方式

**Plan complete and saved to `docs/plans/2026-03-01-anti-detection-plan.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
