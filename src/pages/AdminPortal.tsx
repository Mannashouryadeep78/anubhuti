"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SutraKnot } from '@/components/SutraKnot';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const AdminPortal = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    if (!supabase) return;
    
    // Fetch requests
    const { data: reqData, error: reqError } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reqError) toast.error("Failed to fetch requests");
    else setRequests(reqData || []);

    // Fetch active codes
    const { data: codeData } = await supabase
      .from('access_codes')
      .select('email, code')
      .gt('expires_at', new Date().toISOString());
    
    const codeMap: Record<string, string> = {};
    codeData?.forEach(c => {
      codeMap[c.email] = c.code;
    });
    setCodes(codeMap);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (request: any) => {
    if (!supabase) return;
    const toastId = toast.loading(`Processing approval for ${request.full_name}...`);

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      await supabase.from('access_codes').insert([
        { email: request.email, code: otp, expires_at: expiresAt.toISOString() }
      ]);

      await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      toast.success("Approved and code generated.", { id: toastId });
      fetchData();
    } catch (error) {
      toast.error("Approval failed", { id: toastId });
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><SutraKnot className="animate-pulse text-[#C5A059]" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-white/10 pb-8">
          <div>
            <h1 className="text-3xl serif text-[#C5A059]">Access Management</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-2">Review and manage intentions</p>
          </div>
          <SutraKnot className="w-8 h-8 text-[#C5A059]/40" />
        </header>

        <div className="grid gap-6">
          {requests.length === 0 ? (
            <p className="text-center py-20 text-white/20 italic">No requests found.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="border border-white/5 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-lg serif">{req.full_name}</h3>
                  <p className="text-xs text-white/40">{req.email} • {req.phone}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`text-[9px] uppercase tracking-widest px-2 py-1 ${req.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {req.status}
                    </span>
                    {codes[req.email] && (
                      <span className="text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-1">
                        CODE: {codes[req.email]}
                      </span>
                    )}
                  </div>
                </div>
                {req.status === 'pending' && (
                  <Button 
                    onClick={() => handleApprove(req)}
                    className="bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none px-8 text-[10px] uppercase tracking-widest font-bold"
                  >
                    Approve & Generate Code
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;