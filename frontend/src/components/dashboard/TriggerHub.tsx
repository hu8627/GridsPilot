import React, { useState } from 'react';
import { Zap, Plus, Clock, Webhook, Mail, PlayCircle, Loader2, Power, Settings2, Network, TerminalSquare, Copy, X } from 'lucide-react';

export default function TriggerHub() {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggers] = useState([
    {
      id: 'trig_cron_001', name: '每晚销售战报推送', type: 'cron', status: 'active',
      target_flow_id: 'flow_sdr_001', schema_id: 'schema_ecommerce',
      config: { cron_expr: '0 23 * * *', timezone: 'Asia/Shanghai' },
      payload_template: { department: 'Sales', report_type: 'Daily' }
    },
    {
      id: 'trig_webh_002', name: 'Zendesk 高危客诉监听', type: 'webhook', status: 'active',
      target_flow_id: 'flow_cs_002', schema_id: 'schema_ecommerce',
      config: { endpoint: '/api/webhooks/zendesk_urgent', method: 'POST' },
      payload_template: { ticket_level: 'P0' }
    },
    {
      id: 'trig_mail_003', name: '招聘邮箱简历解析', type: 'email', status: 'idle',
      target_flow_id: 'flow_hr_001', schema_id: 'schema_hr',
      config: { mailbox: 'jobs@company.com', filter_subject: '简历' },
      payload_template: {}
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'cron': return <Clock size={20} className="text-amber-400"/>;
      case 'webhook': return <Webhook size={20} className="text-fuchsia-400"/>;
      case 'email': return <Mail size={20} className="text-blue-400"/>;
      default: return <Zap size={20} className="text-slate-400"/>;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'cron': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'webhook': return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400';
      case 'email': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-amber-500" /> Event & Schedule Triggers</h1>
          <p className="text-xs text-slate-500 mt-1.5">全局事件与定时调度中心。将发令枪绑定至业务图纸 (Flows)，实现无人值守的自动化运转。</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Plus size={14} /> 新增触发器
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {triggers.map((t) => (
          <div key={t.id} className={`bg-[#0E121B] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 group overflow-hidden relative shadow-lg`}>
            
            {t.status === 'active' && <div className={`absolute top-0 left-0 w-full h-1 ${getColor(t.type).replace('text-', 'bg-').replace('border-', '').replace('/30', '')}`}></div>}
            
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${getColor(t.type)}`}>{getIcon(t.type)}</div>
                <div>
                  <h3 className="font-bold text-[15px] text-slate-100">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getColor(t.type)}`}>{t.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono opacity-80">{t.id}</span>
                  </div>
                </div>
              </div>
              {t.status === 'active' ? (
                <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50 font-bold uppercase"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active</span>
              ) : (
                <span className="flex items-center gap-1.5 text-[9px] text-slate-400 bg-slate-900 px-2 py-1 rounded-full border border-slate-700 font-bold uppercase"><Power size={10}/> Idle</span>
              )}
            </div>

            <div className="bg-[#050505] rounded-xl border border-slate-800/80 p-4 mb-5 shadow-inner">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Network size={12}/> Target Orchestration</div>
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/50 pb-2 mb-2">
                <span className="text-slate-500">Business Schema:</span><span className="text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded">{t.schema_id || 'Global'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Target Flow ID:</span><span className="text-blue-400 font-bold flex items-center gap-1.5"><PlayCircle size={12}/> {t.target_flow_id}</span>
              </div>
            </div>
            
            <div className="bg-[#050505] rounded-xl border border-slate-800/80 mb-5 relative group/code shadow-inner overflow-hidden">
              <div className="bg-[#0E121B] px-3 py-2 border-b border-slate-800/80 flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TerminalSquare size={12}/> {t.type === 'cron' ? 'Schedule Config' : 'Endpoint Config'}</span>
                <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover/code:opacity-100 transition-opacity"><Copy size={12}/></button>
              </div>
              <div className="p-3">
                {Object.entries(t.config).map(([k, v], idx) => (
                  <div key={idx} className="flex items-center text-[10px] font-mono mb-1.5 last:mb-0">
                    <span className="text-amber-500/70 w-24 shrink-0">{k}:</span><span className={`truncate flex-1 ${t.type === 'cron' ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto flex gap-3 pt-4 border-t border-slate-800/60">
              <button className="flex-1 bg-[#050505] hover:bg-slate-800 border border-slate-800 text-[11px] font-bold py-2 rounded-lg transition-colors text-slate-300 flex items-center justify-center gap-1.5"><Settings2 size={14}/> 调整调度策略</button>
              <button className={`p-2 rounded-lg border transition-colors ${t.status === 'active' ? 'bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-900/40' : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40'}`}><Power size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}