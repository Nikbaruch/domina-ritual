import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ShieldCheck, X, Check, Camera, Flame } from 'lucide-react';

export default function AdminDashboard({ back }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProofs();
  }, []);

  const fetchPendingProofs = async () => {
    setLoading(true);
    // Fetch pending proofs and join with profiles to get the username
    const { data, error } = await supabase
      .from('penance_proofs')
      .select(`
        *,
        profiles ( username )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proofs:', error);
    } else {
      // Fetch signed URLs for private bucket
      const proofsWithUrls = await Promise.all(
        (data || []).map(async (proof) => {
          const { data: urlData } = await supabase.storage
            .from('proofs')
            .createSignedUrl(proof.image_url, 3600); // 1 hour expiry
          return { ...proof, signedUrl: urlData?.signedUrl };
        })
      );
      setProofs(proofsWithUrls);
    }
    setLoading(false);
  };

  const handleApprove = async (proof) => {
    // 1. Update proof status
    const { error: updateError } = await supabase
      .from('penance_proofs')
      .update({ status: 'approved' })
      .eq('id', proof.id);

    if (updateError) {
      console.error('Error updating proof:', updateError);
      return;
    }

    // 2. Fetch current tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', proof.user_id)
      .single();

    // 3. Add bonus tokens
    if (profile) {
      await supabase
        .from('profiles')
        .update({ tokens: profile.tokens + proof.bonus_tokens })
        .eq('id', proof.user_id);
    }

    // Refresh list
    fetchPendingProofs();
  };

  const handleReject = async (proofId) => {
    const { error } = await supabase
      .from('penance_proofs')
      .update({ status: 'rejected' })
      .eq('id', proofId);

    if (error) {
      console.error('Error rejecting proof:', error);
    } else {
      fetchPendingProofs();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-amber-900/30 pb-4">
        <h2 className="font-serif text-3xl text-amber-500 flex items-center gap-3">
          <ShieldCheck size={32} /> Domina's Dashboard
        </h2>
        <button onClick={back} className="text-amber-700 hover:text-amber-500 uppercase tracking-widest text-xs">
          Return to Sanctuary
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-amber-600 uppercase tracking-widest text-sm flex items-center gap-2">
          <Camera size={16} /> Pending Proofs ({proofs.length})
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Flame size={48} className="text-amber-900/50 animate-pulse" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center p-12 border border-amber-900/20 bg-zinc-900/20">
          <p className="text-amber-700/60 uppercase tracking-widest">No pending devotions to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proofs.map(proof => (
            <div key={proof.id} className="border border-amber-900/50 bg-zinc-900/40 p-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-amber-400 font-bold">Soul: {proof.profiles?.username || 'Unknown'}</p>
                  <p className="text-amber-700/80 text-sm mt-1">{proof.punishment_details}</p>
                </div>
                <div className="text-right">
                  <span className="text-amber-500 font-mono text-sm">+{proof.bonus_tokens} ⏀</span>
                </div>
              </div>
              
              <div className="mb-6 aspect-video bg-zinc-950 border border-amber-900/20 overflow-hidden flex items-center justify-center">
                <img 
                  src={proof.signedUrl || ''} 
                  alt="Proof" 
                  className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Private+Image+Hidden' }}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleReject(proof.id)}
                  className="flex-1 py-3 border border-red-900/50 text-red-700 hover:bg-red-900/20 hover:text-red-500 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs"
                >
                  <X size={16} /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(proof)}
                  className="flex-1 py-3 bg-amber-900/20 border border-amber-500 text-amber-400 hover:bg-amber-900/40 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs"
                >
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
