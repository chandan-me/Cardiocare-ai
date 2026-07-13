import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeartbeat, 
  FaThLarge, 
  FaPlusCircle, 
  FaHistory, 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes, 
  FaMoon, 
  FaSun,
  FaShieldAlt,
  FaSlidersH,
  FaBookMedical,
  FaRobot,
  FaUsers,
  FaUserShield
} from 'react-icons/fa';

const DashboardLayout = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaThLarge },
    { name: 'New Prediction', path: '/dashboard/predict', icon: FaPlusCircle },
    { name: 'Prediction History', path: '/dashboard/history', icon: FaHistory },
    { name: 'Patient Directory', path: '/dashboard/patients', icon: FaUsers },
    { name: 'Cardiology Simulator', path: '/dashboard/simulator', icon: FaSlidersH },
    { name: 'Reference Toolkit', path: '/dashboard/toolkit', icon: FaBookMedical },
    { name: 'AI Assistant', path: '/dashboard/assistant', icon: FaRobot },
    { name: 'Profile', path: '/dashboard/profile', icon: FaUser },
    { name: 'Settings', path: '/dashboard/settings', icon: FaCog },
  ];

  if (user?.role === 'admin') {
    navItems.splice(4, 0, { name: 'Audit Trail Logs', path: '/dashboard/audit-logs', icon: FaUserShield });
  }

  const sidebarVariants = {
    open: { width: 260, transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { width: 80, transition: { duration: 0.3, ease: 'easeInOut' } }
  };

  const textVariants = {
    open: { opacity: 1, display: 'block', transition: { delay: 0.1 } },
    closed: { opacity: 0, display: 'none', transition: { duration: 0.1 } }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <motion.aside
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="hidden md:flex flex-col bg-slate-900 text-slate-100 shadow-xl z-20 overflow-hidden relative border-r border-slate-800"
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
          <FaHeartbeat className="h-8 w-8 text-rose-500 animate-pulse-heart flex-shrink-0" />
          <motion.span 
            variants={textVariants}
            className="font-display font-bold text-lg tracking-wide bg-gradient-to-r from-rose-400 to-sky-400 bg-clip-text text-transparent white-space-nowrap"
          >
            Cardiocare-ai
          </motion.span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-medical-600 to-sky-500 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <motion.span variants={textVariants} className="font-medium text-sm">
                    {item.name}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
            <motion.span variants={textVariants} className="font-medium text-sm">
              Logout
            </motion.span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-100 shadow-2xl z-40 flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <FaHeartbeat className="h-7 w-7 text-rose-500" />
                  <span className="font-display font-bold text-md text-white">Pulse AI</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 py-6 px-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.name} to={item.path} onClick={() => setMobileOpen(false)}>
                      <div
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-medical-600 to-sky-500 text-white shadow-md' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
                >
                  <FaSignOutAlt className="h-5 w-5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm transition-colors duration-300">
          
          <div className="flex items-center gap-4">
            {/* Toggle Sidebar (Desktop) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FaBars className="h-5 w-5" />
            </button>
            {/* Toggle Drawer (Mobile) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <FaBars className="h-5 w-5" />
            </button>
            
            <h2 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
              Welcome, {user?.name || 'Practitioner'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
              <FaShieldAlt className="h-3 w-3" />
              {user?.role === 'admin' ? 'Administrator' : 'Medical Staff'}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? <FaSun className="h-5 w-5 text-amber-500" /> : <FaMoon className="h-5 w-5" />}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-medical-500 text-white flex items-center justify-center font-display font-semibold text-sm ring-2 ring-slate-100 dark:ring-slate-700 shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* View Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
