import React, { useState, useEffect } from 'react';
import { Cpu, Plus, CheckCircle2, AlertCircle, Loader2, X, ChevronDown, Settings2 } from 'lucide-react';

// 💡 内置全球顶级模型字典库
const PRESET_MODELS = {
  OpenAI: [
    { id: 'gpt-4o', name: 'GPT-4 Omni', type: 'LLM & Vision' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'LLM' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'LLM' },
  ],
  Anthropic: [
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', type: 'LLM & Vision' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'LLM' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'LLM' },
  ],
  DeepSeek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3', type: 'LLM' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', type: 'LLM (Reasoning)' },
  ],
  Aliyun: [
    { id: 'qwen-max', name: 'Qwen Max (通义千问)', type: 'LLM' },
    { id: 'qwen-vl-max', name: 'Qwen VL (视觉版)', type: 'LLM & Vision' },
    { id: 'qwen-long', name: 'Qwen Long (长文本)', type: 'LLM' },
  ],
  Moonshot: [
    { id: 'moonshot-v1-8k', name: 'Kimi (8K)', type: 'LLM' },
    { id: 'moonshot-v1-32k', name: 'Kimi (32K)', type: 'LLM' },
    { id: 'moonshot-v1-128k', name: 'Kimi (128K)', type: 'LLM' },
  ],
  Google: [
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', type: 'LLM & Vision' },
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', type: 'LLM & Vision' },
  ]
};

export default function ModelHub() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newModel, setNewModel] = useState({ id: '', name: '', provider: 'OpenAI', type: 'LLM', api_key: '' });

  const fetchModels = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/models')
      .then(res => res.json())
      .then(data => { setModels(data.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchModels(); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    // 默认选中第一个预设
    const defaultProvider = 'OpenAI';
    const defaultPreset = PRESET_MODELS[defaultProvider][0];
    setNewModel({ 
      id: defaultPreset.id, 
      name: defaultPreset.name, 
      provider: defaultProvider, 
      type: defaultPreset.type, 
      api_key: '' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (model: any) => {
    setIsEditing(true);
    setNewModel({ id: model.id, name: model.name, provider: model.provider, type: model.type, api_key: '' });
    setIsModalOpen(true);
  };

  // 💡 当用户在表单里切换厂商 (Provider) 时，自动联动填入它家最强模型的参数
  const handleProviderChange = (provider: string) => {
    if (provider === 'Custom') {
      setNewModel({ ...newModel, provider, id: '', name: '', type: 'LLM' });
    } else {
      const presets = PRESET_MODELS[provider as keyof typeof PRESET_MODELS];
      if (presets && presets.length > 0) {
        setNewModel({ ...newModel, provider, id: presets[0].id, name: presets[0].name, type: presets[0].type });
      }
    }
  };

  // 💡 当用户切换具体模型型号时，自动填入参数
  const handleModelSelectionChange = (presetId: string) => {
    if (newModel.provider === 'Custom') return;
    const presets = PRESET_MODELS[newModel.provider as keyof typeof PRESET_MODELS];
    const selected = presets.find(p => p.id === presetId);
    if (selected) {
      setNewModel({ ...newModel, id: selected.id, name: selected.name, type: selected.type });
    }
  };

  const handleSaveModel = async () => {
    setSaving(true);
    try {
      await fetch('http://localhost:8000/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      setIsModalOpen(false);
      fetchModels();
    } catch (err) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200 relative w-full">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="text-blue-500" /> Model Hub</h1>
          <p className="text-xs text-slate-500 mt-1.5">配置底层大模型参数，赋予 Agent 不同的思考能力。支持全局所有主流厂商。</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          <Plus size={14} /> 接入新模型
        </button>
      </div>

      {/* Cards Area */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在读取系统资产库...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {models.map((m) => (
            <div key={m.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-5 pl-2">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 font-black text-lg shadow-inner">
                  {m.provider.charAt(0)}
                </div>
                {m.status === 'active' ? (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-900/50"><CheckCircle2 size={12}/> Connected</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] text-orange-400 bg-orange-950/30 px-2.5 py-1 rounded-full border border-orange-900/50"><AlertCircle size={12}/> Missing Key</span>
                )}
              </div>
              
              <div className="pl-2">
                <h3 className="font-bold text-base text-slate-100 mb-1">{m.name}</h3>
                <p className="text-[11px] text-slate-500 mb-4 font-mono">{m.provider} · {m.type}</p>
                
                <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-slate-800/80 mb-6 font-mono text-[10px] flex items-center">
                  <span className="text-slate-600 w-12">Key:</span> 
                  {m.api_key_masked ? <span className="text-slate-300">{m.api_key_masked}</span> : <span className="text-orange-500/70 italic">未配置，模型不可用</span>}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleOpenEdit(m)}
                    className="flex-1 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-[11px] font-bold py-2 rounded-lg transition-colors text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Settings2 size={14}/> 更新授权 Key
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 💡 全新升级的“保姆级”弹窗表单 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-[460px] shadow-2xl flex flex-col overflow-hidden">
            
            <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-blue-500"/>
                {isEditing ? '更新模型 API Key' : '接入新模型'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md transition-colors"><X size={16}/></button>
            </div>
            
            <div className="p-6 space-y-5">
              
              {/* 厂商选择 (下拉) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">模型大厂 (Provider)</label>
                <div className="relative">
                  <select 
                    disabled={isEditing} 
                    value={newModel.provider} 
                    onChange={e => handleProviderChange(e.target.value)} 
                    className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 appearance-none disabled:opacity-50"
                  >
                    {Object.keys(PRESET_MODELS).map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="Custom">自定义 (Custom)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* 型号选择 / 自定义输入 */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">具体型号 (Model ID)</label>
                {newModel.provider === 'Custom' || isEditing ? (
                  <input 
                    type="text" disabled={isEditing} placeholder="如: local-llama-3" 
                    value={newModel.id} onChange={e => setNewModel({...newModel, id: e.target.value, name: e.target.value})} 
                    className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" 
                  />
                ) : (
                  <div className="relative">
                    <select 
                      value={newModel.id} 
                      onChange={e => handleModelSelectionChange(e.target.value)} 
                      className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 appearance-none"
                    >
                      {PRESET_MODELS[newModel.provider as keyof typeof PRESET_MODELS]?.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">API Key (鉴权凭证)</label>
                <input 
                  type="password" 
                  placeholder={isEditing ? "请输入新的 API Key" : "sk-..."}
                  value={newModel.api_key} 
                  onChange={e => setNewModel({...newModel, api_key: e.target.value})} 
                  className="w-full bg-[#0a0a0a] border border-blue-500/50 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono shadow-[0_0_10px_rgba(37,99,235,0.1)]" 
                />
                <div className="text-[9px] text-slate-500 mt-2">
                  Key 将被加密存储于您本地的 <code>~/.nexaflow/data/nexaflow.db</code> 数据库中，绝对不会上传云端。
                </div>
              </div>

            </div>

            <div className="bg-slate-800/20 px-6 py-4 border-t border-slate-800/80 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">取消</button>
              <button 
                onClick={handleSaveModel} 
                disabled={saving || !newModel.id || !newModel.api_key} 
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