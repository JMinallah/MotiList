import './App.css'
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'
import Dashboard from './components/dashboard'
import CalendarComponent from './components/calender'
import Timetable from './components/timetable'
import Notifications from './components/notifications'
import Settings from './components/settings'
import Login from './components/Login'
import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import useAuth from './context/useAuth';
import { 
  Sun, 
  Moon, 
  CheckCircle, 
  Clock, 
  Settings as SettingsIcon, 
  Home, 
  Calendar, 
  BellRing, 
  Menu,
  X,
  LogOut
} from 'lucide-react'

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Main layout component that includes sidebar and content area
const MainLayout = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  
  // Check user preference for dark mode
  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    // Apply a single, smooth transition for all themed elements
    document.body.classList.add('theme-transition');
    
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', newDarkMode);
    
    // Remove transition class after transition completes to prevent affecting other animations
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Navigation items
  const navItems = [
    { icon: <Home size={20} />, name: 'Dashboard', view: 'dashboard' },
    { icon: <Calendar size={20} />, name: 'Calendar', view: 'calendar' },
    { icon: <Clock size={20} />, name: 'Timetable', view: 'timetable' },
    { icon: <BellRing size={20} />, name: 'Notifications', view: 'notifications' },
    { icon: <SettingsIcon size={20} />, name: 'Settings', view: 'settings' },
  ].map(item => ({
    ...item,
    active: item.view === currentView
  }));

  // Handle navigation
  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
    // Close sidebar when navigating on mobile
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen, setSidebarOpen]);
  
  // Add event listener for custom navigation events
  useEffect(() => {
    const handleCustomNavigate = (event) => {
      if (event.detail) {
        handleNavigate(event.detail);
      }
    };
    
    window.addEventListener('navigate', handleCustomNavigate);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('navigate', handleCustomNavigate);
    };
  }, [handleNavigate]);

  const renderView = () => {
    // Pass only necessary props to each component
    const commonProps = { 
      darkMode,
      toggleDarkMode, 
      currentView
    };
    
    switch(currentView) {
      case 'calendar':
        return <CalendarComponent {...commonProps} />;
      case 'timetable':
        return <Timetable {...commonProps} />;
      case 'notifications':
        return <Notifications {...commonProps} />;
      case 'settings':
        return <Settings {...commonProps} />;
      case 'dashboard':
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={`min-h-screen flex theme-transition ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
        {/* Sidebar for larger screens */}
        <aside className={`fixed inset-y-0 left-0 z-20 w-60 transform transition-transform theme-transition
          ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-lg overflow-x-hidden overflow-y-auto
          md:translate-x-0 md:fixed md:h-screen md:w-60 md:flex md:flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Sidebar header */}
          <div className={`flex flex-col p-4 ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'} border-b`}>
            <div className="flex justify-between items-center">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                MotiList
              </h1>
              <button 
                onClick={toggleSidebar}
                className={`md:hidden p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}
              >
                <X size={20} />
              </button>
            </div>
            {currentUser && (
              <div className={`mt-2 text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                {currentUser.email || currentUser.displayName}
              </div>
            )}
          </div>
          
          {/* Navigation links */}
          <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
            <ul className="space-y-1 px-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <button 
                    onClick={() => handleNavigate(item.view)}
                    className={`flex items-center gap-2 px-2 py-3 rounded-lg w-full text-left theme-transition
                    ${item.active 
                      ? `${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`
                      : `${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar footer with theme toggle and logout */}
          <div className={`p-4 ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'} border-t space-y-2`}>
            <button 
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:ml-60 theme-transition">
          {/* Header for mobile */}
          <header className={`flex justify-between items-center p-4 theme-transition ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm md:shadow-none`}>
            <div className="flex items-center gap-3">
              {/* Menu button (mobile only) */}
              <button 
                onClick={toggleSidebar}
                className={`md:hidden p-2 rounded-full ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}
              >
                <Menu size={20} />
              </button>
              <h1 className={`md:hidden text-xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                MotiList
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification & Settings buttons */}
              <button 
                onClick={() => handleNavigate('notifications')}
                className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                <BellRing size={20} />
              </button>
              <button 
                onClick={() => handleNavigate('settings')}
                className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                <SettingsIcon size={20} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-red-500 hover:bg-red-500/10"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto theme-transition">
            {renderView()}
          </main>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// Main App Component
function App() {
  // Get dark mode preference from local storage
  const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
    
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login darkMode={isDarkMode} />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App
