import React from 'react';
import { Pen, Eraser, Undo, RotateCcw, Trash2, X } from 'lucide-react';
import Button from '../common/Button';

export default function WhiteboardControls({
  color,
  setColor,
  brushSize,
  setBrushSize,
  mode,
  setMode,
  onUndo,
  onClear,
  onClose,
}) {
  const colors = [
    '#ffffff', // White
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
  ];

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-2xl shadow-black/50 z-50">
      
      {/* Tools */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => setMode('draw')}
          className={`p-2 rounded-lg transition-colors ${mode === 'draw' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          title="Pen (Draw)"
        >
          <Pen className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMode('erase')}
          className={`p-2 rounded-lg transition-colors ${mode === 'erase' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          title="Eraser"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      <div className="w-px h-8 bg-slate-700/80 mx-1"></div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 px-1">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              if (mode === 'erase') setMode('draw');
            }}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && mode === 'draw' ? 'border-white scale-110 shadow-sm shadow-white/20' : 'border-transparent hover:scale-110'}`}
            style={{ backgroundColor: c }}
            title={`Color ${c}`}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-slate-700/80 mx-1"></div>

      {/* Size Slider */}
      <div className="flex items-center px-2 min-w-[80px]">
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          title="Brush Size"
        />
      </div>

      <div className="w-px h-8 bg-slate-700/80 mx-1"></div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Undo last stroke"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={onClear}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Clear Board"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="w-px h-8 bg-slate-700/80 mx-1"></div>
      
      {/* Close */}
      <button
        onClick={onClose}
        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
        title="Close Whiteboard"
      >
        <X className="w-5 h-5" />
      </button>

    </div>
  );
}
