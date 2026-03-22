'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';
import { 
  MessageSquare, Network, Cpu, Wrench, Database, 
  Blocks, ShieldAlert, Users, Archive, Inbox, Hash, 
  ChevronRight, ChevronDown, Search, Settings, Command
} from 'lucide-react';

import FlowCanvas from '@/components/canvas/FlowCanvas';
import ModelHub from '@/components/dashboard/ModelHub';
import SkillRegistry from '@/components/dashboard/SkillRegistry';
import IntegrationHub from '@/components/dashboard/IntegrationHub';
import MonitorHub from '@/components/dashboard/MonitorHub';
import LedgerView from '@/components/dashboard/LedgerView';
import AssetHub from '@/components/dashboard/AssetHub';
import AgentHub from '@/components/dashboard/AgentHub';
import Workbench from '@/components/dashboard/Workbench';
import Workspace from '@/components/dashboard/Workspace';
import ChatCopilot from '@/components/dashboard/ChatCopilot';

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

export default function NexaFlowOS() {
  const { currentView, setCurrentView, activeFlowId } = useUIStore();
  const { connectWs, logs } = useExecStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { connectWs(); }, [connectWs]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

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
      
      {/* 1. 现代化桌面级侧边栏 */}
      <div className="w-60 border-r border-slate-800/60 bg-[#0E121B] flex flex-col z-20 shrink-0">
        
        <div className="p-4 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">N</div>
            <h1 className="font-bold text-slate-100 tracking-wide text-lg">NexaFlow</h1>
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

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <NavGroup title="Collaboration">
            <NavItem id="workspace" icon={<Hash size={16} />} label="Workspace" />
            <NavItem id="chat" icon={<MessageSquare size={16} />} label="Copilot" />
            <NavItem id="workbench" icon={<Inbox size={16} />} label="Inbox" />
          </NavGroup>

          <NavGroup title="Orchestration">
            <NavItem id="studio" icon={<Network size={16} />} label="Studio (Flows)" />
            <NavItem id="agents" icon={<Users size={16} />} label="Agents" />
          </NavGroup>

          <NavGroup title="Assets & Config">
            <NavItem id="assets" icon={<Archive size={16} />} label="Business Assets" />
            <NavItem id="models" icon={<Cpu size={16} />} label="Models" />
            <NavItem id="skills" icon={<Wrench size={16} />} label="Skills" />
            <NavItem id="integrations" icon={<Blocks size={16} />} label="Integrations" />
          </NavGroup>

          <NavGroup title="Governance">
            <NavItem id="monitor" icon={<ShieldAlert size={16} />} label="Guards" />
            <NavItem id="ledger" icon={<Database size={16} />} label="Ledger" />
          </NavGroup>
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

      {/* 2. 主工作区 */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-900">
        {currentView === 'workspace' && <Workspace />}
        {currentView === 'chat' && <ChatCopilot />}
        {currentView === 'workbench' && <Workbench />}
        {currentView === 'agents' && <AgentHub />}
        {currentView === 'assets' && <AssetHub />}
        {currentView === 'models' && <ModelHub />}
        {currentView === 'skills' && <SkillRegistry />}
        {currentView === 'integrations' && <IntegrationHub />}
        {currentView === 'monitor' && <MonitorHub />}
        {currentView === 'ledger' && <LedgerView />}

        {currentView === 'studio' && (
          <div className="flex-1 flex w-full h-full">
            <div className="flex-1 relative">
              <FlowCanvas />
            </div>
            {activeFlowId && (
              <div className="w-[380px] border-l border-slate-800 bg-[#0B0F19] flex flex-col shrink-0 shadow-2xl relative z-10">
                <div className="h-[45%] border-b border-slate-800 p-4 bg-black flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent opacity-50"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[10px] font-bold text-orange-500 tracking-widest flex items-center gap-1.5">● PLAYSTREAM MONITOR</h2>
                    <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">Live</span>
                  </div>
                  <div className="flex-1 border border-slate-800 rounded bg-[#0a0a0a] flex items-center justify-center text-slate-600 text-xs font-mono relative overflow-hidden shadow-inner group-hover:border-slate-700 transition-colors">
                     Waiting for Execution...
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <h2 className="text-[10px] font-bold text-blue-500 tracking-widest mb-3 flex items-center gap-1.5">EXECUTION LOGS</h2>
                  <div className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2.5 shadow-inner">
                    {logs.length === 0 && <div className="text-slate-600">Waiting for task to start...</div>}
                    {logs.map((log, idx) => (
                      <div key={idx} className={`${log.includes('❌') || log.includes('🛑') ? 'text-red-400' : (log.includes('✅') ? 'text-green-400' : 'text-slate-300')}`}>
                        {log}
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
}