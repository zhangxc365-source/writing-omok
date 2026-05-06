import { useState, useCallback } from 'react';

export type Player = 'red' | 'blue' | 'blocked' | null;
export type Board = Player[][];

const BOARD_SIZE = 20;

export function useOmok() {
  const [board, setBoard] = useState<Board>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'blue'>('red');
  const [winner, setWinner] = useState<Player>(null);
  const [history, setHistory] = useState<{ r: number; c: number; p: Player; char?: string; success?: boolean; score?: number }[]>([]);

  const checkWinner = useCallback((newBoard: Board, r: number, c: number, player: Player) => {
    if (!player || player === 'blocked') return null;

    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal \
      [1, -1], // diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      let winningPieces = [{ r, c }];

      // Check one direction
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && newBoard[nr][nc] === player) {
          count++;
          winningPieces.push({ r: nr, c: nc });
        } else {
          break;
        }
      }

      // Check opposite direction
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && newBoard[nr][nc] === player) {
          count++;
          winningPieces.push({ r: nr, c: nc });
        } else {
          break;
        }
      }

      if (count >= 5) return { player, pieces: winningPieces };
    }

    return null;
  }, []);

  const [winningLine, setWinningLine] = useState<{ r: number; c: number }[] | null>(null);

  const placePiece = useCallback((r: number, c: number, extra?: { char: string; success: boolean; score?: number; pOverride?: Player }) => {
    if (board[r][c] || winner) return false;

    const p = extra?.pOverride || currentPlayer;
    const newBoard = board.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? p : cell))
    );

    setBoard(newBoard);
    setHistory(prev => [...prev, { r, c, p, ...extra }]);

    if (p !== 'blocked') {
      const winData = checkWinner(newBoard, r, c, p);
      if (winData) {
        setWinner(winData.player);
        setWinningLine(winData.pieces);
      } else {
        setCurrentPlayer(prev => prev === 'red' ? 'blue' : 'red');
      }
    } else {
      // If blocked, just switch turn
      setCurrentPlayer(prev => prev === 'red' ? 'blue' : 'red');
    }

    return true;
  }, [board, currentPlayer, winner, checkWinner]);

  const skipTurn = useCallback(() => {
    if (winner) return;
    setCurrentPlayer(prev => prev === 'red' ? 'blue' : 'red');
  }, [winner]);

  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('red');
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
  }, []);

  return {
    board,
    currentPlayer,
    winner,
    winningLine,
    placePiece,
    skipTurn,
    resetGame,
    history,
    BOARD_SIZE
  };
}
