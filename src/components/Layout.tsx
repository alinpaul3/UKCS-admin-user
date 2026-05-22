import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, FileBadge, LogOut, Menu, X, User } from 'lucide-react';
import { Button } from './common/Button';
import { Logo } from './common/Logo';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/dashboard', label: 'Student View', icon: FileBadge },
  ];

  const userLinks = [
    { to: '/dashboard', label: 'My Certificates', icon: FileBadge },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-brand-blue text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Logo size="md" theme="dark" variant="horizontal" />
              <div className="hidden lg:flex gap-4 ml-8">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                      location.pathname === link.to ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-bold leading-tight">{user?.username || user?.displayName || 'User'}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                   <p className="text-[10px] text-white/60 leading-none uppercase tracking-widest font-black">{user?.role} AUTH ACTIVE</p>
                </div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                <User size={20} />
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2" onClick={handleSignOut}>
                <LogOut size={20} />
              </Button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#002244] border-t border-white/10 px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </div>
              </Link>
            ))}
            <button
               onClick={handleSignOut}
               className="w-full text-left px-4 py-3 rounded-lg bg-red-900/30 text-red-100 mt-4"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>

      <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-8 text-[11px] text-slate-400 shrink-0 font-medium">
         <div className="flex items-center gap-4">
            <span>Database: Firebase Cloud v4</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Storage: United Kingdom Certification Services</span>
         </div>
         <div className="flex items-center gap-4 uppercase tracking-tighter">
            <span className="text-green-600 font-bold">Security Rules Validated</span>
            <span className="text-slate-200">|</span>
            <span>© {new Date().getFullYear()} UKCS Certification Services</span>
         </div>
      </footer>
    </div>
  );
};
