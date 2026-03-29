import React, { useState } from 'react';
import { Scale, Plus, ChevronRight, ChevronDown, FileText, ShieldAlert, GitMerge, FileKey2,Network } from 'lucide-react';

export default function RulesHub() {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'p1': true, 'p1_c2': true, 'p1_c2_s1': true, 'p1_c2_s1_a4': true
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-8 h-full bg-[#0B0F19] text-slate-200 w-full relative flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="text-amber-500" /> Guidelines & Rules (全局合规法典)</h1>
          <p className="text-xs text-slate-500 mt-1.5">系统的最高宪法。支持 5层目录结构 + 3层法条结构 的全球最复杂法律分类。所有 Agent 的执行和 Monitor 的探针必须严格以此为准绳。</p>
        </div>
        <button className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Plus size={14} /> 起草新法条
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* 左侧：5层法典目录树 (The Legal Tree) */}
        <div className="w-[380px] bg-[#0E121B] border border-slate-800/80 rounded-2xl flex flex-col shadow-lg overflow-hidden shrink-0">
          <div className="px-4 py-3 bg-[#050505] border-b border-slate-800/80 flex items-center gap-2">
            <FileKey2 size={14} className="text-amber-500"/>
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Codex Directory (法典目录)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-sm font-mono space-y-1">
            
            {/* Level 1: 编 (Part) */}
            <div>
              <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-amber-400 font-bold" onClick={() => toggleNode('p1')}>
                {expandedNodes['p1'] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} 编 01: 全球贸易法与平台交易合规
              </div>
              
              {expandedNodes['p1'] && (
                <div className="ml-4 border-l border-slate-800/60 pl-2 mt-1 space-y-1">
                  {/* Level 2: 章 (Chapter) */}
                  <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-slate-200" onClick={() => toggleNode('p1_c1')}>
                    <ChevronRight size={14} className="text-slate-500"/> 章 I: 商家入驻资质审核
                  </div>
                  
                  <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-slate-200" onClick={() => toggleNode('p1_c2')}>
                    {expandedNodes['p1_c2'] ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>} 章 II: 消费者权益与售后合规
                  </div>

                  {expandedNodes['p1_c2'] && (
                    <div className="ml-4 border-l border-slate-800/60 pl-2 mt-1 space-y-1">
                      {/* Level 3: 节 (Section) */}
                      <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-slate-300" onClick={() => toggleNode('p1_c2_s1')}>
                        {expandedNodes['p1_c2_s1'] ? <ChevronDown size={14} className="text-slate-500"/> : <ChevronRight size={14} className="text-slate-500"/>} 节 1: 电子消费品退换货规定
                      </div>

                      {expandedNodes['p1_c2_s1'] && (
                        <div className="ml-4 border-l border-slate-800/60 pl-2 mt-1 space-y-1">
                          {/* Level 4: 条 (Article) */}
                          <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-slate-400">
                            <FileText size={12} className="text-slate-600"/> 第 3 条: 七天无理由退货之豁免
                          </div>
                          <div className="flex items-center gap-1.5 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded cursor-pointer text-amber-300 font-bold" onClick={() => toggleNode('p1_c2_s1_a4')}>
                            {expandedNodes['p1_c2_s1_a4'] ? <ChevronDown size={12} className="text-amber-500"/> : <ChevronRight size={12} className="text-amber-500"/>} 第 4 条: 开封后无理由退换的特殊干预
                          </div>

                          {expandedNodes['p1_c2_s1_a4'] && (
                            <div className="ml-4 border-l-2 border-amber-500/30 pl-2 mt-1 space-y-1">
                              {/* Level 5: 款 (Paragraph) */}
                              <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded text-slate-400 text-xs">
                                  <span className="text-amber-500/70 font-bold">款 A.</span> 针对高价值商品 ({'>'}5000 RMB) 
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-slate-500 text-xs">
                                <span className="text-slate-600 font-bold">款 B.</span> 针对生鲜与易腐败食品
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 另一个大编 */}
            <div>
              <div className="flex items-center gap-1.5 p-1.5 hover:bg-slate-800/50 rounded cursor-pointer text-amber-400 font-bold">
                <ChevronRight size={14}/> 编 02: 数据隐私与 GDPR 保护法案
              </div>
            </div>

          </div>
        </div>

        {/* 右侧：法条详情与 3层熔断配置 (The Rule Details) */}
        <div className="flex-1 bg-[#0E121B] border border-slate-800/80 rounded-2xl flex flex-col shadow-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          
          <div className="px-8 py-6 border-b border-slate-800/60 bg-[#050505]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">编 01 / 章 II / 节 1 / 第 4 条 / 款 A</div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              针对高价值商品 (&gt;5000 RMB) 的特殊干预规定
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase ml-2">STRICT COMPLIANCE</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            
            {/* 法规正文 (RAG 的语料来源) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText size={14}/> 法规正文 (Legal Text)</h3>
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 text-sm text-slate-300 leading-relaxed font-serif shadow-inner">
                对于单价超过人民币 5000 元（含）的 3C 电子及贵重金属类商品，如买家申请“开封后无理由退换货”，客服系统及自动化 Agent <strong className="text-amber-400">不得直接批准退款请求</strong>。必须在执行退款动作前，交由具有 L3 及以上权限的高级风控专家进行人工复核与凭证审查。
              </div>
              <p className="text-[10px] text-slate-500 mt-2">💡 该文本已自动向量化 (Vectorized)，随时供 Agent 检索对齐。</p>
            </div>

            {/* 3层法条熔断配置 (The 3-Level Execution Binding) */}
            <div>
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-1.5"><ShieldAlert size={14}/> 法条执行映射 (Execution Binding)</h3>
              
              <div className="space-y-3">
                {/* 项 (Item) - 条件判定 */}
                <div className="bg-[#050505] border border-slate-800/80 rounded-lg p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 font-mono text-xs font-bold">项</div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">条件判定 (Condition IF)</div>
                    <code className="text-xs text-amber-300 font-mono bg-amber-900/10 px-2 py-1 rounded border border-amber-900/30">context.order_amount &gt;= 5000 AND context.is_opened == True</code>
                  </div>
                </div>

                {/* 目 (Sub-item) - 熔断策略 */}
                <div className="bg-[#050505] border border-slate-800/80 rounded-lg p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 font-mono text-xs font-bold">目</div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">熔断策略 (Enforcement Action)</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-bold text-red-400 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded flex items-center gap-1.5"><ShieldAlert size={12}/> FORCE_SUSPEND (强制拦截)</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">Require Role: <span className="text-blue-400 font-mono">Risk_Expert_L3</span></span>
                    </div>
                  </div>
                </div>

                {/* 细目 (Detail) - 豁免白名单 */}
                <div className="bg-[#050505] border border-slate-800/80 rounded-lg p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 font-mono text-xs font-bold">细目</div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">豁免白名单 (Exemption Bypass)</div>
                    <div className="text-xs text-emerald-400 font-mono bg-emerald-950/10 px-2 py-1 rounded border border-emerald-900/30 mt-1 inline-block">
                      OR (context.customer_tier == 'SVIP' AND context.has_insurance == True)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 关联影响面 */}
            <div className="pt-6 border-t border-slate-800/60">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><GitMerge size={14}/> 规则绑定影响面</h3>
              <p className="text-[11px] text-slate-500">本法条当前已通过底层探针自动绑定至以下业务流水线，任何违反该法条的 Agent 执行行为将触发物理级阻断：</p>
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded flex items-center gap-1"><Network size={10}/> flow_refund_v2 (售后退款与安抚标准审批流)</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}