import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Power, AlertTriangle, Eye, Settings2, Loader2, ServerCrash, Ban, ShieldCheck } from 'lucide-react';

export default function GuardsHub() {
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 从后端真实的 SQLite 数据库中拉取所有的熔断探针规则
  const fetchGuards = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/monitors') // 💡 注意：后端的物理表名还是叫 monitors
      .then(res => res.json())
      .then(data => { 
        if (data.status === 'success') {
          setGuards(Array.isArray(data.data) ? data.data : []);
        } else {
          setGuards([]);
        }
        setLoading(false); 
      })
      .catch(err => { 
        console.error("无法拉取监控探针数据", err); 
        setGuards([]); 
        setLoading(false); 
      });
  };

  useEffect(() => { fetchGuards(); }, []);

  // 💡 视觉辅助：根据拦截动作分配危险等级颜色
  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('suspend') || act.includes('hitl')) return 'text-orange-400 bg-orange-900/30 border-orange-800/50 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
    if (act.includes('terminate') || act.includes('block')) return 'text-red-400 bg-red-900/30 border-red-800/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    if (act.includes('confirm') || act.includes('alert')) return 'text-blue-400 bg-blue-900/30 border-blue-800/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('suspend') || act.includes('hitl')) return <AlertTriangle size={12}/>;
    if (act.includes('terminate') || act.includes('block')) return <Ban size={12}/>;
    if (act.includes('confirm') || act.includes('alert')) return <ShieldCheck size={12}/>;
    return <Eye size={12}/>;
  };

  // 💡 模拟开关切换状态 (真实生产中需要调用 PUT /api/monitors/{id} 接口)
  const toggleGuardStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setGuards(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
    // TODO: fetch('...', { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      
      {/* ========================================================= */}
      {/* 🌟 Header：极其明确的系统定位宣发 */}
      {/* ========================================================= */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-500" /> Security Guards</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
            配置 PNSA 架构中的 <strong>[A] Auditor 熔断器</strong>。<br/>
            在此定义的拦截规则，将作为独立于业务图纸之外的最高安全护栏，实时校验所有 Agent 与 System 节点的越权行为。
          </p>
        </div>
        <button className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          <Plus size={14} /> 部署新护栏规则
        </button>
      </div>

      {/* 顶部全局安防状态概览 */}
      <div className="flex gap-4 mb-10">
        <div className="bg-[#0E121B] border border-slate-800 rounded-xl p-4 flex-1 flex items-center gap-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Global Guardian Status</div>
            <div className="text-lg font-black text-green-400 flex items-center gap-2">
              ARMED & ACTIVE <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            </div>
          </div>
        </div>
        <div className="bg-[#0E121B] border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-center shadow-lg hover:border-slate-700 transition-colors">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><ServerCrash size={12}/> Active Rules</div>
          <div className="text-2xl font-black text-slate-200">
            {guards.filter(g => g.status === 'active').length} <span className="text-[10px] text-slate-500 font-normal ml-1">/ {guards.length} Deployed</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🌟 核心：护栏规则配置卡片列表 (The Rule Configurations) */}
      {/* ========================================================= */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 text-sm justify-center h-32">
          <Loader2 className="animate-spin" size={18} /> 正在拉取底层安防配置...
        </div>
      ) : guards.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
          <ShieldAlert size={32} className="text-slate-600 mx-auto mb-3 opacity-50"/>
          <p className="text-slate-400 text-sm font-bold mb-1">系统处于极度裸奔状态</p>
          <p className="text-[10px] text-slate-500">当前没有任何生效的安全熔断规则，请立即部署！</p>
        </div>
      ) : (
        <div className="space-y-4 pb-10">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <ShieldAlert size={12}/> Active Defense Policies (防御策略明细)
          </h2>
          
          {guards.map((m) => (
            <div key={m.id} className={`bg-[#0E121B] border ${m.status === 'active' ? 'border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'border-slate-800/40 opacity-60'} rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-slate-600 transition-all duration-300 relative overflow-hidden group`}>
              
              {/* 激活状态的左侧光边 */}
              {m.status === 'active' && <div className="absolute left-0 top-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>}

              {/* 1. 规则名与作用域 (Target) */}
              <div className="w-full md:w-1/4">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className={`font-bold text-sm ${m.status === 'active' ? 'text-slate-100' : 'text-slate-400 line-through'}`}>{m.name}</h3>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">Target:</span> 
                  <span className="text-blue-400 truncate">{m.target}</span>
                </div>
              </div>

              {/* 2. 触发条件 (Condition) - 极客代码框 */}
              <div className="flex-1 w-full md:w-auto px-0 md:px-6 md:border-l border-slate-800/60">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Trigger Condition (触发条件)</div>
                <div className={`text-xs font-mono py-2 px-3 rounded-lg border inline-block ${m.status === 'active' ? 'text-orange-400 bg-[#050505] border-orange-900/30 shadow-inner' : 'text-slate-500 bg-slate-900 border-slate-800'}`}>
                  <span className="text-slate-500 mr-2">IF</span>
                  <span className="font-bold">{m.condition}</span>
                </div>
              </div>

              {/* 3. 执行动作 (Action) - 拦截级别高亮 */}
              <div className="w-full md:w-1/4 px-0 md:px-6 md:border-l border-slate-800/60">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Enforcement Action (拦截动作)</div>
                <div className={`text-[10px] font-bold py-1.5 px-3 rounded-md border w-max flex items-center gap-1.5 ${getActionColor(m.action)} ${m.status !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                  {getActionIcon(m.action)}
                  {m.action.toUpperCase()}
                </div>
              </div>

              {/* 4. 物理开关与设置 (Toggle & Settings) */}
              <div className="w-full md:w-28 flex items-center justify-end gap-4 text-slate-500 mt-4 md:mt-0">
                <button className="hover:text-blue-400 transition-colors" title="编辑规则参数"><Settings2 size={16}/></button>
                
                {/* 💡 极其硬核的拟物化物理拨动开关 */}
                <button 
                  onClick={() => toggleGuardStatus(m.id, m.status)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${m.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-slate-700'}`}
                  role="switch"
                  title={m.status === 'active' ? '点击禁用该护栏' : '点击启用该护栏'}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${m.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`}/>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}