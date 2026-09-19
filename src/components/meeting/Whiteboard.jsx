import React, { useRef, useEffect, useState, useCallback } from 'react';
import WhiteboardControls from './WhiteboardControls';

export default function Whiteboard({ socket, roomId, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState('draw'); // 'draw' or 'erase'
  
  // Ref state (avoids re-renders during active drawing)
  const isDrawing = useRef(false);
  const currentStrokeId = useRef(null);
  const currentPoints = useRef([]);
  const allStrokes = useRef([]); // The authoritative array of strokes
  
  // Throttling
  const lastEmitTime = useRef(0);
  const pendingEmitPoints = useRef([]);

  // Setup canvas resolution and resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      // Set actual size in memory (scaled for retina displays)
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      // Redraw everything after resize
      redrawCanvas();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw the entire canvas from the strokes array
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear board
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    
    // Set line styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    allStrokes.current.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.mode === 'erase' ? '#0f172a' : stroke.color; // #0f172a is slate-900 background
      ctx.lineWidth = stroke.size;
      
      if (stroke.mode === 'erase') {
         ctx.globalCompositeOperation = 'destination-out'; // Erase natively if background is transparent, but we want it to look erased against slate-900.
         // Actually, destination-out makes it transparent, revealing what's behind the canvas (which is our slate-900 overlay bg).
         ctx.globalCompositeOperation = 'destination-out';
      } else {
         ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleSync = ({ strokes }) => {
      allStrokes.current = strokes || [];
      redrawCanvas();
    };

    const handleDraw = (strokeData) => {
      // Find if stroke already exists (since we send it in batches)
      const existingStrokeIndex = allStrokes.current.findIndex(s => s.strokeId === strokeData.strokeId);
      
      if (existingStrokeIndex >= 0) {
        // Append new points to existing stroke
        allStrokes.current[existingStrokeIndex].points.push(...strokeData.points);
      } else {
        // New stroke from remote
        allStrokes.current.push(strokeData);
      }
      redrawCanvas();
    };

    const handleUndo = ({ strokeId }) => {
      allStrokes.current = allStrokes.current.filter(s => s.strokeId !== strokeId);
      redrawCanvas();
    };

    const handleClear = () => {
      allStrokes.current = [];
      redrawCanvas();
    };

    socket.on('whiteboard-sync', handleSync);
    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-undo', handleUndo);
    socket.on('whiteboard-clear', handleClear);

    return () => {
      socket.off('whiteboard-sync', handleSync);
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-undo', handleUndo);
      socket.off('whiteboard-clear', handleClear);
    };
  }, [socket, redrawCanvas]);

  // Drawing Helpers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const emitThrottledDraw = (forceEmit = false) => {
    if (pendingEmitPoints.current.length === 0) return;
    
    const now = Date.now();
    // Throttle to roughly 30ms (~33fps)
    if (forceEmit || now - lastEmitTime.current > 30) {
      if (socket) {
        socket.emit('whiteboard-draw', {
          roomId,
          strokeId: currentStrokeId.current,
          color,
          size: brushSize,
          mode,
          points: [...pendingEmitPoints.current]
        });
      }
      
      pendingEmitPoints.current = [];
      lastEmitTime.current = now;
    }
  };

  // Mouse/Touch Handlers
  const startDrawing = (e) => {
    // Only left click
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    
    isDrawing.current = true;
    currentStrokeId.current = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const coords = getCoordinates(e);
    const initialPoint = { x: coords.x, y: coords.y };
    
    currentPoints.current = [initialPoint];
    pendingEmitPoints.current = [initialPoint];
    
    // Add to local state immediately
    const newStroke = {
      strokeId: currentStrokeId.current,
      color,
      size: brushSize,
      mode,
      points: [initialPoint]
    };
    allStrokes.current.push(newStroke);
    
    redrawCanvas();
    emitThrottledDraw(true);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    const newPoint = { x: coords.x, y: coords.y };
    
    // Update local state
    const currentStroke = allStrokes.current[allStrokes.current.length - 1];
    if (currentStroke && currentStroke.strokeId === currentStrokeId.current) {
      currentStroke.points.push(newPoint);
      
      // We don't redraw the whole canvas on every mouse move for performance.
      // Instead, just draw the new line segment on the active canvas context.
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.mode === 'erase' ? '#0f172a' : currentStroke.color;
      ctx.lineWidth = currentStroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (currentStroke.mode === 'erase') {
         ctx.globalCompositeOperation = 'destination-out';
      } else {
         ctx.globalCompositeOperation = 'source-over';
      }

      // Draw from previous point to new point
      const prevPoint = currentStroke.points[currentStroke.points.length - 2];
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(newPoint.x, newPoint.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // Queue for emission
    pendingEmitPoints.current.push(newPoint);
    emitThrottledDraw();
  };

  const stopDrawing = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    
    isDrawing.current = false;
    // Flush any remaining points
    emitThrottledDraw(true);
  };

  // Actions
  const handleUndo = () => {
    if (!socket) return;
    socket.emit('whiteboard-undo', { roomId });
  };

  const handleClear = () => {
    if (!socket) return;
    socket.emit('whiteboard-clear', { roomId });
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />
      
      <WhiteboardControls
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        mode={mode}
        setMode={setMode}
        onUndo={handleUndo}
        onClear={handleClear}
        onClose={onClose}
      />
    </div>
  );
}
