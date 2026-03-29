import React, { useState, useEffect } from 'react';
import { Blocks, Plus, CheckCircle2, AlertCircle, MessageSquare, FileText, Github, Mail, Loader2, X, ChevronRight, Terminal } from 'lucide-react';

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗与表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchIntegrations = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/integrations')
      .then(res => res.json())
      .then(data => { 
        // 💡 绝杀防御：即使后端返回 undefined，强制回退为 []，map 绝对不会崩！
        if (data.status === 'success') {
          setIntegrations(Array.isArray(data.data) ? data.data : []); 
        } else {
          setIntegrations([]);
        }
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setIntegrations([]); // 💡 网络错误也要兜底
        setLoading(false); 
      });
  };

  useEffect(() => { fetchIntegrations(); }, []);

  // 💡 全新定义的品牌视觉映射 (微光、边框、图标颜色)
  const brandStyles: Record<string, any> = {
    lark: { icon: <MessageSquare size={22} />, bg: 'bg-[#3370FF]/10', border: 'border-[#3370FF]/30', text: 'text-[#3370FF]', glow: 'group-hover:shadow-[0_0_20px_rgba(51,112,255,0.15)]' },
    notion: { icon: <FileText size={22} />, bg: 'bg-slate-200/10', border: 'border-slate-200/30', text: 'text-slate-200', glow: 'group-hover:shadow-[0_0_20px_rgba(226,232,240,0.1)]' },
    github: { icon: <Github size={22} />, bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]' },
    smtp: { icon: <Mail size={22} />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
    default: { icon: <Blocks size={22} />, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' }
  };

  const handleOpenEdit = (app: any) => {
    setEditingApp(app);
    const initialForm: Record<string, string> = {};
    Object.keys(app.config || {}).forEach(k => initialForm[k] = ''); 
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedApp = { ...editingApp, config: formData };
      await fetch('http://localhost:8000/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedApp)
      });
      setIsModalOpen(false);
      fetchIntegrations();
    } catch (err) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Blocks className="text-pink-500" /> Integrations</h1>
          <p className="text-xs text-slate-500 mt-1.5">配置第三方生态应用授权，为 Agent 接通外界的神经末梢。</p>
        </div>
        <button className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all shadow-lg backdrop-blur-sm">
          <Plus size={14} /> 接入新生态应用
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在调取授权列表...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {integrations.map((app) => {
            const style = brandStyles[app.id] || brandStyles.default;
            
            return (
              <div key={app.id} className={`bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col relative group transition-all duration-300 ${style.glow} hover:border-slate-700 overflow-hidden`}>
                
                {/* 顶部极细的品牌微光线条 */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity ${style.bg.replace('/10', '')}`}></div>

                <div className="p-6 flex flex-col h-full">
                  {/* 头部：Icon 与 Status */}
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${style.bg} ${style.border} ${style.text} shadow-inner`}>
                      {style.icon}
                    </div>
                    {app.status === 'active' ? (
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-900/50 font-medium">
                        <CheckCircle2 size={12}/> Authorized
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] text-orange-400 bg-orange-950/30 px-2.5 py-1 rounded-full border border-orange-900/50 font-medium">
                        <AlertCircle size={12}/> Needs Auth
                      </span>
                    )}
                  </div>
                  
                  {/* 主体介绍 */}
                  <h3 className="font-bold text-base text-slate-100 mb-2">{app.name}</h3>
                  <p className="text-[12px] text-slate-400 leading-relaxed mb-6 flex-1">
                    {app.desc}
                  </p>
                  
                  {/* 终端风格的配置预览 (Terminal Box) */}
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-slate-800/80 mb-6 relative group-hover:border-slate-700 transition-colors">
                    <div className="absolute -top-2 left-3 bg-slate-900 px-1.5 flex items-center gap-1 text-[9px] font-bold text-slate-500 tracking-widest uppercase rounded">
                      <Terminal size={10} /> Connection Vars
                    </div>
                    <div className="mt-1 space-y-1.5">
                      {Object.entries(app.config_masked || {}).map(([k, v], idx) => {
                        const maskedVal = typeof v === 'string' ? v : '';
                        return (
                          <div key={idx} className="flex items-center text-[10px] font-mono">
                            <span className="text-slate-600 w-24 shrink-0">{k}:</span>
                            <span className={`truncate flex-1 ${maskedVal ? 'text-slate-300' : 'text-orange-500/50 italic'}`}>
                              {maskedVal || '<Empty>'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 底部操作按钮 */}
                  <div className="flex items-center gap-3 mt-auto">
                    <button 
                      onClick={() => handleOpenEdit(app)}
                      className="flex-1 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-[11px] font-bold py-2 px-4 rounded-lg transition-colors text-slate-300 flex items-center justify-center gap-1.5"
                    >
                      {app.status === 'active' ? '更新凭证' : '配置授权'}
                    </button>
                    {app.status === 'active' && (
                      <button className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[11px] font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1">
                        测试连通 <ChevronRight size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 极简高级感的配置弹窗 */}
      {isModalOpen && editingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            
            {/* 弹窗 Header */}
            <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${brandStyles[editingApp.id]?.bg || brandStyles.default.bg} ${brandStyles[editingApp.id]?.text || brandStyles.default.text}`}>
                  {brandStyles[editingApp.id]?.icon || brandStyles.default.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">配置 {editingApp.name}</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {editingApp.id}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md transition-colors"><X size={16}/></button>
            </div>
            
            {/* 弹窗 Body */}
            <div className="p-6">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] p-3 rounded-lg mb-6 flex items-start gap-2 leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                请在下方填入目标应用的接入凭证。保存后，系统底层 FileDB 将对其进行加密脱敏处理。
              </div>

              <div className="space-y-5">
                {Object.keys(editingApp.config).map((key) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {key.replace('_', ' ')}
                    </label>
                    <input 
                      type={key.includes('token') || key.includes('password') ? 'password' : 'text'}
                      placeholder={`请输入 ${key}...`}
                      value={formData[key] || ''} 
                      onChange={e => setFormData({...formData, [key]: e.target.value})} 
                      className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 弹窗 Footer */}
            <div className="bg-slate-800/20 px-6 py-4 border-t border-slate-800/80 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
                取消
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || !Object.values(formData).some(v => v !== '')} 
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : '保存并连接'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}