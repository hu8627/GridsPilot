import React, { useState } from 'react';
import { ListTree, Search, Filter, Clock, CheckCircle2, AlertTriangle, XCircle, TerminalSquare, Eye } from 'lucide-react';

export default function TracesView() {
  const [traces] = useState([
    { id: 'trc_001', flow: '智能拓客与CRM录入', intent: '帮我调研 Shopify', status: 'success', time: '10:42:15', duration: '45s', nodes: 4 },
    { id: 'trc_002', flow: '售后退款审批流', intent: 'System Triggered', status: 'suspended', time: '09:15:22', duration: '12s', nodes: 2 },
    { id: 'trc_003', flow: '简历解析入库', intent: 'Webhook (Email)', status: 'error', time: 'Yesterday', duration: '3s', nodes: 1 },
  ]);

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={12}/> Success</span>;
    if (status === 'suspended') return <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 flex items-center gap-1 animate-pulse"><AlertTriangle size={12}/> Suspended</span>;
    return <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1"><XCircle size={12}/> Error</span>;
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListTree className="text-slate-400" /> Execution Traces</h1>
          <p className="text-xs text-slate-500 mt-1.5">底层 API 调用、大模型推理的每一步无情流水账日志。用于开发环境 Debug 与系统级溯源。</p>
        </div>
      </div>

      <div className="bg-[#0E121B] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800/80 bg-[#050505] flex justify-between items-center">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded px-3 py-1.5 w-64 focus-within:border-blue-500 transition-colors">
            <Search size={14} className="text-slate-500" />
            <input type="text" placeholder="Search Trace ID..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200" />
          </div>
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded transition-colors"><Filter size={14} /> Filter</button>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
            <tr>
              <th className="px-6 py-4 font-bold">Trace ID / Time</th>
              <th className="px-6 py-4 font-bold">Trigger Intent</th>
              <th className="px-6 py-4 font-bold">Target Flow</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {traces.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-mono text-blue-400 text-xs font-bold">{t.id}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1.5"><Clock size={10}/> {t.time} <span className="opacity-50">({t.duration})</span></div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-300 font-mono bg-slate-950/50 p-2 rounded inline-block mt-2 border border-slate-800/50 shadow-inner">
                  {t.intent}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-900/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-bold">{t.flow}</span>
                  <div className="text-[9px] text-slate-500 mt-1.5">{t.nodes} Nodes Executed</div>
                </td>
                <td className="px-6 py-4">{getStatusIcon(t.status)}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-blue-400 text-[10px] font-bold flex items-center gap-1.5 ml-auto transition-colors">
                    <TerminalSquare size={14}/> View Logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}