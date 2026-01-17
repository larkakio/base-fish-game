import Phaser from 'phaser';

// Game configuration constants - adjusted dynamically
let GRID_SIZE = 8;
let TILE_SIZE = 64;
const MATCH_MIN = 3;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Color hex values for fish
const FISH_COLORS = {
  red: { body: 0xff4757, fin: 0xc0392b, highlight: 0xff6b7a },
  blue: { body: 0x3498db, fin: 0x2980b9, highlight: 0x5dade2 },
  green: { body: 0x2ecc71, fin: 0x27ae60, highlight: 0x58d68d },
  yellow: { body: 0xf1c40f, fin: 0xf39c12, highlight: 0xf4d03f },
  purple: { body: 0x9b59b6, fin: 0x8e44ad, highlight: 0xbb8fce },
  orange: { body: 0xe67e22, fin: 0xd35400, highlight: 0xf0b27a },
};

// Level configurations
const LEVEL_CONFIGS = {
  1: { moves: 30, targetScore: 500 },
  2: { moves: 28, targetScore: 800 },
  3: { moves: 26, targetScore: 1200 },
  4: { moves: 24, targetScore: 1600 },
  5: { moves: 22, targetScore: 2000 },
  6: { moves: 20, targetScore: 2500 },
  7: { moves: 18, targetScore: 3000 },
  8: { moves: 16, targetScore: 3500 },
  9: { moves: 14, targetScore: 4000 },
  10: { moves: 12, targetScore: 5000 },
};

