'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiRepeat, FiBox, FiUsers,
  FiFileText, FiCpu, FiSettings,
  FiChevronRight, FiChevronLeft, FiLogOut, FiX, FiUser,
  FiTrendingUp, FiTarget, FiBarChart2, FiCamera,
  FiLink, FiDollarSign,
} from 'react-icons/fi';
import { useUIStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';

const menuGroups = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', icon: FiHome, href: '/dashboard' },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { label: 'Transaksi', icon: FiRepeat, href: '/transactions' },
      { label: 'Hutang & Piutang', icon: FiDollarSign, href: '/hutang-piutang' },
      { label: 'Budgeting', icon: FiTarget, href: '/budgeting' },
      { label: 'Cashflow', icon: FiBarChart2, href: '/cashflow' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { label: 'Inventori', icon: FiBox, href: '/inventory' },
      { label: 'Pelanggan', icon: FiUsers, href: '/crm' },
      { label: 'Scan Struk', icon: FiCamera, href: '/scan-struk' },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { label: 'Laporan', icon: FiFileText, href: '/reports' },
      { label: 'Asisten AI', icon: FiCpu, href: '/ai-assistant' },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { label: 'Integrasi', icon: FiLink, href: '/integrasi' },
      { label: 'Pengaturan', icon: FiSettings, href: '/settings' },
    ],
  },
];

function SidebarContent({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, business, logout } = useAuth();

  const expanded = mobile || sidebarOpen;

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Toggle */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold gradient-text"
          >
            DuitTrack
          </motion.span>
        )}
        {mobile ? (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-smooth ml-auto" aria-label="Tutup">
            <FiX size={18} />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className={`p-2 hover:bg-white/10 rounded-xl transition-smooth ${!sidebarOpen ? 'mx-auto' : ''}`}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
          </button>
        )}
      </div>

      {/* Bisnis Info */}
      {expanded && business && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-white/50 truncate">Bisnis Aktif</p>
          <p className="text-sm font-semibold truncate">{business.name}</p>
        </div>
      )}

      {/* Menu Groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {expanded && (
              <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-5 py-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-smooth ${
                        isActive
                          ? 'bg-primary text-darker shadow-lg shadow-primary/20'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={17} className="flex-shrink-0" />
                      {expanded && <span className="text-sm font-medium">{item.label}</span>}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-white/10 p-2 flex-shrink-0 space-y-1">
        {expanded && user && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-primary/20 flex items-center justify-center flex-shrink-0">
              {(user as any).avatar_url ? (
                <img src={(user as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : user.full_name ? (
                <span className="text-[10px] font-bold text-primary">
                  {user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              ) : (
                <FiUser size={13} className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.full_name || user.email}</p>
              <p className="text-xs text-white/40 truncate">Owner</p>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ x: 2 }}
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-smooth"
        >
          <FiLogOut size={18} className="flex-shrink-0" />
          {expanded && <span className="text-sm font-medium">Keluar</span>}
        </motion.button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, mobileOpen, setMobileOpen } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden lg:block fixed left-0 top-0 h-[100dvh] z-40 print:hidden"
        style={{ width: sidebarOpen ? 240 : 72, transition: 'width 0.25s ease' }}
      >
        <div className="h-full bg-darker border-r border-white/10 overflow-hidden">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 print:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 h-[100dvh] w-[240px] bg-darker border-r border-white/10 z-50 flex flex-col"
            >
              <SidebarContent mobile onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
