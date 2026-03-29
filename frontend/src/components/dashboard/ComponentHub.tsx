import React, { useState } from 'react';
import { Blocks, Plus, PackageOpen, Share2, Eye, GitMerge, FileJson, Cpu, Users } from 'lucide-react';

export default function ComponentHub() {
  const [components] = useState([
    {
      id: 'macro_notion_sync', name: '频道沉淀至 Notion (Macro)', category: 'Business Logic',
      desc: '一键拉取指定频道的群聊历史，调用挂载的大模型总结，并将其格式化写入目标 Notion 页面。',
      nodes: 3, params: ['channel_id', 'page_id', 'agent_id'], status: 'published'
    },
    {
      id: 'macro_fraud_check', name: '金融级活体反欺诈包', category: 'Compliance',
      desc: '内置了多张照片相似度对比、LexisNexis 黑名单核验，及高危命中时的强制人工挂起 (HITL) 逻辑。',
      nodes: 5, params: ['user_images', 'id_number'], status: 'published'
    }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Blocks className="text-blue-500" /> Macro Components (宏组件)</h1>
          <p className="text-xs text-slate-500 mt-1.5">高级的乐高积木生态。将高频使用的“多节点原子组合”封装为黑盒宏组件，供架构师在 Studio 画布中一键挂载。</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md">
            <Share2 size={14} /> 导入第三方宏库
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Plus size={14} /> 封装新宏组件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {components.map((c) => (
          <div key={c.id} className={`bg-[#0E121B] border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all duration-300 group shadow-lg relative overflow-hidden`}>
            
            <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity"><PackageOpen size={160} className="text-blue-500"/></div>
            
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner"><Blocks size={24}/></div>
                <div>
                  <h3 className="font-bold text-[15px] text-slate-100 group-hover:text-blue-400 transition-colors">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-slate-400 bg-slate-800 border-slate-700">{c.category}</span>
                    <span className="text-[10px] text-slate-500 font-mono opacity-80">{c.id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed relative z-10">{c.desc}</p>
            
            <div className="bg-[#050505] rounded-xl border border-slate-800/80 p-4 mb-5 shadow-inner relative z-10">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileJson size={12}/> Required Parameters</div>
              <div className="flex flex-wrap gap-2">
                {c.params.map((p, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-700/50 px-2 py-1 rounded text-[10px] font-mono text-blue-300 shadow-sm">{p}</span>
                ))}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800/60 relative z-10">
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5"><GitMerge size={12} className="text-blue-500/70"/> 封装了 {c.nodes} 个底层节点</span>
              </div>
              <button className="text-blue-500 hover:text-blue-400 text-[11px] font-bold flex items-center gap-1"><Eye size={14}/> 拆解查看结构</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}