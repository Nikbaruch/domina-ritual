import React, { useState, useEffect, useRef } from 'react';
import PenanceRitual from './PenanceRitual';
import AdminDashboard from './AdminDashboard';
import DivineReward from './DivineReward';
import { supabase } from './supabaseClient';
import {
  Flame, Lock, Dumbbell, Gift, Menu, X,
  Sparkles, User, ChevronLeft, Hexagon, Circle, Disc,
  Maximize2, Minimize2, ScanLine, MinusCircle, ShieldAlert,
  Fingerprint, Hourglass, Eye, Key
} from 'lucide-react';

const THEME = {
  bg: 'bg-black',
  panel: 'bg-zinc-900/50 border border-amber-900/30 hover:border-amber-600 transition-all duration-500',
  panelActive: 'bg-amber-900/40 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  text: 'text-amber-500',
  textMuted: 'text-amber-700/70',
  gold: 'text-amber-400',
  header: 'border-b border-amber-900/30',
};

// --- SUBTLE LACE DECORATION (DENTELLE DEPUIS PNG) ---
const LaceDecoration = () => (
  <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-50 overflow-hidden select-none">
    <div 
      className="absolute inset-0 z-0 opacity-35"
      style={{
        backgroundImage: "url('/laceback02.png')",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "bottom",
        backgroundSize: "auto 128px" // scale to container height and repeat horizontally
      }}
    />
  </div>
);

const AVAILABLE_CAGES = [
  { id: 'inverse', name: 'Inverse Device', icon: ScanLine },
  { id: 'flat', name: 'Flat Device', icon: MinusCircle },
  { id: 'micro', name: 'Micro Cage', icon: Minimize2 },
  { id: 'small', name: 'Small Cage', icon: Circle },
  { id: 'medium', name: 'Medium Cage', icon: Disc },
  { id: 'large', name: 'Large Cage', icon: Maximize2 },
  { id: 'xlarge', name: 'Extra Large', icon: Hexagon }
];

// Fonction utilitaire pour formater le temps en Jours/Heures/Minutes/Secondes
const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "00m 00s";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (h > 0) return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
};

