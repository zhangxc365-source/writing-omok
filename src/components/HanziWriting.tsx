import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WordEntry } from '../data/yct_data';
import { cn } from '../lib/utils';
import { RefreshCcw, CheckCircle2, XCircle, Eraser, Lightbulb } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import HanziWriter from 'hanzi-writer';

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
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
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
    <div className={cn("flex flex-col items-center gap-6 p-8 bg-white rounded-3xl shadow-2xl relative max-w-2xl w-full", className)}>
      <div className="text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
          {/* Main Cue (Pinyin) */}
          <h3 className="text-6xl sm:text-8xl font-black text-blue-600 tracking-widest drop-shadow-sm mb-2">
            {word.pinyin.toLowerCase()}
          </h3>

          {/* Context / Translation Section */}
          <div className="space-y-2">
            {!isReview ? (
              <>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Context:</p>
                <p className="text-2xl font-black text-slate-600 tracking-tighter">
                  {word.word.replace(word.char, '___')} <span className="text-slate-300 font-medium">({word.wordPinyin})</span>
                </p>
                <p className="text-slate-500 font-medium italic mt-1">
                  "{word.translation}"
                </p>
              </>
            ) : (
              <h4 className="text-4xl font-black text-slate-400 italic">
                "{word.translation}"
              </h4>
            )}
          </div>

          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] pt-4 opacity-50 flex flex-col items-center gap-1">
            <span>{isReview ? "Write the character for this pinyin" : "Draw the character"}</span>
            <span className="text-[9px] opacity-70">Ханзыг бичээрэй</span>
          </p>
        </div>
      </div>

      <div className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] border-8 border-slate-100 rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-inner group">
        {/* Hint Layer */}
        <div ref={hintRef} className="absolute inset-0 pointer-events-none opacity-60 [&>svg]:w-full [&>svg]:h-full" />
        
        {/* Drawing Layer */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 cursor-crosshair touch-none w-full h-full z-10"
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 font-bold text-blue-600">AI Scoring...</p>
          </div>
        )}

        {(apiError || (score !== null && score < 70)) && !isComplete && !isFailed && !isAnalyzing && (
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border-2 border-amber-200 z-[30] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <RefreshCcw size={32} className="animate-spin-slow" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              {apiError ? "AI Scoring Failed" : "Low Score Detected"}
            </h3>
            <p className="text-slate-500 text-sm font-bold mb-8 max-w-[200px] leading-relaxed text-center">
              {apiError 
                ? "AI scoring is unstable. Please self-confirm your work."
                : "AI gave a low score. If you are sure it is correct, self-confirm."}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleManualPass}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <span>It is Correct! / Би зөв бичсэн!</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              </button>
              <button 
                onClick={handleManualFail}
                className="w-full py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-400 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest"
              >
                {attempts < 2 ? "I'll Rewrite / Би дахиж бичье" : "It's Incorrect / Би буруу бичсэн"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={cn(
                "w-10 h-2 rounded-full transition-all",
                i < attempts ? "bg-red-500" : "bg-slate-200"
              )} 
            />
          ))}
        </div>
        <p className="text-base font-black text-slate-400 uppercase tracking-widest">
          Attempts: {attempts}/3
        </p>
      </div>

      <div className="flex gap-4 w-full">
        <button
          disabled={isAnalyzing || isComplete || isFailed}
          onClick={clearCanvas}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all disabled:opacity-50"
        >
          <RefreshCcw className="w-5 h-5" />
          Reset
        </button>
        <button
          disabled={isAnalyzing || isComplete || isFailed}
          onClick={handleSubmit}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? "..." : "Submit"}
        </button>
      </div>

      {score !== null && !apiError && (
        <div className={cn(
          "px-4 py-1 rounded-full font-bold text-sm",
          score >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          Score: {score}
        </div>
      )}

      {score !== null && score < 70 && !isFailed && !isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-600/10 rounded-3xl backdrop-blur-[2px] z-20 pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white/90 p-8 rounded-[2.5rem] shadow-2xl border-4 border-red-500 flex flex-col items-center gap-4 scale-90 sm:scale-100">
            <XCircle className="w-16 h-16 text-red-500 animate-bounce" />
            <div className="text-center">
              <span className="text-2xl font-black text-red-600 block">Try Again!</span>
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI Score: {score}</span>
            </div>
            <p className="text-slate-500 font-bold text-sm">Write it carefully</p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center gap-4 text-green-600">
            <CheckCircle2 className="w-24 h-24" />
            <span className="text-3xl font-black">Correct!</span>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center gap-4 text-red-600">
            <XCircle className="w-24 h-24" />
            <span className="text-3xl font-black">Failed!</span>
            <p className="text-slate-500">Turn skipped</p>
          </div>
        </div>
      )}
    </div>
  );
}