// Global game data
let gameData = {
  level: 1,
  character: 'orange',
  onScoreUpdate: () => {},
  onMovesUpdate: () => {},
  onLevelComplete: () => {},
  onGameOver: () => {},
};

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    
    // Minimal UI height (45px) + tiny padding (10px top, 5px bottom)
    const uiHeight = 55;
    const bottomPadding = 10;
    const sidePadding = 8;
    
    // Calculate max available space for grid
    const availableHeight = screenHeight - uiHeight - bottomPadding;
    const availableWidth = screenWidth - (sidePadding * 2);
    
    // Calculate optimal tile size - maximize for mobile
    const maxTileWidth = Math.floor(availableWidth / GRID_SIZE);
    const maxTileHeight = Math.floor(availableHeight / GRID_SIZE);
    TILE_SIZE = Math.min(maxTileWidth, maxTileHeight);
    TILE_SIZE = Math.max(TILE_SIZE, 36); // Min 36px for very small screens
    
    console.log(`Screen: ${screenWidth}x${screenHeight}, Tile: ${TILE_SIZE}px`);

    // Create fish textures
    this.createFishTextures();
    this.createHeroFishTexture();
    
    // Start game
    this.time.delayedCall(50, () => {
      this.scene.start('GameScene', { ...gameData });
    });
  }

  createFishTextures() {
    const size = 64;
    
    Object.entries(FISH_COLORS).forEach(([name, colors]) => {
      if (this.textures.exists(name)) return;
      
      const g = this.make.graphics({ add: false });
      
      // Fish body
      g.fillStyle(colors.body, 1);
      g.fillEllipse(32, 32, 52, 36);
      
      // Tail
      g.fillStyle(colors.fin, 1);
      g.fillTriangle(4, 32, 18, 18, 18, 46);
      
      // Top fin
      g.fillTriangle(26, 14, 40, 14, 33, 4);
      
      // Bottom fin  
      g.fillTriangle(26, 50, 40, 50, 33, 60);
      
      // Highlight
      g.fillStyle(colors.highlight, 0.6);
      g.fillEllipse(40, 25, 22, 14);
      
      // Eye
      g.fillStyle(0xffffff, 1);
      g.fillCircle(47, 28, 9);
      g.fillStyle(0x000000, 1);
      g.fillCircle(49, 28, 5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(51, 26, 2);
      
      // Smile
      g.lineStyle(2, 0x000000, 0.4);
      g.beginPath();
      g.arc(47, 38, 5, 0.3, Math.PI - 0.3, false);
      g.strokePath();
      
      g.generateTexture(name, size, size);
      g.destroy();
    });
  }

  createHeroFishTexture() {
    // Larger, more detailed hero fish (96x96)
    const char = gameData.character || 'orange';
    const colors = FISH_COLORS[char] || FISH_COLORS.orange;
    const name = 'hero_fish';
    
    if (this.textures.exists(name)) return;
    
    const g = this.make.graphics({ add: false });
    const cx = 48, cy = 48;
    
    // Larger body with gradient effect
    g.fillStyle(colors.body, 1);
    g.fillEllipse(cx, cy, 80, 55);
    
    // Tail fin (larger)
    g.fillStyle(colors.fin, 1);
    g.fillTriangle(4, cy, 24, cy - 22, 24, cy + 22);
    
    // Top dorsal fin
    g.fillTriangle(36, 18, 60, 18, 48, 4);
    
    // Bottom fin
    g.fillTriangle(36, 78, 60, 78, 48, 92);
    
    // Side fin
    g.fillTriangle(40, cy + 8, 55, cy + 20, 35, cy + 25);
    
    // Body highlight (shine)
    g.fillStyle(colors.highlight, 0.7);
    g.fillEllipse(cx + 12, cy - 10, 35, 20);
    
    // Eye (larger, more expressive)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(68, 40, 14);
    g.fillStyle(0x000000, 1);
    g.fillCircle(72, 40, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(75, 36, 4);
    
    // Cute smile
    g.lineStyle(3, 0x000000, 0.5);
    g.beginPath();
    g.arc(68, 55, 10, 0.3, Math.PI - 0.3, false);
    g.strokePath();
    
    // Cheek blush
    g.fillStyle(0xff9999, 0.4);
    g.fillCircle(55, 52, 8);
    
    g.generateTexture(name, 96, 96);
    g.destroy();
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.grid = [];
    this.selectedTile = null;
    this.canMove = false;
    this.score = 0;
    this.combo = 0;
    
    this.currentLevel = data?.level || 1;
    this.selectedCharacter = data?.character || 'orange';
    this.onScoreUpdate = data?.onScoreUpdate || (() => {});
    this.onMovesUpdate = data?.onMovesUpdate || (() => {});
    this.onLevelComplete = data?.onLevelComplete || (() => {});
    this.onGameOver = data?.onGameOver || (() => {});
    
    const config = LEVEL_CONFIGS[this.currentLevel] || LEVEL_CONFIGS[1];
    this.movesLeft = config.moves;
    this.targetScore = config.targetScore;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Premium underwater background
    this.createPremiumBackground(w, h);
    
    // Water ripple effect
    this.createWaterRipples(w, h);
    
    // Floating bubbles
    this.createBubbles(w, h);
    
    // Compact UI at very top
    this.createTopUI(w);
    
    // Game grid with minimal padding
    this.createGrid(w, h);
    
    // Level popup
    this.showLevelStart(w, h);
    
    this.onScoreUpdate(this.score);
    this.onMovesUpdate(this.movesLeft);
  }

  createPremiumBackground(w, h) {
    const graphics = this.add.graphics();
    
    // Deep ocean gradient with richer colors
    for (let y = 0; y < h; y++) {
      const ratio = y / h;
      const r = Math.floor(5 + ratio * 12);
      const g = Math.floor(35 + ratio * 45);
      const b = Math.floor(85 + ratio * 95);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      graphics.fillRect(0, y, w, 1);
    }
    
    // Light rays from surface (more prominent)
    const rays = this.add.graphics();
    rays.fillStyle(0x4ecdc4, 0.04);
    
    rays.fillTriangle(w * 0.15, 0, w * 0.05, h * 0.85, w * 0.3, h * 0.85);
    rays.fillTriangle(w * 0.45, 0, w * 0.35, h * 0.95, w * 0.6, h * 0.95);
    rays.fillTriangle(w * 0.75, 0, w * 0.65, h * 0.75, w * 0.88, h * 0.75);
    
    // Additional ambient light
    rays.fillStyle(0x87ceeb, 0.02);
    rays.fillTriangle(w * 0.3, 0, w * 0.2, h * 0.6, w * 0.42, h * 0.6);
    rays.fillTriangle(w * 0.6, 0, w * 0.52, h * 0.7, w * 0.72, h * 0.7);
  }

  createWaterRipples(w, h) {
    // Animated caustic light patterns
    const rippleContainer = this.add.container(0, 0);
    
    for (let i = 0; i < 6; i++) {
      const ripple = this.add.ellipse(
        Phaser.Math.Between(50, w - 50),
        Phaser.Math.Between(100, h - 100),
        Phaser.Math.Between(100, 200),
        Phaser.Math.Between(60, 120),
        0x4ecdc4,
        0.03
      );
      rippleContainer.add(ripple);
      
      // Animate ripples
      this.tweens.add({
        targets: ripple,
        scaleX: { from: 0.8, to: 1.2 },
        scaleY: { from: 0.9, to: 1.1 },
        alpha: { from: 0.02, to: 0.05 },
        x: ripple.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 500,
      });
    }
  }

  createBubbles(w, h) {
    // Create bubble texture
    if (!this.textures.exists('bubble')) {
      const bg = this.make.graphics({ add: false });
      bg.fillStyle(0xffffff, 0.5);
      bg.fillCircle(8, 8, 7);
      bg.fillStyle(0xffffff, 0.9);
      bg.fillCircle(5, 5, 3);
      bg.generateTexture('bubble', 16, 16);
      bg.destroy();
    }
    
    // More bubbles for premium feel
    this.add.particles(0, h + 30, 'bubble', {
      x: { min: 0, max: w },
      lifespan: 6000,
      speedY: { min: -30, max: -70 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.7, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      frequency: 200,
    });
    
    // Small sparkles
    this.add.particles(w / 2, h / 2, 'bubble', {
      x: { min: -w/2, max: w/2 },
      y: { min: -h/2, max: h/2 },
      lifespan: 3000,
      speedY: { min: -15, max: 15 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: 500,
    });
  }

  createTopUI(w) {
    const topY = 8;
    const panelHeight = 40;
    
    // Left side: Hero fish + Score
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x000000, 0.5);
    leftPanel.fillRoundedRect(8, topY, 140, panelHeight, 10);
    
    // Animated hero fish
    if (this.textures.exists('hero_fish')) {
      this.heroFish = this.add.sprite(38, topY + panelHeight / 2, 'hero_fish');
      this.heroFish.setScale(0.42);
      
      // Swimming animation
      this.tweens.add({
        targets: this.heroFish,
        y: this.heroFish.y - 3,
        angle: { from: -5, to: 5 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    
    // Score text
    this.add.text(62, topY + 6, 'SCORE', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4',
    });
    this.scoreText = this.add.text(62, topY + 18, '0', {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    });
    
    // Center: Moves
    const centerX = w / 2;
    const movesPanel = this.add.graphics();
    movesPanel.fillStyle(0x000000, 0.5);
    movesPanel.fillRoundedRect(centerX - 45, topY, 90, panelHeight, 10);
    
    this.add.text(centerX - 20, topY + 6, 'MOVES', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4',
    });
    this.movesText = this.add.text(centerX, topY + 20, String(this.movesLeft), {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    
    // Right: Level & Target
    const rightPanel = this.add.graphics();
    rightPanel.fillStyle(0x000000, 0.5);
    rightPanel.fillRoundedRect(w - 108, topY, 100, panelHeight, 10);
    
    this.add.text(w - 100, topY + 6, `LVL ${this.currentLevel}`, {
      fontSize: '12px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffd700',
    });
    this.add.text(w - 100, topY + 22, `🎯 ${this.targetScore}`, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    });
  }

  createGrid(w, h) {
    const gridWidth = GRID_SIZE * TILE_SIZE;
    const gridHeight = GRID_SIZE * TILE_SIZE;
    
    // Position grid right below UI with minimal gap
    const uiBottom = 52;
    const offsetX = (w - gridWidth) / 2;
    const offsetY = uiBottom + (h - uiBottom - gridHeight) / 2;

    this.gridContainer = this.add.container(offsetX, offsetY);

    // Subtle grid background
    const gridBg = this.add.graphics();
    gridBg.fillStyle(0x000000, 0.3);
    gridBg.fillRoundedRect(-8, -8, gridWidth + 16, gridHeight + 16, 12);
    this.gridContainer.add(gridBg);

    // Create tiles
    for (let row = 0; row < GRID_SIZE; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = this.createTile(row, col);
        if (tile) {
          this.grid[row][col] = tile;
          this.gridContainer.add(tile);
        }
      }
    }

    this.removeInitialMatches();
  }

  createTile(row, col, color = null) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const tileColor = color || COLORS[Phaser.Math.Between(0, COLORS.length - 1)];
    
    if (!this.textures.exists(tileColor)) {
      this.createFallbackTexture(tileColor);
    }
    
    const tile = this.add.sprite(x, y, tileColor);
    const scale = (TILE_SIZE - 4) / 64; // Minimal gap between fish
    tile.setScale(scale);
    tile.setInteractive({ useHandCursor: true });
    
    tile.row = row;
    tile.col = col;
    tile.color = tileColor;
    tile.baseScale = scale;

    tile.on('pointerdown', () => this.onTileClick(tile));
    tile.on('pointerover', () => {
      if (this.canMove && tile !== this.selectedTile) {
        this.tweens.add({ targets: tile, scale: scale * 1.12, duration: 80 });
      }
    });
    tile.on('pointerout', () => {
      if (tile !== this.selectedTile) {
        this.tweens.add({ targets: tile, scale: scale, duration: 80 });
      }
    });

    return tile;
  }

  createFallbackTexture(name) {
    const colors = FISH_COLORS[name] || { body: 0x888888 };
    const g = this.make.graphics({ add: false });
    g.fillStyle(colors.body, 1);
    g.fillCircle(32, 32, 28);
    g.generateTexture(name, 64, 64);
    g.destroy();
  }

  showLevelStart(w, h) {
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);
    
    // Big animated fish
    const bigFish = this.add.text(w / 2, h / 2 - 80, '🐠', { fontSize: '72px' }).setOrigin(0.5);
    this.tweens.add({
      targets: bigFish,
      y: bigFish.y - 15,
      angle: { from: -10, to: 10 },
      duration: 600,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
    
    const levelText = this.add.text(w / 2, h / 2, `Level ${this.currentLevel}`, {
      fontSize: '44px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    
    const targetText = this.add.text(w / 2, h / 2 + 50, `Target: ${this.targetScore}`, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    const goText = this.add.text(w / 2, h / 2 + 90, '🎮 TAP TO START', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4',
    }).setOrigin(0.5);
    
    // Blink effect
    this.tweens.add({
      targets: goText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Click anywhere to start
    this.input.once('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, bigFish, levelText, targetText, goText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          bigFish.destroy();
          levelText.destroy();
          targetText.destroy();
          goText.destroy();
          this.canMove = true;
          this.time.delayedCall(100, () => this.checkMatches());
        },
      });
    });
  }

  removeInitialMatches() {
    let hasMatches = true;
    let iterations = 0;
    
    while (hasMatches && iterations < 100) {
      hasMatches = false;
      iterations++;
      
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (!this.grid[row]?.[col]) continue;
          if (this.findMatchesAt(row, col).length >= MATCH_MIN) {
            hasMatches = true;
            const newColor = this.getNewColorFor(row, col);
            this.grid[row][col].color = newColor;
            this.grid[row][col].setTexture(newColor);
          }
        }
      }
    }
  }

  getNewColorFor(row, col) {
    const used = new Set();
    if (this.grid[row]?.[col - 1]) used.add(this.grid[row][col - 1].color);
    if (this.grid[row]?.[col + 1]) used.add(this.grid[row][col + 1].color);
    if (this.grid[row - 1]?.[col]) used.add(this.grid[row - 1][col].color);
    if (this.grid[row + 1]?.[col]) used.add(this.grid[row + 1][col].color);
    const available = COLORS.filter(c => !used.has(c));
    return available[Phaser.Math.Between(0, available.length - 1)] || COLORS[0];
  }

  onTileClick(tile) {
    if (!this.canMove || !tile) return;

    if (!this.selectedTile) {
      this.selectedTile = tile;
      this.tweens.add({
        targets: tile,
        scale: tile.baseScale * 1.18,
        duration: 120,
        yoyo: true,
        repeat: -1,
      });
    } else if (this.selectedTile === tile) {
      this.tweens.killTweensOf(tile);
      tile.setScale(tile.baseScale);
      this.selectedTile = null;
    } else if (this.isAdjacent(this.selectedTile, tile)) {
      this.swapTiles(this.selectedTile, tile);
    } else {
      this.tweens.killTweensOf(this.selectedTile);
      this.selectedTile.setScale(this.selectedTile.baseScale);
      this.selectedTile = tile;
      this.tweens.add({
        targets: tile,
        scale: tile.baseScale * 1.18,
        duration: 120,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  isAdjacent(t1, t2) {
    const dr = Math.abs(t1.row - t2.row);
    const dc = Math.abs(t1.col - t2.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  swapTiles(t1, t2) {
    this.canMove = false;
    this.tweens.killTweensOf(t1);
    t1.setScale(t1.baseScale);
    this.selectedTile = null;

    const r1 = t1.row, c1 = t1.col, r2 = t2.row, c2 = t2.col;
    const x1 = t1.x, y1 = t1.y, x2 = t2.x, y2 = t2.y;

    this.tweens.add({ targets: t1, x: x2, y: y2, duration: 150, ease: 'Power2' });
    this.tweens.add({
      targets: t2, x: x1, y: y1, duration: 150, ease: 'Power2',
      onComplete: () => {
        t1.row = r2; t1.col = c2;
        t2.row = r1; t2.col = c1;
        this.grid[r1][c1] = t2;
        this.grid[r2][c2] = t1;

        const m1 = this.findMatchesAt(r2, c2);
        const m2 = this.findMatchesAt(r1, c1);

        if (m1.length >= MATCH_MIN || m2.length >= MATCH_MIN) {
          this.combo = 0;
          this.movesLeft--;
          this.movesText.setText(String(this.movesLeft));
          this.onMovesUpdate(this.movesLeft);
          this.checkMatches();
        } else {
          this.swapBack(t1, t2, r1, c1, r2, c2);
        }
      },
    });
  }

  swapBack(t1, t2, r1, c1, r2, c2) {
    const x1 = c1 * TILE_SIZE + TILE_SIZE / 2;
    const y1 = r1 * TILE_SIZE + TILE_SIZE / 2;
    const x2 = c2 * TILE_SIZE + TILE_SIZE / 2;
    const y2 = r2 * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({ targets: t1, x: x2, y: y2, duration: 150, ease: 'Power2' });
    this.tweens.add({
      targets: t2, x: x1, y: y1, duration: 150, ease: 'Power2',
      onComplete: () => {
        t1.row = r2; t1.col = c2;
        t2.row = r1; t2.col = c1;
        this.grid[r1][c1] = t2;
        this.grid[r2][c2] = t1;
        this.canMove = true;
      },
    });
  }

  findMatchesAt(row, col) {
    if (!this.grid[row]?.[col]) return [];
    const tile = this.grid[row][col];
    const color = tile.color;
    const matches = new Set([tile]);

    let left = col - 1;
    while (left >= 0 && this.grid[row]?.[left]?.color === color) { matches.add(this.grid[row][left]); left--; }
    let right = col + 1;
    while (right < GRID_SIZE && this.grid[row]?.[right]?.color === color) { matches.add(this.grid[row][right]); right++; }
    let up = row - 1;
    while (up >= 0 && this.grid[up]?.[col]?.color === color) { matches.add(this.grid[up][col]); up--; }
    let down = row + 1;
    while (down < GRID_SIZE && this.grid[down]?.[col]?.color === color) { matches.add(this.grid[down][col]); down++; }

    return (right - left - 1 >= MATCH_MIN || down - up - 1 >= MATCH_MIN) ? Array.from(matches) : [];
  }

  checkMatches() {
    const allMatches = new Set();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        this.findMatchesAt(r, c).forEach(t => allMatches.add(t));
      }
    }
    if (allMatches.size > 0) {
      this.combo++;
      this.removeTiles(Array.from(allMatches));
    } else {
      this.checkGameState();
    }
  }

  removeTiles(tiles) {
    const pts = tiles.length * 10 * Math.min(this.combo, 5);
    this.score += pts;
    this.scoreText.setText(String(this.score));
    this.onScoreUpdate(this.score);

    // Hero fish celebrates on big matches
    if (tiles.length >= 4 && this.heroFish) {
      this.tweens.add({
        targets: this.heroFish,
        angle: { from: -20, to: 20 },
        duration: 150,
        yoyo: true,
        repeat: 2,
      });
    }

    // Floating score
    const avgX = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
    const avgY = tiles.reduce((s, t) => s + t.y, 0) / tiles.length;
    const floatText = this.add.text(this.gridContainer.x + avgX, this.gridContainer.y + avgY, `+${pts}`, {
      fontSize: '26px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: floatText, y: floatText.y - 35, alpha: 0, duration: 600, onComplete: () => floatText.destroy() });

    tiles.forEach(t => {
      this.tweens.add({
        targets: t, scale: 0, alpha: 0, duration: 150,
        onComplete: () => { if (this.grid[t.row]?.[t.col] === t) this.grid[t.row][t.col] = null; },
      });
    });

    this.time.delayedCall(170, () => this.dropTiles());
  }

  dropTiles() {
    const drops = [];

    for (let col = 0; col < GRID_SIZE; col++) {
      let empty = 0;
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (!this.grid[row]?.[col]) {
          empty++;
        } else if (empty > 0) {
          const tile = this.grid[row][col];
          const newRow = row + empty;
          this.grid[newRow][col] = tile;
          this.grid[row][col] = null;
          tile.row = newRow;
          drops.push({ tile, targetY: newRow * TILE_SIZE + TILE_SIZE / 2 });
        }
      }

      for (let i = 0; i < empty; i++) {
        const row = empty - 1 - i;
        const tile = this.createTile(row, col);
        if (tile) {
          tile.y = -TILE_SIZE * (i + 1);
          this.grid[row][col] = tile;
          this.gridContainer.add(tile);
          drops.push({ tile, targetY: row * TILE_SIZE + TILE_SIZE / 2 });
        }
      }
    }

    if (drops.length > 0) {
      drops.forEach(({ tile, targetY }, i) => {
        this.tweens.add({ targets: tile, y: targetY, duration: 200 + i * 10, ease: 'Bounce.easeOut' });
      });
      this.time.delayedCall(280, () => this.checkMatches());
    } else {
      this.checkGameState();
    }
  }

  checkGameState() {
    this.canMove = true;
    if (this.score >= this.targetScore) this.showLevelComplete();
    else if (this.movesLeft <= 0) this.showGameOver();
  }

  showLevelComplete() {
    this.canMove = false;
    const w = this.scale.width, h = this.scale.height;
    
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);
    this.add.text(w / 2, h / 2 - 80, '🎉', { fontSize: '60px' }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 - 20, 'Level Complete!', {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#ffd700', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 30, `Score: ${this.score}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#fff',
    }).setOrigin(0.5);
    
    // Next Level button
    const nextLevel = this.currentLevel + 1;
    const buttonText = nextLevel <= 10 ? `Next Level (${nextLevel})` : 'You Win! 🏆';
    const btnBg = this.add.rectangle(w / 2, h / 2 + 100, 200, 50, 0x2ecc71, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x27ae60);
    const btnLabel = this.add.text(w / 2, h / 2 + 100, buttonText, {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#fff',
    }).setOrigin(0.5);
    
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x27ae60));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2ecc71));
    btnBg.on('pointerdown', () => {
      if (nextLevel <= 10) {
        // Restart scene with next level
        gameData.level = nextLevel;
        this.scene.restart({ ...gameData });
      } else {
        // Game completed - notify parent
        this.onLevelComplete(this.currentLevel, this.score, true);
      }
    });
    
    this.onLevelComplete(this.currentLevel, this.score, false);
  }

  showGameOver() {
    this.canMove = false;
    const w = this.scale.width, h = this.scale.height;
    
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);
    this.add.text(w / 2, h / 2 - 60, '😢', { fontSize: '50px' }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 - 10, 'Game Over', {
      fontSize: '38px', fontFamily: 'Arial Black', color: '#ff4757', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 40, `Score: ${this.score}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#fff',
    }).setOrigin(0.5);
    
    // Try Again button
    const btnBg = this.add.rectangle(w / 2, h / 2 + 110, 180, 50, 0x3498db, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x2980b9);
    this.add.text(w / 2, h / 2 + 110, 'Try Again', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#fff',
    }).setOrigin(0.5);
    
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x2980b9));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x3498db));
    btnBg.on('pointerdown', () => {
      // Restart current level
      this.scene.restart({ ...gameData });
    });
    
    this.onGameOver(this.score);
  }
}

// Game Manager
export class FishdomGame {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.game = null;
    this.resizeHandler = null;
  }

  start(level = 1, character = 'orange') {
    if (this.game) this.destroy();

    gameData = {
      level,
      character: character || 'orange',
      onScoreUpdate: this.options.onScoreUpdate || (() => {}),
      onMovesUpdate: this.options.onMovesUpdate || (() => {}),
      onLevelComplete: this.options.onLevelComplete || (() => {}),
      onGameOver: this.options.onGameOver || (() => {}),
    };

    const parent = this.container || document.getElementById('game-container') || document.body;
    const w = parent.offsetWidth || window.innerWidth;
    const h = parent.offsetHeight || window.innerHeight;

    const config = {
      type: Phaser.AUTO,
      parent,
      width: w,
      height: h,
      backgroundColor: '#051937',
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, GameScene],
      render: { antialias: true },
      input: { activePointers: 3 },
    };

    try {
      this.game = new Phaser.Game(config);
      window.gameInstance = this.game;
    } catch (e) {
      console.error('Game creation failed:', e);
    }

    this.resizeHandler = () => this.game?.scale?.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', this.resizeHandler);
  }

  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    window.gameInstance = null;
  }
}

export default FishdomGame;
