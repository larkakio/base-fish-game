import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import sdk from '@farcaster/frame-sdk';
import { useAccount, useConnect, useWriteContract, useReadContract, useSwitchChain, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';

import FishdomGame from './game/GameEngine';
import Leaderboard from './components/Leaderboard';
import CharacterShop from './components/CharacterShop';
import { saveScore, getUserStats } from './lib/firebase';
import { CHARACTER_STORE_ABI, CHARACTER_STORE_ADDRESS } from './lib/contracts';
import { REQUIRED_CHAIN_ID } from './lib/wagmi';

type Screen = 'menu' | 'game' | 'shop' | 'leaderboard';
type Character = 'orange' | 'green' | 'blue' | 'purple' | 'gold';

interface UserStats {
  highScore: number;
  level: number;
  gamesPlayed: number;
}

const App: React.FC = () => {
  // Farcaster Frame SDK state
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  // Game state
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [, setCurrentScore] = useState(0);
  const [, setMovesLeft] = useState(30);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>('orange');
  const [userStats, setUserStats] = useState<UserStats>({ highScore: 0, level: 1, gamesPlayed: 0 });
  // Orange Fish (index 0) is ALWAYS owned by default - no claim needed
  const [ownedCharacters, setOwnedCharacters] = useState<boolean[]>([true, false, false, false, false]);

  // Network state
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Game instance
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<FishdomGame | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { writeContract } = useWriteContract();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Check if on correct network (Base Mainnet)
  const isOnBase = chainId === REQUIRED_CHAIN_ID;

  // Read owned characters from contract (for paid characters only)
  const { data: contractCharacters } = useReadContract({
    address: CHARACTER_STORE_ADDRESS,
    abi: CHARACTER_STORE_ABI,
    functionName: 'getUserCharacters',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && isOnBase,
    },
  });

  // Initialize Farcaster Frame SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('[Base Fish] Initializing Farcaster SDK...');
        
        // Get context from Farcaster
        const context = await sdk.context;
        console.log('[Base Fish] SDK Context:', context);
        
        if (context?.user) {
          setFarcasterUser(context.user);
          console.log('[Base Fish] User:', context.user);
        }

        // Get safe area insets for mobile
        if (context?.client?.safeAreaInsets) {
          setSafeAreaInsets(context.client.safeAreaInsets);
        }

        setIsSDKLoaded(true);
        
        // Signal ready to Farcaster after a short delay to ensure render
        setTimeout(() => {
          sdk.actions.ready();
          console.log('[Base Fish] SDK ready() called');
        }, 100);
      } catch (error) {
        console.log('[Base Fish] Not in Farcaster Frame context, running standalone');
        setIsSDKLoaded(true);
      }
    };

    initSDK();
  }, []);

  // Check network and prompt to switch if needed
  useEffect(() => {
    if (isConnected && !isOnBase) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [isConnected, isOnBase]);

  // Load user stats from Firebase
  useEffect(() => {
    const loadStats = async () => {
      if (address) {
        const stats = await getUserStats(address);
        if (stats) {
          setUserStats(stats);
          setCurrentLevel(stats.level || 1);
        }
      }
    };
    loadStats();
  }, [address]);

  // Update owned characters when contract data changes
  // Orange Fish (index 0) is ALWAYS true - available without claiming
  useEffect(() => {
    if (contractCharacters && Array.isArray(contractCharacters)) {
      const characters = contractCharacters as readonly boolean[];
      // Always ensure Orange Fish is owned
      setOwnedCharacters([true, !!characters[1], !!characters[2], !!characters[3], !!characters[4]]);
    }
  }, [contractCharacters]);

  // Cleanup game instance on unmount
  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, []);

  // Handle network switch
  const handleSwitchToBase = useCallback(async () => {
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain]);

  // Connect wallet handler - with Base network enforcement
  const handleConnect = useCallback(async () => {
    try {
      // Connect with injected wallet
      connect(
        { connector: injected(), chainId: REQUIRED_CHAIN_ID },
        {
          onSuccess: () => {
            // After connection, check network
            if (chainId !== REQUIRED_CHAIN_ID) {
              handleSwitchToBase();
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [connect, chainId, handleSwitchToBase]);

  // Game callbacks
  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  const handleMovesUpdate = useCallback((moves: number) => {
    setMovesLeft(moves);
  }, []);

  const handleLevelComplete = useCallback(async (level: number, score: number) => {
    // Save score to leaderboard
    if (address) {
      await saveScore({
        walletAddress: address,
        farcasterUsername: farcasterUser?.username,
        farcasterFid: farcasterUser?.fid,
        score,
        level,
        character: selectedCharacter,
      });

      // Update local stats
      setUserStats(prev => ({
        ...prev,
        highScore: Math.max(prev.highScore, score),
        level: Math.max(prev.level, level + 1),
        gamesPlayed: prev.gamesPlayed + 1,
      }));
    }

    // Advance to next level
    if (level < 10) {
      setCurrentLevel(level + 1);
    }
  }, [address, farcasterUser, selectedCharacter]);

  const handleGameOver = useCallback(async (score: number) => {
    // Save final score
    setFinalScore(score);
    setShowGameOver(true);
    
    if (address) {
      await saveScore({
        walletAddress: address,
        farcasterUsername: farcasterUser?.username,
        farcasterFid: farcasterUser?.fid,
        score,
        level: currentLevel,
        character: selectedCharacter,
      });

      setUserStats(prev => ({
        ...prev,
        highScore: Math.max(prev.highScore, score),
        gamesPlayed: prev.gamesPlayed + 1,
      }));
    }
  }, [address, farcasterUser, currentLevel, selectedCharacter]);

  // Share score to Warpcast
  const shareScore = useCallback(() => {
    const appUrl = 'https://my-fishdom-game.vercel.app';
    const text = encodeURIComponent(`I just scored ${finalScore} points in Base Fish! 🐠🎮\n\nCan you beat my score?`);
    const embedUrl = encodeURIComponent(appUrl);
    const warpcastUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`;
    
    // Open in new window or use Farcaster SDK
    if (typeof window !== 'undefined') {
      window.open(warpcastUrl, '_blank');
    }
  }, [finalScore]);

  // Go back to menu
  const goToMenu = useCallback(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }
    setCurrentScreen('menu');
  }, []);

  // Close game over and go to menu
  const handleCloseGameOver = useCallback(() => {
    setShowGameOver(false);
    goToMenu();
  }, [goToMenu]);

  // Start game - Orange Fish is always available
  const startGame = useCallback(() => {
    // Destroy existing game instance first
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }

    setCurrentScreen('game');
    setCurrentScore(0);
    setMovesLeft(30);

    // Use 500ms timeout to ensure DOM is fully painted
    setTimeout(() => {
      // Try ref first, then fallback to getElementById
      const container = gameContainerRef.current || document.getElementById('game-container');
      
      console.log('Starting game, container:', container);
      
      if (container) {
        // Clear any existing canvas elements
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) {
          console.log('Removing existing canvas');
          existingCanvas.remove();
        }

        // Create new game instance
        gameInstanceRef.current = new FishdomGame(container, {
          onScoreUpdate: handleScoreUpdate,
          onMovesUpdate: handleMovesUpdate,
          onLevelComplete: handleLevelComplete,
          onGameOver: handleGameOver,
        });

        // Always default to 'orange' if no other character is owned/selected
        const characterToUse = ownedCharacters[getCharacterIndex(selectedCharacter)] ? selectedCharacter : 'orange';
        gameInstanceRef.current.start(currentLevel, characterToUse);
      } else {
        console.error('Game container not found!');
      }
    }, 500);
  }, [currentLevel, selectedCharacter, ownedCharacters, handleScoreUpdate, handleMovesUpdate, handleLevelComplete, handleGameOver]);

  // Character purchase handler - requires Base network
  const handlePurchaseCharacter = useCallback(async (characterId: number, price: bigint) => {
    if (!isOnBase) {
      await handleSwitchToBase();
      return;
    }

    try {
      await writeContract({
        address: CHARACTER_STORE_ADDRESS,
        abi: CHARACTER_STORE_ABI,
        functionName: 'buyCharacter',
        args: [BigInt(characterId)],
        value: price,
        chainId: REQUIRED_CHAIN_ID,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  }, [writeContract, isOnBase, handleSwitchToBase]);

  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-900 via-blue-900 to-blue-950 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          🐠
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-cyan-900 via-blue-900 to-blue-950 overflow-hidden"
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
      }}
    >
      {/* Network Warning Modal */}
      <AnimatePresence>
        {showNetworkWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-red-900 to-red-950 rounded-3xl p-6 max-w-sm w-full border border-red-400/30 text-center"
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-2">Wrong Network</h3>
              <p className="text-red-200 mb-6">
                Fishdom runs on <span className="font-bold text-blue-400">Base Network</span> for sub-cent transaction fees. Please switch to continue.
              </p>
              <button
                onClick={handleSwitchToBase}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
              >
                🔄 Switch to Base
              </button>
              <p className="text-xs text-red-300/60 mt-4">
                Chain ID: 8453 (Base Mainnet)
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated underwater background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Light rays */}
        <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-300/10 to-transparent transform -skew-x-12" />
        <div className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-cyan-300/5 to-transparent transform skew-x-6" />
        
        {/* Floating bubbles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 20 + 10,
              height: Math.random() * 20 + 10,
              left: `${Math.random() * 100}%`,
              bottom: -50,
            }}
            animate={{
              y: [-50, -window.innerHeight - 100],
              x: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentScreen === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-8xl mb-4"
              >
                🐠
              </motion.div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 drop-shadow-lg">
                FISHDOM
              </h1>
              <p className="text-cyan-300 mt-2 font-medium">Match-3 Puzzle Adventure</p>
            </motion.div>

            {/* User Info */}
            {isConnected && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 w-full max-w-sm border border-cyan-400/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCharacterEmoji(selectedCharacter)}</span>
                    <div>
                      <p className="font-bold text-white">
                        {farcasterUser?.username || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                      </p>
                      <p className="text-sm text-cyan-300">Level {userStats.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-400">HIGH SCORE</p>
                    <p className="text-xl font-black text-yellow-400">{userStats.highScore.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Menu Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm space-y-3"
            >
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 active:scale-95"
                >
                  🔗 Connect Wallet
                </button>
              ) : (
                <>
                  <button
                    onClick={startGame}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-105 active:scale-95"
                  >
                    🎮 Play Level {currentLevel}
                  </button>

                  <button
                    onClick={() => setShowShop(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95"
                  >
                    🛒 Character Shop
                  </button>

                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95"
                  >
                    🏆 Leaderboard
                  </button>
                </>
              )}
            </motion.div>

            {/* Level Select */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 w-full max-w-sm"
              >
                <p className="text-center text-cyan-300 mb-3 font-medium">Select Level</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setCurrentLevel(level)}
                      disabled={level > userStats.level}
                      className={`aspect-square rounded-xl font-bold text-lg transition-all ${
                        level === currentLevel
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg scale-110'
                          : level <= userStats.level
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-black/30 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {level <= userStats.level ? level : '🔒'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Farcaster/Base branding */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-4 text-sm text-cyan-400/60"
            >
              <span>Built on</span>
              <span className="font-bold text-blue-400">Base</span>
              <span>•</span>
              <span className="font-bold text-purple-400">Farcaster</span>
            </motion.div>
          </motion.div>
        )}

        {currentScreen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10"
            style={{ margin: 0, padding: 0 }}
          >
            {/* Back Button - Floating on top of game */}
            <button
              onClick={goToMenu}
              className="absolute top-4 left-4 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              style={{ margin: 0 }}
            >
              ←
            </button>

            {/* Game Container - Full viewport for Phaser, no margins/padding */}
            <div 
              ref={gameContainerRef}
              id="game-container"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                touchAction: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserAddress={address}
        currentUserScore={userStats.highScore}
      />

      <CharacterShop
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        ownedCharacters={ownedCharacters}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={(char: string) => setSelectedCharacter(char as Character)}
        onPurchase={handlePurchaseCharacter}
        isConnected={isConnected}
        isOnBase={isOnBase}
        onSwitchNetwork={handleSwitchToBase}
      />

      {/* Game Over Modal with Share */}
      <AnimatePresence>
        {showGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-sm bg-gradient-to-b from-red-900 via-purple-900 to-indigo-950 rounded-3xl p-6 border border-red-400/30 text-center shadow-2xl"
            >
              {/* Game Over Header */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-4"
              >
                🐠💔
              </motion.div>
              
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-pink-300 mb-2">
                Game Over!
              </h2>
              
              <p className="text-purple-200 mb-6">Level {currentLevel}</p>
              
              {/* Score Display */}
              <div className="bg-black/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-purple-300 mb-1">YOUR SCORE</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  {finalScore.toLocaleString()}
                </p>
                {finalScore >= userStats.highScore && finalScore > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-400 font-bold mt-2"
                  >
                    🎉 New High Score!
                  </motion.p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Share to Warpcast */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={shareScore}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  <span>📣</span> Share on Warpcast
                </motion.button>

                {/* Play Again */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowGameOver(false);
                    startGame();
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 rounded-2xl font-bold text-white text-lg shadow-lg shadow-cyan-500/30"
                >
                  🔄 Play Again
                </motion.button>

                {/* Back to Menu */}
                <button
                  onClick={handleCloseGameOver}
                  className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white/80 transition-colors"
                >
                  Back to Menu
                </button>
              </div>

              {/* Leaderboard prompt */}
              <button
                onClick={() => {
                  setShowGameOver(false);
                  setShowLeaderboard(true);
                }}
                className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                🏆 View Leaderboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper functions
const getCharacterEmoji = (character: string): string => {
  const emojis: Record<string, string> = {
    orange: '🐠',
    green: '🐟',
    blue: '🐋',
    purple: '🦑',
    gold: '🦈',
  };
  return emojis[character] || '🐠';
};

const getCharacterIndex = (character: string): number => {
  const indices: Record<string, number> = {
    orange: 0,
    green: 1,
    blue: 2,
    purple: 3,
    gold: 4,
  };
  return indices[character] ?? 0;
};

export default App;
