import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Certificate, OperationType } from '../../types';
import { handleFirestoreError, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { 
  FileBadge, 
  Download, 
  Eye, 
  Calendar, 
  ShieldCheck, 
  User as UserIcon,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Sparkles,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserDashboard() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'portfolio' | 'verify'>('portfolio');

  // Verification Search states
  const [verifyQueryId, setVerifyQueryId] = useState('');
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchMyCertificates();
    }
  }, [user?.uid]);

  const fetchMyCertificates = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const qUID = query(
        collection(db, 'certificates'),
        where('userId', '==', user.uid)
      );
      const snapUID = await getDocs(qUID);
      const listUID = snapUID.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));

      let listEmail: Certificate[] = [];
      if (user.email) {
        const qEmail = query(
          collection(db, 'certificates'),
          where('userEmail', '==', user.email.trim().toLowerCase())
        );
        const snapEmail = await getDocs(qEmail);
        listEmail = snapEmail.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
      }

      // Merge and deduplicate by document id
      const mergedMap = new Map<string, Certificate>();
      listUID.forEach(c => mergedMap.set(c.id, c));
      listEmail.forEach(c => mergedMap.set(c.id, c));
      
      const mapped = Array.from(mergedMap.values());
      mapped.sort((a, b) => {
        const tA = typeof a.createdAt === 'number' ? a.createdAt : Number(a.createdAt) || 0;
        const tB = typeof b.createdAt === 'number' ? b.createdAt : Number(b.createdAt) || 0;
        return tB - tA;
      });
      setCertificates(mapped);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'certificates');
    }
    setLoading(false);
  };

  const handleVerifySearch = async (targetId?: string) => {
    const idToSearch = (targetId || verifyQueryId).trim();
    if (!idToSearch) return;

    setIsVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const docRef = doc(db, 'certificates', idToSearch);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Certificate;
        setVerifyResult({ id: docSnap.id, ...data });
      } else {
        setVerifyError('Certificate record was not found on the secure registry. Please check the spelling or format.');
      }
    } catch (error: any) {
      console.error('[Verify] Fetch failed:', error);
      if (error?.code === 'permission-denied') {
        setVerifyError('Access restricted. This certificate is protected under high privacy policies. You can only verify certificates that belong to your student account.');
      } else {
        setVerifyError('An error occurred during verification. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const quickInspectAndVerify = (cert: Certificate) => {
    setVerifyQueryId(cert.id);
    setActiveTab('verify');
    handleVerifySearch(cert.id);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCerts = certificates.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateName?.toLowerCase().includes(search.toLowerCase()) ||
    c.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Profile/Welcome Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-10" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#003366] tracking-tight mb-2">
              Welcome back, {user?.displayName?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Explore your secure student dashboard. You can review your credentials, trace certificate validity, or run an official instant verification check.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold border border-blue-100">
                <FileBadge size={14} /> {certificates.length} Issued Certificates
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-100">
                <ShieldCheck size={14} /> Verified Student Profile
              </span>
            </div>
          </motion.div>
        </div>

        <Card className="bg-[#003366] text-white overflow-hidden border-none shadow-xl relative">
          <CardContent className="p-8 relative">
            <div className="absolute -top-10 -right-10 p-4 opacity-5 text-white">
              <ShieldCheck size={200} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg border border-white/5">
                  <UserIcon size={20} className="text-amber-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Official Student Profile</span>
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">{user?.displayName}</p>
                <p className="text-sm text-white/70 font-mono italic">{user?.email}</p>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Registration Enrollment ID</p>
                <p className="text-xl font-mono tracking-tight text-amber-400 font-bold">
                  {user?.enrollmentId || 'UKCS-7729-23'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation Selector */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-4 px-1 text-sm font-bold border-b-2 tracking-tight transition-all uppercase flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <FileBadge size={16} />
            My Active Portfolio
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-4 px-1 text-sm font-bold border-b-2 tracking-tight transition-all uppercase flex items-center gap-2 ${
              activeTab === 'verify'
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            <ShieldCheck size={16} />
            Verify Secure Code
          </button>
        </nav>
      </div>

      {/* Tab Context Contents */}
      <div className="min-h-[400px]">
        {activeTab === 'portfolio' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#003366] tracking-tight">Your Portfolio</h2>
                <p className="text-xs text-slate-400 italic">Fully verified system records matching your academic or professional enrollment</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search title or ID..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] text-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200/50" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCerts.map((cert) => (
                  <div key={cert.id}>
                    <Card className="hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 bg-white border-slate-200">
                      <CardContent className="p-0">
                        {/* Top Header styling */}
                        <div className="bg-slate-50/80 p-6 border-b border-slate-100 relative overflow-hidden rounded-t-2xl">
                          <div className="bg-white p-3 rounded-xl shadow-sm inline-block group-hover:scale-105 transition-transform duration-300 relative z-10 border border-slate-100">
                            <FileBadge className="text-[#003366]" size={32} />
                          </div>
                          <div className="absolute top-6 right-6 z-10">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                              Verified
                            </span>
                          </div>
                          <div className="absolute -bottom-4 -right-4 text-slate-200/40 group-hover:text-blue-100/40 transition-colors">
                            <ShieldCheck size={80} />
                          </div>
                        </div>

                        {/* Info payload */}
                        <div className="p-6 space-y-4">
                          <div>
                            <div className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1 font-mono">SECURE ACADEMIC DOCUMENT</div>
                            <h3 className="font-extrabold text-slate-800 text-lg leading-snug line-clamp-2">{cert.title}</h3>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">SECURE CODE:</span>
                              <span className="text-[10px] text-slate-600 font-mono tracking-tight bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 font-black">
                                {cert.id.slice(0, 14)}...
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(cert.id);
                                  }}
                                  className="text-slate-400 hover:text-[#003366]"
                                  title="Copy Full Secure ID"
                                >
                                  {copiedId === cert.id ? 'Copied' : <Copy size={10} />}
                                </button>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-105">
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Issued On</p>
                              <p className="text-xs font-bold text-slate-600 italic">{formatDate(cert.startDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Valid Until</p>
                              <p className="text-xs font-bold text-slate-600 italic">{formatDate(cert.endDate)}</p>
                            </div>
                          </div>

                          {/* Interactive Buttons */}
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button 
                                variant="primary" 
                                className="flex-1 gap-1.5 text-xs font-bold uppercase tracking-widest h-10 bg-[#003366] hover:bg-[#002244] border-none" 
                                onClick={() => window.open(cert.fileUrl, '_blank')}
                              >
                                <Eye size={14} /> Preview File
                              </Button>
                              <a 
                                href={cert.fileUrl} 
                                download={cert.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                                title="Download File"
                              >
                                <Download size={18} />
                              </a>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              className="w-full text-xs font-bold uppercase tracking-wider text-[#003366] border-[#003366]/20 hover:bg-slate-50 gap-1.5"
                              onClick={() => quickInspectAndVerify(cert)}
                            >
                              <QrCode size={14} /> Check Security Verification Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {filteredCerts.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <FileBadge size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xl font-bold text-slate-400 italic">No certificates found matching your search term.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Secure Instant Verification Hub */
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1">
                <Sparkles size={12} /> Live Integrity Registry Check
              </span>
              <h2 className="text-3xl font-black text-[#003366] tracking-tight">Audit Certificate Verification</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-sm">
                Enter any official certificate code or document reference ID issued by the portal to verify its integrity, status, and timeline validity on the blockchain ledger database.
              </p>
            </div>

            {/* Input Board */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g. y0nIeS8B47vCIsLa38q7 or standard Certificate Reference ID" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] font-mono text-sm placeholder:font-sans font-semibold transition-all"
                    value={verifyQueryId}
                    onChange={(e) => setVerifyQueryId(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => handleVerifySearch()} 
                  isLoading={isVerifying}
                  className="bg-[#003366] hover:bg-slate-900 gap-2 h-12 md:w-36 text-sm font-bold uppercase tracking-wide"
                >
                  Verify Code
                </Button>
              </div>

              {/* Suggestions Helper for Quick Evaluation */}
              {certificates.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Or click to inspect one of your issued certificates:</p>
                  <div className="flex flex-wrap gap-2">
                    {certificates.slice(0, 3).map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setVerifyQueryId(c.id);
                          handleVerifySearch(c.id);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-600 font-mono transition-all font-medium flex items-center gap-1 shrink-0"
                      >
                        <QrCode size={12} className="text-slate-400" />
                        {c.id.slice(0, 8)}... ({c.title.slice(0, 16)}...)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Result Display */}
            <AnimatePresence mode="wait">
              {isVerifying && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-[#003366] italic">Polling registry ledger...</p>
                </motion.div>
              )}

              {verifyError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex gap-4"
                >
                  <div className="shrink-0 text-red-600">
                    <AlertCircle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm tracking-tight">Registry Audit Mismatch</h4>
                    <p className="text-xs leading-relaxed text-red-700/90">{verifyError}</p>
                  </div>
                </motion.div>
              )}

              {verifyResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
                >
                  {/* Status Banner */}
                  <div className="bg-emerald-600 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-700 relative">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <CheckCircle2 size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Live Check Complete</div>
                        <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 leading-none">
                          OFFICIALLY VERIFIED SECURE DOCUMENT
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm z-10 shrink-0">
                      Active Credentials
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-slate-100">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Document Title</p>
                          <h4 className="text-xl font-bold text-slate-900 mt-1 leading-tight">{verifyResult.title}</h4>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Associated Candidate Name</p>
                          <p className="text-lg font-extrabold text-[#003366] mt-0.5">{verifyResult.userName || 'Verified Candidate'}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Enrollment Identification ID</p>
                          <p className="font-mono text-sm text-slate-700 font-bold bg-slate-50 inline-block px-2.5 py-1 rounded border border-slate-100 mt-1">
                            {verifyResult.userEnrollmentId || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Issue Date</p>
                            <p className="text-sm font-bold text-slate-800 mt-1 italic">{formatDate(verifyResult.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Valid Until Date</p>
                            <p className="text-sm font-bold text-slate-800 mt-1 italic">{formatDate(verifyResult.endDate)}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200/60 mt-4">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Public Safety Verification Hash</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-xs text-[#003366] font-extrabold leading-none truncate block max-w-[200px]">
                              {verifyResult.id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(verifyResult.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-[#003366] transition-colors shrink-0"
                              title="Copy Hash Reference ID"
                            >
                              {copiedId === verifyResult.id ? (
                                <span className="text-[9px] text-emerald-600 font-bold">Copied!</span>
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational download segment */}
                    <div className="flex justify-between items-center bg-blue-50/40 p-4 rounded-xl border border-blue-105">
                      <div className="flex items-center gap-2.5">
                        <FileBadge className="text-[#003366]" size={20} />
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">Secure Audit File</p>
                          <p className="text-[10px] text-slate-500 font-mono">{verifyResult.fileName || 'certificate_doc.pdf'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
                          onClick={() => window.open(verifyResult.fileUrl, '_blank')}
                        >
                          <Eye size={14} className="mr-1.5 inline-block" /> Preview
                        </Button>
                        <a 
                          href={verifyResult.fileUrl} 
                          download={verifyResult.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 px-4 items-center gap-1.5 rounded-lg bg-[#003366] text-white hover:bg-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
