import { useState, useEffect, useRef } from 'react';
import { GameEngine } from './GameEngine';

// Simple Audio Synthesizer for Jumpscares & Feedback
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'death') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'jumpscare') {
      // White noise burst for traps
      const bufferSize = ctx.sampleRate * 0.3; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gain);
      gain.gain.setValueAtTime(3, ctx.currentTime); // LOUD
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      noise.start(); noise.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.error("Audio block", e);
  }
};

function App() {
  const [gameState, setGameState] = useState('menu'); // menu, roadmap, playing
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1); // Track progression
  const [deaths, setDeaths] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isGhostLevel, setIsGhostLevel] = useState(false);
  
  const [hintText, setHintText] = useState(null);
  const [skipOverlay, setSkipOverlay] = useState(null);

  const sarcasticHints = [
    "Have you tried pressing the jump button harder?",
    "Hint: The spikes are pointy. Avoid them.",
    "Maybe open your eyes while playing?",
    "Try not dying next time. Just a thought.",
    "If at first you don't succeed, you're probably playing this game.",
    "Hint: The exit is to the right.",
    "Falling into the void usually kills you.",
    "Try using telepathy. It won't work, but it's funny to watch.",
    "I'd give you a real hint, but I enjoy your suffering."
  ];

  const skipInsults = [
    "PATHETIC. GIVING UP ALREADY?",
    "WEAKNESS DISGUSTS ME.",
    "I EXPECTED NOTHING, YET YOU STILL DISAPPOINT.",
    "COWARD. RUN AWAY THEN.",
    "SKILL ISSUE DETECTED. SKIPPING.",
    "SHAMEFUL DISPLAY."
  ];
  
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Array of 100 levels
  const levelsArray = Array.from({ length: 100 }, (_, i) => i + 1);

  useEffect(() => {
    // Load progress
    const savedLvl = localStorage.getItem('hundredthFall_unlocked');
    const savedDeaths = localStorage.getItem('hundredthFall_deaths');
    if (savedLvl) setUnlockedLevel(parseInt(savedLvl));
    if (savedDeaths) setDeaths(parseInt(savedDeaths));

    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      if (engineRef.current) engineRef.current.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerDeath = () => {
    playSound('death');
    setDeaths(d => {
      const newD = d + 1;
      localStorage.setItem('hundredthFall_deaths', newD);
      return newD;
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  const triggerJumpscare = () => {
    playSound('jumpscare');
  };

  const winLevel = (completedLevel) => {
    playSound('win');
    const next = completedLevel + 1;
    if (next > unlockedLevel) {
      setUnlockedLevel(next);
      localStorage.setItem('hundredthFall_unlocked', next);
    }
    // Return to roadmap
    if (engineRef.current) engineRef.current.destroy();
    setGameState('roadmap');
  };

  const startGame = (targetLevel) => {
    setGameState('playing');
    setLevel(targetLevel);
    const ghost = targetLevel % 10 === 0;
    setIsGhostLevel(ghost);
    
    setTimeout(() => {
      if (engineRef.current) engineRef.current.destroy();
      engineRef.current = new GameEngine(
        canvasRef.current,
        targetLevel,
        triggerDeath,
        winLevel,
        triggerJumpscare
      );
      engineRef.current.resize(window.innerWidth, window.innerHeight);
      engineRef.current.start();
    }, 50);
  };

  return (
    <div className={`app-container ${gameState === 'playing' && isGhostLevel ? 'glitch-mode' : ''}`}>
      {flash && <div className="flash-red" />}
      
      <canvas 
        ref={canvasRef} 
        width={windowSize.w} 
        height={windowSize.h} 
        className={`game-canvas ${gameState === 'playing' ? 'visible' : 'hidden'} ${isGhostLevel ? 'ghost-invert' : ''}`}
      />

      {gameState === 'playing' && (
        <>
          <div className="hud">
            <div>
              <div className="game-title-hud glitch" data-text="LAST BREATH">LAST BREATH</div>
              <div className="level-indicator {isGhostLevel ? 'ghost-text' : ''}">
                LEVEL {level} {isGhostLevel ? " [ANOMALY]" : ""}
              </div>
            </div>
            
            <div className="hud-controls">
              <button className="neon-button-small hint-btn" onClick={() => {
                playSound('jumpscare');
                setHintText(sarcasticHints[Math.floor(Math.random() * sarcasticHints.length)]);
                setTimeout(() => setHintText(null), 3000);
              }}>HINT</button>
              
              <button className="neon-button-small skip-btn" onClick={() => {
                playSound('death');
                setSkipOverlay(skipInsults[Math.floor(Math.random() * skipInsults.length)]);
                if (engineRef.current) engineRef.current.isRunning = false;
                
                setTimeout(() => {
                  setSkipOverlay(null);
                  winLevel(level);
                }, 4000);
              }}>SKIP</button>
              
              <button className="neon-button-small" onClick={() => {
                if(engineRef.current) engineRef.current.destroy();
                setGameState('roadmap');
              }}>LEAVE</button>
            </div>
            
            <div className="death-counter">
              <span className="skull-icon">💀</span> {deaths}
            </div>
          </div>
          
          {hintText && <div className="hint-popup">{hintText}</div>}
          {skipOverlay && <div className="skip-overlay glitch-mode">
              <h1 className="title-roadmap glitch" data-text={skipOverlay}>{skipOverlay}</h1>
          </div>}

          <div className="instructions">
            A / D to Move. SPACE to Jump. Touch the Void Orb. Trust nothing.
          </div>
        </>
      )}

      {gameState === 'roadmap' && (
        <div className="ui-overlay scrollable">
          <h2 className="title-roadmap">THE DESCENT</h2>
          <p className="subtitle">Total Deaths: {deaths}</p>
          <div className="roadmap-grid">
            {levelsArray.map(lvl => {
              const isUnlocked = lvl <= unlockedLevel;
              const isGhost = lvl % 10 === 0;
              return (
                <button 
                  key={lvl} 
                  className={`roadmap-node ${!isUnlocked ? 'locked' : ''} ${isGhost ? 'ghost-node' : ''}`}
                  onClick={() => isUnlocked && startGame(lvl)}
                  disabled={!isUnlocked}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
          <button className="neon-button mt-4" onClick={() => setGameState('menu')}>BACK TO HUB</button>
        </div>
      )}

      {gameState === 'menu' && (
        <div className="ui-overlay">
          <div className="menu-content">
            <h1 className="title-main glitch" data-text="LAST BREATH">LAST BREATH</h1>
            <p className="subtitle">There is no escape.</p>
            <button className="start-button" onClick={() => setGameState('roadmap')}>ENTER THE VOID</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
