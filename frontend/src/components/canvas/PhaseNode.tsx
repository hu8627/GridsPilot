import React from 'react';

export default function PhaseNode({ data }: any) {
  return (
    <div className="w-full h-full flex flex-col pointer-events-none">
      {/* 阶段头部 */}
      <div className="h-[40px] bg-slate-900/80 border border-slate-700/80 rounded-t-xl flex items-center px-4 gap-3 shrink-0 backdrop-blur-md shadow-lg pointer-events-auto">
        <div className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-500/30">
          {data.pill || 'PHASE'}
        </div>
        <div className="text-sm font-bold text-slate-200 tracking-wide">{data.label}</div>
      </div>
      
      {/* 垂直落下的虚线墙，贯穿所有的 Actor Row */}
      <div className="flex-1 w-full border-x border-dashed border-slate-700/30 bg-slate-900/5"></div>
    </div>
  );
}