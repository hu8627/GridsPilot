import React from 'react';

export default function RowNode({ data }: any) {
  return (
    <div 
      className={`relative border-t-2 border-dashed border-slate-700/60 ${data.color} overflow-visible`} // 💡 改为 border-t 且 overflow-visible
      style={{ width: '6000px', height: '100%', pointerEvents: 'none' }}
    >
      {/* 极细的光泽扫描线，增加极客感 */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500/20 to-transparent"></div>
      
      {/* 
        💡 绝杀修改：将标签强行“推出”左侧 200px！
        同时加上一个固定的 top: -14px，让它完美骑在横向的虚线上！
        它现在不再是画布里的一团字，而是一个真正的“Y 轴刻度标签”
      */}
      <div 
        className="absolute h-max w-max"
        style={{ left: '-180px', top: '-16px', pointerEvents: 'auto' }}
      >
        <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-[#0B0F19]/90 backdrop-blur-md border border-slate-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-2 uppercase ${data.textColor || 'text-slate-400'}`}>
          {data.label}
        </span>
      </div>
      
    </div>
  );
}