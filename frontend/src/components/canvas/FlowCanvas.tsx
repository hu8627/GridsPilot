'use client';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, Connection, Edge 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, PlayCircle, Edit3, Save, CheckCircle2, DownloadCloud, UploadCloud, AlertTriangle, Settings2, Network, Sparkles, TerminalSquare, Maximize2, ChevronDown, X, Trash2, Cpu, Globe, UserCircle, Plus, Users } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

import BizNode from './BizNode';
import PhaseNode from './PhaseNode';
import SublaneNode from './SublaneNode';
import RowNode from './RowNode';

const SUBLANE_WIDTH = 320;
const PHASE_HEADER_H = 46;

// =================================================================
// 💡 终极对齐：四权分立 (The Four Pillars Paradigm) 横向轨道
// =================================================================
const BACKGROUND_ROWS = [
  { id: 'row_system', type: 'rowNode', position: { x: 0, y: 50 }, style: { height: 250, zIndex: -2 }, data: { label: '⚙️ SYSTEM (系统基建)', color: 'bg-blue-900/10', textColor: 'text-blue-400' }, draggable: false, selectable: false },
  { id: 'row_agent', type: 'rowNode', position: { x: 0, y: 300 }, style: { height: 250, zIndex: -2 }, data: { label: '🧠 AGENT (智能体推理)', color: 'bg-fuchsia-900/10', textColor: 'text-fuchsia-400' }, draggable: false, selectable: false },
  { id: 'row_human', type: 'rowNode', position: { x: 0, y: 550 }, style: { height: 200, zIndex: -2 }, data: { label: '🧑‍💻 HUMAN (人类干预)', color: 'bg-orange-900/10', textColor: 'text-orange-400' }, draggable: false, selectable: false },
  { id: 'row_hardware', type: 'rowNode', position: { x: 0, y: 750 }, style: { height: 250, zIndex: -2 }, data: { label: '🦾 HARDWARE (物理硬件)', color: 'bg-emerald-900/10', textColor: 'text-emerald-400' }, draggable: false, selectable: false }
];

const nodeTypes = {
  bizNode: BizNode,
  phaseNode: PhaseNode,
  sublaneNode: SublaneNode,
  rowNode: RowNode,
};

