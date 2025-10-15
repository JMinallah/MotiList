import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  BellOff,
  Shield,
  Languages,
  Trash2,
  LogOut,
  Github,
  Mail,
  Twitter,
  Settings as SettingsIcon,
  HelpCircle,
  Save,
} from 'lucide-react';

const Settings = ({ onNavigate }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('english');
  const [notificationTime, setNotificationTime] = useState('1hour');
  const [activeSection, setActiveSection] = useState('appearance');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notification, setNotification] = useState(null);

  // Categories for the settings
  const settingsCategories = [
    { id: 'appearance', name: 'Appearance', icon: <Sun size={20} /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={20} /> },
    { id: 'privacy', name: 'Privacy & Security', icon: <Shield size={20} /> },
    { id: 'language', name: 'Language', icon: <Languages size={20} /> },
    { id: 'data', name: 'Data Management', icon: <Trash2 size={20} /> },
    { id: 'about', name: 'About & Help', icon: <HelpCircle size={20} /> },
  ];

  // Languages available in the app
  const availableLanguages = [
    { code: 'english', name: 'English (US)' },
    { code: 'spanish', name: 'Español' },
    { code: 'french', name: 'Français' },
    { code: 'german', name: 'Deutsch' },
    { code: 'chinese', name: '中文' },
    { code: 'japanese', name: '日本語' },
    { code: 'arabic', name: 'العربية' },
  ];

  // Notification times
  const notificationTimes = [
    { value: '15min', label: '15 minutes before' },
    { value: '30min', label: '30 minutes before' },
    { value: '1hour', label: '1 hour before' },
    { value: '3hour', label: '3 hours before' },
    { value: '1day', label: '1 day before' },
  ];

  useEffect(() => {
    // Load user preferences
    const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    const notifPref = localStorage.getItem('notificationsEnabled');
    if (notifPref !== null) {
      setNotifications(notifPref === 'true');
    }
    
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const savedNotifTime = localStorage.getItem('notificationTime');
    if (savedNotifTime) {
      setNotificationTime(savedNotifTime);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    showNotification('Theme updated successfully');
  };

  // Toggle notifications
  const toggleNotifications = () => {
    const newNotifState = !notifications;
    setNotifications(newNotifState);
    localStorage.setItem('notificationsEnabled', newNotifState);
    
    showNotification(`Notifications ${newNotifState ? 'enabled' : 'disabled'}`);
  };

  // Change language
  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
    showNotification('Language updated successfully');
  };
  
  // Change notification time
  const changeNotificationTime = (time) => {
    setNotificationTime(time);
    localStorage.setItem('notificationTime', time);
    showNotification('Notification time updated');
  };
  
  // Delete account (just a simulation)
  const deleteAccount = () => {
    setShowConfirmation(false);
    
    // In a real app, you'd make an API call here
    setTimeout(() => {
      showNotification('Account deletion request submitted');
      // Then redirect or logout
    }, 1000);
  };

  // Show a notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Render active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Theme Settings
            </h3>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon size={20} className="text-midnight-accent" /> : <Sun size={20} className="text-pastel-accent" />}
                  <span className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                
                <button 
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-midnight-primary' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                Current Theme
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border-2 ${darkMode ? 'border-midnight-primary' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-midnight-textPrimary">Midnight Bloom</span>
                    {darkMode && <span className="text-xs bg-midnight-primary/20 text-midnight-primary px-2 py-0.5 rounded">Active</span>}
                  </div>
                  <div className="h-14 bg-midnight-background rounded overflow-hidden">
                    <div className="h-3 w-full bg-midnight-card"></div>
                    <div className="flex h-11">
                      <div className="w-1/4 bg-midnight-primary"></div>
                      <div className="w-1/4 bg-midnight-accent"></div>
                      <div className="w-1/4 bg-midnight-success"></div>
                      <div className="w-1/4 bg-midnight-warning"></div>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 ${!darkMode ? 'border-pastel-primary' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-pastel-textPrimary">Pastel Delight</span>
                    {!darkMode && <span className="text-xs bg-pastel-primary/20 text-pastel-primary px-2 py-0.5 rounded">Active</span>}
                  </div>
                  <div className="h-14 bg-pastel-background rounded overflow-hidden">
                    <div className="h-3 w-full bg-pastel-card"></div>
                    <div className="flex h-11">
                      <div className="w-1/4 bg-pastel-primary"></div>
                      <div className="w-1/4 bg-pastel-accent"></div>
                      <div className="w-1/4 bg-pastel-success"></div>
                      <div className="w-1/4 bg-pastel-warning"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Notification Preferences
            </h3>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {notifications ? <Bell size={20} className={darkMode ? "text-midnight-accent" : "text-pastel-accent"} /> : <BellOff size={20} className="text-gray-400" />}
                  <span className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>
                    Push Notifications
                  </span>
                </div>
                
                <button 
                  onClick={toggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? (darkMode ? 'bg-midnight-primary' : 'bg-pastel-primary') : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <p className={`mt-2 text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                {notifications ? 'You will receive notifications for upcoming events and tasks' : 'You will not receive any notifications'}
              </p>
            </div>
            
            {notifications && (
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  When to notify
                </h4>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
                  <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Notify me before events
                  </label>
                  <select
                    value={notificationTime}
                    onChange={(e) => changeNotificationTime(e.target.value)}
                    className={`w-full p-2.5 rounded-lg text-sm ${darkMode ? 'bg-midnight-background text-midnight-textPrimary border border-midnight-shadow' : 'bg-pastel-background text-pastel-textPrimary border border-pastel-shadow'}`}
                  >
                    {notificationTimes.map(time => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={`p-4 rounded-lg space-y-3 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
                  <h5 className={`font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                    Notification Types
                  </h5>
                  
                  {['Task deadlines', 'Calendar events', 'Timetable reminders', 'System updates'].map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={type.replace(' ', '-').toLowerCase()}
                        defaultChecked={true}
                        className={`w-4 h-4 rounded ${darkMode ? 'accent-midnight-primary' : 'accent-pastel-primary'}`}
                      />
                      <label
                        htmlFor={type.replace(' ', '-').toLowerCase()}
                        className={`ml-2 text-sm ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Privacy & Security
            </h3>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Data Privacy
              </h4>
              
              <p className={`text-sm mb-4 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                MotiList stores your tasks, events, and preferences locally on your device. We don't collect personal data or track your activity.
              </p>
              
              <div className="space-y-3">
                {['Store data locally only', 'Allow anonymous usage statistics'].map((option, index) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={option.replace(/\s+/g, '-').toLowerCase()}
                      defaultChecked={index === 0}
                      className={`w-4 h-4 rounded ${darkMode ? 'accent-midnight-primary' : 'accent-pastel-primary'}`}
                    />
                    <label
                      htmlFor={option.replace(/\s+/g, '-').toLowerCase()}
                      className={`ml-2 text-sm ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Account Security
              </h4>
              
              <div className="space-y-4">
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm ${darkMode ? 'bg-midnight-background text-midnight-textPrimary' : 'bg-pastel-background text-pastel-textPrimary'} border ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'}`}
                >
                  Change Password
                </button>
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm ${darkMode ? 'bg-midnight-background text-midnight-textPrimary' : 'bg-pastel-background text-pastel-textPrimary'} border ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'}`}
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                onClick={() => setShowConfirmation(true)}
                className={`w-full py-2 px-4 rounded-lg text-center text-sm bg-red-500 text-white hover:bg-red-600`}
              >
                Delete Account
              </button>
              
              <p className={`text-xs mt-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </div>
        );
        
      case 'language':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Language Settings
            </h3>
            
            <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {availableLanguages.map(lang => (
                  <li key={lang.code}>
                    <button 
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full px-4 py-3 flex justify-between items-center ${language === lang.code ? (darkMode ? 'bg-midnight-primary/10' : 'bg-pastel-primary/10') : ''}`}
                    >
                      <span className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>
                        {lang.name}
                      </span>
                      
                      {language === lang.code && (
                        <span className={`text-sm font-medium ${darkMode ? 'text-midnight-primary' : 'text-pastel-primary'}`}>
                          Selected
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Date & Time Format
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-2 text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Date Format
                  </label>
                  <select
                    className={`w-full p-2 text-sm rounded-lg ${darkMode ? 'bg-midnight-background text-midnight-textPrimary border border-midnight-shadow' : 'bg-pastel-background text-pastel-textPrimary border border-pastel-shadow'}`}
                    defaultValue="mdy"
                  >
                    <option value="mdy">MM/DD/YYYY</option>
                    <option value="dmy">DD/MM/YYYY</option>
                    <option value="ymd">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-2 text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Time Format
                  </label>
                  <select
                    className={`w-full p-2 text-sm rounded-lg ${darkMode ? 'bg-midnight-background text-midnight-textPrimary border border-midnight-shadow' : 'bg-pastel-background text-pastel-textPrimary border border-pastel-shadow'}`}
                    defaultValue="12h"
                  >
                    <option value="12h">12 hour (AM/PM)</option>
                    <option value="24h">24 hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'data':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Data Management
            </h3>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Import & Export
              </h4>
              
              <div className="space-y-3">
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm flex items-center justify-center gap-2 ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  <Save size={16} />
                  Export All Data
                </button>
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm ${darkMode ? 'bg-midnight-background text-midnight-textPrimary' : 'bg-pastel-background text-pastel-textPrimary'} border ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'}`}
                >
                  Import Data
                </button>
              </div>
              
              <p className={`text-xs mt-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                Export all your tasks, events, and preferences as a JSON file.
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Clear Data
              </h4>
              
              <div className="space-y-4">
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm bg-yellow-500 text-white hover:bg-yellow-600`}
                >
                  Clear All Tasks
                </button>
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm bg-orange-500 text-white hover:bg-orange-600`}
                >
                  Clear All Events
                </button>
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center text-sm bg-red-500 text-white hover:bg-red-600`}
                >
                  Reset All Settings
                </button>
              </div>
              
              <p className={`text-xs mt-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                These actions cannot be undone. Make sure to export your data first.
              </p>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              About MotiList
            </h3>
            
            <div className={`p-5 rounded-lg text-center ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <div className={`w-20 h-20 mx-auto mb-3 flex items-center justify-center rounded-xl ${darkMode ? 'bg-midnight-primary/20' : 'bg-pastel-primary/20'}`}>
                <SettingsIcon size={32} className={darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} />
              </div>
              
              <h4 className={`text-xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                MotiList
              </h4>
              <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                Version 1.0.0
              </p>
              
              <div className="mt-4 flex justify-center space-x-3">
                <a href="#" className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-primary' : 'text-pastel-textSecondary hover:text-pastel-primary'}`}>
                  <Github size={20} />
                </a>
                <a href="#" className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-primary' : 'text-pastel-textSecondary hover:text-pastel-primary'}`}>
                  <Twitter size={20} />
                </a>
                <a href="#" className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-primary' : 'text-pastel-textSecondary hover:text-pastel-primary'}`}>
                  <Mail size={20} />
                </a>
              </div>
              
              <p className={`text-xs mt-6 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                © 2025 MotiList. All rights reserved.
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Support & Resources
              </h4>
              
              <div className="space-y-3">
                {[
                  { label: 'User Guide', path: '#' },
                  { label: 'FAQs', path: '#' },
                  { label: 'Contact Support', path: '#' },
                  { label: 'Report a Bug', path: '#' }
                ].map(item => (
                  <a 
                    key={item.label}
                    href={item.path}
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-midnight-background text-midnight-textPrimary' : 'hover:bg-pastel-background text-pastel-textPrimary'}`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Legal
              </h4>
              
              <div className="space-y-2">
                {[
                  { label: 'Terms of Service', path: '#' },
                  { label: 'Privacy Policy', path: '#' },
                  { label: 'Cookies Policy', path: '#' },
                  { label: 'Open Source Licenses', path: '#' }
                ].map(item => (
                  <a 
                    key={item.label}
                    href={item.path}
                    className={`text-sm block py-1.5 ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-primary' : 'text-pastel-textSecondary hover:text-pastel-primary'}`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Header */}
      <div className={`px-4 py-4 md:py-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                <SettingsIcon size={24} className="hidden md:inline" />
                Settings
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} md:sticky md:top-6 h-fit`}>
            <nav className="p-2">
              <ul className="space-y-1">
                {settingsCategories.map(category => (
                  <li key={category.id}>
                    <button 
                      onClick={() => setActiveSection(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                        activeSection === category.id 
                          ? `${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`
                          : `${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`
                      }`}
                    >
                      {category.icon}
                      <span>{category.name}</span>
                    </button>
                  </li>
                ))}
                
                <li className="py-2">
                  <div className={`h-px w-full ${darkMode ? 'bg-midnight-shadow' : 'bg-pastel-shadow'}`}></div>
                </li>
                
                <li>
                  <button 
                    onClick={() => onNavigate('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Content */}
          <div className="md:col-span-3">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-6`}>
            <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Delete Account
            </h3>
            
            <p className={`mb-4 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              This action cannot be undone. All your data will be permanently deleted.
              Are you sure you want to delete your account?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmation(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                Cancel
              </button>
              
              <button 
                onClick={deleteAccount}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-midnight-card text-midnight-textPrimary' : 'bg-pastel-card text-pastel-textPrimary'}`}>
          {notification}
        </div>
      )}
    </div>
  );
};

export default Settings;