// --- COMPOSANT DE CHEMIN : DISCIPLINE (CHASTETÉ) ---
const DisciplineRitual = ({ back, addTokens, user, requireAuth }) => {
  const [step, setStep] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [selectedCage, setSelectedCage] = useState(null);
  const [vowType, setVowType] = useState(null);
  const [durationStr, setDurationStr] = useState('');

  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Sharing feedback
  const [shareMessage, setShareMessage] = useState('');

  // Tarot Animation States
  const [tarotContext, setTarotContext] = useState(null);
  const [tarotPhase, setTarotPhase] = useState('shuffling');
  const [tarotResult, setTarotResult] = useState({ title: '', icon: null, subtitle: '' });
  const [deckSize, setDeckSize] = useState(0);
  const [pickedCardIndex, setPickedCardIndex] = useState(null);

  // Tarot Timeout Refs for skipping/cancelling animations
  const tarotTimeout1Ref = useRef(null);
  const tarotTimeout2Ref = useRef(null);
  const tarotTimeout3Ref = useRef(null);

  const clearTarotTimeouts = () => {
    if (tarotTimeout1Ref.current) clearTimeout(tarotTimeout1Ref.current);
    if (tarotTimeout2Ref.current) clearTimeout(tarotTimeout2Ref.current);
    if (tarotTimeout3Ref.current) clearTimeout(tarotTimeout3Ref.current);
  };

  const proceedToNextStep = () => {
    clearTarotTimeouts();
    if (tarotContext === 'cage') setStep('vow');
    else setStep('summary');
  };

  useEffect(() => {
    return () => clearTarotTimeouts();
  }, []);

  // Sélection des cages dans l'inventaire
  const toggleCage = (cage) => {
    setInventory(prev =>
      prev.some(c => c.id === cage.id) ? prev.filter(c => c.id !== cage.id) : [...prev, cage]
    );
  };

  // Lance l'animation de tirage pour la Cage
  const runCageAnimation = () => {
    setStep('tarot_draw');
    setTarotContext('cage');
    setTarotPhase('shuffling');
    setDeckSize(inventory.length > 3 ? inventory.length : 3);
    setPickedCardIndex(null);

    const targetCage = inventory[Math.floor(Math.random() * inventory.length)];
    setTarotResult({ title: targetCage.name, icon: targetCage.icon, subtitle: 'The Apparatus' });
    setSelectedCage(targetCage);

    clearTarotTimeouts();
    tarotTimeout1Ref.current = setTimeout(() => {
      setTarotPhase('spreading');
      tarotTimeout2Ref.current = setTimeout(() => setTarotPhase('waiting'), 1000);
    }, 3500);
  };

  // Lance l'animation de tirage pour le Temps
  const runTimeAnimation = (vow) => {
    setVowType(vow);
    setStep('tarot_draw');
    setTarotContext('time');
    setTarotPhase('shuffling');
    setDeckSize(15);
    setPickedCardIndex(null);

    let finalSecs = 0;
    let finalStr = '';

    if (vow === 'Short') {
      const h = Math.floor(Math.random() * 24) + 1;
      finalSecs = h * 3600;
      finalStr = `${h} Hour${h > 1 ? 's' : ''}`;
    } else if (vow === 'Medium') {
      const d = Math.floor(Math.random() * 7) + 1;
      finalSecs = d * 86400;
      finalStr = `${d} Day${d > 1 ? 's' : ''}`;
    } else if (vow === 'Long') {
      const d = Math.floor(Math.random() * 24) + 7;
      finalSecs = d * 86400;
      finalStr = `${d} Days`;
    }

    setTarotResult({ title: finalStr, icon: Hourglass, subtitle: 'The Binding Time', secs: finalSecs });
    setDurationStr(finalStr);

    clearTarotTimeouts();
    tarotTimeout1Ref.current = setTimeout(() => {
      setTarotPhase('spreading');
      tarotTimeout2Ref.current = setTimeout(() => setTarotPhase('waiting'), 1000);
    }, 3500);
  };

  // Clic sur une carte
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

  // Validation finale et lancement du Timer
  const handleProceedToTimer = () => {
    if (!user) {
      requireAuth();
    } else {
      startPrepPhase();
    }
  };

  // Initialisation des Timestamps
  const startPrepPhase = () => {
    setStep('prep');
    // On calcule l'heure de fin de la préparation (Heure actuelle + 2 minutes)
    const targetTime = new Date(Date.now() + 120 * 1000).getTime();
    setEndTime(targetTime);
  };


  // Gestion robuste du Chronomètre basée sur l'heure réelle (Date.now())
  useEffect(() => {
    if ((step !== 'prep' && step !== 'active') || !endTime) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = endTime - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timerId = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerId);
        if (step === 'prep') {
          setStep('active');
          const realDuration = tarotResult.secs * 1000;
          setEndTime(Date.now() + realDuration);
        } else if (step === 'active') {
          setStep('completed');
        }
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [step, endTime, tarotResult.secs]);

  // Actions de fin de parcours
  const handleBreakVow = () => setStep('failed');
  const handleCompletion = () => {
    let reward = vowType === 'Short' ? 50 : vowType === 'Medium' ? 150 : 300;
    addTokens(reward);
    back();
  };

  // --- COMPOSANTS VISUELS DU TAROT ---
  const TarotCardFaceDown = () => (
    <div className="w-full h-full border border-amber-600/50 bg-gradient-to-br from-zinc-900 to-amber-950 rounded-sm flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
      <div className="absolute inset-2 border border-amber-500/20 rounded-sm flex flex-col items-center justify-center p-4">
        <div className="w-full h-full border border-amber-900/40 rounded-full absolute animate-ping opacity-20" style={{ animationDuration: '4s' }} />
        <Hexagon size={64} className="text-amber-900/50 absolute" />
        <Eye size={32} className="text-amber-600 relative z-10" />
      </div>
    </div>
  );

  const TarotCardFaceUp = ({ title, subtitle, icon: Icon }) => (
    <div className="w-full h-full border-2 border-amber-400 bg-zinc-900 rounded-sm flex flex-col items-center justify-center p-4 shadow-[inset_0_0_30px_rgba(245,158,11,0.15)] relative">
      <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
      <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-6 font-bold text-center">{subtitle}</p>
      <div className="bg-amber-950/30 p-3 rounded-full border border-amber-900/50 mb-6 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]">
        {Icon && <Icon size={40} className="text-amber-400" />}
      </div>
      <h3 className="font-serif text-xl md:text-2xl text-amber-500 text-center leading-snug drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
        {title}
      </h3>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-10 duration-700">

      {/* CSS Intégré pour les effets 3D et le mélange */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
        .anim-shuffle-active { animation: realShuffle 1.2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
      `}} />

      {/* BOUTON RETOUR */}
      {['inventory', 'vow', 'summary', 'auth_gate'].includes(step) && (
        <button onClick={back} className="mb-8 text-amber-700 hover:text-amber-500 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
          <ChevronLeft size={16} /> Flee the Sanctuary
        </button>
      )}

      {/* 1. INVENTAIRE */}
      {step === 'inventory' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="text-center">
            <Lock size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="font-serif text-3xl text-amber-500 mb-2">Sacred Apparati</h2>
            <p className="text-amber-700/80 max-w-md mx-auto">
              Select the tools of confinement you possess. The Oracle will determine your binding.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AVAILABLE_CAGES.map(cage => {
              const isSelected = inventory.some(c => c.id === cage.id);
              return (
                <button
                  key={cage.id}
                  onClick={() => toggleCage(cage)}
                  className={`p-4 flex flex-col items-center justify-center gap-3 border rounded-sm transition-all duration-300 ${isSelected ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-zinc-900/50 border-amber-900/30 hover:border-amber-600'}`}
                >
                  <cage.icon size={28} className={isSelected ? 'text-amber-400' : 'text-amber-700'} />
                  <span className={`font-serif text-sm ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>{cage.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-8">
            <button
              onClick={runCageAnimation}
              disabled={inventory.length === 0}
              className={`px-8 py-4 font-serif text-xl tracking-[0.2em] uppercase transition-all duration-500 border ${inventory.length > 0 ? 'bg-amber-900/20 text-amber-400 border-amber-500 hover:bg-amber-900/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}
            >
              Invoke the Sealing Rite
            </button>
          </div>
        </div>
      )}

      {/* 2. LE TAROT (ANIMATION COMMUNE) */}
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
            {tarotPhase === 'waiting'
              ? 'Draw Your Fate'
              : tarotContext === 'cage' ? 'Consulting the Arcana...' : 'Reading the Threads...'}
          </h2>

          <div className="relative w-full h-80 flex items-center justify-center perspective-1000">
            {Array.from({ length: deckSize }).map((_, i) => {
              const center = (deckSize - 1) / 2;
              const offset = i - center;
              const isLargeDeck = deckSize > 10;

              let cardWrapperStyle = {};
              let containerClasses = `absolute w-32 h-48 md:w-40 md:h-56 perspective-1000 ${tarotPhase === 'flipping' || tarotPhase === 'done' ? (pickedCardIndex === i ? 'is-flipped' : '') : ''}`;

              if (tarotPhase === 'shuffling') {
                cardWrapperStyle = { animationDelay: `-${(i * 0.15).toFixed(2)}s`, zIndex: i };
                containerClasses += " anim-shuffle-active";
              }
              else if (tarotPhase === 'spreading' || tarotPhase === 'waiting') {
                const rot = offset * (isLargeDeck ? 4 : 8);
                const tx = offset * (isLargeDeck ? 12 : 35);
                const ty = Math.abs(offset) * (isLargeDeck ? 1.5 : 4);

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

              return (
                <div key={i} className={containerClasses} style={cardWrapperStyle} onClick={() => handleCardPick(i)}>
                  <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="card-front"><TarotCardFaceDown /></div>
                    <div className="card-back">
                      {pickedCardIndex === i ? (
                        <TarotCardFaceUp title={tarotResult.title} subtitle={tarotResult.subtitle} icon={tarotResult.icon} />
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

      {/* 3. SÉLECTION DU VŒU */}
      {step === 'vow' && (
        <div className="space-y-8 text-center animate-in fade-in duration-700">
          <h2 className="font-serif text-3xl text-amber-500 mb-2">The Rite has Chosen</h2>
          <div className="inline-block px-8 py-6 border border-amber-500/50 bg-amber-900/10 mb-8 rounded-sm shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <p className="text-amber-600 uppercase tracking-widest text-xs mb-2">Your Confinement</p>
            <div className="flex items-center justify-center gap-3">
              {selectedCage && React.createElement(selectedCage.icon, { size: 24, className: "text-amber-400" })}
              <p className="font-serif text-2xl text-amber-400">{selectedCage?.name}</p>
            </div>
          </div>

          <h3 className="font-serif text-xl text-amber-500 mb-4">Swear Your Vow</h3>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => runTimeAnimation('Short')} className={`${THEME.panel} p-6 flex flex-col items-center group`}>
              <span className="font-serif text-xl text-amber-500 group-hover:text-amber-400 mb-1">Short Vow</span>
              <span className="text-amber-700/70 text-sm">1h - 24h • Moderate Offering</span>
            </button>
            <button onClick={() => runTimeAnimation('Medium')} className={`${THEME.panel} p-6 flex flex-col items-center group`}>
              <span className="font-serif text-xl text-amber-500 group-hover:text-amber-400 mb-1">Medium Vow</span>
              <span className="text-amber-700/70 text-sm">1 Day - 7 Days • Heavy Devotion</span>
            </button>
            <button onClick={() => runTimeAnimation('Long')} className={`${THEME.panel} p-6 flex flex-col items-center group`}>
              <span className="font-serif text-xl text-amber-500 group-hover:text-amber-400 mb-1">Long Vow</span>
              <span className="text-amber-700/70 text-sm">7 Days - 30 Days • Absolute Surrender</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. LE VERDICT FINAL (LES 2 CARTES) */}
      {step === 'summary' && (
        <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-1000 py-8">
          <h2 className="font-serif text-3xl text-amber-500 tracking-widest uppercase">The Verdict</h2>

          {/* New Decree Card */}
          <div className="max-w-md mx-auto border-2 border-amber-500 bg-zinc-950 p-8 rounded-sm shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
            
            {/* Gold style header */}
            <div className="border-b border-amber-900/30 pb-4 mb-6">
              <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-1 font-bold">Decree of Discipline</p>
              <h3 className="font-serif text-2xl text-amber-400 uppercase tracking-wider">The Oracle's Verdict</h3>
            </div>

            {/* Central emblem */}
            <div className="flex justify-center mb-6">
              <div className="bg-amber-950/20 p-6 rounded-full border-2 border-amber-600/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                {selectedCage && React.createElement(selectedCage.icon, { size: 48, className: "text-amber-400" })}
              </div>
            </div>

            {/* Verdict details */}
            <div className="space-y-4 text-left border-t border-b border-amber-900/30 py-6 mb-6 font-serif">
              <div className="flex justify-between items-center">
                <span className="text-amber-700/80 uppercase text-xs tracking-wider">Device Assigned:</span>
                <span className="text-amber-400 text-lg font-bold">{selectedCage?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-700/80 uppercase text-xs tracking-wider">Duration of Vow:</span>
                <span className="text-amber-400 text-lg font-bold flex items-center gap-2">
                  <Hourglass size={16} className="text-amber-500" />
                  {durationStr}
                </span>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              onClick={handleProceedToTimer}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-4"
            >
              Accept the Verdict & Begin
            </button>

            {/* Share buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-amber-900/20">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = `🔮 My fate is sealed in the Sanctuary!\n⛓️ Device: ${selectedCage?.name}\n⏳ Vow Duration: ${durationStr}\n\nAccepted under the Domina's gaze.`;
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
                    const text = `🔮 My fate is sealed in the Sanctuary!\n⛓️ Device: ${selectedCage?.name}\n⏳ Vow Duration: ${durationStr}\n\nAccepted under the Domina's gaze.`;
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
                  ctx.fillText('DECREE OF DISCIPLINE', canvas.width / 2, 120);
                  ctx.fillStyle = '#b45309';
                  ctx.font = 'italic 18px serif';
                  ctx.fillText('THE SANCTUARY OF OBEDIENCE', canvas.width / 2, 155);
                  
                  // Simple Lock symbol
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 4;
                  ctx.strokeRect(canvas.width / 2 - 25, 260, 50, 40);
                  ctx.beginPath();
                  ctx.arc(canvas.width / 2, 260, 20, Math.PI, 0);
                  ctx.stroke();

                  ctx.fillStyle = '#f59e0b';
                  ctx.font = 'bold 26px serif';
                  ctx.fillText(`Assigned: ${selectedCage?.name}`, canvas.width / 2, 370);
                  ctx.font = '22px sans-serif';
                  ctx.fillText(`Duration: ${durationStr}`, canvas.width / 2, 420);
                  ctx.fillStyle = '#78350f';
                  ctx.font = 'italic 16px sans-serif';
                  ctx.fillText('Under the Domina\'s gaze, your vow begins.', canvas.width / 2, 490);
                  ctx.font = '14px monospace';
                  ctx.fillStyle = '#451a03';
                  ctx.fillText(window.location.origin, canvas.width / 2, 540);
                  const link = document.createElement('a');
                  link.download = 'decree_of_discipline.png';
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

      {/* 6. LES TIMERS (PREP & ACTIVE) */}
      {(step === 'prep' || step === 'active') && (
        <div className="py-12 flex flex-col items-center text-center border border-amber-900/50 bg-amber-950/20 relative overflow-hidden animate-in fade-in">
          <Lock size={48} className={`mb-6 transition-all duration-1000 ${step === 'active' ? 'text-amber-500 animate-pulse' : 'text-amber-700'}`} />
          <h2 className="font-serif text-3xl text-amber-500 mb-2">
            {step === 'prep' ? 'Preparation Phase' : 'The Seal is Active'}
          </h2>
          <p className="text-amber-700/80 italic mb-10 max-w-sm">
            {step === 'prep'
              ? `You have exactly 2 minutes to secure yourself within the ${selectedCage?.name}.`
              : `You are bound. The timer will release you when the debt of time is paid.`}
          </p>

          <div className="font-mono text-5xl md:text-6xl text-amber-400 mb-4 tracking-wider drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            {formatTime(timeLeft)}
          </div>
          <p className="text-amber-700/50 text-xs uppercase tracking-[0.2em] mb-12">
            {step === 'prep' ? 'Until Lock' : 'Remaining'}
          </p>

          <button
            onClick={handleBreakVow}
            className="group flex items-center gap-2 px-6 py-3 border border-red-900/50 hover:border-red-500 bg-red-950/30 text-red-700 hover:text-red-500 transition-all uppercase tracking-widest text-xs"
          >
            <ShieldAlert size={16} className="group-hover:animate-bounce" /> Break the Vow (Surrender)
          </button>
        </div>
      )}

      {/* 7. ÉCHEC / ABANDON */}
      {step === 'failed' && (
        <div className="py-16 flex flex-col items-center text-center border border-red-600 bg-red-950/40 shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in fade-in zoom-in-95 duration-500">
          <X size={64} className="text-red-500 mb-6" />
          <h2 className="font-serif text-4xl text-red-500 mb-4 tracking-wider">Vow Broken</h2>
          <p className="text-red-400/80 mb-8 max-w-md leading-relaxed text-lg">
            You have shattered the seal of trust. The Domina expects endurance, but you have offered only frailty. Your weakness is profoundly disappointing.
          </p>
          <p className="text-red-600 uppercase tracking-widest text-sm mb-10 font-bold">No tokens awarded.</p>
          <button
            onClick={back}
            className="px-8 py-4 border border-red-700 text-red-500 hover:bg-red-900/30 uppercase tracking-[0.2em] transition-all"
          >
            Crawl Away
          </button>
        </div>
      )}

      {/* 8. SUCCÈS */}
      {step === 'completed' && (
        <div className="py-12 flex flex-col items-center text-center border border-amber-500 bg-amber-900/10 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in zoom-in">
          <Sparkles size={48} className="text-amber-400 mb-6" />
          <h2 className="font-serif text-3xl text-amber-400 mb-4">Vow Fulfilled</h2>
          <p className="text-amber-600 mb-8 max-w-md">You have endured the time set by the Rite. Your devotion is recognized and your treasury expands.</p>
          <button
            onClick={handleCompletion}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all"
          >
            Claim Your Reward
          </button>
        </div>
      )}
    </div>
  );
};

// --- AGE VERIFICATION GATE ---
const AgeVerificationGate = ({ onVerified }) => (
  <>
    <div className={`min-h-screen ${THEME.bg} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>
      <div className="max-w-md w-full border border-amber-500/30 bg-zinc-900/80 backdrop-blur-sm p-8 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)] animate-in zoom-in duration-1000 relative z-10">
        <ShieldAlert size={56} className="mx-auto text-amber-500 mb-6" />
        <h1 className="font-serif text-3xl text-amber-500 mb-4 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">Restricted Sanctuary</h1>
        <p className="text-amber-700/80 mb-8 leading-relaxed">
          This domain contains mature themes of devotion, discipline, and confinement.
          You must be at least 18 years of age to proceed.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={onVerified}
            className="w-full py-4 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500 text-amber-400 font-serif tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            I am +18
          </button>
          <a
            href="https://www.google.com"
            className="w-full py-4 border border-zinc-800 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400 font-serif tracking-[0.1em] uppercase transition-all"
          >
            I am under 18 (Leave)
          </a>
        </div>
      </div>
    </div>
    <LaceDecoration />
  </>
);

// --- INTRO PANEL ---
const INTRO_PARAGRAPHS = [
  {
    type: 'normal',
    segments: [
      { text: "Welcome to the Sanctuary. Here, your obedience is measured, quantified, and ultimately, rewarded. This is a realm where submission is not merely an idea, but a tangible currency." }
    ]
  },
  {
    type: 'normal',
    segments: [
      { text: "By embracing the " },
      { text: "Discipline", highlight: true },
      { text: " of the cage, or by enduring the pain of " },
      { text: "Penance", highlight: true },
      { text: ", you prove your worth to the Domina. Every vow fulfilled, every proof accepted, swells your Treasury with sacred Tokens." }
    ]
  },
  {
    type: 'normal',
    segments: [
      { text: "These tokens are your lifeblood. Hoard them carefully, for when the time is right, you may offer them all in exchange for the " },
      { text: "Divine Reward", highlight: true },
      { text: ". The greater your sacrifice, the more the Oracle will smile upon your pleasure." }
    ]
  },
  {
    type: 'italic-center',
    segments: [
      { text: "Will you prove yourself worthy?" }
    ]
  }
];

// Precompute absolute character ranges for each text segment
let totalCharacterCount = 0;
const processedParagraphs = INTRO_PARAGRAPHS.map(p => {
  const segments = p.segments.map(s => {
    const start = totalCharacterCount;
    const end = totalCharacterCount + s.text.length;
    totalCharacterCount += s.text.length;
    return { ...s, start, end };
  });
  return { ...p, segments };
});

const IntroPanel = ({ onProceed }) => {
  const [visibleLength, setVisibleLength] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (visibleLength >= totalCharacterCount) {
      setIsDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setVisibleLength(prev => Math.min(prev + 1, totalCharacterCount));
    }, 20); // 20ms per character for smooth progressive writing
    return () => clearTimeout(timer);
  }, [visibleLength]);

  const handleSkip = () => {
    setVisibleLength(totalCharacterCount);
    setIsDone(true);
  };

  const handleProceedClick = () => {
    if (!isDone) {
      handleSkip();
    } else {
      onProceed();
    }
  };

  return (
    <>
      <div
        onClick={!isDone ? handleSkip : undefined}
        className={`min-h-screen ${THEME.bg} flex flex-col items-center justify-center p-4 relative overflow-hidden cursor-pointer select-none`}
        title={!isDone ? "Click anywhere to reveal text" : undefined}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>
        <div
          className="max-w-2xl w-full border border-amber-500/30 bg-zinc-900/80 backdrop-blur-sm p-8 md:p-12 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)] relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-serif text-3xl md:text-4xl text-amber-500 mb-6 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            The Path of Devotion
          </h2>

          <div className="space-y-6 text-amber-700/80 text-sm md:text-base leading-relaxed mb-10 text-left min-h-[300px] md:min-h-[200px]">
            {processedParagraphs.map((p, pIdx) => {
              const pStart = p.segments[0].start;
              if (visibleLength < pStart) return null;

              const isCenterItalic = p.type === 'italic-center';
              const pClass = isCenterItalic
                ? "text-center italic text-amber-600/80 mt-8 font-serif text-lg"
                : "";

              return (
                <p key={pIdx} className={pClass}>
                  {p.segments.map((s, sIdx) => {
                    if (visibleLength <= s.start) return null;

                    const textToShow = s.text.slice(0, visibleLength - s.start);
                    const isCursorHere = !isDone && visibleLength >= s.start && visibleLength < s.end;

                    return (
                      <span key={sIdx}>
                        {s.highlight ? (
                          <strong className="text-amber-500 font-serif font-normal">
                            {textToShow}
                          </strong>
                        ) : (
                          <span>{textToShow}</span>
                        )}
                        {isCursorHere && (
                          <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                        )}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleProceedClick}
              className="w-full md:w-auto px-12 py-4 bg-amber-600 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-500"
            >
              {isDone ? "Enter the Sanctuary" : "Reveal Text"}
            </button>

            {!isDone && (
              <p className="text-zinc-600 text-xs tracking-widest uppercase hover:text-zinc-400 transition-colors animate-pulse">
                [ Click anywhere to skip typing ]
              </p>
            )}
          </div>
        </div>
      </div>
      <LaceDecoration />
    </>
  );
};

// --- AUTH MODAL ---
const AuthModal = ({ onClose }) => {
  const [authName, setAuthName] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (authName.trim() && authPass.trim()) {
      setLoading(true);
      const dummyEmail = `${authName.trim().toLowerCase()}@dominaritual.com`;
      let { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password: authPass });

      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
          password: authPass
        });
        if (signUpError) {
          alert("Error: " + signUpError.message);
          setLoading(false);
          return;
        }

        if (signUpData.user) {
          await supabase.from('profiles').insert([
            { id: signUpData.user.id, username: authName.trim() }
          ]);
        }
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-amber-500/50 p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(245,158,11,0.1)] animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-amber-700 hover:text-amber-500"><X size={24} /></button>
        <Fingerprint size={48} className="mx-auto text-amber-500 mb-6" />
        <h2 className="font-serif text-2xl text-amber-400 mb-4 text-center">Identify Yourself</h2>
        <p className="text-amber-700/80 mb-8 text-center text-sm">
          Enter your alias and secret to bind your soul.
        </p>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900" />
            <input
              type="text" value={authName} onChange={(e) => setAuthName(e.target.value)}
              placeholder="Your Alias..." required
              className="w-full bg-zinc-950 border border-amber-900/50 p-4 pl-12 text-amber-100 placeholder:text-amber-900/50 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="relative">
            <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900" />
            <input
              type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)}
              placeholder="Secret Key..." required
              className="w-full bg-zinc-950 border border-amber-900/50 p-4 pl-12 text-amber-100 placeholder:text-amber-900/50 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-amber-600 text-zinc-950 font-bold uppercase tracking-[0.2em] hover:bg-amber-500 transition-colors disabled:opacity-50">
            {loading ? 'Binding...' : 'Bind my Soul'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPALE ---
export default function App() {
  const [isAdultVerified, setIsAdultVerified] = useState(false);
  const [introSeen, setIntroSeen] = useState(false);
  const [view, setView] = useState('hub');
  const [tokens, setTokens] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setTokens(data.tokens);
    } else {
      // Auto-create profile if missing
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fallbackUsername = user.email ? user.email.split('@')[0] : 'obedient_soul';
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: userId, username: fallbackUsername }])
          .select()
          .single();
        if (newProfile) {
          setProfile(newProfile);
          setTokens(newProfile.tokens);
        }
      }
    }
  };

  const addTokens = async (amount) => {
    const newTotal = tokens + amount;
    setTokens(newTotal);
    if (user) {
      await supabase.from('profiles').update({ tokens: newTotal }).eq('id', user.id);
    }
  };

  const spendAllTokens = async () => {
    setTokens(0);
    if (user) {
      await supabase.from('profiles').update({ tokens: 0 }).eq('id', user.id);
    }
  };

  const ProfileView = () => (
    <div className="max-w-2xl mx-auto p-6 pt-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-amber-900/30 pb-4">
        <h2 className="font-serif text-3xl text-amber-500 flex items-center gap-3">
          <User size={32} /> Soul Profile
        </h2>
        <button onClick={() => setView('hub')} className="text-amber-700 hover:text-amber-500 uppercase tracking-widest text-xs">
          Return to Sanctuary
        </button>
      </div>

      <div className={`${THEME.panel} p-8 mb-8`}>
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full border border-amber-500 bg-amber-900/20 flex items-center justify-center">
            <User size={48} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-amber-400 mb-1">{profile?.username || 'Unknown Soul'}</h3>
            <p className="text-amber-700/60 uppercase tracking-widest text-xs">ID: {user?.id?.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-amber-900/30 p-6 text-center">
            <p className="text-amber-700/60 uppercase tracking-widest text-xs mb-2">Treasury</p>
            <p className="text-amber-500 font-mono text-3xl">{tokens} ⏀</p>
          </div>
          <div className="bg-zinc-950 border border-amber-900/30 p-6 text-center">
            <p className="text-amber-700/60 uppercase tracking-widest text-xs mb-2">Role</p>
            <p className="text-amber-500 font-mono text-3xl capitalize">{profile?.role || 'User'}</p>
          </div>
        </div>
      </div>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          setView('hub');
        }}
        className="w-full py-4 border border-red-900/50 text-red-700 hover:bg-red-900/20 hover:text-red-500 font-serif tracking-[0.2em] uppercase transition-all"
      >
        Sever Binding (Logout)
      </button>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'chastity': return <DisciplineRitual back={() => setView('hub')} addTokens={addTokens} user={user} requireAuth={() => setShowAuthModal(true)} />;
      case 'penance': return <PenanceRitual back={() => setView('hub')} addTokens={addTokens} user={user} profile={profile} requireAuth={() => setShowAuthModal(true)} />;
      case 'reward': return <DivineReward back={() => setView('hub')} tokens={tokens} spendAllTokens={spendAllTokens} addTokens={addTokens} />;
      case 'admin':
        if (profile?.role !== 'admin') return <HubView />;
        return <AdminDashboard back={() => setView('hub')} />;
      case 'profile': return <ProfileView />;
      default: return <HubView />;
    }
  };

  const HubView = () => (
    <main className="max-w-4xl mx-auto p-6 pt-12 space-y-16 animate-in fade-in duration-700">
      {/* Piliers */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setView('penance')} className={`${THEME.panel} p-8 text-center flex flex-col items-center group`}>
          <Flame size={40} className="mb-4 text-amber-700 group-hover:text-amber-500" />
          <h2 className="font-serif text-xl text-amber-500 mb-2">Penance</h2>
        </button>
        <button onClick={() => setView('chastity')} className={`${THEME.panel} p-8 text-center flex flex-col items-center group`}>
          <Lock size={40} className="mb-4 text-amber-700 group-hover:text-amber-500" />
          <h2 className="font-serif text-xl text-amber-500 mb-2">Discipline</h2>
        </button>
        <button className={`${THEME.panel} p-8 text-center flex flex-col items-center group opacity-50`}>
          <Dumbbell size={40} className="mb-4 text-amber-700" />
          <h2 className="font-serif text-xl text-amber-500 mb-2">Devotion</h2>
        </button>
      </section>

      {/* Récompense Centrale */}
      <section className="flex justify-center px-4">
        <button onClick={() => { if (tokens >= 100) setView('reward'); }} className={`w-full max-w-md p-8 text-center transition-all duration-700 ${tokens >= 100 ? 'bg-amber-900/10 border border-amber-600' : 'bg-zinc-900/30 border border-amber-900/20 opacity-60'}`}>
          <Sparkles size={32} className={`mx-auto mb-4 ${tokens >= 100 ? 'text-amber-400' : 'text-amber-800'}`} />
          <h2 className={`font-serif text-2xl uppercase mb-2 ${tokens >= 100 ? 'text-amber-400' : 'text-amber-800'}`}>Divine Reward</h2>
        </button>
      </section>

      {/* Spoil Me Footer */}
      <section className="pt-12 pb-8 border-t border-amber-900/20 flex flex-col items-center gap-6">
        <a 
          href="https://youpay.me/Dominaritual623" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-12 py-5 group flex border border-amber-700/50 hover:border-amber-400 text-amber-500 font-serif text-xl uppercase transition-colors"
        >
          <Gift size={24} className="mr-4 text-amber-600 group-hover:text-amber-400" /> Spoil Me
        </a>

        <div className="flex gap-4">
          <a
            href="https://x.com/domina_ritual"
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter / X"
            className="p-3 border border-amber-900/40 hover:border-amber-500 text-amber-600 hover:text-amber-400 transition-all flex items-center justify-center rounded-sm"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/qRmwseJv"
            target="_blank"
            rel="noopener noreferrer"
            title="Discord"
            className="p-3 border border-amber-900/40 hover:border-amber-500 text-amber-600 hover:text-amber-400 transition-all flex items-center justify-center rounded-sm"
          >
            <svg viewBox="0 0 127.14 96.36" aria-hidden="true" className="w-5 h-5 fill-current">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.89-.65,1.76-1.34,2.58-2.06a75.48,75.48,0,0,0,65.8,0c.82.72,1.69,1.41,2.58,2.06a68.4,68.4,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.42-18.83C129.9,49.12,123.82,26.31,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
            </svg>
          </a>
        </div>
      </section>
    </main>
  );

  if (!isAdultVerified) {
    return <AgeVerificationGate onVerified={() => setIsAdultVerified(true)} />;
  }

  if (!introSeen) {
    return <IntroPanel onProceed={() => setIntroSeen(true)} />;
  }

  return (
    <>
      <div className={`min-h-screen ${THEME.bg} text-zinc-300 font-sans selection:bg-amber-900/50 overflow-x-hidden pb-12`}>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        <header className={`sticky top-0 z-40 bg-black/80 backdrop-blur-md flex justify-between items-center p-4 md:p-6 ${THEME.header}`}>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setMenuOpen(true)} className="text-amber-700 p-2 hover:text-amber-500 transition-colors"><Menu size={28} /></button>
          </div>
          <h1 onClick={() => setView('hub')} className="text-xl md:text-2xl font-serif text-amber-500 tracking-[0.1em] md:tracking-[0.25em] uppercase cursor-pointer">Domina Ritual</h1>
          <div className="flex gap-2 md:gap-6 items-center">
            <div className="text-right hidden md:block">
              <span className="text-amber-700/60 text-xs uppercase tracking-widest block mb-1">Treasury</span>
              <span className="text-amber-500 font-mono text-lg">{tokens} ⏀</span>
            </div>
            <div className="flex items-center gap-2">
              {!user ? (
                <button onClick={() => setShowAuthModal(true)} className="text-amber-500 font-serif uppercase tracking-widest text-[10px] md:text-xs border border-amber-900/50 px-3 md:px-4 py-2 hover:bg-amber-900/20 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  Login
                </button>
              ) : (
                <button onClick={() => setView('profile')} className="flex items-center gap-2 text-left group">
                  <div className="text-right hidden sm:block mr-2"><span className="text-amber-700/60 text-xs uppercase tracking-widest block group-hover:text-amber-500 transition-colors">{profile?.username || 'Soul'}</span></div>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center border-amber-500 bg-amber-900/20 group-hover:bg-amber-800/40 transition-colors`}>
                    <User size={18} className="text-amber-400" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 bg-black/98 z-50 p-8 flex flex-col">
            <button onClick={() => setMenuOpen(false)} className="self-end text-amber-700"><X size={36} /></button>
            <nav className="flex flex-col items-center flex-1 gap-10 text-3xl font-serif text-amber-500/50 uppercase mt-20">
              <button onClick={() => { setView('hub'); setMenuOpen(false); }}>Sanctuary</button>
              {profile?.role === 'admin' && <button onClick={() => { setView('admin'); setMenuOpen(false); }} className="text-amber-400">Domina Dashboard</button>}
              {user && <button onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }} className="text-red-900/50 hover:text-red-500 mt-8 text-xl">Sever Soul (Logout)</button>}
            </nav>
          </div>
        )}

        {renderContent()}
      </div>
      <LaceDecoration />
    </>
  );
}