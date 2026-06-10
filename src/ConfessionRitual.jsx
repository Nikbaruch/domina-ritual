import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Award, UploadCloud, Loader2, MessageSquare, Check
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { 
  MODES, 
  INTENSITIES, 
  AFTERMATHS, 
  getWeightedPunishment, 
  CONFESSION_JUDGMENTS 
} from './ritualData';
import { TarotCardFaceDown, TarotCardFaceUp, PenanceEmblem } from './PenanceRitual';

const THEME = {
  bg: 'bg-zinc-950',
  panel: 'bg-zinc-900/50 border border-amber-900/30 hover:border-amber-600 transition-all duration-500',
  text: 'text-amber-500',
  textMuted: 'text-amber-700/70',
};

export default function ConfessionRitual({ back, addTokens, user, profile, requireAuth }) {
  const [step, setStep] = useState('confession_input');
  
  // Confession state
  const [confessionText, setConfessionText] = useState('');
  const [mode, setMode] = useState(null);
  const [judgmentText, setJudgmentText] = useState('');
  
  // Draws
  const [draw1, setDraw1] = useState(null); // Punishment
  const [draw2, setDraw2] = useState(null); // Intensity
  const [draw3, setDraw3] = useState(null); // Aftermath

  const [photoProofSubmitted, setPhotoProofSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const [displayedText, setDisplayedText] = useState('');
  const [sermonFinished, setSermonFinished] = useState(false);
  const [flippedCards, setFlippedCards] = useState(0);

  useEffect(() => {
    if (step === 'sermon_animation' && judgmentText) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(judgmentText.substring(0, i + 1));
        i++;
        if (i >= judgmentText.length) {
          clearInterval(interval);
          setSermonFinished(true);
        }
      }, 40); // 40ms per char
      return () => clearInterval(interval);
    }
  }, [step, judgmentText]);

  useEffect(() => {
    if (step === 'cards_reveal') {
      const t1 = setTimeout(() => setFlippedCards(1), 800);
      const t2 = setTimeout(() => setFlippedCards(2), 2200);
      const t3 = setTimeout(() => setFlippedCards(3), 3600);
      const t4 = setTimeout(() => setStep('summary'), 6500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [step]);

  const handleConfessionSubmit = () => {
    if (confessionText.trim().length === 0) return;
    
    const length = confessionText.trim().length;
    let selectedMode;
    let judgmentPool;

    if (length < 150) {
      selectedMode = MODES.find(m => m.id === 'hard');
      judgmentPool = CONFESSION_JUDGMENTS.hard;
    } else if (length < 500) {
      selectedMode = MODES.find(m => m.id === 'mid');
      judgmentPool = CONFESSION_JUDGMENTS.mid;
    } else {
      selectedMode = MODES.find(m => m.id === 'soft');
      judgmentPool = CONFESSION_JUDGMENTS.soft;
    }

    const randomJudgment = judgmentPool[Math.floor(Math.random() * judgmentPool.length)];
    
    // Instantly generate all 3 draws
    const d1 = getWeightedPunishment(selectedMode.id);
    const options = INTENSITIES[d1.id][selectedMode.id];
    const d2 = options[Math.floor(Math.random() * options.length)];
    const d3 = AFTERMATHS[Math.floor(Math.random() * AFTERMATHS.length)];

    setMode(selectedMode);
    setJudgmentText(randomJudgment);
    setDraw1(d1);
    setDraw2(d2);
    setDraw3(d3);
    
    setDisplayedText('');
    setSermonFinished(false);
    setStep('sermon_animation');
  };

  const acceptRedemption = () => {
    setFlippedCards(0);
    setStep('cards_reveal');
  };

  const handleAcceptConfession = () => {
    addTokens(mode.tokens);
    back();
  };

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
      const filePath = `${user.id}/confession-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const punishmentDetails = `Confession (${mode.name}) | ${draw1?.name} | ${draw2} | ${draw3}`;
      
      const { error: dbError } = await supabase
        .from('penance_proofs')
        .insert([{
          user_id: user.id,
          image_url: filePath,
          punishment_details: punishmentDetails,
          bonus_tokens: mode.tokens
        }]);

      if (dbError) throw dbError;

      addTokens(mode.tokens);
      setPhotoProofSubmitted(true);
    } catch (error) {
      console.error("Upload error details:", error);
      alert("Failed to upload proof. Error: " + (error.message || JSON.stringify(error)));
    } finally {
      setUploading(false);
    }
  };

  const getShareCanvas = () => {
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
    ctx.fillText('DECREE OF CONFESSION', canvas.width / 2, 120);
    ctx.fillStyle = '#b45309';
    ctx.font = 'italic 18px serif';
    ctx.fillText('THE SANCTUARY OF OBEDIENCE', canvas.width / 2, 155);
    
    // Simple shape
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
    ctx.fillText('Absolved under the Domina\'s gaze.', canvas.width / 2, 510);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#451a03';
    ctx.fillText(window.location.origin, canvas.width / 2, 550);
    return canvas;
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

      {/* 1. CONFESSION INPUT */}
      {step === 'confession_input' && (
        <div className="space-y-8 animate-in fade-in duration-700 text-center max-w-2xl mx-auto">
          <MessageSquare size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-amber-500 mb-2">The Confession</h2>
          <p className="text-amber-700/80 mb-10">
            Unburden your soul to the Domina. Speak your sins, your flaws, your deepest regrets. The Oracle reads the weight of your words; a meager confession will be met with severe discipline, while true vulnerability may earn mercy.
          </p>

          <div className="bg-zinc-900/50 border border-amber-900/30 p-6 rounded-sm text-left">
            <textarea
              className="w-full h-48 bg-zinc-950 border border-amber-900/50 rounded-sm p-4 text-amber-500 focus:outline-none focus:border-amber-500 transition-colors font-serif resize-none"
              placeholder="Confess your sins here..."
              value={confessionText}
              onChange={(e) => setConfessionText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-amber-700/60 font-mono">
              <span>{confessionText.length} characters</span>
              <span>{confessionText.length < 150 ? 'Incomplete' : confessionText.length < 500 ? 'Adequate' : 'Profound'}</span>
            </div>
          </div>

          <button
            onClick={handleConfessionSubmit}
            disabled={confessionText.trim().length === 0}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] mt-8 flex items-center justify-center gap-2"
          >
            Submit Confession
          </button>
        </div>
      )}

      {/* 2. SERMON ANIMATION */}
      {step === 'sermon_animation' && (
        <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-[1000ms] min-h-[400px] max-w-2xl mx-auto">
          <MessageSquare size={64} className="text-amber-500 mb-8 animate-pulse" style={{ animationDuration: '3s' }} />
          <h2 className="font-serif text-2xl md:text-3xl text-amber-500 tracking-widest uppercase mb-8 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            The Oracle Speaks
          </h2>
          <div className="h-32 flex items-center justify-center">
            <p className="text-lg md:text-xl text-amber-400 font-serif italic leading-relaxed drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              "{displayedText}"<span className="animate-pulse">_</span>
            </p>
          </div>
          
          <div className="mt-16 h-16">
            {sermonFinished && (
              <button
                onClick={acceptRedemption}
                className="px-8 py-4 bg-transparent border-2 border-amber-600 text-amber-500 font-bold tracking-[0.2em] uppercase hover:bg-amber-900/40 hover:text-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                Accept Your Redemption
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2.5 CARDS REVEAL */}
      {step === 'cards_reveal' && (
        <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000 overflow-hidden relative min-h-[500px]">
          <h2 className="font-serif text-3xl text-amber-500 tracking-widest uppercase mb-16 relative z-30 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
            Receiving Discipline...
          </h2>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full max-w-3xl">
            {/* Card 1: Method */}
            <div className={`w-28 h-40 md:w-40 md:h-56 perspective-1000 transition-transform duration-700 ${flippedCards >= 1 ? 'is-flipped scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}`}>
              <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="card-front"><TarotCardFaceDown /></div>
                <div className="card-back"><TarotCardFaceUp title={draw1?.name} subtitle="The Method" cardId={draw1?.id} /></div>
              </div>
            </div>

            {/* Card 2: Intensity */}
            <div className={`w-28 h-40 md:w-40 md:h-56 perspective-1000 transition-transform duration-700 ${flippedCards >= 2 ? 'is-flipped scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}`}>
              <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="card-front"><TarotCardFaceDown /></div>
                <div className="card-back"><TarotCardFaceUp title={draw2} subtitle="The Intensity" cardId={draw1?.id} /></div>
              </div>
            </div>

            {/* Card 3: Aftermath */}
            <div className={`w-28 h-40 md:w-40 md:h-56 perspective-1000 transition-transform duration-700 ${flippedCards >= 3 ? 'is-flipped scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}`}>
              <div className="card-inner shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="card-front"><TarotCardFaceDown /></div>
                <div className="card-back"><TarotCardFaceUp title={draw3} subtitle="The Extra" cardId={null} /></div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setStep('summary')}
            className={`mt-16 text-amber-700 hover:text-amber-500 uppercase tracking-widest text-xs transition-opacity duration-1000 ${flippedCards >= 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            Read the Decree
          </button>
        </div>
      )}

      {/* 3. SUMMARY & PHOTO PROOF */}
      {step === 'summary' && (
        <div className="space-y-12 text-center animate-in fade-in zoom-in-95 duration-1000 py-8">
          <h2 className="font-serif text-3xl text-amber-500 tracking-widest uppercase mb-4">Judgment is Passed</h2>

          {/* New Decree Card */}
          <div className="max-w-md mx-auto border-2 border-amber-500 bg-zinc-950 p-8 rounded-sm shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="absolute inset-1 border border-amber-500/30 rounded-sm pointer-events-none" />
            
            <div className="border-b border-amber-900/30 pb-4 mb-6">
              <p className="text-amber-700 uppercase tracking-widest text-[10px] mb-1 font-bold">Decree of Confession</p>
              <h3 className="font-serif text-2xl text-amber-400 uppercase tracking-wider">The Oracle Speaks</h3>
            </div>

            <div className="flex justify-center mb-6 min-h-[160px] items-center">
              <PenanceEmblem cardId={draw1?.id} title={draw2} isRecap={true} />
            </div>

            <div className="text-sm text-amber-600/90 font-serif italic mb-6 px-4 py-3 bg-amber-950/20 border-l-2 border-amber-600">
              "{judgmentText}"
            </div>

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

            <div className="bg-zinc-900/60 border border-amber-900/30 p-4 rounded-sm mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-amber-900/30 pb-2">
                <span className="text-amber-700 uppercase tracking-widest text-[10px]">Absolution Token Reward</span>
                <span className="text-amber-500 font-mono text-sm">{mode?.tokens} ⏀</span>
              </div>
              
              {!photoProofSubmitted ? (
                <div className="flex flex-col items-center relative">
                  <p className="text-amber-600/80 text-[11px] mb-3">Submit photo proof to double your absolution reward.</p>
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

            <button
              onClick={handleAcceptConfession}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-4 flex items-center justify-center gap-2"
            >
              <Award size={18} /> Accept Your Fate
            </button>

            {/* Share buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-amber-900/20">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = `🔮 My Confession has been judged at the Sanctuary!\n🩸 Method: ${draw1?.name}\n⚡ Intensity: ${draw2}\n⛓️ Aftermath: ${draw3}\n\nAbsolved under the Domina's gaze.`;
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
                    const text = `🔮 My Confession has been judged at the Sanctuary!\n🩸 Method: ${draw1?.name}\n⚡ Intensity: ${draw2}\n⛓️ Aftermath: ${draw3}\n\nAbsolved under the Domina's gaze.`;
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
                  const canvas = getShareCanvas();
                  const link = document.createElement('a');
                  link.download = 'decree_of_confession.png';
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
