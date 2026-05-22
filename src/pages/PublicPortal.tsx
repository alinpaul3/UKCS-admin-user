import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Certificate } from '../types';
import { formatDate } from '../lib/utils';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Logo } from '../components/common/Logo';
import { 
  ShieldCheck, 
  Search, 
  FileBadge, 
  Download, 
  Eye, 
  ExternalLink, 
  AlertCircle,
  Copy, 
  HelpCircle, 
  Building,
  GraduationCap,
  Sparkles,
  QrCode,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifyId, setVerifyId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Automatically trigger verification if query parameters contain an id or verifyId
  useEffect(() => {
    const queryId = searchParams.get('verifyId') || searchParams.get('id');
    if (queryId) {
      setVerifyId(queryId);
      triggerVerification(queryId);
    }
  }, [searchParams]);

  const triggerVerification = async (targetId: string) => {
    const idToSearch = targetId.trim();
    if (!idToSearch) return;

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const docRef = doc(db, 'certificates', idToSearch);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Certificate;
        setResult({ id: docSnap.id, ...data });
      } else {
        setError('Certificate reference number not found in our global directory database. Please correct typing or seek support.');
      }
    } catch (err: any) {
      console.error('[Public Audit] Error checking document:', err);
      setError('A secure communication error occurred. Please verify your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerification(verifyId);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Navigation Header */}
      <header className="bg-[#003366] text-white py-4 px-6 border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="md" theme="dark" variant="horizontal" />
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 text-xs font-black uppercase tracking-wider h-10 px-4"
              onClick={() => navigate('/login')}
            >
              <Lock size={14} className="mr-1.5" />
              Sign In to Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interactive Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-12">
        {/* Banner Section */}
        <div className="text-center py-8 max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full"
          >
            <Sparkles size={12} /> SECURE CRYPTOGRAPHIC VERIFICATION GATEWAY
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-[#003366] tracking-tight leading-tight">
            Verify Academic Credentials & Documents
          </h2>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
            Authorized portal for institutions, corporate hiring staff, and academic offices to query live blockchain-indexed student portfolios and instantly download verified transcripts.
          </p>
        </div>

        {/* Central Search Board */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-2xl border border-slate-200 bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-4">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                  Secure Certificate Reference Code
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="e.g. y0nIeS8B47vCIsLa38q7 or system-generated hash id" 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] font-mono text-sm placeholder:font-sans font-semibold transition-all shadow-inner"
                      value={verifyId}
                      onChange={(e) => setVerifyId(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    isLoading={isVerifying}
                    className="bg-[#003366] hover:bg-slate-950 font-extrabold uppercase tracking-widest px-8 py-3.5 rounded-xl text-sm h-auto flex items-center justify-center gap-2 block shadow-md"
                  >
                    Verify Document
                  </Button>
                </div>
              </form>

              {/* Security Banner Badge */}
              <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
                <ShieldCheck size={18} className="text-[#003366] shrink-0" />
                <span>All documents are cryptographically verified and pulled directly from our database servers in real-time.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Verification Results Display */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {isVerifying ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm space-y-4"
              >
                <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-[#003366] uppercase tracking-widest">Querying registry database</p>
                  <p className="text-xs text-slate-400 font-mono">Status: Awaiting integrity handshake...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex gap-4"
              >
                <AlertCircle className="text-red-600 shrink-0" size={24} />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm tracking-tight uppercase">Registry Lookup Failed</h4>
                  <p className="text-xs leading-relaxed text-red-700/90 font-medium">{error}</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
              >
                {/* Header Badge style */}
                <div className="bg-emerald-600 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-700 relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 shadow-sm">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Handshake Verified</div>
                      <h3 className="text-lg font-black tracking-tight leading-none">
                        CRIMINAL & PROFESSIONAL INTEGRITY VALID
                      </h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm z-10 shrink-0">
                    ACTIVE CERTIFICATE
                  </span>
                </div>

                {/* Details Grid */}
                <div className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AWARDS SUBJECT</span>
                        <h4 className="text-xl font-bold text-slate-900 mt-1 leading-snug">{result.title}</h4>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">CANDIDATE NAME</span>
                        <p className="text-lg font-extrabold text-[#003366] mt-0.5">{result.userName || 'Verified Candidate'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ENROLLMENT REGISTRATION</span>
                        <p className="font-mono text-sm text-slate-700 font-bold bg-slate-50 inline-block px-2.5 py-1 rounded border border-slate-150 mt-1">
                          {result.userEnrollmentId || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">COMMENCEMENT</span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{formatDate(result.startDate)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">EXPIRATION</span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{formatDate(result.endDate)}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">CERTIFICATE IDENTITY HASH</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs text-[#003366] font-black leading-none truncate max-w-[200px]">
                            {result.id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(result.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-[#003366] transition-colors shrink-0"
                            title="Copy Verification ID to Clipboard"
                          >
                            {copiedId === result.id ? (
                              <span className="text-[9px] text-emerald-600 font-bold">Copied!</span>
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Previews and Downloads */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Associated Credentials Document</h5>
                    
                    {/* Embedded file preview for PDFs or images */}
                    {result.fileUrl && (
                      <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                        <iframe 
                          src={`${result.fileUrl}#toolbar=0`}
                          title="Credential View" 
                          className="w-full h-full relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 gap-4">
                      <div className="flex items-center gap-3">
                        <FileBadge className="text-[#003366]" size={20} />
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-none uppercase">{result.fileName || 'certificate_doc.pdf'}</p>
                          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">{result.fileType || 'PDF Document'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="secondary" 
                          className="flex-1 sm:flex-initial text-xs uppercase tracking-widest font-black"
                          onClick={() => window.open(result.fileUrl, '_blank')}
                        >
                          <Eye size={12} className="mr-1" /> Open Direct
                        </Button>
                        <a 
                          href={result.fileUrl} 
                          download={result.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-lg bg-[#003366] text-white hover:bg-[#002244] transition-colors text-xs font-bold uppercase tracking-widest font-black flex-1 sm:flex-initial"
                        >
                          <Download size={14} /> Download File
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Informative Onboarding Segment */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 font-medium">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 bg-[#003366]/10 text-[#003366] rounded-xl flex items-center justify-center">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900">Are you a Student?</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Log in with your official UKCS credentials to access your clean student view dashboard, trace issued certificates, download records, and review profiles.
                  </p>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="text-[#003366] hover:text-slate-900 font-bold text-xs inline-flex items-center gap-1 uppercase tracking-wider"
                  >
                    Go to Student Panel &rarr;
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 bg-[#003366]/10 text-[#003366] rounded-xl flex items-center justify-center">
                    <Building size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900">Affiliated Corporates</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Verify background records safely by scanning candidate QR codes or pasting hash IDs directly into the search console. Instant verification is fully public.
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Fully Compliant Registry
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Corporate footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-6 text-center text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p>&copy; 2026 UKCS Academic Certification Registry. All cryptographic audits verified.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Verification</span>
            <span>&bull;</span>
            <span className="hover:text-white cursor-pointer transition-colors font-mono">support@ukcs.in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
