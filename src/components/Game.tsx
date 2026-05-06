import React, { useState, useEffect, useMemo } from 'react';
import { useOmok, Player } from '../hooks/useOmok';
import { OmokBoard } from './OmokBoard';
import { HanziWriting } from './HanziWriting';
import { YCT_DATA, WordEntry } from '../data/yct_data';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Users, Cpu, RotateCcw, BookOpen, ChevronRight, 
  HelpCircle, Info, Pause, Play, Home, Check, X,
  Zap, Snowflake, SkipForward, ArrowRight, Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';

type GameMode = 'AI' | 'PK';
type GameState = 'START' | 'INTRO' | 'SELECTION' | 'PREPARE' | 'PLAYING' | 'WRITING' | 'WIN';

interface PlayerStats {
  score: number;
  accuracy: number[]; // Scores for each writing
  items: {
    hint: number;
    skip: number;
  };
  earnedItems: {
    hint: number;
    skip: number;
  };
  usedChallengeChars: string[];
}

type QuizType = 'HINT' | 'SKIP';

export function Game() {
  const { board, currentPlayer, winner, placePiece, skipTurn, resetGame, history, BOARD_SIZE, winningLine } = useOmok();
  
  const [gameState, setGameState] = useState<GameState>('START');
  const [instructionLang, setInstructionLang] = useState<'EN' | 'MN'>('EN');
  const [showFailedTurn, setShowFailedTurn] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('PK');
  const [selectedLevel, setSelectedLevel] = useState('yct1');
  const [selectedLesson, setSelectedLesson] = useState(1);
  
  const [pendingMove, setPendingMove] = useState<{ r: number; c: number } | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<WordEntry | null>(null);
  
  const [stats, setStats] = useState<Record<'red' | 'blue', PlayerStats>>({
    red: { score: 0, accuracy: [], items: { hint: 0, skip: 0 }, earnedItems: { hint: 0, skip: 0 }, usedChallengeChars: [] },
    blue: { score: 0, accuracy: [], items: { hint: 0, skip: 0 }, earnedItems: { hint: 0, skip: 0 }, usedChallengeChars: [] },
  });

  const [quizState, setQuizState] = useState<{
    active: boolean;
    type: QuizType | null;
    target: WordEntry | null;
    options: string[];
  }>({
    active: false,
    type: null,
    target: null,
    options: []
  });

  const [activeItems, setActiveItems] = useState({
    hint: false
  });

  const isReviewLesson = useMemo(() => {
    const maxLesson = ['yct1', 'yct2', 'yct3', 'yct4'].includes(selectedLevel) ? 12 : 15;
    return selectedLesson === maxLesson;
  }, [selectedLevel, selectedLesson]);

  const processedYCTData = useMemo(() => {
    // Group by level and lesson
    const groups: Record<string, WordEntry[]> = {};
    YCT_DATA.forEach(w => {
      const key = `${w.level}-${w.lesson}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...w, isChallenge: false });
    });

    // For each group, find top 2 characters with max strokeCount to be the challenge characters
    Object.values(groups).forEach(lessonWords => {
      if (lessonWords.length === 0) return;
      
      // Sort by strokeCount descending
      const sorted = [...lessonWords].sort((a, b) => b.strokeCount - a.strokeCount);
      
      // Mark top 2 as challenge characters (if they exist)
      if (sorted[0]) sorted[0].isChallenge = true;
      if (sorted[1]) sorted[1].isChallenge = true;
    });

    return Object.values(groups).flat();
  }, []);

  const lessonWordsOnly = useMemo(() => {
    const lessonStr = `Lesson${selectedLesson}`;
    const allInLevel = processedYCTData.filter(w => w.level === selectedLevel);
    return allInLevel.filter(w => w.lesson === lessonStr);
  }, [selectedLevel, selectedLesson, processedYCTData]);

  const challengeCharacter = useMemo(() => {
    return lessonWordsOnly.find(w => w.isChallenge);
  }, [lessonWordsOnly]);

  const currentLessonWords = useMemo(() => {
    if (isReviewLesson) {
      const allInLevel = processedYCTData.filter(w => w.level === selectedLevel);
      const charactersOnly = allInLevel.filter(w => (w.char === w.word || w.word.length === 1) && !w.isChallenge);
      const pool = charactersOnly.length > 0 ? charactersOnly : allInLevel.filter(w => !w.isChallenge);
      return [...pool].sort(() => Math.random() - 0.5).slice(0, 40);
    }
    // Exclude challenge character from regular play
    return lessonWordsOnly.filter(w => !w.isChallenge);
  }, [isReviewLesson, lessonWordsOnly, processedYCTData, selectedLevel]);

  useEffect(() => {
    if (winner) {
      setGameState('WIN');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: winner === 'red' ? ['#ef4444', '#f59e0b'] : ['#3b82f6', '#10b981']
      });
    }
  }, [winner]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING' || board[r][c] || winner) return;
    
    // Check if player can move
    const pool = currentLessonWords;
    if (pool.length === 0) return;

    // 1. Get characters recently used to avoid immediate repetition
    const recentlyUsed = history.slice(-12).map(h => h.char).filter(Boolean);
    
    // 2. Filter pool to find candidates not recently seen
    let candidates = pool.filter(w => !recentlyUsed.includes(w.char));
    
    // 3. Fallback if filtering was too aggressive
    if (candidates.length < 3) candidates = pool;

    // 4. Weighted random selection based on stroke count
    // Gives complex characters a higher probability (weight = strokeCount ^ 1.2 + 2)
    let totalWeight = 0;
    const itemsWithWeights = candidates.map(w => {
      const weight = Math.pow(w.strokeCount || 1, 1.2) + 2;
      totalWeight += weight;
      return { item: w, weight };
    });

    let randomRoll = Math.random() * totalWeight;
    let selectedChar = candidates[0];
    for (const iw of itemsWithWeights) {
      if (randomRoll < iw.weight) {
        selectedChar = iw.item;
        break;
      }
      randomRoll -= iw.weight;
    }
    
    setCurrentCharacter(selectedChar);
    setPendingMove({ r, c });
    setGameState('WRITING');
  };

  const handleWritingComplete = (success: boolean, aiScore: number = 0) => {
    const p = currentPlayer;
    const char = currentCharacter?.char;

    // Handle reward writing
    if (gameState === 'WRITING' && !pendingMove) {
      if (success && char) {
        setStats(prev => ({
          ...prev,
          [p]: {
            ...prev[p],
            items: { ...prev[p].items, skip: prev[p].items.skip + 1 },
            earnedItems: { ...prev[p].earnedItems, skip: prev[p].earnedItems.skip + 1 },
            usedChallengeChars: [...prev[p].usedChallengeChars, char]
          }
        }));
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      setGameState('PLAYING');
      setCurrentCharacter(null);
      return;
    }
    
    if (success && pendingMove && char) {
      placePiece(pendingMove.r, pendingMove.c, { char, success: true, score: aiScore });
      
      setStats(prev => ({
        ...prev,
        [p]: {
          ...prev[p],
          accuracy: [...prev[p].accuracy, aiScore]
        }
      }));
    } else if (pendingMove) {
      // Failed: Just skip turn without placing anything
      setShowFailedTurn(true);
      setTimeout(() => setShowFailedTurn(false), 2000);
      skipTurn();
      setStats(prev => ({
        ...prev,
        [p]: {
          ...prev[p],
          accuracy: [...prev[p].accuracy, 0]
        }
      }));
    }
    
    setGameState('PLAYING');
    setPendingMove(null);
    setCurrentCharacter(null);
    setActiveItems({ hint: false });
  };

  // AI Logic
  useEffect(() => {
    if (mode === 'AI' && currentPlayer === 'blue' && gameState === 'PLAYING' && !winner) {
      const timer = setTimeout(() => {
        const emptySpots: { r: number; c: number }[] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (!board[r][c]) emptySpots.push({ r, c });
          }
        }
        if (emptySpots.length > 0) {
          const move = emptySpots[Math.floor(Math.random() * emptySpots.length)];
          placePiece(move.r, move.c, { char: 'AI', success: true });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, mode, gameState, winner, board, placePiece, BOARD_SIZE]);

  const useItem = (type: 'hint' | 'skip') => {
    const p = currentPlayer;
    const hasItems = stats[p].items[type] > 0;
    const canEarn = stats[p].earnedItems[type] < 2;

    if (!hasItems) {
      if (canEarn) {
        startQuiz(type.toUpperCase() as QuizType);
      }
      return;
    }

    if (type === 'hint') {
      if (activeItems.hint || gameState !== 'WRITING') return; 
      setActiveItems(prev => ({ ...prev, hint: true }));
      setStats(prev => ({
        ...prev,
        [p]: { ...prev[p], items: { ...prev[p].items, hint: prev[p].items.hint - 1 } }
      }));
    } else if (type === 'skip' && gameState === 'WRITING') {
      handleWritingComplete(true, 100);
      setStats(prev => ({
        ...prev,
        [p]: { ...prev[p], items: { ...prev[p].items, skip: prev[p].items.skip - 1 } }
      }));
    }
  };

  const startQuiz = (type: QuizType) => {
    const p = currentPlayer;
    const typeKey = type.toLowerCase() as 'hint' | 'skip';
    if (stats[p].earnedItems[typeKey] >= 2) return;
    
    if (type === 'SKIP') {
      // Writing Challenge for SKIP Card
      const lessonChallenges = lessonWordsOnly.filter(w => w.isChallenge);
      const usedByPlayer = stats[p].usedChallengeChars;
      
      // Filter out characters already used successfully by this player
      const availableChallenges = lessonChallenges.filter(w => !usedByPlayer.includes(w.char));
      
      // Fallback if all lesson challenges were used (shouldn't happen with 2 per lesson and limit of 2 cards),
      // just pick any challenge character from the lesson
      const targetChallenge = availableChallenges.length > 0 
        ? availableChallenges[Math.floor(Math.random() * availableChallenges.length)]
        : lessonChallenges[Math.floor(Math.random() * lessonChallenges.length)];

      if (targetChallenge) {
        setCurrentCharacter(targetChallenge);
        setGameState('WRITING');
      }
      return;
    }

    // MULTIPLE CHOICE FOR HINT CARD (Hanzi to Pinyin)
    const target = currentLessonWords[Math.floor(Math.random() * currentLessonWords.length)];
    let options: string[] = [target.pinyin];
    const others = currentLessonWords.filter(w => w.pinyin !== target.pinyin);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    options.push(...shuffledOthers.slice(0, 3).map(w => w.pinyin));
    
    setQuizState({
      active: true,
      type,
      target,
      options: options.sort(() => Math.random() - 0.5)
    });
  };

  const handleQuizAnswer = (answer: string) => {
    const isCorrect = answer === quizState.target?.pinyin;
    
    if (isCorrect) {
      const p = currentPlayer;
      setStats(prev => ({
        ...prev,
        [p]: {
          ...prev[p],
          items: { ...prev[p].items, hint: prev[p].items.hint + 1 },
          earnedItems: { ...prev[p].earnedItems, hint: prev[p].earnedItems.hint + 1 }
        }
      }));
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
    
    setQuizState(prev => ({ ...prev, active: false }));
  };

  const getAccuracy = (p: 'red' | 'blue') => {
    const acc = stats[p].accuracy;
    if (acc.length === 0) return 0;
    return Math.round(acc.reduce((a, b) => a + b, 0) / acc.length);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] text-slate-800 font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {/* START PAGE */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden"
          >
            {/* Start Screen Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              <div className="absolute -top-20 -left-20 w-[40rem] h-[40rem] border-8 border-slate-100/50 rotate-12 rounded-[4rem] flex flex-wrap content-start opacity-70">
                {Array.from({ length: 225 }).map((_, i) => (
                  <div key={i} className="w-[calc(100%/15)] h-[calc(100%/15)] border-b border-r border-slate-100" />
                ))}
              </div>
              <div className="absolute -bottom-40 -right-20 w-[50rem] h-[50rem] border-8 border-slate-100/50 -rotate-6 rounded-[5rem] flex flex-wrap content-start opacity-70">
                {Array.from({ length: 225 }).map((_, i) => (
                  <div key={i} className="w-[calc(100%/15)] h-[calc(100%/15)] border-b border-r border-slate-100" />
                ))}
              </div>
              {/* Some decorative pieces */}
              <div className="absolute top-1/4 right-1/4 w-12 h-12 rounded-full bg-red-400 rotate-12 blur-sm opacity-20" />
              <div className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-full bg-blue-500 -rotate-12 blur-sm opacity-20" />
              <div className="absolute top-1/3 left-1/2 w-8 h-8 rounded-full bg-slate-900 opacity-5" />
              <div className="absolute bottom-1/3 right-1/2 w-10 h-10 rounded-full bg-red-500 opacity-5" />
            </div>

            <motion.div 
              initial={{ y: 20 }} animate={{ y: 0 }}
              className="text-center space-y-12 max-w-4xl z-10"
            >
              <div className="space-y-2">
                <h1 className="text-5xl sm:text-8xl font-black tracking-tighter text-slate-900 leading-[0.8] transition-all uppercase">
                  Writing<br/>Omok
                </h1>
                <p className="text-4xl sm:text-7xl font-bold text-blue-600 tracking-tight drop-shadow-sm">
                  汉字书写五子棋
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 items-stretch">
                <button 
                  onClick={() => { setMode('AI'); setGameState('SELECTION'); }}
                  className="group flex flex-col items-center justify-center gap-6 p-8 bg-white/80 backdrop-blur-sm hover:bg-red-50 border-2 border-slate-100 hover:border-red-500 rounded-[3rem] transition-all shadow-xl hover:shadow-red-100"
                >
                  <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Cpu className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black mb-1">AI Mode</div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Single Player</div>
                  </div>
                </button>

                <button 
                  onClick={() => { setMode('PK'); setGameState('SELECTION'); }}
                  className="group flex flex-col items-center justify-center gap-6 p-8 bg-white/80 backdrop-blur-sm hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-600 rounded-[3rem] transition-all shadow-xl hover:shadow-blue-100"
                >
                  <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black mb-1">PK Mode</div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Two Players</div>
                  </div>
                </button>

                <button 
                  onClick={() => setGameState('INTRO')}
                  className="group flex flex-col items-center justify-center gap-6 p-8 bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 text-white rounded-[3rem] transition-all shadow-2xl"
                >
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black mb-1">How to</div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Introduction</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* INTRODUCTION PAGE */}
        {gameState === 'INTRO' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <div className="max-w-3xl w-full bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 overflow-y-auto max-h-[90vh] relative">
              {/* Language Switcher */}
              <div className="absolute top-8 right-8 flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setInstructionLang('EN')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                    instructionLang === 'EN' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >EN</button>
                <button 
                  onClick={() => setInstructionLang('MN')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                    instructionLang === 'MN' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >MN</button>
              </div>

              <h2 className="text-4xl font-black flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl"><Info /></div>
                {instructionLang === 'EN' ? 'Instructions' : 'Заавар'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                      {instructionLang === 'EN' ? 'Rules' : 'Дүрэм'}
                    </h3>
                    <div className="space-y-2">
                      {instructionLang === 'EN' ? (
                        <p className="text-xl text-slate-800 leading-relaxed font-bold">
                          Players take turns. Before placing a piece, write the correct character.
                        </p>
                      ) : (
                        <p className="text-xl text-slate-500 leading-relaxed font-medium italic border-l-4 border-slate-100 pl-4">
                          Тоглогчид ээлжлэн нүүдэл хийнэ. Хөлөг тавихаас өмнө ханзыг зөв бичнэ үү.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                      {instructionLang === 'EN' ? 'Win' : 'Ялах'}
                    </h3>
                    <div className="space-y-2">
                       {instructionLang === 'EN' ? (
                         <p className="text-lg text-slate-800 font-bold">Connect five pieces in any direction to win.</p>
                       ) : (
                         <p className="text-lg text-slate-500 italic font-medium border-l-4 border-slate-100 pl-4">Аливаа чиглэлд таван хөлөг дараалуулж тавьсан тоглогч ялна.</p>
                       )}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
                      {instructionLang === 'EN' ? 'Items' : 'Хэрэгсэл'}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl shrink-0"><Lightbulb size={24}/></div>
                        <div>
                          <p className="font-black text-xl uppercase tracking-tighter">
                            {instructionLang === 'EN' ? 'Hint' : 'Санамж'}
                          </p>
                          <p className="text-lg text-slate-500 leading-relaxed">
                            {instructionLang === 'EN' 
                              ? 'Shows character outline. Earn by matching character to pinyin.' 
                              : 'Ханзны хүрээг харуулна. Ханзоор пинйинийг тааж авна.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl shrink-0"><SkipForward size={24}/></div>
                        <div>
                          <p className="font-black text-xl uppercase tracking-tighter">
                            {instructionLang === 'EN' ? 'Skip' : 'Алгасах'}
                          </p>
                          <p className="text-lg text-slate-500 leading-relaxed">
                            {instructionLang === 'EN' 
                              ? 'Auto-place piece. Earn by writing the "Challenge Character".' 
                              : 'Шууд хөлөг тавина. "Сорилт" ханзыг бичиж авна.'}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          {instructionLang === 'EN' ? 'Note' : 'Жич'}
                        </p>
                        <p className="text-base text-slate-500 italic leading-relaxed">
                          {instructionLang === 'EN' 
                            ? 'Max 2 items of each type can be earned per game.' 
                            : 'Тоглогч бүр төрөл тус бүрээс 2 хүртэлх хэрэгсэл авч болно.'}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setGameState('START')}
                  className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-all"
                >
                  {instructionLang === 'EN' ? 'Back' : 'Буцах'}
                </button>
                <button 
                  onClick={() => setGameState('SELECTION')}
                  className="flex-[2] py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-slate-200"
                >
                  {instructionLang === 'EN' ? 'Start' : 'Эхлэх'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SELECTION PAGE */}
        {gameState === 'SELECTION' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="min-h-screen p-6 flex flex-col items-center justify-center gap-12"
          >
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Select Level</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest">YCT 1-6 Vocabulary</p>
            </div>

            <div className="w-full max-w-4xl space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[2px] w-12 bg-slate-200" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">LEVEL</span>
                  <div className="h-[2px] w-12 bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(`yct${lvl}`)}
                      className={cn(
                        "py-6 rounded-2xl font-black text-xl transition-all border-2",
                        selectedLevel === `yct${lvl}` 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                          : "bg-white border-slate-100 hover:border-slate-300 text-slate-400"
                      )}
                    >
                      YCT {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[2px] w-12 bg-slate-200" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">LESSON</span>
                  <div className="h-[2px] w-12 bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: ['yct1', 'yct2', 'yct3', 'yct4'].includes(selectedLevel) ? 12 : 15 }).map((_, i) => {
                    const maxLesson = ['yct1', 'yct2', 'yct3', 'yct4'].includes(selectedLevel) ? 12 : 15;
                    const isLast = i === maxLesson - 1;
                    return (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedLesson(i + 1)}
                        className={cn(
                          "py-5 px-4 rounded-2xl font-black transition-all border-2 text-lg",
                          selectedLesson === i + 1 
                            ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-xl shadow-slate-200" 
                            : "bg-white border-slate-100 hover:border-slate-300 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        {isLast ? 'Review' : `Lesson ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setGameState('START')}
                  className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={() => setGameState('PREPARE')}
                  className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                >
                  Start Practice
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PREPARE PAGE */}
        {gameState === 'PREPARE' && (
          <motion.div 
            key="prepare"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="min-h-screen p-8 flex flex-col items-center justify-center gap-12"
          >
             <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Word Preview</h2>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">
                {instructionLang === 'EN' ? 'Master these characters first' : 'Эдгээр ханзнуудаа эхлээд сайн цээжлээрэй'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full max-w-6xl">
              {lessonWordsOnly.map((w, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className={cn(
                    "bg-white p-8 rounded-[2.5rem] shadow-xl border-4 transition-all relative overflow-hidden group",
                    w.isChallenge ? "border-red-100 bg-red-50/20" : "border-slate-50 hover:border-blue-100"
                  )}
                >
                  {w.isChallenge && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black py-1.5 px-4 rounded-bl-2xl uppercase tracking-widest shadow-md flex items-center gap-1 animate-pulse">
                      <Zap size={12} className="fill-current" />
                      <span>Challenge</span>
                    </div>
                  )}
                  <div className="text-5xl font-black text-slate-900 group-hover:scale-110 transition-transform duration-300">{w.char}</div>
                  <div className="space-y-1">
                    <div className="text-blue-600 font-black text-lg">{w.pinyin}</div>
                    <div className="text-sm text-slate-400 font-bold line-clamp-1">{w.translation}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="w-full max-w-6xl space-y-6">
              <div className="p-8 bg-blue-600 rounded-[3rem] shadow-2xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-white/20">
                <div className="flex items-center gap-6 text-left">
                  <div className="p-5 bg-white text-blue-600 rounded-3xl shadow-lg animate-bounce-slow">
                    <Zap size={32} className="fill-current" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-black text-2xl">
                      {instructionLang === 'EN' ? 'Challenge Characters' : 'Сорилт Ханзнууд'}
                    </h4>
                    <p className="text-blue-100 font-bold max-w-md leading-relaxed">
                      {instructionLang === 'EN' 
                        ? 'Red tokens are not in the main game. Write them correctly during item acquisition to get Skip cards!' 
                        : 'Улаан тэмдэглэгээтэй ханзнууд хөлөг дээр ирэхгүй. Эдгээрийг зөв бичиж Алгасах хэрэгсэл аваарай!'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setGameState('SELECTION')}
                    className="flex-1 md:flex-none px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-lg border-2 border-white/30 transition-all uppercase tracking-widest"
                  >
                    {instructionLang === 'EN' ? 'Back' : 'Буцах'}
                  </button>
                  <button 
                    onClick={() => { 
                      resetGame(); 
                      setStats({
                        red: { score: 0, accuracy: [], items: { hint: 0, skip: 0 }, earnedItems: { hint: 0, skip: 0 }, usedChallengeChars: [] },
                        blue: { score: 0, accuracy: [], items: { hint: 0, skip: 0 }, earnedItems: { hint: 0, skip: 0 }, usedChallengeChars: [] },
                      });
                      setGameState('PLAYING'); 
                    }}
                    className="flex-1 md:flex-none px-12 py-5 bg-white text-blue-600 hover:scale-105 active:scale-95 rounded-2xl font-black text-lg shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <span>{instructionLang === 'EN' ? 'Start Game' : 'Тоглох'}</span>
                    <Play className="fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PLAYING PAGE */}
        {(gameState === 'PLAYING' || gameState === 'WRITING' || gameState === 'WIN') && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen relative"
          >
            {/* Turn Passed Overlay */}
            <AnimatePresence>
              {showFailedTurn && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-red-600 text-white px-12 py-6 rounded-[3rem] shadow-2xl border-4 border-white/20 flex flex-col items-center gap-2">
                    <span className="text-4xl font-black uppercase tracking-tighter">Turn Passed!</span>
                    <span className="text-xl font-bold opacity-80 italic">Ээлж шилжлээ!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Minimal Header */}
            <header className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <button onClick={() => setGameState('PREPARE')} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                  <Home className="w-6 h-6 text-slate-400" />
                </button>
                <div className={cn(
                  "px-6 py-2 rounded-full font-black text-lg transition-all border-2",
                  currentPlayer === 'red' ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-800"
                )}>
                  Turn: {currentPlayer === 'red' ? 'Black' : 'White'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">
                  <Pause className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row gap-8 p-4 lg:p-12 items-center justify-center">
              {/* Left Item Bar */}
              <div className={cn(
                "flex lg:flex-col gap-4 order-2 lg:order-1 transition-all duration-500 relative z-[100] pointer-events-auto",
                currentPlayer === 'red' ? "opacity-100 scale-100" : "opacity-40 scale-95 grayscale"
              )}>
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Item Limit</div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Max 2 per round</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); useItem('hint'); }}
                    disabled={stats.red.items.hint <= 0 && stats.red.earnedItems.hint >= 2}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-[2rem] shadow-xl border-4 transition-all cursor-pointer disabled:opacity-40 group overflow-hidden relative w-full",
                      stats.red.items.hint > 0 && currentPlayer === 'red' ? "border-yellow-400 ring-4 ring-yellow-100" : "border-slate-100 hover:border-yellow-200",
                      (stats.red.items.hint <= 0 && stats.red.earnedItems.hint >= 2) && "grayscale"
                    )}
                  >
                    <Lightbulb className={cn("w-7 h-7 transition-all", stats.red.items.hint > 0 ? "text-yellow-500" : "text-slate-300")} />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {stats.red.items.hint > 0 ? 'Use Hint' : 'Earn Hint'}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className={cn(
                            "w-4 h-1.5 rounded-full transition-colors",
                            i < stats.red.earnedItems.hint ? "bg-yellow-500" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                    </div>
                    {stats.red.items.hint > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                        {stats.red.items.hint}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); useItem('skip'); }}
                    disabled={stats.red.items.skip <= 0 && stats.red.earnedItems.skip >= 2}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-[2rem] shadow-xl border-4 transition-all cursor-pointer disabled:opacity-40 group overflow-hidden relative w-full",
                      stats.red.items.skip > 0 && currentPlayer === 'red' ? "border-green-400 ring-4 ring-green-100" : "border-slate-100 hover:border-green-200",
                      (stats.red.items.skip <= 0 && stats.red.earnedItems.skip >= 2) && "grayscale"
                    )}
                  >
                    <Zap className={cn("w-7 h-7 transition-all", stats.red.items.skip > 0 ? "text-green-500" : "text-slate-300")} />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {stats.red.items.skip > 0 ? 'Use Skip' : 'Earn Skip'}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className={cn(
                            "w-4 h-1.5 rounded-full transition-colors",
                            i < stats.red.earnedItems.skip ? "bg-green-500" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                    </div>
                    {stats.red.items.skip > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                        {stats.red.items.skip}
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Board */}
              <div className={cn("order-1 lg:order-2 transition-all p-4 bg-white rounded-[2.5rem] shadow-2xl border-8 border-slate-100", gameState === 'WRITING' ? "blur-md scale-95 opacity-50 pointer-events-none" : "")}>
                <OmokBoard 
                  board={board} 
                  onCellClick={handleCellClick} 
                  currentPlayer={currentPlayer}
                  lastMove={history[history.length - 1]}
                  disabled={gameState !== 'PLAYING' || (mode === 'AI' && currentPlayer === 'blue')}
                  winningLine={winningLine}
                />
              </div>

              {/* Right Item Bar */}
              <div className={cn(
                "flex lg:flex-col gap-4 order-3 transition-all duration-500 relative z-[100] pointer-events-auto",
                currentPlayer === 'blue' ? "opacity-100 scale-100" : "opacity-40 scale-95 grayscale"
              )}>
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Item Limit</div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Max 2 per round</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); useItem('hint'); }}
                    disabled={stats.blue.items.hint <= 0 && stats.blue.earnedItems.hint >= 2}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-[2rem] shadow-xl border-4 transition-all cursor-pointer disabled:opacity-40 group overflow-hidden relative w-full",
                      stats.blue.items.hint > 0 && currentPlayer === 'blue' ? "border-yellow-400 ring-4 ring-yellow-100" : "border-slate-100 hover:border-yellow-200",
                      (stats.blue.items.hint <= 0 && stats.blue.earnedItems.hint >= 2) && "grayscale"
                    )}
                  >
                    <Lightbulb className={cn("w-7 h-7 transition-all", stats.blue.items.hint > 0 ? "text-yellow-500" : "text-slate-300")} />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {stats.blue.items.hint > 0 ? 'Use Hint' : 'Earn Hint'}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className={cn(
                            "w-4 h-1.5 rounded-full transition-colors",
                            i < stats.blue.earnedItems.hint ? "bg-yellow-500" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                    </div>
                    {stats.blue.items.hint > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                        {stats.blue.items.hint}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); useItem('skip'); }}
                    disabled={stats.blue.items.skip <= 0 && stats.blue.earnedItems.skip >= 2}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-[2rem] shadow-xl border-4 transition-all cursor-pointer disabled:opacity-40 group overflow-hidden relative w-full",
                      stats.blue.items.skip > 0 && currentPlayer === 'blue' ? "border-green-400 ring-4 ring-green-100" : "border-slate-100 hover:border-green-200",
                      (stats.blue.items.skip <= 0 && stats.blue.earnedItems.skip >= 2) && "grayscale"
                    )}
                  >
                    <Zap className={cn("w-7 h-7 transition-all", stats.blue.items.skip > 0 ? "text-green-500" : "text-slate-300")} />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {stats.blue.items.skip > 0 ? 'Use Skip' : 'Earn Skip'}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className={cn(
                            "w-4 h-1.5 rounded-full transition-colors",
                            i < stats.blue.earnedItems.skip ? "bg-green-500" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                    </div>
                    {stats.blue.items.skip > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
                        {stats.blue.items.skip}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </main>

            {/* Writing Overlay */}
            <AnimatePresence>
              {gameState === 'WRITING' && currentCharacter && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
                    className="relative"
                  >
                    <button 
                      onClick={() => setGameState('PLAYING')}
                      className="absolute -top-4 -right-4 p-4 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl shadow-xl hover:text-red-500 transition-all z-[60] group"
                    >
                      <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                    <div className="relative">
                      {currentCharacter.isChallenge && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black py-2 px-6 rounded-2xl shadow-xl animate-bounce z-[60] flex items-center gap-2">
                          <Zap size={20} className="fill-current" />
                          <span>CHALLENGE CHARACTER!</span>
                        </div>
                      )}
                      <HanziWriting 
                        word={currentCharacter} 
                        onComplete={handleWritingComplete}
                        showHint={activeItems.hint}
                        isReview={isReviewLesson}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quiz Overlay */}
            <AnimatePresence>
              {quizState.active && quizState.target && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full text-center space-y-8 border-4 border-slate-100"
                  >
                    <div className="space-y-2">
                      <div className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Quiz / Асуулт</div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">
                        What is the correct Pinyin?
                      </h3>
                      <div className="text-6xl font-black py-4 text-blue-600 select-none">
                        {quizState.target.char}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {quizState.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuizAnswer(opt)}
                          className="p-6 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-[2rem] text-xl font-black transition-all border-2 border-slate-100 hover:border-blue-600 shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setQuizState(prev => ({ ...prev, active: false }))}
                      className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                      Cancel / Болих
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WIN PAGE - Fullscreen Overlay */}
            {gameState === 'WIN' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/90 backdrop-blur-2xl overflow-auto no-scrollbar"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
                  className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center space-y-8 max-w-4xl w-full"
                >
                  <header className="space-y-4">
                    <div className="relative inline-block">
                      <Trophy className={cn("w-24 h-24 sm:w-32 sm:h-32 mx-auto", winner === 'red' ? "text-slate-900" : "text-slate-400")} />
                      <motion.div 
                        animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-dashed border-slate-200 rounded-full -m-4"
                      />
                    </div>
                    <div>
                      <h2 className="text-4xl sm:text-6xl font-black text-slate-900">Victory!</h2>
                      <p className="text-xl sm:text-2xl text-slate-400 font-bold tracking-widest mt-2">
                        {winner === 'red' ? "BLACK PLAYER WINS" : "WHITE PLAYER WINS"}
                      </p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y-2 border-slate-100">
                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm">
                        {new Set(history.filter(h => mode === 'PK' || (h.char && h.char !== 'AI')).map(h => h.char)).size}
                      </div>
                      <div className="text-left">
                        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Moves</div>
                        <div className="text-2xl font-black">{mode === 'AI' ? 'Correct' : 'Total'} Moves</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm">
                        {getAccuracy(winner as any)}%
                      </div>
                      <div className="text-left">
                        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Writing Quality</div>
                        <div className="text-2xl font-black">Accuracy</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          <th className="pb-4">Char</th>
                          <th className="pb-4">Pinyin</th>
                          <th className="pb-4">Meaning</th>
                          <th className="pb-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(() => {
                          const seenChars = new Set();
                          return history
                            .filter(h => {
                              if (mode === 'PK') {
                                if (!h.char || seenChars.has(h.char)) return false;
                                seenChars.add(h.char);
                                return true;
                              }
                              if (h.char && h.char !== 'AI' && !seenChars.has(h.char)) {
                                seenChars.add(h.char);
                                return true;
                              }
                              return false;
                            })
                            .map((h, i) => (
                            <tr key={i} className="text-lg">
                              <td className="py-4 font-black">{h.char}</td>
                              <td className="py-4 text-blue-600 font-bold">{
                                processedYCTData.find(w => w.char === h.char)?.pinyin || '-'
                              }</td>
                              <td className="py-4 text-slate-400 text-sm">{
                                processedYCTData.find(w => w.char === h.char)?.translation || '-'
                              }</td>
                              <td className="py-4">
                                {h.success ? (
                                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><Check className="w-5 h-5"/></div>
                                ) : (
                                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center"><X className="w-5 h-5"/></div>
                                )}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => setGameState('START')} className="flex flex-col items-center gap-2 p-6 bg-slate-900 border-2 border-slate-900 text-white rounded-3xl font-black text-xs hover:bg-black transition-all">
                      <Home />
                      Home
                    </button>
                    <button onClick={() => { resetGame(); setGameState('PLAYING'); }} className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-xs hover:bg-slate-50 transition-all">
                      <RotateCcw />
                      Restart
                    </button>
                    <button onClick={() => { 
                      const maxLesson = ['yct1', 'yct2', 'yct3', 'yct4'].includes(selectedLevel) ? 12 : 15;
                      setSelectedLesson(prev => Math.min(prev + 1, maxLesson)); 
                      setGameState('PREPARE'); 
                    }} className="flex flex-col items-center gap-2 p-6 bg-blue-600 border-2 border-blue-600 text-white rounded-3xl font-black text-xs hover:bg-blue-700 transition-all">
                      <SkipForward />
                      Next
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
