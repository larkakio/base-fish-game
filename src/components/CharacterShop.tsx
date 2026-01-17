import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';

interface Character {
  id: number;
  name: string;
  rarity: string;
  emoji: string;
  priceUSD: number;
  priceETH: bigint;
  color: string;
  gradient: string;
}

const CHARACTERS: Character[] = [
  {
    id: 0,
    name: 'Orange Fish',
    rarity: 'Default',
    emoji: '🐠',
    priceUSD: 0,
    priceETH: BigInt(0),
    color: 'orange',
    gradient: 'from-orange-400 to-amber-500',
  },
  {
    id: 1,
    name: 'Green Fish',
    rarity: 'Common',
    emoji: '🐟',
    priceUSD: 1,
    priceETH: BigInt('400000000000000'), // 0.0004 ETH
    color: 'green',
    gradient: 'from-emerald-400 to-green-500',
  },
  {
    id: 2,
    name: 'Blue Fish',
    rarity: 'Uncommon',
    emoji: '🐋',
    priceUSD: 2,
    priceETH: BigInt('800000000000000'), // 0.0008 ETH
    color: 'blue',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    id: 3,
    name: 'Purple Fish',
    rarity: 'Rare',
    emoji: '🦑',
    priceUSD: 3,
    priceETH: BigInt('1200000000000000'), // 0.0012 ETH
    color: 'purple',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    id: 4,
    name: 'Gold Shark',
    rarity: 'Legendary',
    emoji: '🦈',
    priceUSD: 5,
    priceETH: BigInt('2000000000000000'), // 0.002 ETH
    color: 'gold',
    gradient: 'from-yellow-400 to-amber-500',
  },
];

const RARITY_COLORS: Record<string, string> = {
  Default: 'bg-gray-500',
  Common: 'bg-green-500',
  Uncommon: 'bg-blue-500',
  Rare: 'bg-purple-500',
  Legendary: 'bg-gradient-to-r from-yellow-400 to-amber-500',
};

interface CharacterShopProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCharacters: boolean[];
  selectedCharacter: string;
  onSelectCharacter: (character: string) => void;
  onPurchase: (characterId: number, price: bigint) => void;
  isConnected: boolean;
  isOnBase: boolean;
  onSwitchNetwork: () => void;
}

const CharacterShop: React.FC<CharacterShopProps> = ({
  isOpen,
  onClose,
  ownedCharacters,
  selectedCharacter,
  onSelectCharacter,
  onPurchase,
  isConnected,
  isOnBase,
  onSwitchNetwork,
}) => {
  const handlePurchase = (character: Character) => {
    // Only allow purchase for paid characters (id > 0)
    if (character.id > 0) {
      if (!isOnBase) {
        onSwitchNetwork();
        return;
      }
      onPurchase(character.id, character.priceETH);
    }
  };

  const handleSelect = (character: Character) => {
    // Orange Fish (id 0) is always owned
    if (character.id === 0 || ownedCharacters[character.id]) {
      onSelectCharacter(character.color);
    }
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
            className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-b from-indigo-900 to-purple-950 rounded-3xl shadow-2xl border border-purple-400/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-purple-800/50 to-transparent">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-2xl">×</span>
              </button>
              
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 text-center">
                🛒 Character Shop
              </h2>
              <p className="text-center text-purple-300 mt-2 text-sm">
                Collect unique fish to play with!
              </p>
            </div>

            {/* Network Warning */}
            {isConnected && !isOnBase && (
              <div className="mx-4 mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-red-200">
                    Switch to Base Network to buy characters
                  </p>
                  <button
                    onClick={onSwitchNetwork}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Switch
                  </button>
                </div>
              </div>
            )}

            {/* Character Grid */}
            <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-3">
                {CHARACTERS.map((character, index) => {
                  // Orange Fish (id 0) is ALWAYS owned - no claim needed
                  const isOwned = character.id === 0 || ownedCharacters[character.id];
                  const isSelected = selectedCharacter === character.color;

                  return (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative p-4 rounded-2xl transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border-2 border-emerald-400'
                          : isOwned
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                          : 'bg-black/20 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Character Avatar */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                          className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${character.gradient} flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-5xl">{character.emoji}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <span className="text-white text-lg">✓</span>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Character Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{character.name}</h3>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white ${RARITY_COLORS[character.rarity]}`}>
                            {character.rarity}
                          </span>
                          
                          {/* Price or Status */}
                          <div className="mt-2">
                            {isOwned ? (
                              <span className="text-emerald-400 font-medium">✓ Owned</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400 font-bold">
                                  ${character.priceUSD}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  (~{formatEther(character.priceETH)} ETH)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button - min 44px touch target */}
                        <div className="flex-shrink-0">
                          {isOwned ? (
                            <button
                              onClick={() => handleSelect(character)}
                              disabled={isSelected}
                              className={`min-w-[80px] min-h-[44px] px-4 py-3 rounded-xl font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 text-white cursor-default'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePurchase(character)}
                              disabled={!isConnected}
                              className={`min-w-[80px] min-h-[44px] px-4 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isOnBase
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300'
                              }`}
                            >
                              {!isOnBase ? 'Switch' : 'Buy'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Legendary glow effect */}
                      {character.rarity === 'Legendary' && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-amber-500/20 pointer-events-none"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer Info */}
            <div className="px-6 py-4 bg-gradient-to-t from-purple-950 to-transparent border-t border-purple-500/20">
              <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
                <span className="text-blue-400">⟠</span>
                <span>All purchases are on Base Network (sub-cent fees)</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
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

export default CharacterShop;
