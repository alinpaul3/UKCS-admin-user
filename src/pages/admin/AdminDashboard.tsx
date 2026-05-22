/* Admin Components and Logic */
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  addDoc, 
  setDoc,
  serverTimestamp, 
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { User, Certificate, OperationType } from '../../types';
import { handleFirestoreError, formatDate, cn } from '../../lib/utils';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { 
  Users, 
  FileBadge, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Search,
  Eye,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCertificateModal from './UploadCertificateModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, certificates: 0 });
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const certsSnap = await getDocs(collection(db, 'certificates'));
      
      setStats({
        users: usersSnap.size,
        certificates: certsSnap.size
      });

      const mapped = certsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
      mapped.sort((a, b) => {
        const tA = typeof a.createdAt === 'number' ? a.createdAt : Number(a.createdAt) || 0;
        const tB = typeof b.createdAt === 'number' ? b.createdAt : Number(b.createdAt) || 0;
        return tB - tA;
      });
      setCerts(mapped);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'certificates');
    }
    setLoading(false);
  };

  const handleDeleteClick = (cert: Certificate) => {
    setCertToDelete(cert);
    setIsDeleteModalOpen(true);
  };

  const deleteCert = async () => {
    if (!certToDelete) return;
    
    console.log('[Delete] Starting deletion process for:', certToDelete.id, certToDelete);
    setLoading(true);

    try {
      // 1. Delete Cloudinary asset if publicId exists
      if (certToDelete.publicId) {
        console.log('[Delete] Removing Cloudinary asset:', certToDelete.publicId);
        try {
          const cloudRes = await fetch('/api/delete-asset', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: certToDelete.publicId })
          });
          
          if (!cloudRes.ok) {
            const errorData = await cloudRes.json();
            console.error('[Delete] Cloudinary deletion failed:', errorData);
          } else {
            console.log('[Delete] Cloudinary asset removed successfully');
          }
        } catch (cloudErr) {
          console.error('[Delete] Network error during Cloudinary deletion:', cloudErr);
        }
      }

      // 2. Delete Firestore document
      console.log('[Delete] Removing Firestore document:', certToDelete.id);
      await deleteDoc(doc(db, 'certificates', certToDelete.id));
      
      // 3. Update local state
      setCerts(prev => prev.filter(c => c.id !== certToDelete.id));
      setStats(prev => ({ ...prev, certificates: Math.max(0, prev.certificates - 1) }));
      
      console.log('[Delete] Deletion completed successfully for:', certToDelete.id);
      setIsDeleteModalOpen(false);
      setCertToDelete(null);
      alert('Success: Certificate and associated files deleted.');
    } catch (error: any) {
      console.error('[Delete] Critical failure during deletion:', error);
      if (error.code === 'permission-denied') {
        alert('Permission Denied: Your account doesn\'t have authorization to delete certificates.');
      } else {
        alert('Deletion failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certs.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.userName?.toLowerCase().includes(search.toLowerCase()) ||
    c.userEnrollmentId?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-brand-blue tracking-tight">Admin Portal Control</h1>
          <p className="text-sm text-slate-500 font-medium italic">User & Certificate Lifecycle Management</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2 bg-action-blue">
          <Plus size={20} />
          <span>Issue New Certificate</span>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Registered" 
          value={stats.users} 
          subtitle="System Users"
          icon={<Users className="text-blue-600" size={20} />} 
          color="bg-blue-50"
        />
        <StatsCard 
          title="Active Issues" 
          value={stats.certificates} 
          subtitle="Total Certs"
          icon={<FileBadge className="text-emerald-600" size={20} />} 
          color="bg-emerald-50"
        />
        <StatsCard 
          title="Pending Sync" 
          value={0} 
          subtitle="Data Integrity"
          icon={<Clock className="text-amber-600" size={20} />} 
          color="bg-amber-50"
        />
        <div className="flex flex-col justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Database Status</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-bold text-slate-700">FIREBASE PRODUCTION</span>
           </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader 
            title="Certificate Management" 
            subtitle="Search and manage all issued certificates"
            action={
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name, ID or title..." 
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={fetchDashboardData}>
                   Refresh
                </Button>
              </div>
            }
          />
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-y border-slate-100">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-600 uppercase text-[10px] tracking-widest">Candidate</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 uppercase text-[10px] tracking-widest">Certificate / Title</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 uppercase text-[10px] tracking-widest">Reference Code (Firestore ID)</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 uppercase text-[10px] tracking-widest">Issued On</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 uppercase text-[10px] tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCerts.slice(0, 50).map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{cert.userName || 'System User'}</div>
                          <div className="text-[10px] text-brand-blue font-black uppercase">{cert.userEnrollmentId || 'VERIFIED'}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{cert.title}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50/60 border border-blue-100 px-2 py-1 rounded truncate max-w-[180px]" title={cert.id}>
                              {cert.id}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cert.id);
                                setCopiedId(cert.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#003366] transition-colors shrink-0"
                              title="Copy Reference ID"
                            >
                              {copiedId === cert.id ? (
                                <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(cert.createdAt)}</td>
                        <td className="px-6 py-4">
                           <div className="flex justify-end gap-2">
                             <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Document">
                               <Eye size={18} />
                             </a>
                             <button 
                               onClick={() => handleDeleteClick(cert)} 
                               className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                               title="Delete Certificate"
                             >
                               <Trash2 size={18} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCerts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          {certs.length === 0 ? 'No certificates issued yet.' : 'No matching certificates found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>

      <UploadCertificateModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Certificate?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete the certificate for <span className="font-bold text-slate-700">{certToDelete?.userName}</span>? 
                This action is permanent and will remove both the record and the file.
              </p>
              
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={deleteCert} isLoading={loading}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon, color }: { title: string; value: number; subtitle: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{title}</p>
           <p className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</p>
           <p className="text-xs text-slate-500 font-medium italic">{subtitle}</p>
        </div>
        <div className={cn('p-3 rounded-xl border border-slate-100 shadow-sm', color)}>
           {icon}
        </div>
      </CardContent>
    </Card>
  );
}
