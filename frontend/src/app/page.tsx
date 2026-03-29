//  Copyright (C) 2024 GridsPilot Team (charismamikoo@gmail.com)
//  This file is part of GridsPilot.
//  GridsPilot is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License.
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

// ==============================================================================
// 🎨 图标库 (Lucide Icons)
// ==============================================================================
import { 
  MessageSquare, Network, Cpu, Wrench, Database, Blocks, ShieldAlert, Users, 
  Archive, Inbox, Hash, ChevronRight, ChevronDown, Search, Settings, Command, 
  Quote, FilePlus2, Loader2, Layers, Scale, Briefcase, Ticket, ListTree, 
  Share2, Activity, Zap 
} from 'lucide-react';

// ==============================================================================
// 📦 子系统视图挂载 (The 6 Pillars of GridsPilot OS)
// 严格按照导航栏从上到下的业务域层级排列
// ==============================================================================

// --- 1. Collaboration (协同前台) ---
import Workspace from '@/components/dashboard/Workspace';
import ChatCopilot from '@/components/dashboard/ChatCopilot';
import Workbench from '@/components/dashboard/Workbench';

// --- 2. Orchestration (架构车间) ---
import TriggerHub from '@/components/dashboard/TriggerHub';
import FlowCanvas from '@/components/canvas/FlowCanvas';     // 包含 Studio(Flows)
import ComponentHub from '@/components/dashboard/ComponentHub';

// --- 3. AI Workforces (算力总成) ---
import AgentHub from '@/components/dashboard/AgentHub';
import PromptHub from '@/components/dashboard/PromptHub';
import SkillRegistry from '@/components/dashboard/SkillRegistry';
import ModelHub from '@/components/dashboard/ModelHub';

// --- 4. Business Ecosystem (业务底座) ---
import SchemaHub from '@/components/dashboard/SchemaHub';
import AssetHub from '@/components/dashboard/AssetHub';
import IntegrationHub from '@/components/dashboard/IntegrationHub';

// --- 5. Governance (治理宪法) ---
import RulesHub from '@/components/dashboard/RulesHub';
import GuardsHub from '@/components/dashboard/GuardsHub';
import MonitorHub from '@/components/dashboard/MonitorHub';

// --- 6. Records & Insights (数据洞察) ---
import TracesView from '@/components/dashboard/TracesView';
import CasesView from '@/components/dashboard/CasesView';
import TicketsView from '@/components/dashboard/TicketsView';
import LedgerView from '@/components/dashboard/LedgerView';

// ==============================================================================
// 🎨 组件：二级折叠菜单组
// ==============================================================================
const NavGroup = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 mb-1.5 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors group"
      >
        {isOpen ? <ChevronDown size={12} className="opacity-70 group-hover:opacity-100" /> : <ChevronRight size={12} className="opacity-70 group-hover:opacity-100" />}
        <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
      </div>
      {isOpen && <div className="space-y-0.5 px-2">{children}</div>}
    </div>
  );
};

// ==============================================================================
// 💡 组件：Studio 左侧的图纸列表侧边栏 (Flows Explorer)
// ==============================================================================
const FlowListSidebar = () => {
  const { activeFlowId, setActiveFlow } = useUIStore();
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/flows');
      const data = await res.json();
      setFlows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error('fetchFlows error', err);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    // 监听新建图纸事件，刷新列表
    const handleRefresh = () => fetchFlows();
    window.addEventListener('flow-created', handleRefresh);
    return () => window.removeEventListener('flow-created', handleRefresh);
  }, []);

  if (loading) return <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-slate-500" /></div>;
  
  return (
    <div className="space-y-1">
      {/* 💡 顶部隐藏的新建按钮入口 (配合右侧空状态大按钮，双重保险) */}
      <div className="px-3 pb-3 flex justify-between items-center text-slate-500 pt-2 border-b border-slate-800/60 mb-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">Your Assets</span>
        <button onClick={() => window.dispatchEvent(new CustomEvent('trigger-create-flow'))} className="hover:text-blue-400 transition-colors" title="新建空白流程图">
          <FilePlus2 size={14} />
        </button>
      </div>

      {flows.length === 0 && <div className="text-center p-4 text-xs text-slate-600">资产库空空如也</div>}

      {flows.map(f => (
        <div 
          key={f.id} 
          onClick={() => setActiveFlow(f.id)}
          className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all flex flex-col gap-1 border ${
            activeFlowId === f.id 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.1)]' 
              : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-bold truncate">{f.name}</div>
          <div className="text-[9px] font-mono opacity-60 truncate">{f.id}</div>
        </div>
      ))}
    </div>
  );
};

