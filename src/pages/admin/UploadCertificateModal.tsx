import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Certificate, User } from '../../types';
import { Upload, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  certificate?: Certificate | null;
}

export default function UploadCertificateModal({ isOpen, onClose, onSuccess, certificate }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    startDate: '',
    endDate: '',
    certificateName: ''
  });
  const isEditMode = Boolean(certificate);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setFile(null);
      if (certificate) {
        setFormData({
          userId: certificate.userId || '',
          title: certificate.title || '',
          startDate: certificate.startDate || '',
          endDate: certificate.endDate || '',
          certificateName: certificate.certificateName || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, certificate]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    } catch (e) {
      console.error(e);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false
  } as any);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !isEditMode) || !formData.userId) return;

    setLoading(true);
    try {
      let uploadRes: { secure_url?: string; public_id?: string } = {};
      let fileUrl = certificate?.fileUrl || '';

      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
          throw new Error('Server upload failed');
        }

        uploadRes = await response.json();
        fileUrl = uploadRes.secure_url || fileUrl;
      }

      const selectedUser = users.find(u => u.uid === formData.userId);
      const certificateData = {
        ...formData,
        userName: selectedUser?.displayName || 'Unknown User',
        userEnrollmentId: selectedUser?.enrollmentId || 'N/A',
        userEmail: selectedUser?.email || '',
        fileUrl,
        publicId: uploadRes.public_id || certificate?.publicId || '',
        fileName: file?.name || certificate?.fileName || '',
        fileType: file?.type || certificate?.fileType || '',
      };

      if (isEditMode && certificate) {
        await updateDoc(doc(db, 'certificates', certificate.id), {
          ...certificateData,
          updatedAt: Date.now(),
          updatedBy: auth.currentUser?.uid,
        });
      } else {
        await addDoc(collection(db, 'certificates'), {
          ...certificateData,
          uploadedBy: auth.currentUser?.uid,
          createdAt: Date.now()
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      alert('Upload failed: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFile(null);
    setFormData({ userId: '', title: '', startDate: '', endDate: '', certificateName: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
             {/* Left side: Upload area */}
             <div className="md:w-5/12 bg-slate-50 p-6 border-r border-slate-100 flex flex-col">
                <div className="mb-6">
                   <h3 className="text-xl font-black text-[#003366] tracking-tight">{isEditMode ? 'Edit Document' : 'Upload Document'}</h3>
                   <p className="text-sm text-slate-500 font-medium italic">{isEditMode ? 'Replace file if needed' : 'PDF or images only'}</p>
                </div>

                <div 
                  {...getRootProps()} 
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                    isDragActive ? 'border-[#003366] bg-[#003366]/5' : 'border-slate-300 hover:border-[#003366]/50'
                  }`}
                >
                   <input {...getInputProps()} />
                   {file ? (
                     <div className="text-center">
                        <div className="bg-emerald-100 text-emerald-700 p-4 rounded-full inline-block mb-3">
                           <CheckCircle2 size={40} />
                        </div>
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="mt-4 text-xs font-bold text-red-600 hover:underline"
                        >
                          Change File
                        </button>
                     </div>
                   ) : isEditMode && certificate?.fileName ? (
                     <div className="text-center">
                        <div className="bg-blue-100 text-blue-700 p-4 rounded-full inline-block mb-3">
                           <CheckCircle2 size={40} />
                        </div>
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{certificate.fileName}</p>
                        <p className="text-sm text-slate-500">Current file</p>
                        <p className="text-xs text-slate-400 mt-4">Click to upload a replacement</p>
                     </div>
                   ) : (
                     <div className="text-center">
                        <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                        <p className="font-bold text-slate-700">Drag & Drop</p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Right side: Form */}
             <form onSubmit={handleUpload} className="md:w-7/12 p-8 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assign to User</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
                      value={formData.userId}
                      onChange={(e) => setFormData({...formData, userId: e.target.value})}
                      required
                    >
                      <option value="">Select a user...</option>
                      {users && users.filter(u => u && u.uid).map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName || u.email || 'Untitled User'} ({u.enrollmentId || u.email || u.uid})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input 
                    label="Certificate Title" 
                    placeholder="E.g. Advanced Cybersecurity Certification" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />

                  <Input 
                    label="Internal Certificate Name (Optional)" 
                    placeholder="UKCS-CERT-2024" 
                    value={formData.certificateName}
                    onChange={(e) => setFormData({...formData, certificateName: e.target.value})}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Start Date" 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required 
                    />
                    <Input 
                      label="End Date (Expiry Optional)" 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                   <Button type="submit" className="flex-1" isLoading={loading} disabled={(!file && !isEditMode) || !formData.userId}>
                      {isEditMode ? 'Save Changes' : 'Issue Certificate'}
                   </Button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
