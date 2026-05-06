import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, 
  Shirt, 
  Sparkles, 
  Calendar as CalendarIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export function Layout({ children, user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
    { to: '/outfits', label: 'Outfits', icon: Sparkles },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen bg-brand-paper flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-transparent border-r border-brand-border h-screen sticky top-0">
        <div className="h-20 px-10 flex items-center border-b border-brand-border">
          <span className="font-serif text-2xl italic font-bold tracking-tighter">Aura</span>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300",
                  isActive 
                    ? "text-brand-text border-l-2 border-brand-text -ml-4 pl-8" 
                    : "text-brand-accent opacity-50 hover:opacity-100"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-8 space-y-6">
          <div className="p-6 bg-[#EFEEE8] rounded-[40px]">
            <p className="text-[11px] leading-relaxed italic text-brand-accent">
              "Style is a way to say who you are without having to speak."
            </p>
            <p className="text-[9px] mt-2 uppercase tracking-widest opacity-60">— Rachel Zoe</p>
          </div>

          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full grayscale"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-brand-text truncate">{user.displayName}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-brand-accent hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-6 bg-white border-b border-brand-border sticky top-0 z-50">
        <span className="font-serif text-xl italic font-bold">Aura</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <LogOut className="w-6 h-6 rotate-180" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="hidden md:flex h-20 items-center justify-between px-10 border-b border-brand-border bg-white/50 backdrop-blur-sm sticky top-0 z-40">
           <div className="art-label">System: Active</div>
           <div className="flex gap-8">
              <span className="art-label group border-b border-brand-text pb-1 cursor-default">Ready for Today</span>
           </div>
        </header>

        <main className="flex-1 p-8 md:p-12 lg:p-16 w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, ease: "anticipate" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="h-14 bg-brand-text text-brand-paper flex items-center justify-between px-10">
          <div className="text-[9px] uppercase tracking-[0.3em] opacity-60">Rule-Based Coordination Engine v1.02</div>
          <div className="flex gap-6 text-[9px] uppercase tracking-[0.2em] opacity-80">
            <span>Sync: Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
