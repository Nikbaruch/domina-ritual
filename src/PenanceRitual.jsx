import React, { useState } from 'react';
import { 
  ChevronLeft, Hexagon, Eye, Flame, AlertCircle, Camera, Check, Award, UploadCloud, Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';

const THEME = {
  bg: 'bg-zinc-950',
  panel: 'bg-zinc-900/50 border border-amber-900/30 hover:border-amber-600 transition-all duration-500',
  panelActive: 'bg-amber-900/40 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  text: 'text-amber-500',
  textMuted: 'text-amber-700/70',
  gold: 'text-amber-400',
  header: 'border-b border-amber-900/30',
};

// --- DATA STRUCTURES ---
const MODES = [
  { id: 'soft', name: 'Soft', tokens: 50, desc: 'A gentle reminder of your place.' },
  { id: 'mid', name: 'Mid', tokens: 150, desc: 'A painful lesson in submission.' },
  { id: 'hard', name: 'Hard', tokens: 300, desc: 'Absolute physical and mental breakdown.' },
];

const PUNISHMENTS = [
  { id: 'spanking', name: 'Spanking' },
  { id: 'clamps', name: 'Nipple Clamps' },
  { id: 'ballbusting', name: 'Light Ballbusting' },
  { id: 'corner', name: 'Corner Time' },
  { id: 'lines', name: 'Writing Lines' }
];

// Weighted punishment selection depending on selected mode (soft, mid, hard)
const getWeightedPunishment = (modeId) => {
  // Index mapping: 0: spanking, 1: clamps, 2: ballbusting, 3: corner, 4: lines
  let weights = [1, 1, 1, 1, 1]; // default flat weights
  
  if (modeId === 'soft') {
    // lines (4) and corner (3) high; spanking (0), clamps (1), ballbusting (2) low
    weights = [1, 1, 1, 6, 6]; 
  } else if (modeId === 'mid') {
    // clamps (1) and ballbusting (2) high; others low
    weights = [2, 7, 7, 2, 2];
  } else if (modeId === 'hard') {
    // spanking (0) is very high; others low
    weights = [8, 2, 2, 2, 2];
  }
  
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < PUNISHMENTS.length; i++) {
    if (random < weights[i]) {
      return PUNISHMENTS[i];
    }
    random -= weights[i];
  }
  return PUNISHMENTS[0];
};

const INTENSITIES = {
  spanking: {
    soft: ['20 strikes with hand', '30 strikes with hand'],
    mid: ['50 strikes with hairbrush', '60 strikes with wooden spoon'],
    hard: ['100 strikes with cane', '120 strikes with belt']
  },
  clamps: {
    soft: ['5 mins, no weight', '10 mins, no weight'],
    mid: ['15 mins, light weights', '20 mins, light weights'],
    hard: ['30 mins, heavy weights', '45 mins, heavy weights']
  },
  ballbusting: {
    soft: ['10 flicks with fingers', '15 flicks with fingers'],
    mid: ['20 slaps with hand', '30 slaps with hand'],
    hard: ['50 slaps with hand', '20 strikes with light crop']
  },
  corner: {
    soft: ['10 mins standing', '15 mins standing'],
    mid: ['20 mins kneeling', '30 mins kneeling, hands behind back'],
    hard: ['45 mins kneeling on rice', '60 mins kneeling, holding object with nose against wall']
  },
  lines: {
    soft: ['50 lines: "I will be obedient"', '100 lines: "I must submit"'],
    mid: ['200 lines: "My body belongs to the Domina"', '300 lines: "I am a pathetic servant"'],
    hard: ['500 lines: "I am nothing without Her discipline"', '1000 lines: "Pain is my only purpose"']
  }
};

const AFTERMATHS = [
  'Wear feminine lingerie all day',
  'Wear adult diaper all day',
  'Wear an anal plug all day',
  'Crawl instead of walking for 2 hours',
  'Sleep on the bare floor tonight',
  'Chastity locked for 24 hours'
];

