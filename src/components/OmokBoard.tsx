import React from 'react';
import { Board, Player } from '../hooks/useOmok';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface OmokBoardProps {
  board: Board;
  onCellClick: (r: number, c: number) => void;
  currentPlayer: 'red' | 'blue';
  lastMove?: { r: number; c: number } | null;
  disabled?: boolean;
  winningLine?: { r: number; c: number }[] | null;
}

export function OmokBoard({ board, onCellClick, currentPlayer, lastMove, disabled, winningLine }: OmokBoardProps) {
  const size = board.length;

  return (
    <div className="relative p-2 sm:p-4 bg-[#e6c9a8] rounded-xl shadow-2xl border-4 sm:border-8 border-[#8b5e3c] overflow-auto no-scrollbar">
      {/* Grid Lines */}
      <div 
        className="grid relative" 
        style={{ 
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          width: 'min(90vw, 700px)',
          height: 'min(90vw, 700px)',
        }}
      >
        {/* Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: size }).map((_, r) => (
            <div key={`hr-${r}`} className="absolute w-full h-[1px] bg-[#8b5e3c]/30" style={{ top: `${(r + 0.5) * (100 / size)}%` }} />
          ))}
          {Array.from({ length: size }).map((_, c) => (
            <div key={`vr-${c}`} className="absolute w-[1px] h-full bg-[#8b5e3c]/30" style={{ left: `${(c + 0.5) * (100 / size)}%` }} />
          ))}
        </div>

        {board.map((row, r) => 
          row.map((cell, c) => {
            const isWinningPiece = winningLine?.some(p => p.r === r && p.c === c);
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => !disabled && onCellClick(r, c)}
                className={cn(
                  "relative flex items-center justify-center cursor-pointer group",
                  disabled && "cursor-not-allowed"
                )}
              >
                {/* Hover Preview */}
                {!cell && !disabled && (
                  <div className={cn(
                    "w-3/4 h-3/4 rounded-full opacity-0 group-hover:opacity-30 transition-opacity",
                    currentPlayer === 'red' ? "bg-slate-900" : "bg-slate-200"
                  )} />
                )}

                {/* Actual Piece */}
                {cell && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      ...(isWinningPiece ? {
                        boxShadow: [
                          "0 0 0px 0px rgba(255,215,0,0)",
                          "0 0 20px 10px rgba(255,215,0,0.8)",
                          "0 0 0px 0px rgba(255,215,0,0)"
                        ]
                      } : {})
                    }}
                    transition={isWinningPiece ? {
                      boxShadow: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    } : {}}
                    className={cn(
                      "w-[85%] h-[85%] rounded-full shadow-lg z-10 relative flex items-center justify-center",
                      cell === 'red' 
                      ? "bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600" 
                      : cell === 'blue' 
                      ? "bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-300"
                      : "bg-slate-200 border-2 border-slate-300 shadow-none grayscale",
                      isWinningPiece && "border-2 border-yellow-400"
                    )}
                  >
                    {cell === 'blocked' && <X className="w-1/2 h-1/2 text-slate-400" />}
                    {isWinningPiece && (
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-yellow-400/20 blur-sm"
                      />
                    )}
                    {lastMove?.r === r && lastMove?.c === c && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1/4 h-1/4 bg-white/40 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Board Markings */}
      {[3, 9, 15].map(r => 
        [3, 9, 15].map(c => (
          <div 
            key={`star-${r}-${c}`}
            className="absolute w-1.5 h-1.5 bg-[#8b5e3c] rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((c + 0.5) / size) * 100}%`,
              top: `${((r + 0.5) / size) * 100}%`,
              margin: '0.5rem 1rem' 
            }}
          />
        ))
      )}
    </div>
  );
}
