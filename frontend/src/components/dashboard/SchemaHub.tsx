import React, { useState } from 'react';
import { Layers, Plus, Share2, Globe, ShoppingBag, Users, Crosshair, Network, ChevronRight, Activity, ShieldCheck, Box } from 'lucide-react';

export default function SchemaHub() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="text-indigo-500" /> Business Schemas</h1>
          <p className="text-xs text-slate-500 mt-1.5">系统的“造物主”面板。定义底层的业务模式、角色权限与全链路服务场景，让 GridsPilot OS 完美适配行业生态。</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md">
            <Share2 size={14} /> 导入 Schema 模板
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Plus size={14} /> 新建行业模式
          </button>
        </div>
      </div>

      {/* 🌟 核心：电商全链路业务 Schema 视图 */}
      <div className="bg-[#0E121B] border border-indigo-500/30 rounded-2xl flex flex-col relative transition-all duration-300 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.1)]">
        
        {/* 顶层光晕与状态 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
        
        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 lg:items-start">
          
          {/* 左侧：业务模式定义 (Level 1) */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-blue-500/30 bg-blue-900/10 shadow-inner text-blue-400">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-100">电商交易与逆向物流</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">B2C / Platform</span>
                  <span className="flex items-center gap-1 text-[9px] text-white bg-indigo-600 px-2 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                    <Globe size={10}/> SYSTEM ACTIVE
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              定义了多边交易平台的核心数据流。从正向的商品浏览、订单履约，到逆向的客诉处理、高危拦截与资金退回，实现全链路的 Agentic Orchestration。
            </p>
            
            {/* 用户角色拆分 (Level 2) */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-1.5"><Users size={12}/> User Roles (角色隔离)</div>
              <div className="bg-[#050505] border border-slate-800/80 rounded-lg p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 买家 (Consumer)</div>
                <span className="text-[9px] text-slate-500 font-mono">APP / Web</span>
              </div>
              <div className="bg-[#050505] border border-slate-800/80 rounded-lg p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 商家 (Merchant)</div>
                <span className="text-[9px] text-slate-500 font-mono">Seller Center</span>
              </div>
              <div className="bg-[#050505] border border-indigo-900/30 rounded-lg p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 平台管控 (Platform Admin)</div>
                <span className="text-[9px] text-indigo-500/70 font-mono">GridsPilot OS</span>
              </div>
            </div>
          </div>

          {/* 右侧：业务场景 -> 服务流程映射 (Level 3 & 4) */}
          <div className="flex-1 bg-[#050505] border border-slate-800/80 rounded-xl p-6 shadow-inner relative overflow-hidden">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 mb-5">
              <Crosshair size={14}/> Scenarios & Service Flows (业务场景与底层图纸映射)
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              
              {/* 场景 1：大促导购 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-slate-900 text-slate-500 group-hover:text-blue-400 group-hover:border-blue-900/30 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                  <Activity size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0E121B] p-4 rounded-xl border border-slate-800/60 shadow-lg group-hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xs text-slate-200">售前：大促智能导购</h3>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">SCENARIO</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">基于用户画像与大促规则库，提供多轮对话式商品推荐与库存实时查询。</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
                    <Network size={12} className="text-blue-500"/> Bound Flow: <span className="text-slate-300">flow_presales_01</span>
                  </div>
                </div>
              </div>

              {/* 场景 2：逆向物流与退款 (核心全链路) */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-slate-900 text-slate-500 group-hover:text-orange-400 group-hover:border-orange-900/30 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                  <ShieldCheck size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0E121B] p-4 rounded-xl border border-slate-800/60 shadow-lg group-hover:border-orange-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xs text-slate-200">售后：高危逆向物流退款</h3>
                    <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">SCENARIO</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{'全链路覆盖：客诉识别 -> 凭证视觉分析 -> 风控欺诈判定 -> 人工熔断审批 -> 原路退款打款。'}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
                    <Network size={12} className="text-orange-500"/> Bound Flow: <span className="text-slate-300">flow_refund_v2</span>
                  </div>
                </div>
              </div>

              {/* 场景 3：供应链风控 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-slate-900 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-900/30 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                  <Box size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0E121B] p-4 rounded-xl border border-slate-800/60 shadow-lg group-hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xs text-slate-200">合规：商家侵权与黑产巡检</h3>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">SCENARIO</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">自动化巡检商家上架商品，比对版权图库，触发侵权即下架并封禁资金账户。</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
                    <Network size={12} className="text-emerald-500"/> Bound Flow: <span className="text-slate-300">flow_compliance_risk</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}