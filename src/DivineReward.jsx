import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Hand, Timer, Activity, Zap, Play, CheckSquare, Square, 
  ChevronLeft, Gift, AlertCircle, RefreshCw
} from 'lucide-react';

const THEME = {
  bg: 'bg-zinc-950',
  panel: 'bg-zinc-900/50 border border-amber-900/30',
  text: 'text-amber-500',
};

// Data Structures (Ordered Worst to Best)
const FINGERS = [
  { id: 1, name: '1 Finger' },
  { id: 2, name: '2 Fingers' },
  { id: 3, name: '3 Fingers' },
  { id: 4, name: 'Whole Hand' }
];

const HANDS = [
  { id: 'left', name: 'Left Hand' },
  { id: 'right', name: 'Right Hand' }
];

const ORGASMS = [
  { id: 'edge', name: 'Edge Only' },
  { id: 'ruined', name: 'Ruined Orgasm' },
  { id: 'full', name: 'Full Orgasm' }
];

const RHYTHMS = [
  { id: 160, name: '160 BPM (Frantic)' },
  { id: 60, name: '60 BPM (Slow)' },
  { id: 120, name: '120 BPM (Fast)' },
  { id: 90, name: '90 BPM (Medium)' }
];

const TIMES = [
  { id: 60, name: '1 Minute' },
  { id: 180, name: '3 Minutes' },
  { id: 300, name: '5 Minutes' },
  { id: 600, name: '10 Minutes' }
];

// Determine probability tier based on tokens
const getReward = (tokens, options) => {
  const tier = tokens < 100 ? 0 : tokens < 500 ? 1 : tokens < 1000 ? 2 : 3;
  let weights = [];
  if (tier === 0) weights = [0.6, 0.3, 0.1, 0.0];
  if (tier === 1) weights = [0.3, 0.4, 0.2, 0.1];
  if (tier === 2) weights = [0.1, 0.3, 0.4, 0.2];
  if (tier === 3) weights = [0.0, 0.1, 0.3, 0.6];
  
  // Normalize for array length
  const w = weights.slice(0, options.length);
  const sum = w.reduce((a, b) => a + b, 0);
  const r = Math.random() * sum;
  
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i];
    if (r <= acc) return options[i];
  }
  return options[options.length - 1];
};

