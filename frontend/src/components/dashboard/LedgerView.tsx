import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, AlertTriangle, CheckCircle2, Clock, Eye, MessageSquare, PlayCircle, Loader2, Sparkles, Activity, ShieldAlert, TrendingUp, Cpu, DownloadCloud,Network } from 'lucide-react';

export default function LedgerView() {
  const [loading, setLoading] = useState(true);

  // 模拟从后端聚合统计出来的质检大盘数据
  const [qaStats, setQaStats] = useState<any>(null);

  useEffect(() => {
    // 模拟网络请求延迟
    setTimeout(() => {
      setQaStats({
        total_runs: 12450,
        success_rate: 94.2,
        avg_latency: '1.2s',
        intervention_rate: 5.8, // 人工接管率
        
        // 质检核心：哪些节点最容易出错？
        top_failed_nodes: [
          { id: 'N3_CRM_Entry', name: '审批写入老旧 CRM', failures: 412, issue: 'Timeout / Element Not Found' },
          { id: 'N2_AntiFraud', name: '大模型价值洗筛', failures: 156, issue: 'LLM Hallucination / Parse Error' },
          { id: 'N1_Scrape', name: '全网信息抓取', failures: 89, issue: 'CAPTCHA Blocked' }
        ],

        // 质检核心：探针拦截了什么？
        guards_intercepts: [
          { rule: '全局 Token 熔断', count: 320, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { rule: '敏感数据写入', count: 215, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { rule: '反爬虫/验证码拦截', count: 180, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' }
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="text-purple-500" /> Data Ledger (QA & Insights)</h1>
          <p className="text-xs text-slate-500 mt-1.5">全局执行质检大盘。洞察 AI 员工的运行健康度、探针拦截率与高危故障点。</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md">
            <DownloadCloud size={14} /> 导出质检月报
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Sparkles size={14} /> 唤醒 Optimizer 自动修图
          </button>
        </div>
      </div>

      {loading || !qaStats ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在聚合并计算全局账本数据...
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          
          {/* ======================================================= */}
          {/* 🌟 区块 1：核心健康度指标 (Core Vitals) */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Runs (本月流转)</div>
                <Activity size={16} className="text-blue-500 opacity-80" />
              </div>
              <div className="text-3xl font-black text-slate-100">{qaStats.total_runs.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp size={12}/> +12.5% vs last month</div>
              <div className="absolute -bottom-4 -right-4 text-slate-800 opacity-20"><Network size={80}/></div>
            </div>

            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success Rate (直通率)</div>
                <CheckCircle2 size={16} className="text-emerald-500 opacity-80" />
              </div>
              <div className="text-3xl font-black text-emerald-400">{qaStats.success_rate}%</div>
              <div className="text-[10px] text-slate-500 mt-2 font-mono">Target: &gt; 95%</div>
            </div>

            <div className="bg-[#0E121B] border border-orange-900/30 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.05)]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest">Intervention Rate (接管率)</div>
                <AlertTriangle size={16} className="text-orange-500 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-orange-400">{qaStats.intervention_rate}%</div>
              <div className="text-[10px] text-orange-500/60 mt-2 flex items-center gap-1">触发了 {qaStats.guards_intercepts.reduce((a:any, b:any) => a + b.count, 0)} 次 Guard 拦截</div>
            </div>

            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Latency (平均延迟)</div>
                <Clock size={16} className="text-purple-500 opacity-80" />
              </div>
              <div className="text-3xl font-black text-slate-100 font-mono">{qaStats.avg_latency}</div>
              <div className="text-[10px] text-slate-500 mt-2">包含 LLM 推理与物理耗时</div>
            </div>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
            
            {/* ======================================================= */}
            {/* 🌟 区块 2：高频故障节点质检榜 (Top Failed Nodes) */}
            {/* ======================================================= */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19] flex justify-between items-center shrink-0">
                <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2"><AlertTriangle size={14} className="text-rose-500"/> 高危业务节点质检榜 (Top Failed Nodes)</h2>
                <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-widest uppercase">View All Cases</button>
              </div>
              <div className="p-6 flex-1 bg-[#050505]">
                <div className="space-y-4">
                  {qaStats.top_failed_nodes.map((node: any, idx: number) => (
                    <div key={idx} className="bg-[#0E121B] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between group hover:border-rose-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rose-950/30 flex items-center justify-center border border-rose-900/50 text-rose-500 font-bold text-lg">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-200 mb-1">{node.name} <span className="text-[9px] text-slate-500 font-mono ml-2">({node.id})</span></div>
                          <div className="text-[10px] font-mono text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded inline-block border border-rose-900/30">
                            Root Cause: {node.issue}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-100">{node.failures}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Failures</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ======================================================= */}
            {/* 🌟 区块 3：探针拦截分布图 (Guards Intercepts) */}
            {/* ======================================================= */}
            <div className="bg-[#0E121B] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19] flex justify-between items-center shrink-0">
                <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2"><ShieldAlert size={14} className="text-amber-500"/> 安全探针拦截分布 (Guards Intercepts)</h2>
              </div>
              <div className="p-6 flex-1 bg-[#050505] flex flex-col justify-center">
                
                {qaStats.guards_intercepts.map((guard: any, idx: number) => {
                  // 计算宽度的极简视觉黑客手法
                  const max = Math.max(...qaStats.guards_intercepts.map((g:any)=>g.count));
                  const widthPct = (guard.count / max) * 100;
                  
                  return (
                    <div key={idx} className="mb-5 last:mb-0">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-bold text-slate-300">{guard.rule}</span>
                        <span className={`text-[12px] font-black font-mono ${guard.color}`}>{guard.count} <span className="text-[9px] text-slate-500 font-normal">Times</span></span>
                      </div>
                      {/* 极其漂亮的发光进度条 */}
                      <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full ${guard.bg} relative`} 
                          style={{ width: `${widthPct}%` }}
                        >
                          <div className={`absolute top-0 right-0 w-full h-full border-r-2 ${guard.color.replace('text-', 'border-')} shadow-[2px_0_10px_currentColor]`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-500 mb-3">系统探针极其有效地阻止了 {qaStats.guards_intercepts.reduce((a:any, b:any) => a + b.count, 0)} 次可能导致资产损失的高危 AI 操作。</p>
                  <button className="bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-[11px] font-bold py-1.5 px-4 rounded-lg transition-colors text-slate-300">
                    调整熔断阈值 (Tune Guards)
                  </button>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}