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
type Theme = 'dark' | 'light';

interface UserStats {
  highScore: number;
  level: number;
  gamesPlayed: number;
}

const App: React.FC = () => {
  // Theme state (light/dark mode)
  const [theme, setTheme] = useState<Theme>('dark');

  // Farcaster Frame SDK state
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Game state
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [, setCurrentScore] = useState(0);
  const [, setMovesLeft] = useState(30);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>('orange');
  const [userStats, setUserStats] = useState<UserStats>({ highScore: 0, level: 1, gamesPlayed: 0 });
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

  const isOnBase = chainId === REQUIRED_CHAIN_ID;

  // Read owned characters from contract
  const { data: contractCharacters } = useReadContract({
    address: CHARACTER_STORE_ADDRESS,
    abi: CHARACTER_STORE_ABI,
    functionName: 'getUserCharacters',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && isOnBase,
    },
  });

  // Theme classes based on current theme
  const themeClasses = theme === 'dark' 
    ? {
        bg: 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900',
        card: 'bg-white/10 border-white/20',
        text: 'text-white',
        textMuted: 'text-white/60',
        accent: 'text-cyan-400',
      }
    : {
        bg: 'bg-gradient-to-b from-sky-100 via-blue-100 to-cyan-100',
        card: 'bg-white/80 border-gray-200',
        text: 'text-gray-900',
        textMuted: 'text-gray-500',
        accent: 'text-blue-600',
      };

  // Initialize Farcaster Frame SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('[Base Fish] Initializing SDK...');
        const context = await sdk.context;
        console.log('[Base Fish] SDK Context:', context);
        
        if (context?.user) {
          setFarcasterUser(context.user);
          console.log('[Base Fish] User:', context.user);
        }

        if (context?.client?.safeAreaInsets) {
          setSafeAreaInsets(context.client.safeAreaInsets);
        }

        // Check if user has seen onboarding
        const onboardingSeen = localStorage.getItem('basefish_onboarding_seen');
        if (!onboardingSeen) {
          setShowOnboarding(true);
        }

        setIsSDKLoaded(true);
        
        setTimeout(() => {
          sdk.actions.ready();
          console.log('[Base Fish] SDK ready() called');
        }, 100);
      } catch (error) {
        console.log('[Base Fish] Running standalone mode');
        
        const onboardingSeen = localStorage.getItem('basefish_onboarding_seen');
        if (!onboardingSeen) {
          setShowOnboarding(true);
        }
        
        setIsSDKLoaded(true);
      }
    };

    initSDK();
  }, []);

  // Network check
  useEffect(() => {
    if (isConnected && !isOnBase) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [isConnected, isOnBase]);

  // Load user stats
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

  // Update owned characters
  useEffect(() => {
    if (contractCharacters && Array.isArray(contractCharacters)) {
      const characters = contractCharacters as readonly boolean[];
      setOwnedCharacters([true, !!characters[1], !!characters[2], !!characters[3], !!characters[4]]);
    }
  }, [contractCharacters]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, []);

  const handleSwitchToBase = useCallback(async () => {
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain]);

  const handleConnect = useCallback(async () => {
    try {
      console.log('[Base Fish] Connecting wallet...');
      
      // Check if Farcaster SDK wallet is available (inside Warpcast/Base App)
      if (sdk.wallet?.ethProvider) {
        console.log('[Base Fish] Farcaster SDK wallet detected');
        try {
          // Request accounts directly from Farcaster SDK
          await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          });
          console.log('[Base Fish] Farcaster wallet connected');
        } catch (sdkError) {
          console.log('[Base Fish] SDK request failed:', sdkError);
        }
      }
      
      // Use wagmi injected connector (will pick up Farcaster's injected provider)
      console.log('[Base Fish] Connecting via injected connector');
      connect(
        { connector: injected(), chainId: REQUIRED_CHAIN_ID },
        {
          onSuccess: () => {
            console.log('[Base Fish] Connected successfully');
            if (chainId !== REQUIRED_CHAIN_ID) {
              handleSwitchToBase();
            }
          },
          onError: (error) => {
            console.error('[Base Fish] Connect error:', error);
          },
        }
      );
    } catch (error) {
      console.error('[Base Fish] Failed to connect wallet:', error);
    }
  }, [connect, chainId, handleSwitchToBase]);

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  const handleMovesUpdate = useCallback((moves: number) => {
    setMovesLeft(moves);
  }, []);

  const handleLevelComplete = useCallback(async (level: number, score: number) => {
    if (address) {
      await saveScore({
        walletAddress: address,
        farcasterUsername: farcasterUser?.username,
        farcasterFid: farcasterUser?.fid,
        score,
        level,
        character: selectedCharacter,
      });

      setUserStats(prev => ({
        ...prev,
        highScore: Math.max(prev.highScore, score),
        level: Math.max(prev.level, level + 1),
        gamesPlayed: prev.gamesPlayed + 1,
      }));
    }

    if (level < 10) {
      setCurrentLevel(level + 1);
    }
  }, [address, farcasterUser, selectedCharacter]);

  const handleGameOver = useCallback(async (score: number) => {
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

  const shareScore = useCallback(() => {
    const appUrl = 'https://my-fishdom-game.vercel.app';
    const text = encodeURIComponent(`I scored ${finalScore} points in Base Fish! 🐠\n\nCan you beat me?`);
    const embedUrl = encodeURIComponent(appUrl);
    const shareUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`;
    
    if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank');
    }
  }, [finalScore]);

  const goToMenu = useCallback(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }
    setCurrentScreen('menu');
  }, []);

  const handleCloseGameOver = useCallback(() => {
    setShowGameOver(false);
    goToMenu();
  }, [goToMenu]);

  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('basefish_onboarding_seen', 'true');
  }, []);

  const startGame = useCallback(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
      gameInstanceRef.current = null;
    }

    setCurrentScreen('game');
    setCurrentScore(0);
    setMovesLeft(30);

    setTimeout(() => {
      const container = gameContainerRef.current || document.getElementById('game-container');
      
      if (container) {
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) existingCanvas.remove();

        gameInstanceRef.current = new FishdomGame(container, {
          onScoreUpdate: handleScoreUpdate,
          onMovesUpdate: handleMovesUpdate,
          onLevelComplete: handleLevelComplete,
          onGameOver: handleGameOver,
        });

        const characterToUse = ownedCharacters[getCharacterIndex(selectedCharacter)] ? selectedCharacter : 'orange';
        gameInstanceRef.current.start(currentLevel, characterToUse);
      }
    }, 500);
  }, [currentLevel, selectedCharacter, ownedCharacters, handleScoreUpdate, handleMovesUpdate, handleLevelComplete, handleGameOver]);

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

  // Get display name (username preferred over address)
  const displayName = farcasterUser?.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Guest');
  const avatarUrl = farcasterUser?.pfpUrl || null;

  if (!isSDKLoaded) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          🐠
        </motion.div>
        <p className={`ml-4 ${themeClasses.textMuted}`}>Loading...</p>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${themeClasses.bg} overflow-hidden`}
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: Math.max(safeAreaInsets.bottom, 80), // Space for bottom nav
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
      }}
    >
      {/* Onboarding Popup */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className={`w-full max-w-sm ${theme === 'dark' ? 'bg-gradient-to-b from-blue-900 to-indigo-950' : 'bg-white'} rounded-3xl p-6 border ${theme === 'dark' ? 'border-blue-400/30' : 'border-gray-200'} text-center shadow-2xl`}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-4"
              >
                🐠
              </motion.div>
              
              <h2 className={`text-3xl font-black ${themeClasses.text} mb-2`}>
                Welcome to Base Fish!
              </h2>
              
              <p className={`${themeClasses.textMuted} mb-6`}>
                Match-3 Puzzle Adventure
              </p>

              <div className={`${theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'} rounded-2xl p-4 mb-6 text-left space-y-3`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👆</span>
                  <p className={`${themeClasses.text} text-sm`}>Swap adjacent fish to match 3+ of same color</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <p className={`${themeClasses.text} text-sm`}>Reach target score before moves run out</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <p className={`${themeClasses.text} text-sm`}>Match 4+ for combo bonuses!</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <p className={`${themeClasses.text} text-sm`}>Compete on global leaderboard</p>
                </div>
              </div>

              <button
                onClick={handleCloseOnboarding}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Let's Play! 🎮
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className={`${theme === 'dark' ? 'bg-gradient-to-b from-red-900 to-red-950' : 'bg-white'} rounded-3xl p-6 max-w-sm w-full border ${theme === 'dark' ? 'border-red-400/30' : 'border-red-200'} text-center`}
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Wrong Network</h3>
              <p className={`${themeClasses.textMuted} mb-6`}>
                Base Fish runs on <span className="font-bold text-blue-500">Base Network</span> for fast, low-cost transactions.
              </p>
              <button
                onClick={handleSwitchToBase}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Switch to Base
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {theme === 'dark' && (
          <>
            <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-300/10 to-transparent transform -skew-x-12" />
            <div className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-cyan-300/5 to-transparent transform skew-x-6" />
          </>
        )}
        
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-blue-400/20'}`}
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
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`absolute top-4 right-4 w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-800'} flex items-center justify-center min-w-[48px] min-h-[48px] transition-colors`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Help button */}
            <button
              onClick={() => setShowOnboarding(true)}
              className={`absolute top-4 left-4 w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-800'} flex items-center justify-center min-w-[48px] min-h-[48px] transition-colors font-bold`}
              aria-label="Help"
            >
              ?
            </button>

            {/* Logo */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-3"
              >
                🐠
              </motion.div>
              <h1 className={`text-4xl font-black ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300' : 'text-blue-600'} drop-shadow-lg`}>
                BASE FISH
              </h1>
              <p className={`${themeClasses.textMuted} mt-1 font-medium`}>Match-3 Puzzle Adventure</p>
            </motion.div>

            {/* User Info Card */}
            {isConnected && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`${themeClasses.card} backdrop-blur-lg rounded-2xl p-4 mb-6 w-full max-w-sm border`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl">
                        {getCharacterEmoji(selectedCharacter)}
                      </div>
                    )}
                    <div>
                      <p className={`font-bold ${themeClasses.text}`}>{displayName}</p>
                      <p className={`text-sm ${themeClasses.accent}`}>Level {userStats.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${themeClasses.textMuted}`}>HIGH SCORE</p>
                    <p className="text-xl font-black text-yellow-500">{userStats.highScore.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Menu Buttons - 56px min height for touch targets */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm space-y-3"
            >
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Connect Wallet
                </button>
              ) : (
                <>
                  <button
                    onClick={startGame}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🎮 Play Level {currentLevel}
                  </button>

                  <button
                    onClick={() => setShowShop(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🛒 Character Shop
                  </button>

                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                className="mt-6 w-full max-w-sm"
              >
                <p className={`text-center ${themeClasses.textMuted} mb-3 font-medium`}>Select Level</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setCurrentLevel(level)}
                      disabled={level > userStats.level}
                      className={`aspect-square rounded-xl font-bold text-lg transition-all min-w-[48px] min-h-[48px] ${
                        level === currentLevel
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg scale-110'
                          : level <= userStats.level
                          ? theme === 'dark' ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-gray-800 hover:bg-gray-100 shadow'
                          : theme === 'dark' ? 'bg-black/30 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {level <= userStats.level ? level : '🔒'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Built on Base */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={`mt-6 flex items-center gap-2 text-sm ${themeClasses.textMuted}`}
            >
              <span>Built on</span>
              <span className="font-bold text-blue-500">Base</span>
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
            <button
              onClick={goToMenu}
              className="absolute top-4 left-4 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors min-w-[48px] min-h-[48px]"
            >
              ←
            </button>

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

      {/* Bottom Navigation Bar - always visible on menu */}
      {currentScreen === 'menu' && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={`fixed bottom-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-lg border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} safe-area-bottom`}
          style={{ paddingBottom: safeAreaInsets.bottom }}
        >
          <div className="flex items-center justify-around py-2">
            <NavButton 
              icon="🏠" 
              label="Home" 
              active={true}
              onClick={() => {}}
              theme={theme}
            />
            <NavButton 
              icon="🎮" 
              label="Play" 
              active={false}
              onClick={isConnected ? startGame : handleConnect}
              theme={theme}
            />
            <NavButton 
              icon="🛒" 
              label="Shop" 
              active={false}
              onClick={() => setShowShop(true)}
              theme={theme}
            />
            <NavButton 
              icon="🏆" 
              label="Ranks" 
              active={false}
              onClick={() => setShowLeaderboard(true)}
              theme={theme}
            />
          </div>
        </motion.nav>
      )}

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

      {/* Game Over Modal */}
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
              className={`w-full max-w-sm ${theme === 'dark' ? 'bg-gradient-to-b from-red-900 via-purple-900 to-indigo-950' : 'bg-white'} rounded-3xl p-6 border ${theme === 'dark' ? 'border-red-400/30' : 'border-gray-200'} text-center shadow-2xl`}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-4"
              >
                🐠💔
              </motion.div>
              
              <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-pink-300' : 'text-red-600'} mb-2`}>
                Game Over!
              </h2>
              
              <p className={`${themeClasses.textMuted} mb-6`}>Level {currentLevel}</p>
              
              <div className={`${theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'} rounded-2xl p-4 mb-6`}>
                <p className={`text-sm ${themeClasses.textMuted} mb-1`}>YOUR SCORE</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  {finalScore.toLocaleString()}
                </p>
                {finalScore >= userStats.highScore && finalScore > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-500 font-bold mt-2"
                  >
                    🎉 New High Score!
                  </motion.p>
                )}
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={shareScore}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px] flex items-center justify-center gap-2"
                >
                  📣 Share Score
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowGameOver(false);
                    startGame();
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 rounded-2xl font-bold text-white text-lg shadow-lg min-h-[56px]"
                >
                  🔄 Play Again
                </motion.button>

                <button
                  onClick={handleCloseGameOver}
                  className={`w-full py-3 px-6 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-xl font-medium transition-colors min-h-[48px]`}
                >
                  Back to Menu
                </button>
              </div>

              <button
                onClick={() => {
                  setShowGameOver(false);
                  setShowLeaderboard(true);
                }}
                className={`mt-4 ${themeClasses.accent} hover:opacity-80 text-sm font-medium transition-colors min-h-[44px]`}
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

// Bottom Navigation Button Component
const NavButton: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: Theme;
}> = ({ icon, label, active, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-4 py-2 rounded-xl transition-all ${
      active 
        ? theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
        : theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-800'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-xs font-medium mt-1">{label}</span>
  </button>
);

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
