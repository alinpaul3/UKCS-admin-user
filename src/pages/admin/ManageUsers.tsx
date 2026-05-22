import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Note: In a real app, this would be a cloud function or manual invite process
import { db, auth } from '../../lib/firebase';
import { User, OperationType } from '../../types';
import { handleFirestoreError, cn } from '../../lib/utils';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Plus, Search, Mail, User as UserIcon, Trash2, Edit2, Shield, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    enrollmentId: '',
    role: 'user' as 'admin' | 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        // Update user
        const updatedUser = { 
          ...editingUser, 
          displayName: formData.displayName,
          username: formData.username.trim().toLowerCase() || formData.email.split('@')[0].toLowerCase(),
          enrollmentId: formData.enrollmentId,
          role: formData.role
        };
        await setDoc(doc(db, 'users', editingUser.uid), updatedUser);
      } else {
        // Create user
        const tempUid = 'user_' + Math.random().toString(36).substr(2, 9);
        const newUser: User = {
          uid: tempUid,
          email: formData.email,
          displayName: formData.displayName,
          username: formData.username.trim().toLowerCase() || formData.email.split('@')[0].toLowerCase(),
          role: formData.role,
          enrollmentId: formData.enrollmentId,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'users', tempUid), newUser);
      }
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
       alert('Error saving user: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    if (userToDelete.uid === auth.currentUser?.uid) {
      alert("Security Error: You cannot delete your own administrative account while logged in.");
      setIsDeleteModalOpen(false);
      return;
    }

    setLoading(true);
    try {
      console.log('[ManageUsers] Deleting user document:', userToDelete.uid);
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      alert('Success: User record removed from database.');
    } catch (error: any) {
      console.error('[ManageUsers] Delete failed:', error);
      if (error.code === 'permission-denied') {
        alert('Permission Denied: Your account doesn\'t have authorization to delete users. Please ensure your role is correctly set to "admin" in your profile.');
      } else {
        alert('Failed to delete user: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName,
      username: user.username || '',
      email: user.email,
      password: '',
      enrollmentId: user.enrollmentId || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      displayName: '',
      username: '',
      email: '',
      password: '',
      enrollmentId: '',
      role: 'user'
    });
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.enrollmentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-blue tracking-tight">User Directory</h1>
          <p className="text-sm text-slate-500 font-medium italic">Manage portal access and permissions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-action-blue">
          <Plus size={20} />
          <span>Register New User</span>
        </Button>
      </div>

      <Card>
        <CardHeader 
          title="All Registered Accounts" 
          action={
            <div className="relative w-64">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search users..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] text-sm"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          }
        />
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#003366] text-white italic text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-semibold">User Details</th>
                    <th className="px-6 py-4 font-semibold">Username</th>
                    <th className="px-6 py-4 font-semibold">Enrollment ID</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-[#003366] font-bold">
                              {user.displayName?.charAt(0) || user.email.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">{user.displayName}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-[#003366] bg-blue-50 px-2 py-1 rounded">
                          {user.username || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm px-2 py-1 bg-slate-100 rounded text-slate-700">
                          {user.enrollmentId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                          user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                             <Edit2 size={18} />
                           </button>
                           <button onClick={() => confirmDelete(user)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                             <Trash2 size={18} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </CardContent>
      </Card>

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-[#003366] p-6 text-white">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                   {editingUser ? <Edit2 size={24} /> : <Plus size={24} />}
                   {editingUser ? 'Update User Details' : 'Register New User'}
                </h3>
                <p className="text-white/70 text-sm italic font-medium">UKCS Certification System</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Input 
                  label="Full Name" 
                  placeholder="John Doe" 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  required 
                />
                <Input 
                  label="Username" 
                  placeholder="johndoe" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required 
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!!editingUser}
                  required 
                />
                <Input 
                  label="Enrollment ID" 
                  placeholder="UKCS-2024-XXXX" 
                  value={formData.enrollmentId} 
                  onChange={(e) => setFormData({...formData, enrollmentId: e.target.value})}
                />
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Role</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'admin'|'user'})}
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" isLoading={loading}>
                    {editingUser ? 'Save Changes' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <UserX size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User Record?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to remove <span className="font-bold text-slate-700">{userToDelete?.displayName}</span>? 
                This will revoke their access to the portal certificates.
              </p>
              
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={deleteUser} isLoading={loading}>
                  Delete User
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