export default function FlowCanvas() {
  const { activeFlowId } = useUIStore(); 
  const { logs } = useExecStore(); 
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [flowMeta, setFlowMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [inspectNode, setInspectNode] = useState<any>(null);

  // 🌟 全局可用技能库 (Micro App Store)
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);

  // =================================================================
  // 1. 初始化拉取图纸与技能数据 (防弹级)
  // =================================================================
  useEffect(() => {
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => { if (data.status === 'success') setAvailableSkills(data.data); })
      .catch(err => console.error("Failed to load skills:", err));
  },[]);

  useEffect(() => {
    if (!activeFlowId) { 
      setLoading(false); 
      setNodes([...BACKGROUND_ROWS] as any);
      return; 
    }
    
    setLoading(true); 
    setError(null);
    setSelectedNode(null); 

    fetch(`http://localhost:8000/api/flows/${activeFlowId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.status === 'success' && data.data) {
          setFlowMeta(data.data);
          
          // 🚨 核心排雷：过滤掉从后端传来的旧底带，强制使用干净的 BACKGROUND_ROWS
          const cleanNodes = (data.data.nodes || []).filter((n: any) => n.type !== 'rowNode');
          setNodes([...BACKGROUND_ROWS, ...cleanNodes] as any);
          setEdges(Array.isArray(data.data.edges) ? data.data.edges : []);
        } else {
          setError(data.msg || "无法解析底层 JSON 文件");
          setNodes([...BACKGROUND_ROWS] as any); 
          setEdges([]);
        }
      })
      .catch(err => { 
        console.error("Fetch Flow Error:", err);
        setError("网络请求失败，请检查后端引擎是否启动。"); 
        setNodes([...BACKGROUND_ROWS] as any);
      })
      .finally(() => setLoading(false));
  }, [activeFlowId, setNodes, setEdges]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // =================================================================
  // 2. 编排操作逻辑
  // =================================================================
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = (event: React.MouseEvent, node: any) => {
    if (node.type === 'rowNode') {
      setSelectedNode(null); setInsights(null); setInspectNode(null); return;
    }
    
    if (!editMode) {
      setInspectNode({ ...node, mouseX: event.clientX, mouseY: event.clientY });
      return;
    }
    
    setSelectedNode(node);
    
    // 模拟基于 Ledger 历史的 AI 诊断
    if (node.id?.includes('CRM') || node.data?.interrupt_before) {
      setInsights({
        targetNode: node.id, failCount: 14,
        reason: '人类接管记录显示，AI 多次无法找到 "Save" 按钮。经分析 DOM 快照，系统存在网络延迟。',
        suggestion: '建议增加 [Wait_For_Selector] 参数，或 [重试机制 (Max Retries: 3)]。',
        autoFixData: { max_retries: 3, components: [{ type: 'action', tool_name: 'crm_api_submit', params: { wait_timeout: 5000, retry: true } }] }
      });
    } else setInsights(null);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
    setSelectedNode((prev: any) => {
      if (!prev || prev.id !== nodeId) return prev;
      return { ...prev, data: { ...prev.data, ...newData } };
    });
  };

  const handleAutoFix = () => {
    if (!selectedNode || !insights) return;
    updateNodeData(selectedNode.id, insights.autoFixData);
    alert('✨ AI 建议已采纳！底层 JSON 配置已自动重写。');
    setInsights(null); 
  };

  const onUpdateLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n));
  }, [setNodes]);

  const onAddSublane = useCallback((phaseId: string) => {
    setNodes((nds) => {
      const existingLanes = nds.filter(n => n.parentNode === phaseId);
      const newLaneIndex = existingLanes.length;
      const newLaneId = `Lane_auto_${Date.now()}`;
      const newLane = {
        id: newLaneId, type: 'sublaneNode', parentNode: phaseId,
        position: { x: newLaneIndex * SUBLANE_WIDTH, y: PHASE_HEADER_H },
        style: { width: SUBLANE_WIDTH, height: 950, zIndex: 1 }, 
        data: { label: '未命名泳道' }, draggable: false, selectable: false
      };
      const newPhaseWidth = (newLaneIndex + 1) * SUBLANE_WIDTH;
      return nds.map(n => n.id === phaseId ? { ...n, style: { ...n.style, width: newPhaseWidth, height: 1000 }, data: { ...n.data, stats: `${newLaneIndex + 1} 子泳道` } } : n).concat(newLane as any);
    });
  }, [setNodes]);

  const onDeleteSublane = useCallback((sublaneId: string) => setNodes(nds => nds.filter(n => n.id !== sublaneId)), [setNodes]);
  const onDeletePhase = useCallback((phaseId: string) => setNodes(nds => nds.filter(n => n.id !== phaseId && n.parentNode !== phaseId)), [setNodes]);

  // =================================================================
  // 3. 资产固化与流转 (保存、导出、导入)
  // =================================================================
  const filterOutBaseRows = (currentNodes: any[]) => currentNodes.filter(n => n.type !== 'rowNode');

  const handleSaveFlow = async () => {
    if (!flowMeta) return;
    setSaving(true);
    const updatedFlow = { ...flowMeta, nodes: filterOutBaseRows(nodes), edges };

    try {
      const res = await fetch('http://localhost:8000/api/flows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedFlow)
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else alert(result.msg);
    } catch (err) { alert("网络请求失败，保存中止。"); } 
    finally { setSaving(false); }
  };

  const handleExport = () => {
    if (!flowMeta) return;
    const exportData = { ...flowMeta, nodes: filterOutBaseRows(nodes), edges };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowMeta.id || 'export'}.bpnl`; 
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setNodes([...BACKGROUND_ROWS, ...(importedData.nodes || [])] as any);
        setEdges(importedData.edges || []);
        setFlowMeta({ ...flowMeta, ...importedData, id: activeFlowId });
        alert("✅ 流程图纸解析成功！请点击【保存流程资产】固化到您的本地数据库。");
      } catch (err) {
        alert("❌ 文件格式错误，无法解析 BPNL 协议。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // =================================================================
  // 4. UI 渲染与节点透传
  // =================================================================
  const nodeTypesMerged = useMemo(() => ({ bizNode: BizNode, phaseNode: PhaseNode, sublaneNode: SublaneNode, rowNode: RowNode }), []);
  
  const nodesWithProps = useMemo(() => {
    return nodes.map(n => ({
      ...n, data: { ...n.data, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel }
    }));
  }, [nodes, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel]);

  const toggleMode = (isEdit: boolean) => {
    setEditMode(isEdit);
    if (isEdit) { setSelectedNode(null); setIsBottomPanelOpen(false); } 
    else { setIsBottomPanelOpen(true); }
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center text-slate-500 bg-[#050505]"><Loader2 className="animate-spin mb-4" size={32} /></div>;
  if (error) return <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-[#050505]"><AlertTriangle className="mb-4" size={32} /> {error}</div>;

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] relative overflow-hidden">
      
      {/* 🚀 浮动控制条 */}
      <div className="absolute top-4 left-4 z-50 flex gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <button onClick={() => toggleMode(false)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${!editMode ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
          <PlayCircle size={14}/> 运行监控模式
        </button>
        <button onClick={() => toggleMode(true)} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${editMode ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
          <Edit3 size={14}/> 深度编排模式
        </button>
        
        {editMode && (
          <>
            <div className="w-px h-6 bg-slate-700 mx-1 my-auto"></div>
            <input type="file" accept=".json,.bpnl" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="导入本地 BPNL 资产">
              <UploadCloud size={14}/> 导入
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="导出 BPNL 以供分发">
              <DownloadCloud size={14}/> 导出
            </button>
            <button 
              onClick={handleSaveFlow} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold rounded-md ml-2 transition-all duration-300
                ${saveSuccess ? 'bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-900/50'} 
                ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {saving ? <Loader2 size={14} className="animate-spin"/> : (saveSuccess ? <CheckCircle2 size={14}/> : <Save size={14}/>)}
              {saving ? '固化中...' : (saveSuccess ? '资产已落盘' : '保存流程资产')}
            </button>
          </>
        )}
      </div>

      {/* 🌟 核心：横向分栏区 (左画布，右属性面板) */}
      <div className="flex-1 flex w-full relative min-h-0">
        
        {/* 左侧：React Flow 画板 */}
        <div className="flex-1 relative h-full">
          <ReactFlow
            nodes={nodesWithProps} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick}
            nodeTypes={nodeTypesMerged}
            nodesDraggable={editMode} nodesConnectable={editMode} elementsSelectable={editMode}
            onPaneClick={() => { setInspectNode(null); setSelectedNode(null); }} 
            onlyRenderVisibleElements={false} // 🚨 防止画布底带被剪切消失
            fitView minZoom={0.1}
          >
            <Background color="#1e293b" gap={24} size={2} variant={BackgroundVariant.Dots} className="opacity-40" />
            <Controls className="fill-slate-400 bg-slate-800 border-slate-700" />
            {/* 💡 修复点：黑暗模式下的小地图背景 */}
            {editMode && <MiniMap nodeColor="#3b82f6" maskColor="rgba(2, 6, 23, 0.8)" style={{ backgroundColor: '#0B0F19' }} className="border border-slate-700 rounded-md overflow-hidden" />}
          </ReactFlow>
        </div>

        {/* ✏️ 右侧：云端 IDE 属性面板 (仅编排模式可见) */}
        {editMode && (
          <div className="w-[340px] bg-[#0E121B] border-l border-slate-800/60 flex flex-col h-full shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 bg-[#0B0F19] shrink-0">
              <Settings2 size={18} className="text-slate-400"/>
              <h2 className="text-sm font-bold text-slate-200">{selectedNode ? 'Node Configuration' : 'Workspace Palette'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* ========================================================= */}
              {/* 🌟 兵器库 (Node Palette) */}
              {/* ========================================================= */}
              {!selectedNode ? (
                <div className="animate-in fade-in duration-200">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-1.5">
                    <TerminalSquare size={12}/> Drag or Click to Add Nodes
                  </div>
                  <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">请选择需要部署的算力节点。系统将自动将其空投至对应的矩阵轨道中。</p>
                  
                  <div className="space-y-3">
                    <button onClick={() => {
                        const newNode = { id: `N_Sys_${Date.now()}`, type: 'bizNode', position: { x: 300, y: 100 }, style: { zIndex: 10 }, data: { label: '新建系统动作', components: [] } };
                        setNodes(nds => nds.concat(newNode));
                      }} className="w-full flex items-center justify-between p-3 bg-blue-950/10 hover:bg-blue-900/30 border border-blue-900/50 rounded-lg transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-900/40 text-blue-400 flex items-center justify-center"><Cpu size={16}/></div>
                        <div className="text-left"><div className="text-xs font-bold text-blue-400">System Node</div><div className="text-[9px] text-slate-500 font-mono">Y-Axis: 50~300</div></div>
                      </div>
                      <Plus size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <button onClick={() => {
                        const newNode = { id: `N_Agt_${Date.now()}`, type: 'bizNode', position: { x: 300, y: 350 }, style: { zIndex: 10 }, data: { label: '新建大模型推理', components: [] } };
                        setNodes(nds => nds.concat(newNode));
                      }} className="w-full flex items-center justify-between p-3 bg-fuchsia-950/10 hover:bg-fuchsia-900/30 border border-fuchsia-900/50 rounded-lg transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-fuchsia-900/40 text-fuchsia-400 flex items-center justify-center"><Sparkles size={16}/></div>
                        <div className="text-left"><div className="text-xs font-bold text-fuchsia-400">Agent Node</div><div className="text-[9px] text-slate-500 font-mono">Y-Axis: 300~550</div></div>
                      </div>
                      <Plus size={14} className="text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <button onClick={() => {
                        const newNode = { id: `N_Hum_${Date.now()}`, type: 'bizNode', position: { x: 300, y: 600 }, style: { zIndex: 10 }, data: { label: '新建人工审批表单', interrupt_before: true, components: [] } };
                        setNodes(nds => nds.concat(newNode));
                      }} className="w-full flex items-center justify-between p-3 bg-orange-950/10 hover:bg-orange-900/30 border border-orange-900/50 rounded-lg transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-orange-900/40 text-orange-400 flex items-center justify-center"><Users size={16}/></div>
                        <div className="text-left"><div className="text-xs font-bold text-orange-400">Human Node</div><div className="text-[9px] text-slate-500 font-mono">Y-Axis: 550~750</div></div>
                      </div>
                      <Plus size={14} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    <button onClick={() => {
                        const newNode = { id: `N_Hw_${Date.now()}`, type: 'bizNode', position: { x: 300, y: 800 }, style: { zIndex: 10 }, data: { label: '新建物理硬件驱动', components: [] } };
                        setNodes(nds => nds.concat(newNode));
                      }} className="w-full flex items-center justify-between p-3 bg-emerald-950/10 hover:bg-emerald-900/30 border border-emerald-900/50 rounded-lg transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-900/40 text-emerald-400 flex items-center justify-center"><Cpu size={16}/></div>
                        <div className="text-left"><div className="text-xs font-bold text-emerald-400">Hardware Node</div><div className="text-[9px] text-slate-500 font-mono">Y-Axis: 750~950</div></div>
                      </div>
                      <Plus size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-800/60">
                     <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Container Management</div>
                     <button onClick={() => onAddSublane(`Phase_${Date.now()}`)} className="w-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg border border-slate-700 transition-colors mb-2">
                       + 新增 阶段容器 (Phase)
                     </button>
                     <p className="text-[9px] text-slate-600 text-center">容器用于横向切分业务流的时间状态</p>
                  </div>
                </div>
              ) : (
                // =========================================================
                // 当选中节点时，显示原有的 Node Configuration 属性配置表单
                // =========================================================
                <div className="animate-in fade-in duration-200 space-y-6">
                  
                  {/* 节点名称输入区 */}
                  <div className="bg-[#050505] p-4 rounded-lg border border-slate-800/80 shadow-inner">
                    <div className="text-[9px] font-bold tracking-widest uppercase text-indigo-500 mb-1.5 flex items-center gap-1.5"><Network size={12}/> {selectedNode.type}</div>
                    <input 
                      className="w-full bg-transparent text-[15px] font-bold text-slate-200 outline-none border-b border-transparent focus:border-blue-500 transition-colors" 
                      value={selectedNode.data?.label || ''} 
                      onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} 
                      placeholder="节点显示名称"
                    />
                    <div className="text-[10px] font-mono text-slate-600 mt-1">{selectedNode.id}</div>
                  </div>

                  {/* AI 诊断 */}
                  {insights && (
                    <div className="bg-orange-950/20 border border-orange-500/40 rounded-xl p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                      <h4 className="text-[12px] font-bold text-orange-400 flex items-center gap-1.5 mb-3"><Sparkles size={14} className="animate-pulse"/> Optimizer Suggestion</h4>
                      <div className="text-[11px] text-orange-300/80 leading-relaxed mb-3">{insights.suggestion}</div>
                      <button onClick={handleAutoFix} className="w-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-400 text-xs font-bold py-1.5 rounded-lg transition-colors shadow-md">✨ 一键采纳</button>
                    </div>
                  )}

                  {/* 动态组件库挂载区 */}
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Mounted Capabilities</div>
                    
                    {selectedNode.data?.components?.map((comp: any, idx: number) => {
                      const isAgent = comp.executor === 'agent';
                      const isHuman = comp.executor === 'human';
                      const isHardware = comp.executor === 'hardware';

                      let boxColor = 'border-slate-800/80 bg-[#050505]';
                      let tagColor = 'text-slate-400 bg-slate-800/50 border-slate-700/50';
                      let toolColor = 'text-blue-400';

                      if (isAgent) { boxColor = 'border-fuchsia-500/30 bg-fuchsia-950/10'; tagColor = 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-900/50'; toolColor = 'text-fuchsia-300'; }
                      else if (isHuman) { boxColor = 'border-orange-500/30 bg-orange-950/10'; tagColor = 'text-orange-400 bg-orange-950/50 border-orange-900/50'; toolColor = 'text-orange-300'; }
                      else if (isHardware) { boxColor = 'border-emerald-500/40 bg-emerald-950/10'; tagColor = 'text-emerald-400 bg-emerald-950/50 border-emerald-900/50'; toolColor = 'text-emerald-300'; }

                      // 找到当前选中的技能配置
                      const activeSkill = availableSkills.find(s => s.id === comp.tool_name);

                      return (
                        <div key={comp.step_id || idx} className={`border rounded-lg p-3 mb-3 shadow-inner group relative ${boxColor}`}>
                          <button 
                            onClick={() => {
                              const newComps = selectedNode.data.components.filter((c: any) => c.step_id !== comp.step_id);
                              updateNodeData(selectedNode.id, { components: newComps });
                            }} 
                            className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="移除此能力"
                          ><Trash2 size={14}/></button>

                          <div className="flex justify-between items-center mb-2.5">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${tagColor}`}>[{comp.type || 'action'}]</span>
                            
                            {/* 💡 核心：技能选择下拉框 */}
                            <select 
                              className={`bg-[#050505] text-[11px] font-mono font-bold outline-none border-b border-slate-700/50 focus:border-blue-500 ml-2 flex-1 w-0 truncate cursor-pointer ${toolColor}`}
                              value={comp.tool_name || ''}
                              onChange={(e) => {
                                const selectedSkillId = e.target.value;
                                const targetSkill = availableSkills.find(s => s.id === selectedSkillId);
                                
                                // 重置并构建空的 Params
                                const newParams: any = {};
                                if (targetSkill?.params_schema) {
                                  targetSkill.params_schema.forEach((p: any) => newParams[p.field] = '');
                                }

                                const newComps = [...selectedNode.data.components];
                                newComps[idx] = { ...comp, tool_name: selectedSkillId, params: newParams };
                                updateNodeData(selectedNode.id, { components: newComps });
                              }}
                            >
                              <option value="" disabled>-- 动态绑定技能 --</option>
                              {/* 过滤掉类型不匹配的技能，保持职能隔离 */}
                              {availableSkills.filter(s => s.type === comp.executor).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center text-[9px] text-slate-500 font-mono mb-1"><Cpu size={10} className="mr-1"/> Executor: {comp.executor?.toUpperCase() || 'SYSTEM'}</div>

                          {/* 💡 核心：根据 Schema 动态渲染输入表单 */}
                          {comp.tool_name && activeSkill?.params_schema && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-2.5">
                              {activeSkill.params_schema.map((pSchema: any) => (
                                <div key={pSchema.field}>
                                  <label className="flex justify-between text-[9px] text-slate-400 mb-1.5">
                                    <span>{pSchema.label} <span className="font-mono opacity-50">({pSchema.field})</span></span>
                                    {pSchema.required && <span className="text-red-500/70">*</span>}
                                  </label>
                                  <input 
                                    type="text"
                                    placeholder={pSchema.description || `{{context.${pSchema.field}}} 或静态值`}
                                    className={`w-full bg-[#050505] border border-slate-700/50 rounded px-2.5 py-1.5 text-[10px] text-slate-300 font-mono outline-none focus:border-blue-500 transition-colors shadow-inner ${pSchema.required && !comp.params?.[pSchema.field] ? 'border-amber-900/50 bg-amber-950/10' : ''}`}
                                    value={comp.params?.[pSchema.field] || ''}
                                    onChange={(e) => {
                                      const newComps = [...selectedNode.data.components];
                                      newComps[idx].params = { ...newComps[idx].params, [pSchema.field]: e.target.value };
                                      updateNodeData(selectedNode.id, { components: newComps });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* 悬浮菜单：追加新的原子动作 */}
                    <div className="mt-4 pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Attach New Power</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => {
                          const newComp = { step_id: `step_${Date.now()}`, type: 'action', tool_name: '', executor: 'system', params: {} };
                          updateNodeData(selectedNode.id, { components:[...(selectedNode.data.components || []), newComp] });
                        }} className="border border-blue-900/50 bg-blue-950/10 text-blue-500 hover:bg-blue-900/30 text-[10px] font-bold py-1.5 rounded transition-all">+ 💻 System</button>
                        
                        <button onClick={() => {
                          const newComp = { step_id: `step_${Date.now()}`, type: 'judge', tool_name: '', executor: 'agent', params: {}, assignee_id: '' };
                          updateNodeData(selectedNode.id, { components:[...(selectedNode.data.components || []), newComp] });
                        }} className="border border-fuchsia-900/50 bg-fuchsia-950/10 text-fuchsia-500 hover:bg-fuchsia-900/30 text-[10px] font-bold py-1.5 rounded transition-all">+ 🧠 Agent</button>
                        
                        <button onClick={() => {
                          const newComp = { step_id: `step_${Date.now()}`, type: 'input', tool_name: '', executor: 'human', params: {} };
                          updateNodeData(selectedNode.id, { components:[...(selectedNode.data.components || []), newComp] });
                        }} className="border border-orange-900/50 bg-orange-950/10 text-orange-500 hover:bg-orange-900/30 text-[10px] font-bold py-1.5 rounded transition-all">+ 🧑‍💻 Human</button>
                        
                        <button onClick={() => {
                          const newComp = { step_id: `step_${Date.now()}`, type: 'physical', tool_name: '', executor: 'hardware', params: {} };
                          updateNodeData(selectedNode.id, { components:[...(selectedNode.data.components || []), newComp] });
                        }} className="border border-emerald-900/50 bg-emerald-950/10 text-emerald-500 hover:bg-emerald-900/30 text-[10px] font-bold py-1.5 rounded transition-all">+ 🦾 Hardware</button>
                      </div>
                    </div>
                  </div>

                  {/* 熔断器配置 */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Auditor & Guards</div>
                    <div className="flex items-start gap-3 p-3 bg-[#050505] border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                      <input type="checkbox" className="mt-1" checked={!!selectedNode.data?.interrupt_before} onChange={(e) => updateNodeData(selectedNode.id, { interrupt_before: e.target.checked })} />
                      <div>
                        <div className="text-[12px] font-bold text-slate-200 mb-1">执行前强制挂起 (HITL)</div>
                        <div className="text-[9px] text-slate-500 leading-relaxed">开启后，流程运行到此节点将触发 Auditor 熔断，必须由人类在 Inbox 中放行。</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 底部运行控制台 (保留不变) */}
      <div className={`w-full bg-[#0E121B] border-t border-slate-800/60 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 z-50 shrink-0 ${isBottomPanelOpen ? 'h-[320px]' : 'h-10'}`}>
        <div className="h-10 px-4 flex justify-between items-center bg-[#0B0F19] border-b border-slate-800/60 cursor-pointer hover:bg-[#0E121B] transition-colors" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}>
          <div className="flex items-center gap-4 h-full">
            <div className="flex items-center gap-2 h-full border-b-2 border-blue-500 text-blue-400 px-2">
              <TerminalSquare size={14} />
              <span className="text-[11px] font-bold tracking-wider uppercase">Execution Console</span>
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-300">{isBottomPanelOpen ? <ChevronDown size={16} /> : <Maximize2 size={14} />}</button>
        </div>

        {isBottomPanelOpen && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[40%] border-r border-slate-800/60 flex flex-col bg-[#050505] p-4 relative group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-orange-500/80 via-amber-400/50 to-transparent"></div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold text-orange-500 tracking-widest flex items-center gap-1.5">● PLAYSTREAM MONITOR</h2>
                <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Real-time</span>
              </div>
              <div className="flex-1 rounded-lg border border-slate-800/80 bg-[#0B0F19] flex items-center justify-center text-slate-600 text-xs font-mono relative overflow-hidden shadow-inner">
                Waiting for Emobodied Action...
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#050505] p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold text-blue-500 tracking-widest flex items-center gap-1.5"><span className="text-blue-500/70">▶_</span> SYSTEM LOGS</h2>
              </div>
              <div className="flex-1 rounded-lg border border-slate-800/80 bg-[#0B0F19] p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-2.5 shadow-inner custom-scrollbar">
                {logs.length === 0 && <div className="text-slate-600 italic">No logs generated. Click "Run Flow" to start engine.</div>}
                {logs.map((log, idx) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('❌') || log.includes('🛑')) colorClass = 'text-red-400 font-bold';
                  else if (log.includes('✅')) colorClass = 'text-emerald-400';
                  else if (log.includes('🚀')) colorClass = 'text-blue-400 font-bold';
                  else if (log.includes('⚙️')) colorClass = 'text-amber-400/90';
                  return <div key={idx} className={`leading-relaxed break-words ${colorClass}`}>{log}</div>;
                })}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 悬浮只读属性卡片 (监控模式下) */}
      {!editMode && inspectNode && (
        <div 
          className="fixed z-[100] bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ left: Math.min(inspectNode.mouseX + 15, window.innerWidth - 320), top: Math.min(inspectNode.mouseY + 15, window.innerHeight - 300), width: '300px' }}
        >
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-start">
            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-blue-500 mb-1 flex items-center gap-1"><Network size={10}/> {inspectNode.type}</div>
              <h3 className="font-bold text-sm text-slate-100 leading-tight">{inspectNode.data?.label || '未命名'}</h3>
            </div>
            <button onClick={() => setInspectNode(null)} className="text-slate-500 hover:text-slate-300 transition-colors p-1"><X size={14}/></button>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {inspectNode.data?.components && inspectNode.data.components.length > 0 ? (
              inspectNode.data.components.map((comp: any, idx: number) => {
                const isAgent = comp.executor === 'agent';
                const isHuman = comp.executor === 'human';
                const isHardware = comp.executor === 'hardware';
                
                return (
                  <div key={idx} className="bg-[#050505] border border-slate-700/50 rounded-lg p-2.5 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">[{comp.type}]</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{comp.tool_name || '未配置技能'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 uppercase tracking-wider">Role:</span>
                      <span className={`font-mono px-1.5 py-0.5 rounded border ${
                        isHuman ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        isHardware ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isAgent ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {comp.executor?.toUpperCase() || 'SYSTEM'} {comp.assignee_id ? `(@${comp.assignee_id})` : ''}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (<div className="text-center text-[10px] text-slate-500 py-2">无挂载能力</div>)}
          </div>
        </div>
      )}

    </div>
  );
}