// --- TAROT UI COMPONENTS ---
const TarotCardFaceDown = () => (
  <div className="w-full h-full border border-amber-600/50 bg-gradient-to-br from-zinc-900 to-amber-950 rounded-sm flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
    <div className="absolute inset-2 border border-amber-500/20 rounded-sm flex flex-col items-center justify-center p-4">
      <div className="w-full h-full border border-amber-900/40 rounded-full absolute animate-ping opacity-20" style={{ animationDuration: '4s' }} />
      <Hexagon size={64} className="text-amber-900/50 absolute" />
      <Eye size={32} className="text-amber-600 relative z-10" />
    </div>
  </div>
);

// Resolve specific asset image based on punishment type and text description
const getCardAsset = (cardId, title) => {
  if (!cardId) return null;
  const text = title ? title.toLowerCase() : '';

  if (cardId === 'spanking') {
    if (text.includes('hairbrush')) return '/spanking-hairbrush.png';
    if (text.includes('spoon')) return '/spanking-spoon.png';
    if (text.includes('cane')) return '/spanking-cane.png';
    if (text.includes('belt')) return '/spanking-belt.png';
    return '/hand-spanking.png';
  }
  
  if (cardId === 'clamps') {
    if (text.includes('heavy')) return '/clamps-heavy.png';
    if (text.includes('light')) return '/clamps-light.png';
    return '/x-clamps.png';
  }

  if (cardId === 'ballbusting') {
    if (text.includes('flick') || text.includes('finger')) return '/x-ballbsutingFinger.png';
    if (text.includes('crop')) return '/X-ballbusting-crop.png';
    if (text.includes('hand') || text.includes('slap')) return '/ballbusting-hand.png';
    return '/x-ballbusting.png';
  }

  if (cardId === 'corner') {
    if (text.includes('rice')) return '/corner-rice.png';
    if (text.includes('nose') || text.includes('wall')) return '/corner-wall.png';
    if (text.includes('kneel')) return '/corner-kneeling.png';
    return '/corner-standing.png';
  }

  if (cardId === 'lines') {
    return '/x-writing.png';
  }

  return null;
};

