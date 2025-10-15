import './App.css'
import { useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Dashboard from './components/dashboard'
import CalendarComponent from './components/calender'
import Timetable from './components/timetable'
import Notifications from './components/notifications'
import Settings from './components/settings'

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'calendar':
        return <CalendarComponent onNavigate={setCurrentView} />;
      case 'timetable':
        return <Timetable onNavigate={setCurrentView} />;
      case 'notifications':
        return <Notifications onNavigate={setCurrentView} />;
      case 'settings':
        return <Settings onNavigate={setCurrentView} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setCurrentView} currentView={currentView} />;
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {renderView()}
    </GoogleOAuthProvider>
  );
}

export default App
