import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Clock, Zap, Network, Loader2, PlayCircle, BarChart3, Radio } from 'lucide-react';

export default function MonitorHub() {
  const [loading, setLoading] = useState(true);

  // 模拟从后端拉取的实时全局监控指标 (真实生产环境中应通过 WebSocket 实时推送 Telemetry 数据)
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    // 模拟网络请求延迟，展示加载骨架屏
    setTimeout(() => {
      setSystemMetrics({
        status: 'Healthy',
        uptime: '14 days, 6 hours',
        active_workers: 4,
        total_workers: 8,
        queue_size: 12,
        throughput_rpm: 850, // Requests Per Minute
        avg_latency_ms: 1240,
        
        // 节点吞吐热力数据：哪些图纸节点最吃算力？
        node_traffic: [
          { name: 'N1_Search (Browser-use)', load: 85, color: 'bg-blue-500' },
          { name: 'N2_Check (LLM Inference)', load: 92, color: 'bg-fuchsia-500' },
          { name: 'N3_CRM_Entry (API Push)', load: 45, color: 'bg-emerald-500' },
          { name: 'N4_Fail_Notify (Lark Bot)', load: 12, color: 'bg-rose-500' }
        ],

        // 大模型 API 消耗状态账单
        llm_usage: [
          { provider: 'OpenAI (gpt-4o)', tokens: '1.2M', cost: '$12.50', status: 'normal' },
          { provider: 'DeepSeek (chat)', tokens: '8.5M', cost: '$4.20', status: 'normal' },
          { provider: 'Anthropic (sonnet)', tokens: '0', cost: '$0.00', status: 'idle' }
        ]
      });
      setLoading(false);
    }, 600);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      
      {/* ========================================================= */}
      {/* 🌟 Header：全局指挥中心大屏标题 */}
      {/* ========================================================= */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-indigo-500" /> Global Monitors Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1.5">系统的全局心跳图。实时监控后台并发 Worker 负载、大模型 API 调用耗时及节点吞吐瓶颈。</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md">
            <BarChart3 size={14} /> 导出监控报告
          </button>
          <div className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-default">
            <Radio size={14} className="animate-pulse" /> Live Telemetry
          </div>
        </div>
      </div>

      {loading || !systemMetrics ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在连接底层遥测总线 (Telemetry Bus)...
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          
          {/* ======================================================= */}
          {/* 🌟 区块 1：实时并发基建状态 (Infrastructure Pulse) */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            
            {/* 引擎状态 */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engine Status</div>
                <Server size={16} className="text-emerald-500 opacity-80" />
              </div>
              <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                {systemMetrics.status} <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 font-mono">Uptime: {systemMetrics.uptime}</div>
            </div>

            {/* 并发 Workers */}
            <div className="bg-[#0E121B] border border-indigo-900/30 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.05)]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">Active Workers (并发协程)</div>
                <Cpu size={16} className="text-indigo-500 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-indigo-400 font-mono">
                {systemMetrics.active_workers} <span className="text-lg text-slate-600">/ {systemMetrics.total_workers}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/50 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-500 relative" style={{ width: `${(systemMetrics.active_workers / systemMetrics.total_workers) * 100}%` }}></div>
              </div>
            </div>

            {/* 任务队列堆积 */}
            <div className="bg-[#0E121B] border border-orange-900/30 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest">Queue Backlog (排队任务)</div>
                <Zap size={16} className="text-orange-500 opacity-80" />
              </div>
              <div className="text-3xl font-black text-orange-400 font-mono">{systemMetrics.queue_size}</div>
              <div className="text-[10px] text-orange-500/60 mt-2">待分配给 Idle Worker 的载荷</div>
            </div>

            {/* 平均延迟 */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg E2E Latency (端到端延迟)</div>
                <Clock size={16} className="text-purple-500 opacity-80" />
              </div>
              <div className="text-3xl font-black text-purple-400 font-mono">{systemMetrics.avg_latency_ms} <span className="text-sm">ms</span></div>
              <div className="text-[10px] text-slate-500 mt-2">含 LLM 首 Token 生成时间</div>
            </div>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
            
            {/* ======================================================= */}
            {/* 🌟 区块 2：大模型 API 消耗状态 (LLM API Telemetry) */}
            {/* ======================================================= */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19] flex justify-between items-center shrink-0">
                <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2"><Cpu size={14} className="text-blue-500"/> LLM API Telemetry (大模型消耗与连通性)</h2>
              </div>
              <div className="p-6 flex-1 bg-[#050505]">
                <table className="w-full text-left text-sm">
                  <thead className="text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                    <tr>
                      <th className="pb-3 font-bold">Provider / Model</th>
                      <th className="pb-3 font-bold">Tokens Used</th>
                      <th className="pb-3 font-bold">Est. Cost</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {systemMetrics.llm_usage.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 text-xs font-bold text-slate-200">{m.provider}</td>
                        <td className="py-4 font-mono text-xs text-blue-400">{m.tokens}</td>
                        <td className="py-4 font-mono text-xs text-emerald-400">{m.cost}</td>
                        <td className="py-4 text-right">
                          {m.status === 'normal' 
                            ? <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-widest">Normal</span>
                            : <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-widest">Idle</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ======================================================= */}
            {/* 🌟 区块 3：节点吞吐量热力图 (Node Throughput Heatmap) */}
            {/* ======================================================= */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19] flex justify-between items-center shrink-0">
                <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2"><Network size={14} className="text-fuchsia-500"/> Node Throughput Heatmap (节点负载热力)</h2>
              </div>
              <div className="p-6 flex-1 bg-[#050505] flex flex-col justify-center">
                
                {systemMetrics.node_traffic.map((node: any, idx: number) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-bold text-slate-300">{node.name}</span>
                      <span className={`text-[12px] font-black font-mono text-slate-400`}>{node.load}% <span className="text-[9px] text-slate-600 font-normal">Load</span></span>
                    </div>
                    {/* 极其漂亮的发光进度条 */}
                    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden flex">
                      <div className={`h-full ${node.color} relative`} style={{ width: `${node.load}%` }}>
                        <div className={`absolute top-0 right-0 w-full h-full border-r-2 border-white/20 shadow-[2px_0_10px_currentColor]`}></div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-500 mb-3">当前 [大模型视觉洗筛] 节点负载过高 (92%)，可能成为执行流转的瓶颈，建议增加 Max Retries 或提升并发 Worker 数量。</p>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}