const TarotCardFaceUp = ({ title, subtitle, cardId }) => {
  const picSrc = getCardAsset(cardId, title);

  return (
    <div className="w-full h-full border-2 border-amber-400 bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] relative">
      <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
      <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-4 font-bold text-center">{subtitle}</p>
      
      {picSrc ? (
        <div className="w-16 h-16 mb-4 flex items-center justify-center overflow-hidden">
          <img 
            src={picSrc} 
            alt={title} 
            className="w-full h-full object-contain" 
            onError={(e) => {
              // Fallback if the custom asset PNG is not created yet
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="bg-amber-950/30 p-2 rounded-full border border-amber-900/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
                    <svg class="text-amber-400 w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-amber-950/30 p-2 rounded-full border border-amber-900/50 mb-4 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
          <Flame size={32} className="text-amber-400" />
        </div>
      )}
      
      <h3 className="font-serif text-sm md:text-base text-amber-500 text-center leading-snug drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
        {title}
      </h3>
    </div>
  );
};

const PenanceEmblem = ({ cardId, title }) => {
  const [error, setError] = React.useState(false);
  const src = getCardAsset(cardId, title);

  React.useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return <Flame size={48} className="text-amber-400" />;
  }

  return (
    <img 
      src={src} 
      alt={title} 
      className="w-16 h-16 object-contain" 
      onError={() => setError(true)}
    />
  );
};

export default function PenanceRitual({ back, addTokens, user, profile, requireAuth }) {
  const [step, setStep] = useState('mode_selection');
  const [mode, setMode] = useState(null);
  
  // Draws
  const [draw1, setDraw1] = useState(null); // Punishment
  const [draw2, setDraw2] = useState(null); // Intensity
  const [draw3, setDraw3] = useState(null); // Aftermath

  // Tarot state
  const [tarotPhase, setTarotPhase] = useState('shuffling'); 
  const [deckSize, setDeckSize] = useState(0);
  const [pickedCardIndex, setPickedCardIndex] = useState(null);
  const [currentDrawType, setCurrentDrawType] = useState(1); // 1, 2, or 3
  const [tempResult, setTempResult] = useState(null);

  const [photoProofSubmitted, setPhotoProofSubmitted] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Tarot Timeout Refs for skipping animations
  const tarotTimeout1Ref = React.useRef(null);
  const tarotTimeout2Ref = React.useRef(null);
  const tarotTimeout3Ref = React.useRef(null);

  const clearTarotTimeouts = () => {
    if (tarotTimeout1Ref.current) clearTimeout(tarotTimeout1Ref.current);
    if (tarotTimeout2Ref.current) clearTimeout(tarotTimeout2Ref.current);
    if (tarotTimeout3Ref.current) clearTimeout(tarotTimeout3Ref.current);
  };

  const proceedToNextStep = () => {
    clearTarotTimeouts();
    if (currentDrawType === 1) {
      setDraw1(tempResult);
      startDraw(2, tempResult, mode);
    } else if (currentDrawType === 2) {
      setDraw2(tempResult);
      startDraw(3, null, mode);
    } else if (currentDrawType === 3) {
      setDraw3(tempResult);
      setStep('summary');
    }
  };

  React.useEffect(() => {
    return () => clearTarotTimeouts();
  }, []);

  const startDraw = (drawNumber, previousDraw, currentMode = mode) => {
    setCurrentDrawType(drawNumber);
    setStep('tarot_draw');
    setTarotPhase('shuffling');
    setDeckSize(5);
    setPickedCardIndex(null);

    let result = '';
    if (drawNumber === 1) {
      const p = getWeightedPunishment(currentMode.id);
      result = p;
      setTempResult(p);
    } else if (drawNumber === 2) {
      const options = INTENSITIES[previousDraw.id][currentMode.id];
      const i = options[Math.floor(Math.random() * options.length)];
      result = i;
      setTempResult(i);
    } else if (drawNumber === 3) {
      const a = AFTERMATHS[Math.floor(Math.random() * AFTERMATHS.length)];
      result = a;
      setTempResult(a);
    }

    clearTarotTimeouts();
    tarotTimeout1Ref.current = setTimeout(() => {
      setTarotPhase('spreading');
      tarotTimeout2Ref.current = setTimeout(() => setTarotPhase('waiting'), 1000);
    }, 1800); // Shuffling duration shortened from 3.5s to 1.8s
  };

  const handleCardPick = (index) => {
    if (tarotPhase === 'shuffling' || tarotPhase === 'spreading') {
      clearTarotTimeouts();
      setTarotPhase('waiting');
      return;
    }
    if (tarotPhase === 'done') {
      proceedToNextStep();
      return;
    }
    if (tarotPhase !== 'waiting') return; 
    setPickedCardIndex(index);
    setTarotPhase('picked');
    
    clearTarotTimeouts();
    tarotTimeout1Ref.current = setTimeout(() => {
      setTarotPhase('flipping');
      tarotTimeout2Ref.current = setTimeout(() => {
        setTarotPhase('done');
        tarotTimeout3Ref.current = setTimeout(() => {
          proceedToNextStep();
        }, 3000);
      }, 800);
    }, 600);
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    startDraw(1, null, selectedMode);
  };

  const handleAcceptPenance = () => {
    // Bonus tokens will be awarded manually by the Admin after reviewing the proof
    addTokens(mode.tokens);
    back();
  };

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    if (!user) {
      requireAuth();
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const punishmentDetails = `${draw1?.name} | ${draw2} | ${draw3}`;
      
      const { error: dbError } = await supabase
        .from('penance_proofs')
        .insert([{
          user_id: user.id,
          image_url: filePath,
          punishment_details: punishmentDetails,
          bonus_tokens: mode.tokens
        }]);

      if (dbError) throw dbError;

      // Award bonus tokens immediately
      addTokens(mode.tokens);
      setPhotoProofSubmitted(true);
    } catch (error) {
      console.error("Upload error details:", error);
      alert("Failed to upload proof. Error: " + (error.message || JSON.stringify(error)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-10 duration-700">
      
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .card-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .card-front, .card-back {
          position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .card-back { transform: rotateY(180deg); }
        .is-flipped .card-inner { transform: rotateY(180deg); }
        .is-flipped .card-front {
          visibility: hidden;
          transition: visibility 0s 0.4s;
        }

        @keyframes realShuffle {
          0% { transform: translate(0px, 0px) rotate(0deg); z-index: 10; }
          25% { transform: translate(-55px, -25px) rotate(-20deg); z-index: 50; }
          50% { transform: translate(0px, -5px) rotate(0deg); z-index: 20; }
          75% { transform: translate(55px, -25px) rotate(20deg); z-index: 5; }
          100% { transform: translate(0px, 0px) rotate(0deg); z-index: 10; }
        }
        .anim-shuffle-active { animation: realShuffle 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1); }
      `}} />

      <button onClick={back} className="mb-8 text-amber-700 hover:text-amber-500 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
        <ChevronLeft size={16} /> Flee the Sanctuary
      </button>

      {/* 1. MODE SELECTION */}
      {step === 'mode_selection' && (
        <div className="space-y-8 animate-in fade-in duration-700 text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-amber-500 mb-2">The Penance Rite</h2>
          <p className="text-amber-700/80 max-w-md mx-auto mb-10">
            Choose your level of suffering. Higher devotion yields greater rewards, but the Oracle's demands will be severe.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODES.map(m => (
              <button 
                key={m.id}
                onClick={() => handleSelectMode(m)}
                className={`${THEME.panel} p-8 flex flex-col items-center group`}
              >
                <h3 className="font-serif text-2xl text-amber-500 group-hover:text-amber-400 mb-2 uppercase tracking-widest">{m.name}</h3>
                <p className="text-amber-700/70 text-sm mb-6 h-10">{m.desc}</p>
                <div className="mt-auto bg-zinc-950 border border-amber-900/50 px-4 py-2 rounded-sm text-amber-400 font-mono">
                  {m.tokens} ⏀
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. TAROT DRAW */}
      {step === 'tarot_draw' && (
        <div 
          onClick={() => {
            if (tarotPhase === 'shuffling' || tarotPhase === 'spreading') {
              clearTarotTimeouts();
              setTarotPhase('waiting');
            } else if (tarotPhase === 'done') {
              proceedToNextStep();
            }
          }}
          className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 overflow-hidden relative min-h-[500px] cursor-pointer"
        >
          <h2 className="font-serif text-3xl text-amber-500 tracking-widest uppercase mb-16 relative z-30 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            {currentDrawType === 1 ? 'Draw I: The Punishment' : 
             currentDrawType === 2 ? 'Draw II: The Intensity' : 
             'Draw III: The Aftermath'}
          </h2>

          <div className="relative w-full h-80 flex items-center justify-center perspective-1000">
            {Array.from({ length: deckSize }).map((_, i) => {
              const center = (deckSize - 1) / 2;
              const offset = i - center;
              
              let cardWrapperStyle = {};
              let containerClasses = `absolute w-32 h-48 md:w-40 md:h-56 perspective-1000 ${tarotPhase === 'flipping' || tarotPhase === 'done' ? (pickedCardIndex === i ? 'is-flipped' : '') : ''}`;

              if (tarotPhase === 'shuffling') {
                cardWrapperStyle = { animationDelay: `-${(i * 0.15).toFixed(2)}s`, zIndex: i };
                containerClasses += " anim-shuffle-active";
              } 
              else if (tarotPhase === 'spreading' || tarotPhase === 'waiting') {
                const rot = offset * 8;
                const tx = offset * 35;
                const ty = Math.abs(offset) * 4;
                
                cardWrapperStyle = {
                  transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
                  transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: i
                };
                
                if (tarotPhase === 'waiting') {
                  containerClasses += " cursor-pointer hover:-translate-y-8 hover:scale-110 hover:z-50 hover:drop-shadow-[0_0_30px_rgba(245,158,11,0.8)] hover:brightness-125 transition-all duration-300";
                }
              }
              else if (tarotPhase === 'picked' || tarotPhase === 'flipping' || tarotPhase === 'done') {
                if (pickedCardIndex === i) {
                  cardWrapperStyle = {
                    transform: `translate(0px, -40px) scale(1.3)`,
                    transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 100
                  };
                  if (tarotPhase === 'done') cardWrapperStyle.filter = 'drop-shadow(0 0 30px rgba(245,158,11,0.6))';
                } else {
                  cardWrapperStyle = {
                    transform: `translate(${offset * 10}px, 300px) rotate(${offset * 15}deg) scale(0.5)`,
                    opacity: 0,
                    transition: 'all 0.8s ease-in',
                    pointerEvents: 'none'
                  };
                }
              }

              let titleToDisplay = '';
              let subToDisplay = '';
              let cardId = '';
              if (currentDrawType === 1) {
                titleToDisplay = tempResult?.name;
                subToDisplay = 'The Method';
                cardId = tempResult?.id;
              } else if (currentDrawType === 2) {
                titleToDisplay = tempResult;
                subToDisplay = 'The Pain';
                cardId = draw1?.id;
              } else {
                titleToDisplay = tempResult;
                subToDisplay = 'After your punishment';
              }

              return (
                <div key={i} className={containerClasses} style={cardWrapperStyle} onClick={() => handleCardPick(i)}>
                  <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="card-front"><TarotCardFaceDown /></div>
                    <div className="card-back">
                      {pickedCardIndex === i ? (
                        <TarotCardFaceUp title={titleToDisplay} subtitle={subToDisplay} cardId={cardId} />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 border-2 border-amber-900 rounded-sm"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-amber-700/60 uppercase tracking-[0.3em] text-xs h-4 mt-16 transition-opacity duration-500">
            {tarotPhase === 'shuffling' && 'The Oracle weaves the threads...'}
            {tarotPhase === 'waiting' && 'Select your destined card.'}
          </p>
        </div>
      )}

      {/* 3. SUMMARY & PHOTO PROOF */}
      {step === 'summary' && (
        <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-1000 py-8">
          <h2 className="font-serif text-3xl text-amber-500 tracking-widest uppercase mb-4">Your Penance is Set</h2>

          {/* New Decree Card */}
          <div className="max-w-md mx-auto border-2 border-amber-500 bg-zinc-950 p-8 rounded-sm shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
            
            {/* Gold style header */}
            <div className="border-b border-amber-900/30 pb-4 mb-6">
              <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-1 font-bold">Decree of Penance</p>
              <h3 className="font-serif text-2xl text-amber-400 uppercase tracking-wider">The Penance Rite</h3>
            </div>

            {/* Central emblem / pictogram */}
            <div className="flex justify-center mb-6">
              <div className="bg-amber-950/20 p-6 rounded-full border-2 border-amber-600/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
                <PenanceEmblem cardId={draw1?.id} title={draw2} />
              </div>
            </div>

            {/* Verdict details */}
            <div className="space-y-4 text-left border-t border-b border-amber-900/30 py-6 mb-6 font-serif">
              <div className="flex justify-between items-center">
                <span className="text-amber-700/80 uppercase text-xs tracking-wider">Method:</span>
                <span className="text-amber-400 text-base font-bold">{draw1?.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-amber-700/80 uppercase text-xs tracking-wider pt-0.5">Intensity:</span>
                <span className="text-amber-400 text-sm font-bold text-right max-w-[200px]">{draw2}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-amber-700/80 uppercase text-xs tracking-wider pt-0.5">Aftermath:</span>
                <span className="text-amber-400 text-sm font-bold text-right max-w-[200px]">{draw3}</span>
              </div>
            </div>

            {/* Photo Proof Uploder */}
            <div className="bg-zinc-900/60 border border-amber-900/30 p-4 rounded-sm mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-amber-900/30 pb-2">
                <span className="text-amber-700 uppercase tracking-widest text-[10px]">Base Reward ({mode?.name})</span>
                <span className="text-amber-500 font-mono text-sm">{mode?.tokens} ⏀</span>
              </div>
              
              {!photoProofSubmitted ? (
                <div className="flex flex-col items-center relative">
                  <p className="text-amber-600/80 text-[11px] mb-3">Submit photo proof to the Domina to double your tokens.</p>
                  {!user ? (
                    <button onClick={requireAuth} className="flex items-center gap-2 px-4 py-2 border border-amber-600 text-amber-400 uppercase tracking-widest text-[10px] transition-colors bg-amber-950/40 hover:bg-amber-900/40">
                      <UploadCloud size={14} /> 
                      Identify & Upload (+{mode?.tokens} ⏀)
                    </button>
                  ) : (
                    <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 border border-amber-600 text-amber-400 uppercase tracking-widest text-[10px] transition-colors ${uploading ? 'bg-amber-900/60' : 'bg-amber-950/40 hover:bg-amber-900/40'}`}>
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} 
                      {uploading ? 'Transmitting...' : `Upload Proof (+${mode?.tokens} ⏀)`}
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <Check size={16} /> <span className="uppercase tracking-widest text-xs">Proof Transmitted</span>
                  </div>
                  <p className="text-amber-400 text-xs">Bonus tokens (+{mode?.tokens} ⏀) awarded!</p>
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <button
              onClick={handleAcceptPenance}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-4 flex items-center justify-center gap-2"
            >
              <Award size={18} /> Accept Your Fate
            </button>

            {/* Share buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-amber-900/20">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = `🔮 My Penance has been decreed at the Sanctuary!\n🩸 Method: ${draw1?.name}\n⚡ Intensity: ${draw2}\n⛓️ Aftermath: ${draw3}\n\nAccepted under the Domina's gaze.`;
                    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
                    window.open(shareUrl, '_blank');
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-900/50 text-amber-500 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </button>
                <button
                  onClick={() => {
                    const text = `🔮 My Penance has been decreed at the Sanctuary!\n🩸 Method: ${draw1?.name}\n⚡ Intensity: ${draw2}\n⛓️ Aftermath: ${draw3}\n\nAccepted under the Domina's gaze.`;
                    navigator.clipboard.writeText(`${text}\nJoin the Sanctuary: ${window.location.origin}`);
                    setShareMessage('Decree details copied to clipboard!');
                    setTimeout(() => setShareMessage(''), 3000);
                    window.open('https://discord.gg/qRmwseJv', '_blank');
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-900/50 text-amber-500 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-current">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.89-.65,1.76-1.34,2.58-2.06a75.48,75.48,0,0,0,65.8,0c.82.72,1.69,1.41,2.58,2.06a68.4,68.4,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.42-18.83C129.9,49.12,123.82,26.31,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                  </svg>
                  Discord
                </button>
              </div>
              <button
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 800;
                  canvas.height = 600;
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#09090b';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.strokeStyle = '#d97706';
                  ctx.lineWidth = 8;
                  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
                  ctx.fillStyle = '#f59e0b';
                  ctx.font = 'bold 36px serif';
                  ctx.textAlign = 'center';
                  ctx.fillText('DECREE OF PENANCE', canvas.width / 2, 120);
                  ctx.fillStyle = '#b45309';
                  ctx.font = 'italic 18px serif';
                  ctx.fillText('THE SANCTUARY OF OBEDIENCE', canvas.width / 2, 155);
                  
                  // Simple Skull or Flame shape
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 4;
                  ctx.beginPath();
                  ctx.moveTo(canvas.width / 2, 230);
                  ctx.bezierCurveTo(canvas.width / 2 - 30, 270, canvas.width / 2 - 30, 310, canvas.width / 2, 330);
                  ctx.bezierCurveTo(canvas.width / 2 + 30, 310, canvas.width / 2 + 30, 270, canvas.width / 2, 230);
                  ctx.stroke();

                  ctx.fillStyle = '#f59e0b';
                  ctx.font = 'bold 24px serif';
                  ctx.fillText(`Method: ${draw1?.name}`, canvas.width / 2, 380);
                  ctx.font = '18px sans-serif';
                  ctx.fillText(`Intensity: ${draw2}`, canvas.width / 2, 420);
                  ctx.fillText(`Aftermath: ${draw3}`, canvas.width / 2, 460);
                  ctx.fillStyle = '#78350f';
                  ctx.font = 'italic 16px sans-serif';
                  ctx.fillText('Submit to your penance with grace.', canvas.width / 2, 510);
                  ctx.font = '14px monospace';
                  ctx.fillStyle = '#451a03';
                  ctx.fillText(window.location.origin, canvas.width / 2, 550);
                  
                  const link = document.createElement('a');
                  link.download = 'decree_of_penance.png';
                  link.href = canvas.toDataURL();
                  link.click();
                }}
                className="py-2 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-600/30 text-amber-400 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                Download Decree Card Image
              </button>
            </div>
            
            {shareMessage && (
              <p className="text-amber-500 text-xs mt-4 animate-pulse">{shareMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
