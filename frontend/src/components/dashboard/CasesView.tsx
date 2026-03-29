import React, { useState } from 'react';
import { Briefcase, Search, DownloadCloud, FileJson, Network, ChevronRight, Clock, BoxSelect, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CasesView() {
  const [cases] = useState([
    { 
      id: 'case_sales_091', 
      title: 'Shopify 竞品调研报告', 
      flow: '智能拓客与CRM录入', 
      status: 'completed',
      payload: '{\n  "company": "Shopify",\n  "extracted_leads": 12,\n  "confidence": 0.95\n}', 
      time: '10:42 AM',
      date: 'Today'
    },
    { 
      id: 'case_refund_112', 
      title: '订单 #8891 售后退款处理', 
      flow: '售后退款审批流', 
      status: 'intervention',
      payload: '{\n  "order_id": "#8891",\n  "amount": 150.00,\n  "risk_level": "high",\n  "reason": "broken_item"\n}', 
      time: '14:30 PM',
      date: 'Yesterday'
    },
    { 
      id: 'case_onboard_004', 
      title: '新员工 Alice 入职权限开通', 
      flow: 'IT 自动化工单系统', 
      status: 'completed',
      payload: '{\n  "employee": "Alice Smith",\n  "department": "Engineering",\n  "provisioned_apps": ["Github", "Slack", "Jira"]\n}', 
      time: '09:15 AM',
      date: '2 Days Ago'
    }
  ]);

  // 控制某行 JSON Payload 的展开/折叠
  const [expandedRow, setExpandedRow] = useState<string | null>('case_refund_112');

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-emerald-500" /> Business Cases</h1>
          <p className="text-xs text-slate-500 mt-1.5">系统处理过的所有结构化业务实例库。从海量 Traces 中提炼出的具有明确业务意图 (Intent) 和载荷 (Payload) 的高价值资产。</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-md">
          <DownloadCloud size={14} /> 导出为 CSV
        </button>
      </div>

      {/* 数据表主体 */}
      <div className="bg-[#0E121B] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        
        {/* 工具栏 */}
        <div className="p-4 border-b border-slate-800/80 bg-[#050505] flex justify-between items-center">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded px-3 py-1.5 w-64 focus-within:border-emerald-500/50 transition-colors">
            <Search size={14} className="text-slate-500" />
            <input type="text" placeholder="Search Case ID or Title..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded transition-colors uppercase font-bold tracking-wider">Filter</button>
            <button className="flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1.5 rounded transition-colors uppercase font-bold tracking-wider">Export JSON</button>
          </div>
        </div>

        {/* 表格 */}
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0B0F19] text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
            <tr>
              <th className="px-6 py-4 font-bold w-12"></th>
              <th className="px-6 py-4 font-bold">Case ID & Time</th>
              <th className="px-6 py-4 font-bold">Business Intent (Title)</th>
              <th className="px-6 py-4 font-bold">Target Flow (SOP)</th>
              <th className="px-6 py-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {cases.map((c) => (
              <React.Fragment key={c.id}>
                {/* 1. 主行数据 */}
                <tr 
                  onClick={() => toggleRow(c.id)}
                  className={`hover:bg-slate-800/30 transition-colors cursor-pointer group ${expandedRow === c.id ? 'bg-slate-900/40' : ''}`}
                >
                  <td className="px-6 py-4 text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <ChevronRight size={16} className={`transition-transform duration-200 ${expandedRow === c.id ? 'rotate-90 text-emerald-400' : ''}`} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-emerald-400 text-xs font-bold">{c.id}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1.5"><Clock size={10}/> {c.date} <span className="opacity-50">({c.time})</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-200 font-bold flex items-center gap-2">
                      <BoxSelect size={14} className="text-slate-600"/> {c.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-900/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 w-max shadow-sm">
                      <Network size={10}/> {c.flow}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status === 'completed' ? (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase"><CheckCircle2 size={12} className="text-green-500"/> Completed</span>
                    ) : (
                      <span className="text-[10px] text-orange-400 flex items-center gap-1.5 font-bold uppercase"><AlertCircle size={12} className="text-orange-500"/> Intervention</span>
                    )}
                  </td>
                </tr>

                {/* 2. 展开的子行：JSON Payload 详情 */}
                {expandedRow === c.id && (
                  <tr className="bg-[#050505]">
                    <td colSpan={5} className="p-0 border-t-0">
                      <div className="px-6 py-5 border-l-2 border-emerald-500 ml-[26px]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                            <FileJson size={12}/> Structured Business Payload
                          </div>
                          <button className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors font-mono underline decoration-slate-700 underline-offset-4">View Raw JSON</button>
                        </div>
                        
                        {/* 极客风代码框 */}
                        <div className="bg-[#0E121B] rounded-lg border border-slate-800/80 p-4 shadow-inner overflow-hidden relative">
                          <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                            <code dangerouslySetInnerHTML={{
                              __html: c.payload
                                .replace(/"(.*?)":/g, '<span class="text-indigo-400">"$1"</span>:') // 高亮 Key
                                .replace(/:\s"(.*?)"/g, ': <span class="text-emerald-400">"$1"</span>') // 高亮 String
                                .replace(/:\s(\d+(\.\d+)?)/g, ': <span class="text-amber-400">$1</span>') // 高亮 Number
                            }}></code>
                          </pre>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}