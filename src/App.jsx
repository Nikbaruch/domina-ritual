import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Lock, Dumbbell, Gift, Menu, X, 
  Sparkles, User, ChevronLeft, Hexagon, Circle, Disc,
  Maximize2, Minimize2, ScanLine, MinusCircle, ShieldAlert,
  Fingerprint, Hourglass, Eye, Key
} from 'lucide-react';

const THEME = {
  bg: 'bg-zinc-950',
  panel: 'bg-zinc-900/50 border border-amber-900/30 hover:border-amber-600 transition-all duration-500',
  panelActive: 'bg-amber-900/40 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  text: 'text-amber-500',
  textMuted: 'text-amber-700/70',
  gold: 'text-amber-400',
  header: 'border-b border-amber-900/30',
};

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
const DisciplineRitual = ({ back, addTokens, user, setUser }) => {
  const [step, setStep] = useState('inventory'); 
  const [inventory, setInventory] = useState([]);
  const [selectedCage, setSelectedCage] = useState(null);
  const [vowType, setVowType] = useState(null);
  const [durationStr, setDurationStr] = useState('');
  
  // Variables temporelles robustes (Préparation Backend)
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Authentification
  const [authName, setAuthName] = useState('');
  const [authPass, setAuthPass] = useState('');

  // Tarot Animation States
  const [tarotContext, setTarotContext] = useState(null);
  const [tarotPhase, setTarotPhase] = useState('shuffling'); 
  const [tarotResult, setTarotResult] = useState({ title: '', icon: null, subtitle: '' });
  const [deckSize, setDeckSize] = useState(0);
  const [pickedCardIndex, setPickedCardIndex] = useState(null);

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
    
    setTimeout(() => {
      setTarotPhase('spreading');
      setTimeout(() => setTarotPhase('waiting'), 1000);
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
    
    setTimeout(() => {
      setTarotPhase('spreading');
      setTimeout(() => setTarotPhase('waiting'), 1000);
    }, 3500);
  };

  // Clic sur une carte
  const handleCardPick = (index) => {
    if (tarotPhase !== 'waiting') return; 
    setPickedCardIndex(index);
    setTarotPhase('picked');
    
    setTimeout(() => {
      setTarotPhase('flipping');
      setTimeout(() => {
        setTarotPhase('done');
        setTimeout(() => {
          if (tarotContext === 'cage') setStep('vow');
          else setStep('summary');
        }, 3000);
      }, 800);
    }, 600);
  };

  // Validation finale et lancement du Timer
  const handleProceedToTimer = () => {
    if (!user) {
      setStep('auth_gate');
    } else {
      startPrepPhase();
    }
  };

  // Simulation Supabase : Connexion via Pseudo/MDP (Faux Email en arrière-plan)
  const handleAuth = (e) => {
    e.preventDefault();
    if (authName.trim() && authPass.trim()) {
      // CODE FUTUR SUPABASE ICI :
      // const dummyEmail = `${authName.trim().toLowerCase()}@domina-ritual.local`;
      // const { data, error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password: authPass });
      // if(error) await supabase.auth.signUp({ email: dummyEmail, password: authPass, options: { data: { username: authName } }});
      
      setUser(authName.trim());
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
        <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 overflow-hidden relative min-h-[500px]">
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
          
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <div className="w-48 h-72 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <TarotCardFaceUp title={selectedCage?.name} subtitle="The Apparatus" icon={selectedCage?.icon} />
            </div>
            <div className="hidden md:flex items-center justify-center text-amber-900/50"><Lock size={32} /></div>
            <div className="w-48 h-72 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <TarotCardFaceUp title={durationStr} subtitle="The Binding Time" icon={Hourglass} />
            </div>
          </div>
          
          <button 
            onClick={handleProceedToTimer}
            className="w-full max-w-md mx-auto py-5 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500 text-amber-400 font-serif tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            Accept the Verdict
          </button>
        </div>
      )}

      {/* 5. VÉRIFICATION D'IDENTITÉ (AUTH) */}
      {step === 'auth_gate' && (
        <div className="py-12 text-center animate-in zoom-in-95 duration-500">
          <Fingerprint size={48} className="mx-auto text-amber-500 mb-6" />
          <h2 className="font-serif text-2xl text-amber-400 mb-4">Identify Yourself</h2>
          <p className="text-amber-700/80 mb-8 max-w-md mx-auto">
            The seal cannot be cast on an unknown soul. Enter your alias and secret to bind this vow to your treasury.
          </p>
          <form onSubmit={handleAuth} className="max-w-xs mx-auto space-y-4">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900" />
              <input 
                type="text" value={authName} onChange={(e) => setAuthName(e.target.value)}
                placeholder="Your Alias..." required
                className="w-full bg-zinc-900 border border-amber-900/50 p-4 pl-12 text-amber-100 placeholder:text-amber-900/50 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="relative">
              <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-900" />
              <input 
                type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)}
                placeholder="Secret Key..." required
                className="w-full bg-zinc-900 border border-amber-900/50 p-4 pl-12 text-amber-100 placeholder:text-amber-900/50 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-amber-600 text-zinc-950 font-bold uppercase tracking-[0.2em] hover:bg-amber-500 transition-colors">
              Bind my Soul
            </button>
          </form>
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

// --- APP PRINCIPALE ---
export default function App() {
  const [view, setView] = useState('hub');
  const [tokens, setTokens] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null); 

  const addTokens = (amount) => setTokens(prev => prev + amount);

  const renderContent = () => {
    switch (view) {
      case 'chastity': return <DisciplineRitual back={() => setView('hub')} addTokens={addTokens} user={user} setUser={setUser} />;
      default: return <HubView />;
    }
  };

  const HubView = () => (
    <main className="max-w-4xl mx-auto p-6 pt-12 space-y-16 animate-in fade-in duration-700">
      {/* Piliers */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className={`${THEME.panel} p-8 text-center flex flex-col items-center group opacity-50`}>
          <Flame size={40} className="mb-4 text-amber-700" />
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
        <button onClick={() => { if(tokens >= 100) setView('reward'); }} className={`w-full max-w-md p-8 text-center transition-all duration-700 ${tokens >= 100 ? 'bg-amber-900/10 border border-amber-600' : 'bg-zinc-900/30 border border-amber-900/20 opacity-60'}`}>
          <Sparkles size={32} className={`mx-auto mb-4 ${tokens >= 100 ? 'text-amber-400' : 'text-amber-800'}`} />
          <h2 className={`font-serif text-2xl uppercase mb-2 ${tokens >= 100 ? 'text-amber-400' : 'text-amber-800'}`}>Divine Reward</h2>
        </button>
      </section>

      {/* Spoil Me Footer */}
      <section className="pt-12 pb-8 border-t border-amber-900/20 flex justify-center">
        <button className="px-12 py-5 group flex border border-amber-700/50 hover:border-amber-400 text-amber-500 font-serif text-xl uppercase">
          <Gift size={24} className="mr-4 text-amber-600 group-hover:text-amber-400" /> Spoil Me
        </button>
      </section>
    </main>
  );

  return (
    <div className={`min-h-screen ${THEME.bg} text-zinc-300 font-sans selection:bg-amber-900/50 overflow-x-hidden`}>
      <header className={`sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center p-6 ${THEME.header}`}>
        <button onClick={() => setMenuOpen(true)} className="text-amber-700 p-2"><Menu size={28} /></button>
        <h1 onClick={() => setView('hub')} className="text-2xl font-serif text-amber-500 tracking-[0.25em] uppercase cursor-pointer">Domina Ritual</h1>
        <div className="flex gap-6 items-center">
          <div className="text-right hidden md:block">
            <span className="text-amber-700/60 text-xs uppercase tracking-widest block mb-1">Treasury</span>
            <span className="text-amber-500 font-mono text-lg">{tokens} ⏀</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block mr-2"><span className="text-amber-700/60 text-xs uppercase tracking-widest block">{user || 'Unknown Soul'}</span></div>
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${user ? 'border-amber-500 bg-amber-900/20' : 'border-amber-800 bg-zinc-900'}`}>
              <User size={18} className={user ? 'text-amber-400' : 'text-amber-600'} />
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 bg-zinc-950/98 z-50 p-8 flex flex-col">
          <button onClick={() => setMenuOpen(false)} className="self-end text-amber-700"><X size={36} /></button>
          <nav className="flex flex-col items-center flex-1 gap-10 text-3xl font-serif text-amber-500/50 uppercase mt-20">
            <button onClick={() => { setView('hub'); setMenuOpen(false); }}>Sanctuary</button>
            {user && <button onClick={() => { setUser(null); setMenuOpen(false); }} className="text-red-900/50 hover:text-red-500 mt-8 text-xl">Sever Soul (Logout)</button>}
          </nav>
        </div>
      )}

      {renderContent()}
    </div>
  );
}