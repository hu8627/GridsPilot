import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Network, TerminalSquare, User, Bot, Loader2, Plus, Clock, ChevronRight, Activity, PlayCircle, MoreVertical, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
  isIntentMatched?: boolean;
  matchedFlow?: { id: string; name: string; params: Record<string, string>; status: 'new_created' | 'existing' };
}

interface ChatSession {
  id: string;
  title: string;
  time: string;
  messages: ChatMessage[];
}

export default function ChatCopilot() {
  const { setCurrentView, setActiveFlow } = useUIStore();
  const { startTask } = useExecStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // 💡 状态管理：私有会话列表
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 初始化拉取后端 Chats (私聊记录)
  useEffect(() => {
    fetch('http://localhost:8000/api/chats')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data.length > 0) {
          setSessions(data.data);
          setActiveSessionId(data.data[0].id);
        } else {
          handleNewChat(); // 如果是空的，自动建一个
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("加载 Copilot 历史失败", err);
        setLoading(false);
      });
  }, []);

  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  // 2. 同步单个会话到后端 FileDB
  const syncSessionToDb = async (sessionData: ChatSession) => {
    await fetch('http://localhost:8000/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [{ id: `m_${Date.now()}`, role: 'assistant', content: '您好，我是您的私人 Copilot 中枢。请问需要执行什么任务？' }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    syncSessionToDb(newSession); 
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
    // 真实生产中这里应该调后端的 DELETE 接口，由于我们目前只有覆盖保存 API，这里仅做前端演示
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMsg: ChatMessage = { id: `m_${Date.now()}`, role: 'user', content: input };
    
    // 更新状态并持久化
    const updateAndSave = (newMsg: ChatMessage, newTitle?: string) => {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === activeSessionId) {
            const updatedSession = { ...s, title: newTitle || s.title, messages: [...s.messages, newMsg] };
            syncSessionToDb(updatedSession);
            return updatedSession;
          }
          return s;
        });
        return updated;
      });
    };
    
    // 如果是首句对话，智能重命名标题
    const newTitle = currentMessages.length <= 2 ? input.substring(0, 15) + '...' : undefined;
    updateAndSave(userMsg, newTitle);
    
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.type === 'COMPLEX_TASK') {
        updateAndSave({
          id: `m_${Date.now()}`, role: 'assistant', content: data.message, isIntentMatched: true,
          matchedFlow: { id: data.flow_id, name: data.sop_data.sop_name, params: data.sop_data.extracted_params || {}, status: 'new_created' }
        });
      } else {
        updateAndSave({ id: `m_${Date.now()}`, role: 'assistant', content: data.message });
      }
    } catch (err) {
      setIsTyping(false);
      updateAndSave({ id: `m_${Date.now()}`, role: 'assistant', content: '❌ 抱歉，连接 Intent Router 引擎失败。' });
    }
  };

  const handleExecuteFlow = (flowId: string) => {
    setCurrentView('studio');
    setActiveFlow(flowId);
    setTimeout(() => { useExecStore.getState().ws?.send(`START_TASK|${flowId}`); }, 500); 
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center bg-[#0B0F19] text-slate-500"><Loader2 className="animate-spin mb-4" size={32} /></div>;

  return (
    <div className="flex h-full w-full bg-[#0B0F19] overflow-hidden text-slate-200 select-none">
      
      {/* ================================================================= */}
      {/* 1. 左侧：私有会话列表 (Private Sessions) 对齐 Workspace 结构 */}
      {/* ================================================================= */}
      <div className="w-64 bg-[#0E121B] border-r border-slate-800/60 flex flex-col z-10 shrink-0 shadow-xl">
        
        {/* Header */}
        <div className="h-14 border-b border-slate-800/60 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-2 truncate">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]">C</div>
            My Copilot
          </div>
          <MoreVertical size={16} className="text-slate-500" />
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
          <div>
            <div className="px-4 flex items-center justify-between mb-3 group">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12}/> Recent Chats
              </span>
              <button onClick={handleNewChat} className="text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 p-1 rounded" title="New Session">
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-0.5 px-2">
              {sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSessionId(s.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group ${
                    s.id === activeSessionId 
                      ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                      : 'bg-transparent border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate mb-1">{s.title}</div>
                    <div className="text-[9px] text-slate-600 font-mono truncate">{s.time}</div>
                  </div>
                  {/* Hover 时显示删除按钮 */}
                  <button 
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className={`text-slate-500 hover:text-red-400 transition-opacity p-1.5 rounded-md hover:bg-slate-800/80 ${s.id === activeSessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部状态 */}
        <div className="p-4 border-t border-slate-800/60 bg-black">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={12}/> Router Engine</div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Zero-Shot SOP Gen:</span>
            <span className="text-green-500 font-mono">Online</span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. 右侧：对话主窗口 (Main Chat Area) */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col relative bg-slate-900">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-slate-800/60 px-6 flex items-center justify-between bg-slate-950/30 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Intent Router <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider">System Core</span>
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">对话级意图识别、SOP 动态生成与执行调度。</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {currentMessages.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">这是一个全新的会话。</div>}
          
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-slate-800 text-slate-300' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={20} />}
              </div>

              <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-baseline gap-2 mb-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="font-bold text-sm text-slate-200">{msg.role === 'user' ? 'Admin' : 'Copilot'}</span>
                  <span className="text-[10px] text-slate-500">{msg.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div className={`text-[13px] leading-relaxed p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-[#0E121B] border border-slate-700/80 text-slate-300 rounded-tl-sm shadow-lg'}`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.includes('**') ? <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400">$1</strong>') }} /> : line}
                    </p>
                  ))}
                </div>

                {/* 💡 SOP 运行卡片 */}
                {msg.isIntentMatched && msg.matchedFlow && (
                  <div className="mt-4 w-full md:w-[450px] bg-[#050505] border border-blue-500/30 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(37,99,235,0.1)] group-hover:border-blue-500/50 transition-colors">
                    <div className={`px-4 py-2.5 border-b flex items-center justify-between ${msg.matchedFlow.status === 'new_created' ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-blue-900/20 border-blue-900/50'}`}>
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 ${msg.matchedFlow.status === 'new_created' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {msg.matchedFlow.status === 'new_created' ? <Sparkles size={12}/> : <Network size={12}/>}
                        {msg.matchedFlow.status === 'new_created' ? 'NEW SOP GENERATED' : 'SOP MATCHED'}
                        <span className="text-slate-500 font-mono ml-1 opacity-70">({msg.matchedFlow.id})</span>
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center justify-between">
                        {msg.matchedFlow.name}
                      </h3>
                      
                      <div className="bg-[#0E121B] rounded-lg border border-slate-800/80 p-3 mb-5 space-y-2 shadow-inner">
                        <div className="text-[9px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">Context Variables</div>
                        {Object.entries(msg.matchedFlow.params).length > 0 ? Object.entries(msg.matchedFlow.params).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center text-[11px] font-mono border-b border-slate-800/50 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-slate-500">{k}:</span>
                            <span className="text-blue-400">"{v}"</span>
                          </div>
                        )) : <div className="text-[10px] text-slate-600 font-mono italic">No parameters extracted.</div>}
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => { setCurrentView('studio'); setActiveFlow(msg.matchedFlow!.id); }} className="flex-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm">
                          <Network size={14}/> 审阅流程画布
                        </button>
                        <button onClick={() => handleExecuteFlow(msg.matchedFlow!.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                          <PlayCircle size={14}/> 载入大屏执行
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 px-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-[0_0_15px_rgba(37,99,235,0.4)]"><Bot size={20} /></div>
              <div className="bg-[#0E121B] border border-slate-700/80 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5 w-max shadow-lg">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-[11px] text-slate-400 font-mono">Intent Router 正在解析上下文...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 pt-0 bg-slate-900 shrink-0">
          <div className="bg-[#0E121B] border border-slate-700/80 focus-within:border-blue-500 rounded-xl overflow-hidden transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="发送任务指令，唤起大模型自动检索或生成 SOP..."
              className="w-full bg-transparent text-slate-200 text-sm p-4 outline-none resize-none max-h-32 min-h-[60px]"
            />
            <div className="bg-[#050505] px-3 py-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] ml-2">
                <Sparkles size={12} className="text-blue-500/50" /> Press <kbd className="mx-1 px-1 bg-slate-800 rounded">Enter</kbd> to dispatch intent
              </div>
              <button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-1.5 rounded-lg transition-all shadow-md">
                <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}