// ==============================================================================
// 主界面：GridsPilot OS 壳子 (The Shell)
// ==============================================================================
export default function GridsPilotOS() {
  const { currentView, setCurrentView, activeFlowId } = useUIStore();
  const { connectWs, logs } = useExecStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { connectWs(); }, [connectWs]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // 监听侧边栏派发的新建事件
  useEffect(() => {
    const handleTriggerCreate = async () => {
      const newFlowId = `flow_custom_${Date.now()}`;
      // 初始化一张极其干净的、符合绝对矩阵排版的白板图纸
      const newFlow = {
        id: newFlowId, name: "未命名新业务流", description: "手动创建的空白图纸",
        nodes: [
          { id: `Phase_${Date.now()}`, type: "phaseNode", position: { x: 200, y: 0 }, style: { width: 320, height: 40, zIndex: -1 }, data: { label: "新建业务阶段", pill: "PHASE 1", stats: "1 子泳道" }, draggable: false, selectable: false },
          { id: `Lane_${Date.now()}`, type: "sublaneNode", position: { x: 200, y: 46 }, style: { width: 320, height: 954, zIndex: 0 }, data: { label: "▶ 默认主线" }, draggable: false, selectable: false }
        ], edges: []
      };
      try {
        const res = await fetch('http://localhost:8000/api/flows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFlow) });
        if ((await res.json()).status === 'success') {
          window.dispatchEvent(new CustomEvent('flow-created'));
          useUIStore.getState().setActiveFlow(newFlowId);
        }
      } catch (e) { alert("无法连接后端引擎。"); }
    };
    window.addEventListener('trigger-create-flow', handleTriggerCreate);
    return () => window.removeEventListener('trigger-create-flow', handleTriggerCreate);
  }, []);

  const NavItem = ({ id, icon, label }: { id: any, icon: any, label: string }) => {
    const isActive = currentView === id;
    return (
      <button 
        onClick={() => setCurrentView(id)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-all text-sm ${
          isActive 
            ? 'bg-blue-600/15 text-blue-400 font-medium' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <span className={isActive ? "text-blue-400" : "text-slate-500"}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <main className="flex h-screen w-screen bg-[#0B0F19] overflow-hidden select-none">
      
      {/* ================================================================= */}
      {/* 1. 现代化桌面级宽幅侧边栏 (The Ultimate OS Dock) */}
      {/* ================================================================= */}
      <div className="w-60 border-r border-slate-800/60 bg-[#0E121B] flex flex-col z-20 shrink-0">
        
        <div className="p-4 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">G</div>
            <h1 className="font-bold text-slate-100 tracking-wide text-lg">GridsPilot</h1>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 flex items-center justify-between text-slate-500 hover:border-slate-700 transition-colors cursor-text">
            <div className="flex items-center gap-2 text-xs">
              <Search size={14} /> Search...
            </div>
            <div className="flex items-center gap-0.5 opacity-60">
              <Command size={10} /> <span className="text-[10px] font-mono">K</span>
            </div>
          </div>
        </div>

        {/* 🌟 核心：五大业务域的终极划分 */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar pr-1">
          
          {/* ================================================================= */}
        {/* 🌟 终极导航树 (The Ultimate OS Dock) - 展现 5 大核心业务域 */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar pr-1">
          
          {/* 1. 内部管理与生产力 (Internal Productivity) */}
          <NavGroup title="Copilots">
            {/* 💡 重新定义：Copilot 是员工的私有/内部群组工作区，用于调度被封装后的专属 Agents */}
            <NavItem id="chat" icon={<MessageSquare size={16} />} label="My Copilots" />
            {/* 💡 Inbox 属于内部员工的待办处理台 */}
            <NavItem id="workbench" icon={<Inbox size={16} />} label="Inbox (Tickets)" />
          </NavGroup>

          {/* 2. 外部业务协同 (External Collaboration) */}
          <NavGroup title="Business Workspaces">
            {/* 💡 重新定义：Workspace 是对接外部场景（客服/销售）的公共频道大厅 */}
            <NavItem id="workspace" icon={<Hash size={16} />} label="Service Workspaces" />
          </NavGroup>

          {/* 3. 编排与组装区 (架构师的车间) */}
          <NavGroup title="Orchestration">
            <NavItem id="triggers" icon={<Zap size={16} />} label="Triggers" /> {/* 💡 新增：定义业务流何时被唤醒 */}
            <NavItem id="studio" icon={<Network size={16} />} label="Studio" />
            <NavItem id="components" icon={<Blocks size={16} />} label="Components" /> 
          </NavGroup>

          {/* 4. AI 算力总成 (数字员工的五脏六腑) 💡 你的神级重组 */}
          <NavGroup title="AI Workforces">
            <NavItem id="agents" icon={<Users size={16} />} label="Agents" />
            <NavItem id="prompts" icon={<Quote size={16} />} label="Prompts" /> 
            <NavItem id="skills" icon={<Wrench size={16} />} label="Skills" />
            <NavItem id="models" icon={<Cpu size={16} />} label="Models" />
            
          </NavGroup>

          {/* 5. 业务生态底座 (系统的物理世界映射) 💡 你的神级重组 */}
          <NavGroup title="Business Ecosystem">
            <NavItem id="schemas" icon={<Layers size={16} />} label="Business Schemas" />
            <NavItem id="assets" icon={<Archive size={16} />} label="Business Data" />
            <NavItem id="integrations" icon={<Share2 size={16} />} label="Integrations" />
          </NavGroup>

          {/* ========================================================= */}
          {/* 🌟 6. 治理域 (Governance) - 定规矩、设探针、看大盘 */}
          {/* ========================================================= */}
          <NavGroup title="Governance">
            <NavItem id="rules" icon={<Scale size={16} />} label="Guidelines & Rules" />
            <NavItem id="guards" icon={<ShieldAlert size={16} />} label="Security Guards" /> {/* 💡 拆分：纯粹的探针配置 */}
            <NavItem id="monitors" icon={<Activity size={16} />} label="Global Monitors" />  {/* 💡 拆分：纯粹的数据监控大盘 */}
          </NavGroup>

          {/* 7. 记录与洞察域 (沉淀数据，反哺迭代) - 严格遵循数据价值升维漏斗 */}
          <NavGroup title="Records & Insights">
            <NavItem id="traces" icon={<ListTree size={16} />} label="Traces" />
            <NavItem id="cases" icon={<Briefcase size={16} />} label="Cases" />
            <NavItem id="tickets" icon={<Ticket size={16} />} label="Tickets" />
            <NavItem id="ledger" icon={<Database size={16} />} label="Ledger" />
          </NavGroup>

        </div>

        </div>

        <div className="p-4 border-t border-slate-800/60 flex items-center gap-3 hover:bg-slate-800/40 cursor-pointer transition-colors mt-auto">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            Me
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-200 truncate">Architect</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Local Engine</div>
          </div>
          <Settings size={16} className="text-slate-500" />
        </div>

      </div>

      {/* ================================================================= */}
      {/* 2. 主工作区路由 (Main Workspace Routing) - 严丝合缝对应左侧 6 大域 */}
      {/* ================================================================= */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-900">
        
        {/* ========================================================= */}
        {/* 🚀 1. 内部管理与生产力 (Internal Productivity: My Copilots) */}
        {/* 定位：员工的私有/内部群组工作区，用于调度被封装后的专属 Agents */}
        {/* ========================================================= */}
        {currentView === 'chat' && <ChatCopilot />}
        {currentView === 'workbench' && <Workbench />}


        {/* ========================================================= */}
        {/* 🚀 2. 外部业务协同 (External Business Workspaces) */}
        {/* 定位：对接外部场景（客服/销售/生态）的公共频道大厅 */}
        {/* ========================================================= */}
        {currentView === 'workspace' && <Workspace />}

        {/* 🚀 3. 编排与组装区 (Orchestration) */}
        {currentView === 'triggers' && <TriggerHub />} {/* 💡 这里完美挂载发令枪！ */}
        {currentView === 'components' && <ComponentHub />} {/* 💡 这里完美挂载宏积木！ */}
        
        {/* 🚀 4. AI 算力总成 (AI Workforces) */}
        {currentView === 'agents' && <AgentHub />}
        {currentView === 'prompts' && <PromptHub />}
        {currentView === 'skills' && <SkillRegistry />}
        {currentView === 'models' && <ModelHub />}

        {/* 🚀 5. 业务生态底座 (Business Ecosystem) */}
        {currentView === 'schemas' && <SchemaHub />} 
        {currentView === 'assets' && <AssetHub />}
        {currentView === 'integrations' && <IntegrationHub />}

        {/* 🚀 6. 治理域 (Governance) */}
        {/* ========================================================= */}
        {currentView === 'rules' && <RulesHub />} 
        {/* 💡 修复点：Guards 菜单正确指向 GuardsHub (探针拦截配置页) */}
        {currentView === 'guards' && <GuardsHub />} 
        {/* 💡 修复点：Monitors 菜单正确指向 MonitorHub (带有数据的全局大盘页) */}
        {currentView === 'monitors' && <MonitorHub />}

        {/* 🚀 7. 记录与洞察域 (Records & Insights) */}
        {currentView === 'traces' && <TracesView />}
        {currentView === 'cases' && <CasesView />}
        {currentView === 'tickets' && <TicketsView />}
        {currentView === 'ledger' && <LedgerView />} 


        {/* ========================================================= */}
        {/* 🌟 核心独享：Studio (Flows) 的三栏式 IDE 布局 */}
        {/* ========================================================= */}
        {currentView === 'studio' && (
          <div className="flex-1 flex w-full h-full bg-[#0B0F19]">
            
            {/* 中间栏：Flows Explorer */}
            <div className="w-[280px] bg-[#0E121B] border-r border-slate-800/60 flex flex-col shrink-0 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
              <div className="p-4 border-b border-slate-800/60 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Network size={16} className="text-blue-500"/> Flows Explorer</h2>
                </div>
                <div className="bg-[#050505] border border-slate-800 rounded-md px-3 py-1.5 flex items-center text-slate-500 focus-within:border-blue-500 transition-colors shadow-inner">
                  <Search size={14} className="mr-2" />
                  <input type="text" placeholder="搜索图纸..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <FlowListSidebar />
              </div>
            </div>

            {/* 右侧大区：画布 (内置空状态引导与创建按钮) */}
            <div className="flex-1 relative flex flex-col min-w-0 bg-[#050505]">
              {!activeFlowId ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <Network size={48} className="text-slate-800 mb-4 stroke-1"/>
                  <h3 className="text-slate-300 font-bold mb-2 text-lg">No Flow Selected</h3>
                  <p className="text-sm mb-6 max-w-sm text-center opacity-80">请在左侧文件树中选择一个业务流图纸，或点击下方新建一张空白画布。</p>
                  
                  {/* 💡 绑定真实的建图事件！ */}
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-create-flow'))}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
                  >
                    <FilePlus2 size={14}/> 创建新图纸 (New Flow)
                  </button>
                  
                </div>
              ) : (
                <FlowCanvas />
              )}
            </div>
          </div>
        )}
      </div>

    </main>
  );
}