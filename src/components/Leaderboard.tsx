import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLeaderboard, LeaderboardEntry } from '../lib/firebase';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserAddress?: string;
  currentUserScore?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  isOpen,
  onClose,
  currentUserAddress,
  currentUserScore,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('allTime');

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(timeframe, 50);
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-amber-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-600 to-amber-700';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCharacterEmoji = (character: string) => {
    const characters: Record<string, string> = {
      orange: '🐠',
      green: '🐟',
      blue: '🐋',
      purple: '🦑',
      gold: '🦈',
    };
    return characters[character] || '🐠';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[85vh] bg-gradient-to-b from-cyan-900 to-blue-950 rounded-3xl shadow-2xl border border-cyan-400/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-cyan-800/50 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-2xl">×</span>
              </button>
              
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300 text-center">
                🏆 Leaderboard
              </h2>
              
              {/* Timeframe Tabs - min 44px touch target */}
              <div className="flex gap-2 mt-4 p-1 bg-black/20 rounded-xl">
                {(['daily', 'weekly', 'allTime'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 py-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold transition-all ${
                      timeframe === tf
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'text-cyan-300 hover:bg-white/10'
                    }`}
                  >
                    {tf === 'daily' ? 'Today' : tf === 'weekly' ? 'This Week' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="px-4 pb-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"
                  />
                  <span className="text-cyan-300 font-medium">Loading rankings...</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl">🐠</span>
                  <p className="text-cyan-300 mt-4">No scores yet. Be the first!</p>
                </div>
              ) : (
                <motion.div className="space-y-2">
                  {entries.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.walletAddress?.toLowerCase() === currentUserAddress?.toLowerCase();
                    
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative flex items-center gap-3 p-3 rounded-xl ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50'
                            : 'bg-white/5 hover:bg-white/10'
                        } transition-colors`}
                      >
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center font-black text-white shadow-lg`}>
                          {rank <= 3 ? (
                            <span className="text-2xl">{getRankEmoji(rank)}</span>
                          ) : (
                            <span className="text-sm">{rank}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCharacterEmoji(entry.character || 'orange')}</span>
                            <span className="font-bold text-white truncate">
                              {entry.farcasterUsername || formatAddress(entry.walletAddress)}
                            </span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-cyan-300">
                            <span>Level {entry.level || 1}</span>
                            <span>•</span>
                            <span>{entry.gamesPlayed || 0} games</span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-cyan-400 font-medium">POINTS</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Current User Footer */}
            {currentUserAddress && currentUserScore !== undefined && (
              <div className="sticky bottom-0 px-4 py-3 bg-gradient-to-t from-blue-950 to-transparent border-t border-cyan-500/20">
                <div className="flex items-center justify-between p-3 bg-cyan-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-medium">Your Best:</span>
                  </div>
                  <span className="text-xl font-black text-yellow-400">
                    {currentUserScore.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Decorative bubbles */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 bg-white/10 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: -20,
                  }}
                  animate={{
                    y: [0, -600],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
