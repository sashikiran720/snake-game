import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, RotateCcw, Gamepad2, VolumeX, Music, Disc3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRID_SIZE = 20;

const TRACKS = [
  { id: 1, title: "Neon Synth Grid", artist: "AI_Gen_1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: "3:40" },
  { id: 2, title: "Cyber Drift", artist: "AI_Gen_2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", duration: "4:15" },
  { id: 3, title: "Retro Hacker", artist: "AI_Gen_3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: "2:50" }
];

const generateFood = (currentSnake: { x: number, y: number }[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function App() {
  // Game states
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(150);

  const directionRef = useRef(direction);

  // Music Player states
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when playing
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === " " && gameOver) {
        resetGame();
        return;
      }

      if (e.key === " " && !gameStarted) {
        setGameStarted(true);
        return;
      }

      if (e.key === "Escape") {
        setIsPaused(p => !p);
        return;
      }

      if (!gameStarted || isPaused || gameOver) return;

      const { x, y } = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prev => {
      const head = prev[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prev;
      }

      // Self collision
      if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        setSpeed(s => Math.max(60, s - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, isPaused, score, highScore]);

  useInterval(moveSnake, (gameOver || isPaused || !gameStarted) ? null : speed);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    setFood({ x: 5, y: 5 });
    setGameOver(false);
    setScore(0);
    setSpeed(150);
    setGameStarted(true);
    setIsPaused(false);
  };

  // Audio setup
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log("Audio play blocked by browser. User interaction needed.");
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying, volume]);

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col p-4 md:p-8">
      {/* Header spanning top */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 w-full max-w-[1024px] mx-auto gap-4">
        <div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">CYBER_SNAKE</h1>
          <p className="text-xs md:text-sm tracking-[0.4em] text-gray-500 uppercase font-bold mt-2">Music & Arcade Hybrid Interface</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Current Score</p>
          <div className="font-['Impact','Arial_Narrow_Bold',sans-serif] text-[64px] md:text-[84px] leading-[0.8] tracking-[-2px] text-[#39FF14]">
            {score.toString().padStart(4, '0')}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1024px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left side: Music Player */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex-1 shadow-lg">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6 font-bold flex items-center gap-2">
              <Music className="w-4 h-4 text-[#FF00FF]" /> Now Playing
            </h2>
            
            {/* Visualizer / Album Art Placeholders */}
            <div className="w-full aspect-square rounded-lg bg-black/40 border border-white/5 mb-6 relative flex items-center justify-center overflow-hidden">
              {isPlaying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-[#FF00FF] flex items-center justify-center relative shadow-[0_0_20px_rgba(255,0,255,0.2)]"
                >
                  <Disc3 className="w-10 h-10 text-[#FF00FF]" />
                </motion.div>
              ) : (
                <div className="w-32 h-32 rounded-full border border-gray-800 flex items-center justify-center">
                  <Disc3 className="w-10 h-10 text-gray-600" />
                </div>
              )}
            </div>

            <div className="space-y-2 mb-6">
              {TRACKS.map((track, i) => (
                <div 
                  key={track.id} 
                  onClick={() => {
                    setCurrentTrackIndex(i);
                    setIsPlaying(true);
                  }}
                  className={`p-3 cursor-pointer transition-colors ${i === currentTrackIndex ? 'border-l-4 border-[#FF00FF] bg-[#FF00FF]/5' : 'hover:bg-white/5'}`}
                >
                  <p className={`text-sm font-bold ${i === currentTrackIndex ? 'text-white' : 'text-gray-400'}`}>{track.title}</p>
                  <p className={`text-[10px] uppercase ${i === currentTrackIndex ? 'text-[#FF00FF]' : 'text-gray-600'}`}>{track.artist}</p>
                </div>
              ))}
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 text-gray-500 mb-4 px-2">
              {volume === 0 ? <VolumeX className="w-4 h-4 text-gray-600" /> : <Volume2 className="w-4 h-4 text-[#FF00FF]/70" />}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#FF00FF]"
              />
            </div>
          </div>
        </section>

        {/* Center: Game Grid */}
        <section className="lg:col-span-6 flex justify-center order-first lg:order-none">
          <div className="relative aspect-square w-full max-w-[480px] bg-[#0f0f0f] border-[4px] border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
            {/* Grid layout for cells */}
            <div
              className="absolute inset-[2px] grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div key={i} className={`w-full h-full transition-colors duration-75 ${
                    isHead ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF14] rounded-sm z-10' :
                      isBody ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF14] rounded-sm' :
                        isFood ? 'bg-[#FF00FF] shadow-[0_0_15px_#FF00FF] rounded-full z-10' :
                          'bg-transparent'
                    }`} />
                );
              })}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {!gameStarted && !gameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
                >
                  <Gamepad2 className="w-16 h-16 text-[#39FF14] mb-6 drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]" />
                  <h3 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">System Ready</h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-[200px] leading-relaxed font-bold">WASD - MOVE<br/>SPACE - PAUSE/START</p>
                  <button
                    onClick={() => setGameStarted(true)}
                    className="px-8 py-3 bg-[#39FF14] text-black font-black rounded uppercase tracking-widest shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-white transition-colors"
                  >
                    Start Sync
                  </button>
                </motion.div>
              )}

              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-4 border-[#FF00FF] z-20"
                >
                  <h3 className="text-5xl font-black text-[#FF00FF] mb-2 tracking-tighter uppercase italic">Signal Lost</h3>
                  <div className="my-8">
                    <p className="text-gray-400 text-sm tracking-[0.2em] font-bold uppercase mb-1">Final Score</p>
                    <p className="font-['Impact'] text-[64px] leading-[0.8] text-white tracking-[-2px]">{score}</p>
                  </div>
                  <button
                    onClick={resetGame}
                    className="flex items-center gap-2 px-8 py-3 bg-transparent border-2 border-[#FF00FF] hover:bg-[#FF00FF] text-white font-bold rounded uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all"
                  >
                    <RotateCcw className="w-5 h-5" /> Reboot
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right side: Stats & Controls */}
        <section className="lg:col-span-3 flex flex-col gap-4 text-left lg:text-right h-full">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 flex-1 flex flex-col justify-between shadow-lg h-full">
            <div className="mb-6 lg:mb-0">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Level</p>
              <p className="text-4xl font-black italic">0{Math.floor(score / 50) + 1}</p>
            </div>
            <div className="mb-6 lg:mb-0">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Personal Best</p>
              <p className="text-4xl font-black italic text-[#FF00FF]">{highScore.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Controls</p>
              <p className="text-xs font-mono leading-relaxed text-gray-400 uppercase">
                WASD - MOVE<br/>
                SPACE - PAUSE<br/>
                ESC - MENU
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer / Music Controls spanning bottom like an active buffer */}
      <footer className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 max-w-[1024px] w-full mx-auto gap-8">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex gap-4">
            <button
              onClick={handlePrevTrack}
              className="w-10 h-10 flex items-center justify-center hover:text-[#FF00FF] transition-colors text-gray-400"
            >
              <SkipBack className="w-6 h-6" fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-[#FF00FF] hover:text-white transition-colors shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 pl-1" fill="currentColor" />}
            </button>
            <button
              onClick={handleNextTrack}
              className="w-10 h-10 flex items-center justify-center hover:text-[#FF00FF] transition-colors text-gray-400"
            >
              <SkipForward className="w-6 h-6" fill="currentColor" />
            </button>
          </div>
          
          {/* Progress bar visual (fake) */}
          <div className="h-1 flex-1 min-w-[100px] max-w-[300px] bg-white/10 rounded-full relative hidden sm:block">
            {isPlaying && (
              <motion.div 
                animate={{ width: ["0%", "100%"] }} 
                transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 top-0 h-full bg-[#FF00FF] rounded-full shadow-[0_0_10px_rgba(255,0,255,0.5)]" 
              />
            )}
          </div>
        </div>

        <div className="text-[10px] sm:text-xs text-gray-600 font-bold uppercase tracking-widest text-right">
          Hardware Accel: EN // Buffer: OPTIMAL
        </div>
      </footer>

      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleNextTrack}
      />
    </div>
  );
}
