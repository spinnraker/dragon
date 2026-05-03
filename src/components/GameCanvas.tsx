import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Sparkles, Play } from 'lucide-react';

const FPS = 60;
const DRAGON_SIZE = 40;
const GRAVITY = 0.4;
const JUMP_STRENGTH = -8;
const INITIAL_SPEED = 4;
const SPEED_INCREMENT = 0.001;
const OBSTACLE_SPAWN_RATE = 100; // frames
const COLLECTIBLE_SPAWN_RATE = 150; // frames

interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Soft Modern Palette
const COLORS = {
  SKY_TOP: '#E0F2FE',
  SKY_BOTTOM: '#F0FDFA',
  DRAGON_BODY: '#FB7185', // Friendly Rose Red
  DRAGON_BELLY: '#FFF1F2', // Very Light Peach/Red
  DRAGON_WINGS: '#FDA4AF', // Soft Pinkish Red
  DRAGON_SPIKES: '#FECACA', // Light Red Accents
  STAR: '#FEF08A',
  CLOUD: 'rgba(255, 255, 255, 0.8)',
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Minimal state
  const [isInitialized, setIsInitialized] = useState(false);

  // Game Logic Refs
  const gameData = useRef({
    dragonX: 0,
    dragonY: 0,
    targetY: 0,
    collectibles: [] as { id: number; x: number; y: number; active: boolean; scale: number; color: string }[],
    frame: 0,
    nextId: 0,
  });

  useEffect(() => {
    gameData.current.dragonY = window.innerHeight / 2;
    gameData.current.targetY = window.innerHeight / 2;
    setIsInitialized(true);
  }, []);

  const handleInput = useCallback((e: any) => {
    if (!canvasRef.current) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    gameData.current.targetY = clientY - DRAGON_SIZE / 2;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleInput);
    window.addEventListener('touchmove', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleInput);
      window.removeEventListener('touchmove', handleInput);
      window.removeEventListener('mousedown', handleInput);
      window.removeEventListener('touchstart', handleInput);
    };
  }, [handleInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const drawDragon = (x: number, y: number, frame: number) => {
      const size = DRAGON_SIZE * 1.5;
      const wingWobble = Math.sin(frame * 0.1) * 10;

      ctx.save();
      ctx.translate(x, y + Math.sin(frame * 0.05) * 5); // Gentle floating

      // 1. Wings (behind)
      ctx.fillStyle = COLORS.DRAGON_WINGS;
      ctx.beginPath();
      ctx.ellipse(-10, 10 + wingWobble, 25, 15, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Tail
      ctx.fillStyle = COLORS.DRAGON_BODY;
      ctx.beginPath();
      ctx.moveTo(-20, 20);
      ctx.quadraticCurveTo(-45, 30, -35, 10);
      ctx.lineTo(-20, 15);
      ctx.fill();

      // 3. Body (Round & Soft)
      ctx.fillStyle = COLORS.DRAGON_BODY;
      ctx.beginPath();
      ctx.ellipse(0, 20, 35, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Belly
      ctx.fillStyle = COLORS.DRAGON_BELLY;
      ctx.beginPath();
      ctx.ellipse(5, 28, 25, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Head
      ctx.fillStyle = COLORS.DRAGON_BODY;
      ctx.beginPath();
      ctx.ellipse(30, 5, 22, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Spikes (Soft Rounded)
      ctx.fillStyle = COLORS.DRAGON_SPIKES;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-5 - (i * 12), 5 - (i * 2), 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Eyes (Large & Friendly)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(38, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      const lookDown = Math.max(-2, Math.min(2, (gameData.current.targetY - gameData.current.dragonY) / 50));
      ctx.arc(41, 1 + lookDown, 3, 0, Math.PI * 2);
      ctx.fill();

      // 8. Cheeks
      ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
      ctx.beginPath();
      ctx.arc(35, 12, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;
      const { frame } = gameData.current;

      // 1. BACKGROUND (Gentle Sky)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, COLORS.SKY_TOP);
      grad.addColorStop(1, COLORS.SKY_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Distant Clouds (Super Slow)
      ctx.fillStyle = COLORS.CLOUD;
      for (let i = 0; i < 8; i++) {
        const cx = (Math.sin(i * 999) * 5000 - frame * 0.4) % (width + 400);
        const cy = (Math.cos(i * 777) * 300 + height / 2) % height;
        ctx.beginPath();
        ctx.arc(cx + 100, cy, 40, 0, Math.PI * 2);
        ctx.arc(cx + 140, cy - 15, 50, 0, Math.PI * 2);
        ctx.arc(cx + 190, cy, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. UPDATE POSITION
      const dy = gameData.current.targetY - gameData.current.dragonY;
      gameData.current.dragonY += dy * 0.05; // Even smoother
      gameData.current.dragonX = width / 4;
      gameData.current.frame++;

      // 3. SPAWN STARS
      if (frame % 120 === 0) {
        const starColors = ['#FDE68A', '#F9A8D4', '#93C5FD'];
        gameData.current.collectibles.push({
          id: gameData.current.nextId++,
          x: width + 50,
          y: Math.random() * (height - 150) + 75,
          active: true,
          scale: 1,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }

      // 4. MOVE & DRAW STARS
      gameData.current.collectibles = gameData.current.collectibles.filter(item => {
        item.x -= 2.5; // Slower speed
        
        const dist = Math.sqrt(Math.pow(gameData.current.dragonX - item.x, 2) + Math.pow(gameData.current.dragonY - item.y, 2));
        
        if (dist < 60 && item.active) {
            item.active = false;
        }

        if (!item.active) {
            item.scale *= 0.85;
            item.y -= 3;
        }

        if (item.scale > 0.05) {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.scale(item.scale, item.scale);
            ctx.rotate(frame * 0.015);
            ctx.fillStyle = item.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = item.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos(i * 0.8 * Math.PI) * 18, Math.sin(i * 0.8 * Math.PI) * 18);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        return item.x > -50 && item.scale > 0.05;
      });

      // 5. DRAW DRAGON
      drawDragon(gameData.current.dragonX, gameData.current.dragonY, frame);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-sky-50 select-none cursor-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      
      {!isInitialized && (
         <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm z-50">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
         </div>
      )}

      <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-40">
          <p className="text-blue-400 text-lg tracking-[0.3em] font-medium uppercase">Quiet Skies</p>
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-none opacity-20 animate-bounce">
          <Sparkles className="text-blue-300 w-16 h-16" />
      </div>
    </div>
  );
};


export default GameCanvas;
