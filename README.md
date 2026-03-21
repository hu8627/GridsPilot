<div align="center">
  <h1>🌊 BizFlow: An AI-Native Business OS Demo</h1>
  <p><b>Bridging the gap between Autonomous Agents and Enterprise Workflows.</b></p>
  <p><i>A highly visual, Human-in-the-Loop (HITL) orchestration framework for complex AI tasks.</i></p>

  <br>

  > **"This might be closer to the true form of future human-AI collaboration: <br> AI executes, humans supervise and provide the safety net."**
  > 
  > **"这可能更接近未来人类与 AI 协同工作的真实形态——AI 负责执行，人类负责监督和兜底。"**

  <br>

  <p>
    <a href="#english-version"><b>English Documentation</b></a> • 
    <a href="#中文介绍"><b>中文说明文档</b></a>
  </p>
</div>
<img width="3024" height="1618" alt="a16f1e7889727d0199e9baab3e61e804" src="https://github.com/user-attachments/assets/c0673b37-fadb-47c3-9bd7-ce05745d0f8e" />

---

<h2 id="english-version">English Version</h2>

### 🤔 Why I built this?

When attempting to deploy AI Agents (e.g., LLM-based web scrapers, automated data entry scripts) into real-world business scenarios, I encountered a massive pain point: **The execution process is too much of a "black box" and the fault tolerance is extremely low.**

Current solutions face a dilemma:
*   **Code-only Agents (e.g., AutoGPT/Devin)**: Once they run, you can only stare at dense terminal logs. If it gets stuck on a web form or encounters a distorted CAPTCHA, the entire task crashes, leaving you no chance to intervene.
*   **Traditional Workflows (e.g., Coze/Dify)**: While they offer node graphs, they lack fine-grained monitoring and human-takeover mechanisms for long-running asynchronous tasks that require "embodied actions."

Thus, I conceived and built **BizFlow** as a Proof of Concept (POC).

The core idea is simple: **Draw the Agent's execution logic as a visible blueprint (DAG) or execute according to a confirmed logic, and place a "brake (Auditor)" at critical nodes. If the AI hits its capability boundary, freeze the frame, push it to a human, let the human click a button in the console, and the AI resumes running with the human's input.**

As the project slogan states, BizFlow does not pursue blind "full automation" but strives to build an extremely elegant **Human-in-the-Loop (HITL) Workbench**.

### ✨ Core Features

1. **👀 100% Execution Visibility**: Say goodbye to staring at terminal strings. BizFlow's frontend provides a split-screen `Studio`: the left side shows the glowing, flowing node graph, and the right side is a live stream monitor (ready for physical execution streams like Browser-use).
2. **🛑 Elegant Human-in-the-Loop Workbench**: Perhaps the most interesting part of this project. When orchestrating nodes, you can enable `interrupt_before: true`. When the AI reaches here (e.g., before writing sensitive data to CRM), the workflow suspends. The task appears in your `Inbox (Workbench)`, waiting for your personal click to "resume."
3. **💬 Chat-to-SOP (Dynamic Intent Generation)**: Describe a complex task in natural language in the `Copilot` window. The underlying LLM outputs a BPNL (JSON) protocol, rendering an interactive, modifiable business flowchart in the frontend instantly.
4. **🗄️ Everything is an Asset (FileDB)**: For out-of-the-box readiness, all underlying Flows, Agents, Models, and Intervention Cases are persisted as local JSON files. This gives the system extreme portability and privacy.

### 🏗️ Core Architecture: The PNSA Paradigm

BizFlow's underlying philosophy is: **AI's generalized intelligence must be contained within system-controlled cages.** Therefore, BizFlow invented the **PNSA Architecture**, restructuring workflows and LLM Agents:

*   **[ P ] Parametric**: Nodes are no longer hardcoded; they dynamically mount specific Agents, underlying Models, and atomic Skills.
*   **[ N ] Nodal**: Physical isolation of context boundaries. Splitting long-chain tasks into discrete nodes prevents LLMs from falling into infinite loops.
*   **[ S ] Supervisor**: The dynamic guard on the edges. Based on the previous Agent's execution result (e.g., CAPTCHA detected, low risk score), it dynamically decides whether to take the main route or fall into the retry/alert branch.
*   **[ A ] Auditor (The Ultimate Moat)**: Facing high-risk nodes (e.g., writing to CRM, triggering payment), the engine is forcefully suspended, returning decision-making power and physical buttons to humans.

---

<br>

<h2 id="中文介绍">中文说明文档</h2>

### 🤔 为什么做这个项目？

在尝试将 AI Agent（如基于大模型的网页操控、自动化录入脚本）落地到真实的业务场景时，我遇到了一个巨大的痛点：**执行过程太“黑盒”了，且容错率极低。**

现有的方案往往面临两难：
*   **纯代码 Agent (如 AutoGPT/Devin)**：一旦运行，你只能在终端里看着密密麻麻的 Log。如果它在一个表单页面卡住了，或者遇到了一个极度扭曲的验证码，整个任务直接崩溃，你连介入帮忙的机会都没有。
*   **传统 Workflow (如 Coze/Dify)**：虽然有连线图，但对这种需要“具身操作”的长时间异步任务，缺乏细粒度的监控和人工接管机制。

因此，我构思并写下了 **BizFlow** 这个概念验证项目 (POC)。

它的核心思路很简单：**把 Agent 的执行逻辑画成可见的图纸 (DAG) 或者按照已确认的执行逻辑执行，并且在关键节点挂上一个“刹车 (Auditor)”。如果 AI 遇到了它的能力边界，把画面定格推给人类，人类在控制台点一下，AI 带着人类的输入继续跑。**

