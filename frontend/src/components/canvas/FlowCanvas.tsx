'use client';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, Connection, Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, PlayCircle, Edit3, Save, CheckCircle2, DownloadCloud, UploadCloud, AlertTriangle, Settings2, Network, Sparkles, TerminalSquare, Maximize2, Minimize2, ChevronDown, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

import BizNode from './BizNode';
import PhaseNode from './PhaseNode';
import SublaneNode from './SublaneNode';
import RowNode from './RowNode'; 

const SUBLANE_WIDTH = 320;
const PHASE_HEADER_H = 46;

// 💡 将横向轨道的起点设为 x=0，让它们成为画板的地基
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

  // =================================================================
  // 1. 初始化拉取图纸数据 (防弹级健壮版)
  // =================================================================
  useEffect(() => {
    if (!activeFlowId) { setLoading(false); return; }
    
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
    // 点到底座背景，什么都不做
    if (node.type === 'rowNode') {
      setSelectedNode(null); setInsights(null); setInspectNode(null); return;
    }
    
    // 💡 监控模式下：弹出轻量级只读悬浮卡片
    if (!editMode) {
      setInspectNode({
        ...node,
        // 获取鼠标点击的相对坐标，用来定位悬浮卡片
        mouseX: event.clientX,
        mouseY: event.clientY
      });
      return;
    }
    
    // ✏️ 编排模式下：原有逻辑保持不变，打开右侧抽屉
    setSelectedNode(node);
    if (node.id?.includes('CRM') || node.data?.interrupt_before) {
      setInsights({
        targetNode: node.id, failCount: 14,
        reason: '人类接管记录显示，AI 多次无法找到 "Save" 按钮。经分析 DOM 快照，系统存在偶发性网络延迟。',
        suggestion: '建议增加 [Wait_For_Selector] 参数，或 [重试机制 (Max Retries: 3)]。',
        autoFixData: { max_retries: 3, components: [{ type: 'action', tool_name: 'crm_api_submit', params: { wait_timeout: 5000, retry: true } }] }
      });
    } else setInsights(null);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
    setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, ...newData } }));
  };

  const handleAutoFix = () => {
    if (!selectedNode || !insights) return;
    updateNodeData(selectedNode.id, insights.autoFixData);
    alert('✨ AI 建议已采纳！底层 JSON 配置已自动重写。下一次执行将自动进行智能重试。');
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
  // 4. 依赖注入与合并
  // =================================================================
  const nodeTypesMerged = useMemo(() => ({ bizNode: BizNode, phaseNode: PhaseNode, sublaneNode: SublaneNode, rowNode: RowNode }), []);
  const nodesWithProps = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        editMode, 
        onAddSublane,
        onDeletePhase,
        onDeleteSublane,
        onUpdateLabel
      }
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
    // 🌟 最外层容器：纵向布局 (上：内容区，下：底部控制台)
    <div className="w-full h-full flex flex-col bg-[#050505] relative overflow-hidden">
      
      {/* 🚀 悬浮控制条 (绝对定位，极高层级) */}
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

      {/* 🌟 内容区：横向布局 (左：画板，右：属性面板) */}
      <div className="flex-1 flex w-full relative min-h-0">
        
        {/* 左侧：React Flow 画板 */}
        <div className="flex-1 relative h-full">
          <ReactFlow
            nodes={nodesWithProps} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick}
            nodeTypes={nodeTypesMerged}
            nodesDraggable={editMode} nodesConnectable={editMode} elementsSelectable={editMode}
            onlyRenderVisibleElements={false} // 🚨 极度关键：防止底色带被剪裁导致白屏！
            onPaneClick={() => setInspectNode(null)} // 点击空白处关掉弹窗

            fitView minZoom={0.1}
          >
            <Background color="#1e293b" gap={24} size={2} variant={BackgroundVariant.Dots} className="opacity-40" />
            <Controls className="fill-slate-400 bg-slate-800 border-slate-700" />
            {/* 只在编排模式展示地图 */}
            {editMode && <MiniMap nodeColor="#3b82f6" maskColor="rgba(2, 6, 23, 0.8)" className="bg-slate-900 border border-slate-700" />}
          </ReactFlow>
        </div>

        {/* 右侧：属性配置面板 (仅编排模式) */}
        {editMode && (
          <div className="w-[320px] bg-[#0E121B] border-l border-slate-800/60 flex flex-col h-full shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 bg-[#0B0F19] shrink-0">
              <Settings2 size={18} className="text-slate-400"/>
              <h2 className="text-sm font-bold text-slate-200">Node Properties</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {!selectedNode ? (
                <div className="text-center py-20 text-xs text-slate-500 leading-loose flex flex-col items-center gap-3">
                  <Network size={32} className="text-slate-700/50" />
                  <p>点击左侧画布中的任意节点或连线<br/>查看并修改详细配置</p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200 space-y-6">
                  {/* 节点标题 */}
                  <div className="bg-[#050505] p-4 rounded-lg border border-slate-800/80 shadow-inner">
                    <div className="text-[9px] font-bold tracking-widest uppercase text-indigo-500 mb-1.5 flex items-center gap-1.5"><Network size={12}/> {selectedNode.type || 'bizNode'}</div>
                    <div className="text-[15px] font-bold text-slate-200">{selectedNode.data?.label || '未命名'}</div>
                    <div className="text-[10px] font-mono text-slate-600 mt-1">{selectedNode.id}</div>
                  </div>

                  {/* AI 诊断 */}
                  {insights && (
                    <div className="bg-orange-950/20 border border-orange-500/40 rounded-xl p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                      <h4 className="text-[12px] font-bold text-orange-400 flex items-center gap-1.5 mb-3"><Sparkles size={14} className="animate-pulse"/> Optimizer Agent 迭代建议</h4>
                      <div className="text-[11px] text-orange-300/80 leading-relaxed mb-4 space-y-2">
                        <p><strong className="text-orange-300">📊 运行体检：</strong>该节点过去 30 天触发人工接管 <span className="font-mono font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">{insights.failCount}</span> 次。</p>
                        <p><strong className="text-orange-300">🔍 根因分析：</strong>{insights.reason}</p>
                        <p><strong className="text-orange-300">🛠 修复建议：</strong>{insights.suggestion}</p>
                      </div>
                      <button onClick={handleAutoFix} className="w-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-400 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md">✨ 一键采纳建议并重写配置</button>
                    </div>
                  )}

                  {/* 基础设置 */}
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Basic Settings</div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1.5">展示名称</label>
                      <input className="w-full bg-[#050505] border border-slate-700/80 text-slate-200 text-xs rounded-md px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" value={selectedNode.data?.label || ''} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} />
                    </div>
                  </div>

                  {/* 组件挂载 */}
                  {selectedNode.data?.components && selectedNode.data.components.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Mounted Components</div>
                      
                      {selectedNode.data.components.map((comp: any, idx: number) => {
                        const executorType = comp.executor || 'system';
                        
                        let boxColor = 'border-slate-800/80 bg-[#050505]';
                        let tagColor = 'text-slate-400 bg-slate-800/50 border-slate-700/50';
                        let toolColor = 'text-blue-400';
                        let roleBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                        let roleIcon = '⚙️ SYSTEM (Code)';

                        if (executorType === 'agent') {
                          boxColor = 'border-fuchsia-500/30 bg-fuchsia-950/10';
                          tagColor = 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-900/50';
                          toolColor = 'text-fuchsia-300';
                          roleBadge = 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
                          roleIcon = '🧠 AGENT (LLM)';
                        } else if (executorType === 'human') {
                          boxColor = 'border-orange-500/30 bg-orange-950/10';
                          tagColor = 'text-orange-400 bg-orange-950/50 border-orange-900/50';
                          toolColor = 'text-orange-300';
                          roleBadge = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                          roleIcon = '🧑‍💻 HUMAN (Admin)';
                        } else if (executorType === 'hardware') {
                          boxColor = 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
                          tagColor = 'text-emerald-400 bg-emerald-950/50 border-emerald-900/50';
                          toolColor = 'text-emerald-300 font-bold tracking-wider';
                          roleBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold';
                          roleIcon = '🦾 HARDWARE (IoT)';
                        }

                        return (
                          <div key={idx} className={`border rounded-lg p-3 mb-3 shadow-inner group ${boxColor}`}>
                            <div className="flex justify-between items-center mb-2.5">
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${tagColor}`}>[{comp.type || 'action'}]</span>
                              <span className={`text-[11px] font-mono ${toolColor}`}>{comp.tool_name}</span>
                            </div>
                            
                            <div className={`flex items-center justify-between text-[9px] mb-2 ${comp.params && Object.keys(comp.params).length > 0 ? 'border-b border-slate-800/60 pb-2' : ''}`}>
                              <span className="text-slate-500 uppercase tracking-wider">Executor Role:</span>
                              <div className="flex items-center gap-1.5">
                                {executorType === 'agent' && comp.assignee_id && <span className="text-[9px] text-fuchsia-500 font-mono opacity-80">@{comp.assignee_id}</span>}
                                {executorType === 'hardware' && comp.assignee_id && <span className="text-[9px] text-emerald-500 font-mono opacity-80">[{comp.assignee_id}]</span>}
                                <span className={`font-mono px-1.5 py-0.5 rounded border ${roleBadge}`}>{roleIcon}</span>
                              </div>
                            </div>

                            {executorType === 'hardware' && (
                               <div className="flex items-start gap-1.5 text-[9px] mt-2 text-emerald-500/70 bg-emerald-950/20 p-1.5 rounded border border-emerald-900/30">
                                 <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                                 <span>此组件将产生物理位移。建议强制开启 Auditor 拦截。</span>
                               </div>
                            )}

                            {executorType !== 'human' && comp.params?.max_retries && (
                               <div className="flex justify-between items-center text-[10px] mt-2">
                                 <span className="text-slate-500 font-mono">Max Retries:</span>
                                 <span className="text-emerald-400 font-mono bg-emerald-950/30 px-1.5 rounded border border-emerald-900/50">{comp.params.max_retries}</span>
                               </div>
                            )}

                            {executorType === 'human' && comp.params?.form_schema && (
                              <div className="mt-2 space-y-1.5">
                                <div className="text-[9px] text-orange-500/70 mb-1">要求填写的字段 (Input Schema):</div>
                                {comp.params.form_schema.map((f: any, fIdx: number) => (
                                  <div key={fIdx} className="flex justify-between items-center text-[10px] bg-[#0a0a0a] border border-orange-900/30 px-2 py-1 rounded">
                                    <span className="text-slate-400">{f.label}</span>
                                    <span className="text-slate-600 font-mono">({f.type}{f.required ? ' *' : ''})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* 四权分立的挂载动作按钮 */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button className="border border-blue-900/50 bg-blue-950/10 text-blue-500 hover:bg-blue-900/30 hover:text-blue-400 text-[10px] font-bold py-1.5 rounded transition-all">+ 💻 System Code</button>
                        <button className="border border-fuchsia-900/50 bg-fuchsia-950/10 text-fuchsia-500 hover:bg-fuchsia-900/30 hover:text-fuchsia-400 text-[10px] font-bold py-1.5 rounded transition-all">+ 🧠 AI Agent</button>
                        <button className="border border-orange-900/50 bg-orange-950/10 text-orange-500 hover:bg-orange-900/30 hover:text-orange-400 text-[10px] font-bold py-1.5 rounded transition-all">+ 🧑‍💻 Human Input</button>
                        <button className="border border-emerald-900/50 bg-emerald-950/10 text-emerald-500 hover:bg-emerald-900/30 hover:text-emerald-400 text-[10px] font-bold py-1.5 rounded transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">+ 🦾 Hardware (IoT)</button>
                      </div>
                    </div>
                  )}

                  {/* 熔断器配置 */}
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Auditor & Guards</div>
                    <div className="flex items-start gap-3 p-3.5 bg-slate-900/40 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
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

      {/* 🌟 底部控制台：Terminal & Monitor (脱离画布流独立存在于底部) */}
      <div className={`w-full bg-[#0E121B] border-t border-slate-800/60 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 z-50 shrink-0 ${isBottomPanelOpen ? 'h-[320px]' : 'h-10'}`}>
        
        {/* 控制台 Bar */}
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

        {/* 控制台双屏体 */}
        {isBottomPanelOpen && (
          <div className="flex-1 flex overflow-hidden">
            
            <div className="w-[40%] border-r border-slate-800/60 flex flex-col bg-[#050505] p-4 relative group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-orange-500/80 via-amber-400/50 to-transparent"></div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold text-orange-500 tracking-widest flex items-center gap-1.5">● PLAYSTREAM MONITOR</h2>
                <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Real-time</span>
              </div>
              <div className="flex-1 rounded-lg border border-slate-800/80 bg-[#0B0F19] flex items-center justify-center text-slate-600 text-xs font-mono relative overflow-hidden shadow-inner group-hover:border-slate-700 transition-colors">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.03),transparent_70%)]"></div>
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
      {!editMode && inspectNode && (
        <div 
          className="fixed z-[100] bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            left: Math.min(inspectNode.mouseX + 15, window.innerWidth - 320), // 防止飘出屏幕右侧
            top: Math.min(inspectNode.mouseY + 15, window.innerHeight - 300), // 防止飘出屏幕底部
            width: '300px'
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-start">
            <div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-blue-500 mb-1 flex items-center gap-1"><Network size={10}/> {inspectNode.type}</div>
              <h3 className="font-bold text-sm text-slate-100 leading-tight">{inspectNode.data?.label || '未命名'}</h3>
              <div className="text-[9px] font-mono text-slate-500 mt-0.5">{inspectNode.id}</div>
            </div>
            <button onClick={() => setInspectNode(null)} className="text-slate-500 hover:text-slate-300 transition-colors p-1"><X size={14}/></button>
          </div>

          {/* Body: 核心组件概览 */}
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {inspectNode.data?.components && inspectNode.data.components.length > 0 ? (
              inspectNode.data.components.map((comp: any, idx: number) => {
                const isHuman = comp.executor === 'human';
                const isHardware = comp.executor === 'hardware';
                const isAgent = comp.executor === 'agent';
                
                return (
                  <div key={idx} className="bg-[#050505] border border-slate-700/50 rounded-lg p-2.5 shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">[{comp.type}]</span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{comp.tool_name}</span>
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
            ) : (
              <div className="text-center text-[10px] text-slate-500 py-2">无挂载组件</div>
            )}

            {/* 状态徽章 */}
            {inspectNode.data?.interrupt_before && (
              <div className="bg-orange-950/30 border border-orange-500/30 rounded p-2 flex items-center gap-2">
                <AlertTriangle size={12} className="text-orange-500 shrink-0"/>
                <span className="text-[9px] text-orange-400/90 leading-tight">此节点将触发 Auditor 熔断挂起。</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}