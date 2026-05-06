import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WordEntry } from '../data/yct_data';
import { cn } from '../lib/utils';
import { RefreshCcw, CheckCircle2, XCircle, Eraser, Lightbulb, RotateCcw, Play } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import HanziWriter from 'hanzi-writer';
import { motion, AnimatePresence } from 'framer-motion';

interface HanziWritingProps {
  word: WordEntry;
  onComplete: (success: boolean, score?: number) => void;
  className?: string;
  showHint?: boolean;
  isReview?: boolean;
}

export function HanziWriting({ word, onComplete, className, showHint, isReview }: HanziWritingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [apiError, setApiError] = useState(false);
  const [isMissingKey, setIsMissingKey] = useState(false);

  // Analysis Timeout Handler
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAnalyzing) {
      timeout = setTimeout(() => {
        if (isAnalyzing) {
          setApiError(true);
          setIsAnalyzing(false);
        }
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timeout);
  }, [isAnalyzing]);

  // Initialize HanziWriter for hints
  useEffect(() => {
    if (!hintRef.current) return;
    hintRef.current.innerHTML = '';
    
    if (showHint) {
      const size = hintRef.current.clientWidth || 500;
      const writer = HanziWriter.create(hintRef.current, word.char, {
        width: size,
        height: size,
        padding: size * 0.15, // 15% padding to fit grid perfectly
        showOutline: true,
        showCharacter: false,
        strokeColor: '#94a3b8', // slate-400
        outlineColor: '#cbd5e1', // slate-300
      });
      writerRef.current = writer;
    }
  }, [word.char, showHint]);

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;

      // Draw 田字格
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.moveTo(canvas.width, 0);
      ctx.lineTo(0, canvas.height);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 40;
    };

    drawGrid();
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (score !== null) setScore(null);
    if (apiError) setApiError(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX) * scaleX;
    const y = (('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX) * scaleX;
    const y = (('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw grid
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 40;
    
    setScore(null);
  };

  const handleSubmit = async () => {
    if (isAnalyzing || isComplete || isFailed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsAnalyzing(true);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_")) {
        setIsMissingKey(true);
        setIsAnalyzing(false);
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      const client = new GoogleGenAI({ apiKey });
      
      const prompt = `You are a Chinese handwriting AI teacher. 
      Analyze the handwritten character in the provided image.
      The target character is "${word.char}".
      Rate the handwriting quality and accuracy from 0 to 100.
      Respond ONLY with the numerical score. If it's very messy or wrong, give < 70. If it looks like the character, give > 70.
      Only return the number.`;
      
      const result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "image/png",
                },
              },
            ],
          },
        ],
      });
      
      const responseText = result.text?.trim() || "0";
      const aiScore = parseInt(responseText) || 0;
      setScore(aiScore);
      
      if (aiScore >= 70) {
        setIsComplete(true);
        setTimeout(() => onComplete(true, aiScore), 1000);
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          setIsFailed(true);
          setTimeout(() => onComplete(false, aiScore), 1500);
        } else {
          // Allow retry
          setTimeout(() => setIsAnalyzing(false), 1000);
        }
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setApiError(true);
      setIsAnalyzing(false);
    }
  };

  const handleManualPass = () => {
    setIsComplete(true);
    setScore(85);
    onComplete(true, 85);
  };

  const handleManualFail = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      setIsFailed(true);
      setScore(40);
      onComplete(false, 40);
    } else {
      // Clear for rewrite
      clearCanvas();
      setScore(null);
      setApiError(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-between p-4 sm:p-8 bg-white rounded-3xl shadow-2xl relative w-full",
      "h-[92dvh] max-h-[850px] max-w-2xl mx-auto overflow-hidden",
      className
    )}>
      {/* 1. Top Section - Context & Info */}
      <div className="text-center w-full shrink-0">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <h3 className="text-4xl sm:text-6xl font-black text-blue-600 tracking-tight leading-none mb-1">
            {word.pinyin.toLowerCase()}
          </h3>
          
          <div className="flex flex-col items-center gap-0 sm:gap-1">
            {!isReview ? (
              <p className="text-lg sm:text-2xl font-black text-slate-600 tracking-tighter">
                {word.word.replace(word.char, '___')} <span className="text-slate-300 font-medium text-sm sm:text-base">({word.wordPinyin})</span>
              </p>
            ) : (
              <h4 className="text-xl sm:text-3xl font-black text-slate-400 italic">
                "{word.translation}"
              </h4>
            )}
            <p className="text-slate-500 font-bold text-xs sm:text-sm italic line-clamp-1">
              "{word.translation}"
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Section - Writing Square */}
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 relative py-2">
        <div 
          className="relative aspect-square w-full h-auto max-h-full bg-slate-50 rounded-[2rem] border-4 border-slate-100 shadow-inner overflow-hidden"
          style={{ width: 'min(100%, 500px, calc(92dvh - 300px))' }}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-red-400" />
            <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-red-400" />
            <div className="absolute inset-0 border-2 border-dotted border-red-400 m-6 rounded-lg" />
          </div>

          {/* HanziWriter Hint Layer */}
          <div ref={hintRef} className="absolute inset-0 pointer-events-none opacity-60 [&>svg]:w-full [&>svg]:h-full z-0" />
          
          {/* Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={1000}
            height={1000}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-10"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Analyzing Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 font-black text-blue-600 uppercase tracking-widest text-[10px]">AI Scoring...</p>
            </div>
          )}

          {/* Status Modal inside square */}
          {(apiError || (score !== null && score < 70) || isMissingKey) && !isComplete && !isFailed && !isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md p-4 sm:p-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
               <RefreshCcw size={32} className={cn("text-amber-500 mb-3", isMissingKey ? "" : "animate-spin-slow")} />
               <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">
                {isMissingKey ? "Key Required" : apiError ? "AI Error" : "Low Score"}
              </h3>
              <p className="text-slate-500 text-[10px] font-bold mb-4 text-center leading-tight max-w-[200px]">
                {isMissingKey ? "Set GEMINI_API_KEY in Settings" : apiError ? "AI failed. Self-confirm?" : "Low score. Self-confirm?"}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[180px]">
                {isMissingKey ? (
                  <>
                    <button 
                      onClick={handleManualPass} 
                      className="w-full py-3 bg-amber-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                    >
                      Manual: Correct / Зөв
                    </button>
                    <button 
                      onClick={handleManualFail} 
                      className="w-full py-2 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl text-[9px] uppercase tracking-widest transition-all"
                    >
                      Manual: Incorrect / Буруу
                    </button>
                    <button 
                      onClick={() => setIsMissingKey(false)} 
                      className="w-full py-1 text-slate-300 text-[8px] uppercase font-bold hover:text-slate-400 transition-colors"
                    >
                      Back to Drawing
                    </button>
                    <p className="text-[8px] text-slate-400 text-center mt-1">API Key Missing. Please self-confirm.</p>
                  </>
                ) : (
                  <>
                    <button onClick={handleManualPass} className="w-full py-3 bg-amber-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all">It's Correct!</button>
                    <button onClick={handleManualFail} className="w-full py-2 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl text-[9px] uppercase tracking-widest transition-all">Rewrite</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Attempt Count below square - using relative sizing */}
        <div className="mt-2 sm:mt-4 flex flex-col items-center gap-1 sm:gap-2 w-full shrink-0">
          <div className="flex gap-1.5 sm:gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("w-6 sm:w-10 h-1 sm:h-1.5 rounded-full transition-all", i < attempts ? "bg-red-500" : "bg-slate-100")} />
            ))}
          </div>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attempts: {attempts}/3</p>
        </div>
      </div>

      {/* 3. Bottom Section - Buttons */}
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 shrink-0 mt-4 sm:mt-6">
        <button
          disabled={isAnalyzing || isComplete || isFailed}
          onClick={clearCanvas}
          className="px-6 py-4 sm:py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          disabled={isAnalyzing || isComplete || isFailed}
          onClick={handleSubmit}
          className="px-6 py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isAnalyzing ? "Checking..." : "Submit AI"}
          <Play size={16} className="fill-current" />
        </button>
      </div>

      {/* Global State Overlays */}
      <AnimatePresence>
        {isComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-[100] animate-in zoom-in duration-300 rounded-3xl">
            <div className="flex flex-col items-center gap-4 text-green-600">
              <CheckCircle2 className="w-20 h-20" />
              <span className="text-3xl font-black uppercase tracking-tighter">Correct!</span>
            </div>
          </motion.div>
        )}
        
        {isFailed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-[100] animate-in zoom-in duration-300 rounded-3xl">
            <div className="flex flex-col items-center gap-4 text-red-600">
              <XCircle className="w-20 h-20" />
              <span className="text-3xl font-black uppercase tracking-tighter">Failed!</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Turn Skipped</p>
            </div>
          </motion.div>
        )}

        {score !== null && score < 70 && !isFailed && !isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-red-600/10 backdrop-blur-[2px] z-[90] pointer-events-none rounded-3xl">
            <div className="bg-white/95 p-8 rounded-[2.5rem] shadow-2xl border-4 border-red-500 flex flex-col items-center gap-4 scale-90 sm:scale-100">
              <XCircle className="w-16 h-16 text-red-500 animate-bounce" />
              <div className="text-center">
                <span className="text-2xl font-black text-red-600 block">Try Again!</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI Score: {score}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