正如项目标语所言，BizFlow 不追求盲目的“全自动”，而是致力于打造一个极其优雅的**人机协同工作台 (Human-in-the-Loop Workbench)**。

### ✨ 核心特性 (Core Features)

1. **👀 100% 可视化的执行过程**：不再是看着终端里的字符串发呆。BizFlow 的前端提供了一个双分屏的 `Studio`：左侧是正在发光流转的节点图，右侧是实况推流大屏（未来可接入 Browser-use 等物理执行画面的推流）。
2. **🛑 优雅的人机接管 (Workbench)**：这或许是本项目最有意思的地方。在编排节点时，你可以开启 `interrupt_before: true`。当 AI 走到这里（例如准备向 CRM 写入敏感数据前），流程会挂起 (Suspended)。任务会出现在你的 `Inbox (Workbench)` 里，等待你亲自点击“确认放行”。
3. **💬 Chat-to-SOP (动态意图生成)**：在 `Copilot` 窗口中用自然语言描述一个复杂任务（如“帮我调研 Shopify 并录入系统”），底层的 LLM 会直接输出一段 BPNL (JSON) 协议，并在前端瞬间渲染成可二次拖拽、修改的业务流程图。
4. **🗄️ 一切皆资产 (极简 FileDB)**：为了开箱即用，系统底层的 Flows（图纸）、Agents（数字员工）、Models（模型配置）和 Cases（人工接管记录）全部被持久化为本地的 JSON 文件。这让系统具备了极强的可移植性和隐私性。

### 🏗️ 核心架构：PNSA 范式

BizFlow 的底层哲学是：**AI 的泛化智力必须被关进系统控制的笼子里。** 为此，BizFlow 独创了 **PNSA 架构**，将业务流与大模型 Agent 进行了降维重构：

*   **[ P ] Parametric (参数化)**：节点内不再是写死的死板代码，而是可以动态挂载具体的数字员工 (Agent)、底层模型 (Model) 和原子能力 (Skills)。
*   **[ N ] Nodal (节点化)**：物理隔离上下文边界。将复杂的长链路任务切分为离散节点，彻底防止大模型在复杂任务中陷入“发散与死循环”。
*   **[ S ] Supervisor (监督者)**：连线上的动态卫兵。根据前置 Agent 的执行结果（如识别出验证码、风控评分过低），动态决定是走主干流水线，还是掉入重试/告警分支。
*   **[ A ] Auditor (审计与熔断)**：**系统的终极护城河。** 面对高危节点（如写入 CRM、触发付款），引擎将被强制挂起，将决策权和物理按键交还给人类。

---

## 🛠️ The Tech Stack (技术栈)

*   **Frontend (The Cockpit)**: `Next.js 14` + `TailwindCSS` + `React Flow` (@xyflow/react) + `Zustand`
*   **Backend (The Orchestrator)**: `FastAPI` + `LangGraph` + `LiteLLM`
*   **Storage**: Lightweight local FileSystem JSON DB. *(Recommended to replace with a Database via Repository pattern for production).*

---

## 🚀 Quick Start (快速开始)

> **Note**: This is currently a Proof of Concept (POC). The frontend UI is highly polished, and the backend core compiler/websocket loop is functional. However, features like distributed task queues (Celery) or real browser-use integrations require further development.

### 1. Start the Backend Engine
```bash
git clone https://github.com/your-username/bizflow.git
cd bizflow/backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*(Tip: Add your `OPENAI_API_KEY` or `DEEPSEEK_API_KEY` in the Frontend's `Model Hub` once it's running.)*

### 2. Start the Frontend OS
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` to enter the BizFlow dashboard.

---

## 🗺️ Roadmap & How to Contribute

I open-sourced this code to provide a **"high-aesthetic AI workflow console scaffold"**. If you also find the HITL concept cool, PRs are extremely welcome:
我开源这套代码，是希望为大家提供一个 **“高颜值的 AI 工作流控制台脚手架”**。非常欢迎提交 PR 来一起完善它：

- [x] React Flow Orchestrator with Phase/Sublane layout.
- [x] Backend BPNL JSON Compiler & WebSocket state broadcasting.
- [x] Global FileDB Asset Persistence (Flows, Models, Agents, Cases).
- [ ] **[Backend]** Integrate `Celery` / `Temporal` for highly concurrent task queues. (接入任务队列以支持高并发)
- [ ] **[Backend]** Integrate a real Database as LangGraph Checkpointer for robust task suspension and resumption. (接入数据库实现真实的任务挂起与恢复)
- [ ] **[Execution]** Package `browser-use` into a Node Component and stream real-time screenshots via WebSocket. (封装 browser-use 并实现实时推流)
- [ ] **[Evolution]** Build the Optimizer Agent to self-correct Flows based on human intervention Cases in the Ledger. (基于人工接管账本，利用智能体自动进化图纸)

---

## 📄 License & Contact

BizFlow is released under the **MIT License**. You are free to use, modify, and distribute it for personal or commercial projects. 

*If you find the architectural design or the UI/UX concepts of BizFlow valuable for your enterprise use cases, or if you're interested in consulting / custom development, feel free to reach out:*

📧 **[charismamiko@gmail.com]**

---
<div align="center">
  <p><i>Built for the hackers who want control over their Agents.</i></p>
  <p><b>✨ 特别鸣谢：此项目核心架构与理念由 Gemini 协同推演创作。<br>(Special thanks: Core architecture and philosophy co-created via inference with Gemini.)</b></p>
</div>
