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
  { id: 'spanking', name: 'Self-Administered Spanking' },
  { id: 'clamps', name: 'Nipple Clamps' },
  { id: 'ballbusting', name: 'Light Ballbusting' },
  { id: 'corner', name: 'Corner Time' },
  { id: 'lines', name: 'Writing Lines' }
];

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

const TarotCardFaceUp = ({ title, subtitle }) => (
  <div className="w-full h-full border-2 border-amber-400 bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] relative">
    <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
    <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-4 font-bold text-center">{subtitle}</p>
    <div className="bg-amber-950/30 p-2 rounded-full border border-amber-900/50 mb-4 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
      <Flame size={32} className="text-amber-400" />
    </div>
    <h3 className="font-serif text-lg md:text-xl text-amber-500 text-center leading-snug drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
      {title}
    </h3>
  </div>
);

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

  // Summary state
  const [photoProofSubmitted, setPhotoProofSubmitted] = useState(false);

  const startDraw = (drawNumber, previousDraw) => {
    setCurrentDrawType(drawNumber);
    setStep('tarot_draw');
    setTarotPhase('shuffling');
    setDeckSize(5);
    setPickedCardIndex(null);

    let result = '';
    if (drawNumber === 1) {
      const p = PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
      result = p;
      setTempResult(p);
    } else if (drawNumber === 2) {
      const options = INTENSITIES[previousDraw.id][mode.id];
      const i = options[Math.floor(Math.random() * options.length)];
      result = i;
      setTempResult(i);
    } else if (drawNumber === 3) {
      const a = AFTERMATHS[Math.floor(Math.random() * AFTERMATHS.length)];
      result = a;
      setTempResult(a);
    }

    setTimeout(() => {
      setTarotPhase('spreading');
      setTimeout(() => setTarotPhase('waiting'), 1000);
    }, 3500);
  };

  const handleCardPick = (index) => {
    if (tarotPhase !== 'waiting') return; 
    setPickedCardIndex(index);
    setTarotPhase('picked');
    
    setTimeout(() => {
      setTarotPhase('flipping');
      setTimeout(() => {
        setTarotPhase('done');
        setTimeout(() => {
          if (currentDrawType === 1) {
            setDraw1(tempResult);
            startDraw(2, tempResult);
          } else if (currentDrawType === 2) {
            setDraw2(tempResult);
            startDraw(3, null);
          } else if (currentDrawType === 3) {
            setDraw3(tempResult);
            setStep('summary');
          }
        }, 3000);
      }, 800);
    }, 600);
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    startDraw(1, null);
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
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
        }
        .card-back { transform: rotateY(180deg); }
        .is-flipped .card-inner { transform: rotateY(180deg); }

        @keyframes realShuffle {
          0% { transform: translate(0px, 0px) rotate(0deg); z-index: 10; }
          25% { transform: translate(-55px, -25px) rotate(-20deg); z-index: 50; }
          50% { transform: translate(0px, -5px) rotate(0deg); z-index: 20; }
          75% { transform: translate(55px, -25px) rotate(20deg); z-index: 5; }
          100% { transform: translate(0px, 0px) rotate(0deg); z-index: 10; }
        }
        .anim-shuffle-active { animation: realShuffle 1.2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
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
        <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 overflow-hidden relative min-h-[500px]">
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
              if (currentDrawType === 1) {
                titleToDisplay = tempResult?.name;
                subToDisplay = 'The Method';
              } else if (currentDrawType === 2) {
                titleToDisplay = tempResult;
                subToDisplay = 'The Pain';
              } else {
                titleToDisplay = tempResult;
                subToDisplay = 'The Humiliation';
              }

              return (
                <div key={i} className={containerClasses} style={cardWrapperStyle} onClick={() => handleCardPick(i)}>
                  <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="card-front"><TarotCardFaceDown /></div>
                    <div className="card-back">
                      {pickedCardIndex === i ? (
                        <TarotCardFaceUp title={titleToDisplay} subtitle={subToDisplay} />
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
          <p className="text-amber-700/80 max-w-lg mx-auto">
            The Oracle has decreed your suffering. You must execute this ritual precisely as demanded.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12 mb-16">
            <div className="w-48 h-72 transform -rotate-6 hover:rotate-0 transition-transform duration-500 hover:z-10">
              <TarotCardFaceUp title={draw1?.name} subtitle="The Method" />
            </div>
            <div className="w-48 h-72 transform hover:-translate-y-4 transition-transform duration-500 hover:z-10 z-10">
              <TarotCardFaceUp title={draw2} subtitle="The Pain" />
            </div>
            <div className="w-48 h-72 transform rotate-6 hover:rotate-0 transition-transform duration-500 hover:z-10">
              <TarotCardFaceUp title={draw3} subtitle="The Humiliation" />
            </div>
          </div>

          <div className="max-w-lg mx-auto bg-zinc-900/40 border border-amber-900/30 p-8 rounded-sm mb-8">
            <div className="flex items-center justify-between mb-6 border-b border-amber-900/30 pb-4">
              <span className="text-amber-700 uppercase tracking-widest text-sm">Base Reward ({mode?.name})</span>
              <span className="text-amber-500 font-mono text-lg">{mode?.tokens} ⏀</span>
            </div>
            
            {!photoProofSubmitted ? (
              <div className="flex flex-col items-center relative">
                <p className="text-amber-600/80 text-sm mb-4">Submit photographic proof to the Domina to double your tokens.</p>
                {!user ? (
                  <button onClick={requireAuth} className="flex items-center gap-2 px-6 py-3 border border-amber-600 text-amber-400 uppercase tracking-widest text-xs transition-colors bg-amber-950/40 hover:bg-amber-900/40">
                    <UploadCloud size={16} /> 
                    Identify Your Soul to Upload (+{mode?.tokens} ⏀)
                  </button>
                ) : (
                  <label className={`cursor-pointer flex items-center gap-2 px-6 py-3 border border-amber-600 text-amber-400 uppercase tracking-widest text-xs transition-colors ${uploading ? 'bg-amber-900/60' : 'bg-amber-950/40 hover:bg-amber-900/40'}`}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
                    {uploading ? 'Transmitting...' : `Upload Proof (+${mode?.tokens} ⏀)`}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Check size={20} /> <span className="uppercase tracking-widest text-sm">Proof Transmitted</span>
                </div>
                <p className="text-amber-400 text-sm mb-4">Bonus tokens (+{mode?.tokens} ⏀) have been awarded directly to your Treasury!</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAcceptPenance}
            className="w-full max-w-md mx-auto py-5 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500 text-amber-400 font-serif tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3"
          >
            <Award size={24} /> Accept Your Fate
          </button>
        </div>
      )}
    </div>
  );
}
