import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Loader2, X, TerminalSquare, Database, CheckCircle2, Globe, FileText, UserCircle } from 'lucide-react';

export default function SkillRegistry() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 默认创建一个新技能的模板
  const [newSkill, setNewSkill] = useState({ 
    id: '', name: '', desc: '', type: 'system', env: 'Python Script', params_schema: [] as any[] 
  });

  const fetchSkills = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => { setSkills(data.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchSkills(); }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'agent': return <Globe size={18} className="text-fuchsia-400"/>;
      case 'human': return <UserCircle size={18} className="text-orange-400"/>;
      default: return <Database size={18} className="text-blue-400"/>; // system
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'agent': return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400';
      case 'human': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-400'; // system
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewSkill({ id: '', name: '', desc: '', type: 'system', env: 'Python Script', params_schema: [{ field: 'param_1', type: 'string', label: '参数名', required: true }] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setIsEditing(true);
    setNewSkill({ ...s, params_schema: Array.isArray(s.params_schema) ? s.params_schema : [] });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...newSkill,
        id: newSkill.id || `skill_${Date.now()}`
      };
      await fetch('http://localhost:8000/api/skills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      setIsModalOpen(false);
      fetchSkills();
    } catch (err) { alert("保存失败"); } 
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200 relative w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="text-emerald-500" /> Skill Registry</h1>
          <p className="text-xs text-slate-500 mt-1.5">管理底层的手脚 (原子化工具与执行环境)。这些技能将在 Studio 编排时被挂载到具体的业务节点中。</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Plus size={14} /> 注册底层原子能力
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在调阅底层能力注册表...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((s) => (
            <div key={s.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 group relative overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner ${getColor(s.type)}`}>
                    {getIcon(s.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-slate-100">{s.name}</h3>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.id}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getColor(s.type)}`}>
                  {s.type}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 mb-6 flex-1 leading-relaxed">
                {s.desc}
              </p>
              
              {/* 参数定义预览区 (极其高级的视觉设计) */}
              <div className="bg-[#0a0a0a] rounded-lg border border-slate-800/80 mb-6 p-3">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TerminalSquare size={10}/> Schema Definition</div>
                {s.params_schema && s.params_schema.length > 0 ? (
                  <div className="space-y-1.5">
                    {s.params_schema.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center text-[10px] font-mono">
                        <span className="text-emerald-400 w-24 shrink-0">{p.field}{p.required ? <span className="text-red-500">*</span> : ''}</span>
                        <span className="text-slate-500 w-16">{p.type}</span>
                        <span className="text-slate-400 truncate flex-1 opacity-80">// {p.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 font-mono italic">No input parameters required.</div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto border-t border-slate-800/60 pt-4">
                <div className="text-[10px] font-mono text-slate-500">Env: {s.env}</div>
                <button onClick={() => handleOpenEdit(s)} className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                  配置底层参数
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Wrench size={16} className="text-emerald-500"/> {isEditing ? '修改底层能力定义' : '注册新的原子动作'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md"><X size={16}/></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Skill ID (代码调用名)</label>
                  <input type="text" disabled={isEditing} placeholder="如: notion_append" value={newSkill.id} onChange={e => setNewSkill({...newSkill, id: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">展示名称</label>
                  <input type="text" placeholder="如: 写入 Notion 文档" value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500" />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">执行主体 (Executor)</label>
                  <select value={newSkill.type} onChange={e => setNewSkill({...newSkill, type: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500">
                    <option value="system">SYSTEM (基建与代码)</option>
                    <option value="agent">AGENT (大模型推理与操作)</option>
                    <option value="human">HUMAN (推送表单审批)</option>
                    <option value="hardware">HARDWARE (物理硬件驱动)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">执行环境 (Env)</label>
                  <input type="text" placeholder="如: Python Script, API" value={newSkill.env} onChange={e => setNewSkill({...newSkill, env: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">功能描述</label>
                <textarea rows={2} placeholder="描述此技能的具体作用..." value={newSkill.desc} onChange={e => setNewSkill({...newSkill, desc: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500 resize-none" />
              </div>

              {/* 参数 Schema 配置器 (极其硬核) */}
              <div className="bg-slate-950 border border-emerald-900/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Params Schema (入参定义)</label>
                  <button 
                    onClick={() => setNewSkill({...newSkill, params_schema: [...newSkill.params_schema, { field: '', type: 'string', label: '', required: false }]})}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition-colors"
                  >+ 新增参数</button>
                </div>
                
                {newSkill.params_schema.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2 bg-[#0a0a0a] p-2 rounded border border-slate-800">
                    <input type="text" placeholder="Key (如 page_id)" value={p.field} onChange={(e) => { const n = [...newSkill.params_schema]; n[idx].field = e.target.value; setNewSkill({...newSkill, params_schema: n}); }} className="w-1/4 bg-transparent border-b border-slate-700 text-[10px] outline-none text-slate-200" />
                    <input type="text" placeholder="中文 Label" value={p.label} onChange={(e) => { const n = [...newSkill.params_schema]; n[idx].label = e.target.value; setNewSkill({...newSkill, params_schema: n}); }} className="flex-1 bg-transparent border-b border-slate-700 text-[10px] outline-none text-slate-200" />
                    <select value={p.type} onChange={(e) => { const n = [...newSkill.params_schema]; n[idx].type = e.target.value; setNewSkill({...newSkill, params_schema: n}); }} className="w-20 bg-transparent border-b border-slate-700 text-[10px] outline-none text-slate-400">
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                    <label className="flex items-center gap-1 text-[9px] text-slate-500 w-16">
                      <input type="checkbox" checked={p.required} onChange={(e) => { const n = [...newSkill.params_schema]; n[idx].required = e.target.checked; setNewSkill({...newSkill, params_schema: n}); }} />
                      必填
                    </label>
                    <button onClick={() => { const n = [...newSkill.params_schema]; n.splice(idx, 1); setNewSkill({...newSkill, params_schema: n}); }} className="text-red-500/70 hover:text-red-400"><X size={14}/></button>
                  </div>
                ))}
              </div>

            </div>

            <div className="bg-slate-800/20 px-6 py-4 border-t border-slate-800/80 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200">取消</button>
              <button onClick={handleSave} disabled={saving || !newSkill.name || !newSkill.id} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                {saving ? <Loader2 size={14} className="animate-spin" /> : '注册到底层库'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}