export default function DivineReward({ back, tokens, spendAllTokens, addTokens }) {
  const [step, setStep] = useState('intro'); // intro, spinning, recap, active, completed
  const [investedTokens, setInvestedTokens] = useState(0);
  const [results, setResults] = useState(null);
  
  // Spinning State
  const [spinIndexes, setSpinIndexes] = useState([0,0,0,0,0]);
  const [spinRevealed, setSpinRevealed] = useState(0); // 0 to 5

  // Recap State
  const [consumeSeed, setConsumeSeed] = useState(false);

  // Active Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const metronomeRef = useRef(null);

  const startRitual = async () => {
    if (tokens < 1) return;
    
    const spent = tokens;
    setInvestedTokens(spent);
    await spendAllTokens(); // Drains DB tokens to 0
    
    // Calculate results based on the spent tokens
    const finalResults = {
      finger: getReward(spent, FINGERS),
      hand: getReward(spent, HANDS),
      orgasm: getReward(spent, ORGASMS),
      rhythm: getReward(spent, RHYTHMS),
      time: getReward(spent, TIMES),
    };
    
    setResults(finalResults);
    setStep('spinning');
    
    // Simulate spinning effect
    let interval = setInterval(() => {
      setSpinIndexes(prev => prev.map(() => Math.floor(Math.random() * 4)));
    }, 100);

    // Reveal one by one
    setTimeout(() => setSpinRevealed(1), 1000);
    setTimeout(() => setSpinRevealed(2), 2000);
    setTimeout(() => setSpinRevealed(3), 3000);
    setTimeout(() => setSpinRevealed(4), 4000);
    setTimeout(() => {
      setSpinRevealed(5);
      clearInterval(interval);
      setTimeout(() => setStep('recap'), 2000);
    }, 5000);
  };

  const playClick = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const startTimer = () => {
    setStep('active');
    setTimeLeft(results.time.id);
    
    // Init Audio Context for metronome
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const msPerBeat = 60000 / results.rhythm.id;
    metronomeRef.current = setInterval(() => {
      playClick();
    }, msPerBeat);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(metronomeRef.current);
          finishRitual();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishRitual = async () => {
    setStep('completed');
    if (consumeSeed) {
      // Refund 25% of spent tokens if they checked the box
      const refund = Math.floor(investedTokens * 0.25);
      if (refund > 0) {
        await addTokens(refund);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-10 duration-700">
      <button onClick={back} className="mb-8 text-amber-700 hover:text-amber-500 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
        <ChevronLeft size={16} /> Flee the Sanctuary
      </button>

      {/* 1. INTRO */}
      {step === 'intro' && (
        <div className="space-y-8 animate-in fade-in duration-700 text-center py-12">
          <Sparkles size={64} className="text-amber-500 mx-auto mb-4 animate-pulse" />
          <h2 className="font-serif text-4xl text-amber-500 mb-2 uppercase tracking-widest">Divine Reward</h2>
          <p className="text-amber-700/80 max-w-lg mx-auto mb-10">
            The Oracle will bestow a reward upon you. To proceed, you must offer ALL your accumulated tokens. 
            The magnitude of your sacrifice determines the generosity of your reward.
          </p>

          <div className="bg-zinc-900/50 border border-amber-500/50 p-8 max-w-md mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-900/10 group-hover:bg-amber-900/20 transition-colors" />
            <h3 className="text-amber-600 uppercase tracking-widest text-sm mb-4">Current Offering</h3>
            <p className="font-mono text-5xl text-amber-400 mb-8">{tokens} ⏀</p>
            
            <button 
              onClick={startRitual}
              disabled={tokens < 1}
              className="w-full py-5 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500 text-amber-400 font-serif tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 relative z-10"
            >
              Offer Tokens & Spin
            </button>
          </div>
        </div>
      )}

      {/* 2. SPINNING WHEELS */}
      {step === 'spinning' && results && (
        <div className="py-12 animate-in fade-in zoom-in-95 duration-1000 text-center">
          <h2 className="font-serif text-3xl text-amber-500 uppercase tracking-widest mb-12">The Oracle Decides</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: Hand, label: 'Fingers', value: spinRevealed >= 1 ? results.finger.name : FINGERS[spinIndexes[0]].name, revealed: spinRevealed >= 1 },
              { icon: Hand, label: 'Hand', value: spinRevealed >= 2 ? results.hand.name : HANDS[spinIndexes[1] % 2].name, revealed: spinRevealed >= 2 },
              { icon: Zap, label: 'Orgasm', value: spinRevealed >= 3 ? results.orgasm.name : ORGASMS[spinIndexes[2] % 3].name, revealed: spinRevealed >= 3 },
              { icon: Activity, label: 'Rhythm', value: spinRevealed >= 4 ? results.rhythm.name : RHYTHMS[spinIndexes[3]].name, revealed: spinRevealed >= 4 },
              { icon: Timer, label: 'Time Cap', value: spinRevealed >= 5 ? results.time.name : TIMES[spinIndexes[4]].name, revealed: spinRevealed >= 5 },
            ].map((col, idx) => (
              <div key={idx} className={`p-6 border flex flex-col items-center justify-center min-h-[160px] transition-all duration-500 ${col.revealed ? 'border-amber-400 bg-amber-900/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-amber-900/30 bg-zinc-900'}`}>
                <col.icon size={24} className={`mb-4 ${col.revealed ? 'text-amber-400' : 'text-amber-800/50'}`} />
                <p className="text-[10px] text-amber-700 uppercase tracking-widest mb-2">{col.label}</p>
                <p className={`font-serif text-sm md:text-base ${col.revealed ? 'text-amber-500' : 'text-amber-900/50 blur-[1px]'}`}>
                  {col.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-amber-700/60 uppercase tracking-[0.3em] text-xs h-4 mt-16 animate-pulse">
            {spinRevealed < 5 ? "Weaving destiny..." : "Destiny sealed."}
          </p>
        </div>
      )}

      {/* 3. RECAP */}
      {step === 'recap' && results && (
        <div className="py-8 animate-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-amber-500 uppercase tracking-widest mb-8 text-center">Your Fate is Written</h2>
          
          <div className="bg-zinc-900/40 border border-amber-900/50 p-8 rounded-sm mb-8 space-y-6">
            <div className="grid grid-cols-2 gap-y-6">
              <div><p className="text-amber-700/60 text-xs uppercase tracking-widest mb-1">Fingers</p><p className="text-amber-400 font-serif text-lg">{results.finger.name}</p></div>
              <div><p className="text-amber-700/60 text-xs uppercase tracking-widest mb-1">Hand</p><p className="text-amber-400 font-serif text-lg">{results.hand.name}</p></div>
              <div><p className="text-amber-700/60 text-xs uppercase tracking-widest mb-1">Orgasm Type</p><p className="text-amber-400 font-serif text-lg">{results.orgasm.name}</p></div>
              <div><p className="text-amber-700/60 text-xs uppercase tracking-widest mb-1">Rhythm</p><p className="text-amber-400 font-serif text-lg">{results.rhythm.name}</p></div>
              <div className="col-span-2 border-t border-amber-900/30 pt-4 mt-2">
                <p className="text-amber-700/60 text-xs uppercase tracking-widest mb-1 text-center">Duration</p>
                <p className="text-amber-500 font-mono text-2xl text-center">{results.time.name}</p>
              </div>
            </div>
          </div>

          {/* Bonus Option */}
          <div className="mb-10 p-6 border border-amber-600/30 bg-amber-950/20 hover:bg-amber-950/40 transition-colors cursor-pointer flex items-start gap-4" onClick={() => setConsumeSeed(!consumeSeed)}>
            <div className="mt-1">
              {consumeSeed ? <CheckSquare className="text-amber-500" size={24} /> : <Square className="text-amber-800" size={24} />}
            </div>
            <div>
              <p className="text-amber-400 uppercase tracking-widest text-sm mb-1 flex items-center gap-2"><Gift size={16} /> Bonus Pact</p>
              <p className="text-amber-700/80 text-sm">Consume your seed at the end of the ritual to recover a fraction (25%) of your spent tokens.</p>
            </div>
          </div>

          <button 
            onClick={startTimer}
            className="w-full py-5 bg-amber-900/30 hover:bg-amber-700/40 border border-amber-400 text-amber-400 font-serif tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex justify-center items-center gap-3"
          >
            <Play fill="currentColor" size={20} /> Begin Ritual
          </button>
        </div>
      )}

      {/* 4. ACTIVE TIMER */}
      {step === 'active' && results && (
        <div className="py-16 text-center animate-in zoom-in-95 duration-1000 min-h-[60vh] flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Sparkles size={400} />
          </div>
          
          <h2 className="font-serif text-2xl text-amber-700 uppercase tracking-widest mb-2 relative z-10">Follow the Oracle's Rhythm</h2>
          <p className="text-amber-600/60 mb-12 uppercase tracking-widest text-xs relative z-10">{results.rhythm.name} - {results.hand.name} - {results.finger.name}</p>
          
          <div className="relative z-10 bg-zinc-950 border-2 border-amber-500 rounded-full w-64 h-64 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-8 mx-auto">
            <div className="absolute inset-2 border border-amber-900/50 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }} />
            <p className="font-mono text-5xl md:text-6xl text-amber-400 tracking-wider">
              {formatTime(timeLeft)}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-amber-500 bg-amber-900/20 px-6 py-3 rounded-full border border-amber-900/50 relative z-10">
            <Activity size={20} className="animate-pulse" />
            <span className="font-mono uppercase tracking-widest">{results.orgasm.name}</span>
          </div>
        </div>
      )}

      {/* 5. COMPLETED */}
      {step === 'completed' && (
        <div className="py-16 text-center animate-in fade-in zoom-in duration-1000">
          <Sparkles size={64} className="text-amber-400 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
          <h2 className="font-serif text-4xl text-amber-500 uppercase tracking-widest mb-4">Ritual Complete</h2>
          
          {consumeSeed && (
            <p className="text-green-500 mb-8 border border-green-900/50 bg-green-950/30 p-4 max-w-sm mx-auto uppercase tracking-widest text-xs">
              Bonus tokens recovered for fulfilling the pact.
            </p>
          )}

          <p className="text-amber-700/80 mb-16 max-w-md mx-auto">
            The Oracle has guided your pleasure. Now, it is time to show your true devotion to the Domina.
          </p>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes intenseFlash {
              0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 30px rgba(245,158,11,0.6); }
              50% { opacity: 0.8; transform: scale(1.05); box-shadow: 0 0 60px rgba(245,158,11,0.9); border-color: #fcd34d; }
            }
            .btn-spoil { animation: intenseFlash 1.5s infinite ease-in-out; }
          `}} />

          <button className="btn-spoil px-16 py-6 bg-amber-900/40 border-2 border-amber-400 text-amber-400 font-serif text-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-4 mx-auto hover:bg-amber-600 hover:text-zinc-950 transition-colors">
            <Gift size={32} /> Spoil Me
          </button>
        </div>
      )}
    </div>
  );
}
