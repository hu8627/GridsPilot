import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Network, TerminalSquare, User, Bot, Loader2, Plus, Clock, ChevronRight, Activity, PlayCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 💡 1. 初始加载：从后端拉取历史会话
  useEffect(() => {
    fetch('http://localhost:8000/api/chats')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data.length > 0) {
          setSessions(data.data);
          setActiveSessionId(data.data[0].id);
        } else {
          // 如果没有历史记录，自动建一个空的
          handleNewChat();
        }
      });
  }, []);

  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  // 💡 2. 封装：同步单个会话到后端 FileDB
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
      messages: [{ id: 'm1', role: 'assistant', content: '新的工作区已就绪，请输入您的任务指令。' }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    syncSessionToDb(newSession); // 保存到库
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    
    // 更新状态并持久化
    const updateAndSave = (newMsg: ChatMessage, newTitle?: string) => {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === activeSessionId) {
            const updatedSession = { ...s, title: newTitle || s.title, messages: [...s.messages, newMsg] };
            syncSessionToDb(updatedSession); // 💡 同步到后端
            return updatedSession;
          }
          return s;
        });
        return updated;
      });
    };
    
    const newTitle = currentMessages.length <= 1 ? input.substring(0, 15) + '...' : undefined;
    updateAndSave(userMsg, newTitle);
    
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.type === 'COMPLEX_TASK') {
        updateAndSave({
          id: Date.now().toString(), role: 'assistant', content: data.message, isIntentMatched: true,
          matchedFlow: { id: data.flow_id, name: data.sop_data.sop_name, params: data.sop_data.extracted_params || {}, status: 'new_created' }
        });
      } else {
        updateAndSave({ id: Date.now().toString(), role: 'assistant', content: data.message });
      }
    } catch (err) {
      setIsTyping(false);
      updateAndSave({ id: Date.now().toString(), role: 'assistant', content: '❌ 抱歉，连接意图引擎失败，请检查后端服务。' });
    }
  };

  const handleExecuteFlow = (flowId: string) => {
    setCurrentView('studio');
    setActiveFlow(flowId);
    setTimeout(() => { useExecStore.getState().ws?.send(`START_TASK|${flowId}`); }, 500); 
  };

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden">
      {/* 1. 左侧：历史会话列表 */}
      <div className="w-64 bg-slate-950 border-r border-slate-800/60 flex flex-col z-10 shadow-xl">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> Recent Chats</h2>
          <button onClick={handleNewChat} className="text-blue-500 hover:text-blue-400 p-1 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors" title="New Chat">
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setActiveSessionId(s.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                s.id === activeSessionId 
                  ? 'bg-slate-900 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-300'
              }`}
            >
              <div className="text-xs font-bold truncate mb-1">{s.title}</div>
              <div className="text-[9px] text-slate-600 font-mono">{s.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 右侧：对话主窗口 */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400"><Sparkles size={20} /></div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">NexaFlow Copilot <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Intent Router</span></h1>
              <p className="text-xs text-slate-500 mt-0.5">对话级意图识别、SOP 动态生成与执行调度。</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-28 space-y-6">
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={`text-[13px] leading-relaxed p-4 rounded-2xl ${msg.role === 'user' ? 'bg-slate-700 text-slate-100 rounded-tr-sm' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm shadow-lg'}`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.includes('**') ? <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400">$1</strong>') }} /> : line}
                    </p>
                  ))}
                </div>

                {/* SOP 运行卡片 */}
                {msg.isIntentMatched && msg.matchedFlow && (
                  <div className="mt-4 w-full md:w-[450px] bg-slate-950 border border-blue-500/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.1)] group">
                    <div className={`px-4 py-2 border-b flex items-center justify-between ${msg.matchedFlow.status === 'new_created' ? 'bg-green-900/20 border-green-900/50' : 'bg-blue-900/20 border-blue-900/50'}`}>
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 ${msg.matchedFlow.status === 'new_created' ? 'text-green-400' : 'text-blue-400'}`}>
                        {msg.matchedFlow.status === 'new_created' ? <Sparkles size={12}/> : <Network size={12}/>}
                        {msg.matchedFlow.status === 'new_created' ? 'NEW SOP GENERATED' : 'SOP MATCHED'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-200 text-sm mb-3 flex items-center justify-between">
                        {msg.matchedFlow.name}
                        {msg.matchedFlow.status === 'new_created' && <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[9px] uppercase">已保存至库</span>}
                      </h3>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setCurrentView('studio'); setActiveFlow(msg.matchedFlow!.id); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-2 rounded flex items-center justify-center gap-1.5 border border-slate-700">
                          <Network size={14}/> 审阅流程画布
                        </button>
                        <button onClick={() => handleExecuteFlow(msg.matchedFlow!.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-1.5">
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
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-[0_0_15px_rgba(37,99,235,0.4)]"><Bot size={18} /></div>
              <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 w-max">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-[11px] text-slate-400 font-mono">Intent Router 正在解析并生成图纸...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* 输入区 */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 backdrop-blur-md">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="发送任务指令，唤起大模型自动生成 SOP..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl pl-4 pr-12 py-4 outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            <button onClick={handleSend} disabled={!input.trim() || isTyping} className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}