import React, { useState } from 'react';
import { Ticket, Search, ShieldAlert, Clock, User, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export default function TicketsView() {
  const { setCurrentView } = useUIStore();
  const [tickets] = useState([
    { id: 'TKT-9921', flow: '智能拓客与CRM录入', node: 'N3_CRM_Entry', guard: '敏感数据写入', status: 'pending', time: '10 mins ago', assignee: 'Sales_Admin' },
    { id: 'TKT-9920', flow: '自动化竞品爬取', node: 'N2_Scrape', guard: '反爬虫/验证码拦截', status: 'resolved', time: '1 hour ago', assignee: 'System_Admin' }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="text-rose-500" /> Intervention Tickets</h1>
          <p className="text-xs text-slate-500 mt-1.5">由安防探针 (Guards) 挂起，待人类在 Workbench 中接管审批的异常工单池。</p>
        </div>
      </div>

      <div className="bg-[#0E121B] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#050505] text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
            <tr>
              <th className="px-6 py-4 font-bold">Ticket ID & Time</th>
              <th className="px-6 py-4 font-bold">Suspended At (Node)</th>
              <th className="px-6 py-4 font-bold">Triggered Guard</th>
              <th className="px-6 py-4 font-bold">Status / Assignee</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-mono text-rose-400 text-xs font-bold">{t.id}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1.5"><Clock size={10}/> {t.time}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-bold text-slate-200">{t.node}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t.flow}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-rose-950/30 text-rose-400 border border-rose-900/50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                    <ShieldAlert size={10}/> {t.guard}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {t.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                      <span className="text-xs text-amber-500 font-bold">Pending</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-bold">Resolved</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1"><User size={10}/> {t.assignee}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  {t.status === 'pending' ? (
                    <button onClick={() => setCurrentView('workbench')} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 rounded shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all flex items-center gap-1 ml-auto">
                      Go to Workbench <ArrowRight size={12}/>
                    </button>
                  ) : (
                    <button onClick={() => setCurrentView('ledger')} className="text-slate-500 hover:text-emerald-400 text-[10px] font-bold transition-colors flex items-center gap-1 ml-auto">
                      <PlayCircle size={14}/> View in Ledger
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}