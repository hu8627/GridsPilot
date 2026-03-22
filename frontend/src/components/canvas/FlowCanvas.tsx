'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, Connection, Edge, BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, PlayCircle, Edit3, Save, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

import BizNode from './BizNode';
import PhaseNode from './PhaseNode';
import SublaneNode from './SublaneNode';

const SUBLANE_WIDTH = 320;
const PHASE_HEADER_H = 46;

export default function FlowCanvas() {
  const { activeFlowId } = useUIStore(); 
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // 💡 新增：保存当前图纸的元数据 (ID, Name, Desc)，以便保存时回传
  const [flowMeta, setFlowMeta] = useState<any>(null);
  // 💡 新增：保存状态控制 UI
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 💡 100% 真实读取 JSON 资产 (加固防崩溃版)
  useEffect(() => {
    // 如果没有选中任何流程，直接不加载
    if (!activeFlowId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    fetch(`http://localhost:8000/api/flows/${activeFlowId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.status === 'success' && data.data) {
          setFlowMeta(data.data); 
          setNodes(data.data.nodes || []);
          setEdges(data.data.edges || []);
        } else {
          console.warn(`⚠️ 警告：后端返回失败或无数据 -> ${data.msg}`);
          // 即使失败，也要清空画布，不能无限转圈
          setNodes([]);
          setEdges([]);
        }
      })
      .catch(err => {
        console.error("❌ 请求 /api/flows 彻底失败：", err);
        setNodes([]);
        setEdges([]);
      })
      .finally(() => {
        // 💡 无论成功还是失败，必须强行关闭 Loading！
        setLoading(false);
      });
  }, [activeFlowId, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
        style: { width: SUBLANE_WIDTH, height: 754, zIndex: 0 },
        data: { label: '未命名泳道' }, draggable: false, selectable: false
      };

      const newPhaseWidth = (newLaneIndex + 1) * SUBLANE_WIDTH;
      return nds.map(n => n.id === phaseId ? { ...n, style: { ...n.style, width: newPhaseWidth }, data: { ...n.data, stats: `${newLaneIndex + 1} 子泳道` } } : n).concat(newLane);
    });
  }, [setNodes]);

  const onDeleteSublane = useCallback((sublaneId: string) => {
    setNodes(nds => nds.filter(n => n.id !== sublaneId));
  }, [setNodes]);

  const onDeletePhase = useCallback((phaseId: string) => {
    setNodes(nds => nds.filter(n => n.id !== phaseId && n.parentNode !== phaseId));
  }, [setNodes]);

  // =================================================================
  // 💡 核心新增：将画布的最新状态，反向固化到后端的 JSON 硬盘里
  // =================================================================
  const handleSaveFlow = async () => {
    if (!flowMeta) return;
    setSaving(true);
    
    // 组装 BPNL Schema
    const updatedFlow = {
      ...flowMeta,
      nodes: nodes,
      edges: edges
    };

    try {
      const res = await fetch('http://localhost:8000/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFlow)
      });
      const result = await res.json();
      
      if (result.status === 'success') {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000); // 2秒后恢复按钮状态
      } else {
        alert(result.msg);
      }
    } catch (err) {
      alert("网络请求失败，保存中止。");
    } finally {
      setSaving(false);
    }
  };

  const nodeTypesMerged = useMemo(() => ({ bizNode: BizNode, phaseNode: PhaseNode, sublaneNode: SublaneNode }), []);
  const nodesWithProps = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: { ...n.data, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel }
    }));
  }, [nodes, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel]);

  if (loading) return <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-950"><Loader2 className="animate-spin mb-4" size={32} /></div>;

  return (
    <div className="w-full h-full flex bg-slate-950 relative">
      
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/50 shadow-lg">
        <button 
          onClick={() => setEditMode(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${!editMode ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <PlayCircle size={14}/> 运行监控模式
        </button>
        <button 
          onClick={() => setEditMode(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${editMode ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Edit3 size={14}/> 深度编排模式
        </button>
        
        {/* 💡 注入了真实保存事件的按钮 */}
        {editMode && (
          <button 
            onClick={handleSaveFlow}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded ml-2 transition-all duration-300
              ${saveSuccess 
                ? 'bg-green-600 text-white border border-green-500 shadow-[0_0_10px_rgba(22,163,74,0.5)]' 
                : 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/20 border border-emerald-900/50'
              } 
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {saving ? <Loader2 size={14} className="animate-spin"/> : (saveSuccess ? <CheckCircle2 size={14}/> : <Save size={14}/>)}
            {saving ? '正在固化...' : (saveSuccess ? '资产已落盘' : '保存流程资产')}
          </button>
        )}
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodesWithProps} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypesMerged}
          nodesDraggable={editMode} 
          nodesConnectable={editMode} 
          fitView
          minZoom={0.1}
        >
          <Background color="#1e293b" gap={24} size={2} variant={BackgroundVariant.Dots} />
          <Controls className="fill-slate-400 bg-slate-800 border-slate-700" />
        </ReactFlow>
      </div>

    </div>
  );
}