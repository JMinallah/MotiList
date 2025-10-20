import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, LogIn, Plus, RefreshCw, Settings, Trash, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import AIAssistant from './AIAssistant';

// Google API configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

const CalendarComponent = ({ darkMode = false }) => {
  // Custom navigation function
  const navigateTo = (view) => {
    const event = new CustomEvent('navigate', { detail: view });
    window.dispatchEvent(event);
  };
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [gapiInitialized, setGapiInitialized] = useState(false);

  // Fetch events from Google Calendar - define this first to avoid circular dependency issues
  const fetchEvents = useCallback(async () => {
    if (!gapiInitialized) return;
    
    setIsLoading(true);
    
    try {
      const accessToken = localStorage.getItem('googleAccessToken');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      
      // Set auth token for the request
      gapi.client.setToken({ access_token: accessToken });
      
      // Get events from primary calendar
      const response = await gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        'timeMax': new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      });
      
      // Format events for our app
      const formattedEvents = response.result.items.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        date: event.start.dateTime ? event.start.dateTime.split('T')[0] : event.start.date,
        startTime: event.start.dateTime 
          ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : '00:00',
        endTime: event.end.dateTime 
          ? new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : '23:59',
        description: event.description || ''
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // Handle auth errors
      if (error.status === 401) {
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('googleTokenExpiry');
        setIsAuthenticated(false);
      }
    }
    
    setIsLoading(false);
  }, [gapiInitialized, currentDate]);

  // Check if user is authenticated with Google
  const checkAuthStatus = useCallback(() => {
    const tokenExists = localStorage.getItem('googleAccessToken');
    const tokenExpiry = localStorage.getItem('googleTokenExpiry');
    
    const isValid = tokenExists && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry);
    
    setIsAuthenticated(isValid);
    
    if (isValid && gapiInitialized) {
      fetchEvents();
    }
  }, [gapiInitialized, fetchEvents]);

  // Initialize Google API client
  useEffect(() => {
    const initializeGapi = async () => {
      try {
        await gapi.load('client:auth2', () => {
          gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          }).then(() => {
            setGapiInitialized(true);
            checkAuthStatus();
          });
        });
      } catch (error) {
        console.error('Error initializing GAPI:', error);
      }
    };

    // We now receive darkMode as a prop from App.jsx
    
    initializeGapi();
  }, [checkAuthStatus]);

  // Handle Google OAuth login
  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      // Save the token
      localStorage.setItem('googleAccessToken', tokenResponse.access_token);
      
      // Calculate and save expiry time
      const expiresIn = tokenResponse.expires_in || 3600;
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('googleTokenExpiry', expiryTime.toString());
      
      setIsAuthenticated(true);
      fetchEvents();
    },
    onError: error => console.error('Login Failed:', error),
    scope: SCOPES
  });
  
  const handleGoogleLogin = () => {
    login();
  };

  const handleLogout = () => {
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleTokenExpiry');
    setIsAuthenticated(false);
    setEvents([]);
  };

  // Calendar navigation
  const getPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    if (isAuthenticated) {
      fetchEvents();
    }
  };

  const getNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    if (isAuthenticated) {
      fetchEvents();
    }
  };

  // Get calendar data for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysArray = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  };

  // Filter events for a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  // Handle new event form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = async () => {
    if (!gapiInitialized || !isAuthenticated) return;
    
    try {
      const accessToken = localStorage.getItem('googleAccessToken');
      if (!accessToken) return;
      
      // Set auth token for the request
      gapi.client.setToken({ access_token: accessToken });
      
      // Format the event for Google Calendar API
      const { title, date, startTime, endTime, description } = newEvent;
      
      // Create start and end datetime strings
      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;
      
      const event = {
        'summary': title,
        'description': description,
        'start': {
          'dateTime': startDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        'end': {
          'dateTime': endDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      // Add the event
      const response = await gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
      });
      
      // Format and add to our local state
      const createdEvent = {
        id: response.result.id,
        title: response.result.summary,
        date: date,
        startTime: startTime,
        endTime: endTime,
        description: description
      };
      
      setEvents(prev => [...prev, createdEvent]);
      
      // Reset form
      setShowModal(false);
      setNewEvent({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        description: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Handle auth errors
      if (error.status === 401) {
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('googleTokenExpiry');
        setIsAuthenticated(false);
      }
    }
  };

  // Get month name for display
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Header */}
      <div className={`px-3 md:px-4 py-4 md:py-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => navigateTo('dashboard')} 
                className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className={`text-lg md:text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                <Calendar size={20} className="hidden md:inline" />
                Calendar
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={handleLogout}
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg ${darkMode ? 'bg-midnight-card border border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-card border border-pastel-shadow text-pastel-textPrimary'}`}
                  >
                    Disconnect
                  </button>
                  <button 
                    onClick={() => setShowModal(true)}
                    className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                  >
                    <Plus size={18} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleGoogleLogin}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 text-xs md:text-sm ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Connect Google Calendar</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Calendar Controls */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
            {getMonthName(currentDate)}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={getPreviousMonth}
              className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'bg-midnight-card hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'bg-pastel-card hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
            >
              &lt;
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${darkMode ? 'bg-midnight-card hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'bg-pastel-card hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
            >
              Today
            </button>
            <button 
              onClick={getNextMonth}
              className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'bg-midnight-card hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'bg-pastel-card hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
            >
              &gt;
            </button>
            {isAuthenticated && (
              <button 
                onClick={fetchEvents}
                className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'bg-midnight-card hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'bg-pastel-card hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-opacity-20">
            {weekdays.map((day, index) => (
              <div 
                key={index} 
                className={`p-1 md:p-2 text-center font-medium text-xs md:text-sm ${darkMode ? 'text-midnight-textSecondary border-midnight-shadow' : 'text-pastel-textSecondary border-pastel-shadow'}`}
              >
                {window.innerWidth < 640 ? day.charAt(0) : day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((day, index) => {
              // Get events for this day
              const dayEvents = day ? getEventsForDay(day) : [];
              
              // Check if this day is today
              const today = new Date();
              const isToday = day && 
                today.getDate() === day && 
                today.getMonth() === currentDate.getMonth() && 
                today.getFullYear() === currentDate.getFullYear();

              return (
                <div 
                  key={index} 
                  className={`min-h-[60px] md:min-h-[100px] border-b border-r ${darkMode ? 'border-midnight-shadow/20' : 'border-pastel-shadow/20'} p-0.5 md:p-1`}
                >
                  {day && (
                    <div className="h-full">
                      {/* Day number */}
                      <div className={`text-right p-0.5 md:p-1 font-medium text-xs md:text-sm
                        ${isToday 
                          ? `rounded-full w-5 h-5 md:w-8 md:h-8 flex items-center justify-center ml-auto
                             ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}` 
                          : darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}
                      >
                        {day}
                      </div>
                      
                      {/* Events for this day */}
                      <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[30px] md:max-h-[60px]">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`text-[8px] md:text-xs p-0.5 md:p-1 rounded truncate ${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`}
                          >
                            {event.startTime} - {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events List Section */}
        {isAuthenticated && (
          <div className={`mt-6 md:mt-8 rounded-xl p-3 md:p-4 ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
            <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Upcoming Events
            </h2>

            {isLoading ? (
              <div className={`py-6 md:py-8 text-center text-sm md:text-base ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                Loading events...
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {events.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 md:p-4 rounded-lg border ${darkMode ? 'border-midnight-shadow bg-midnight-background/30' : 'border-pastel-shadow bg-pastel-background/50'}`}
                  >
                    <div className="flex justify-between">
                      <h3 className={`font-medium text-sm md:text-base ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button className={darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}>
                          <Settings size={14} />
                        </button>
                        <button className={darkMode ? 'text-midnight-textSecondary hover:text-midnight-error' : 'text-pastel-textSecondary hover:text-pastel-error'}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                      <Calendar size={12} className={darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'} />
                      <span className={`text-xs md:text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                        {event.date}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                      <Clock size={12} className={darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'} />
                      <span className={`text-xs md:text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className={`mt-1.5 md:mt-2 text-xs md:text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`py-6 md:py-8 text-center text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                No events found. Click the "+" button to add an event.
              </div>
            )}
          </div>
        )}

        {/* Not Authenticated Message */}
        {!isAuthenticated && (
          <div className={`mt-6 md:mt-8 p-4 md:p-8 rounded-xl text-center ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
            <Calendar size={36} className={`mx-auto mb-3 md:mb-4 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`} />
            <h2 className={`text-lg md:text-xl font-semibold mb-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Connect Your Google Calendar
            </h2>
            <p className={`mb-4 md:mb-6 text-sm md:text-base ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              Link your Google Calendar to sync and manage all your events
            </p>
            <button 
              onClick={handleGoogleLogin}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 mx-auto text-sm md:text-base ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
            >
              <LogIn size={16} />
              Connect Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-4 md:p-6`}>
            <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Add New Event
            </h2>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className={`block mb-1 text-xs md:text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Event Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  placeholder="Meeting, Appointment, Task..."
                  className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 text-xs md:text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Date*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newEvent.date}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-1 text-xs md:text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
              </div>
              
              {/* Collapsible Advanced Options */}
              <details className="group">
                <summary className={`cursor-pointer text-xs font-medium ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}>
                  <span className="select-none">Advanced Options</span>
                </summary>
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-opacity-20 border-current">
                  <div>
                    <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                      End Time (optional)
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={newEvent.endTime}
                      onChange={handleInputChange}
                      className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      value={newEvent.description}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Additional details..."
                      className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                    />
                  </div>
                </div>
              </details>
              
              <div className="flex justify-end gap-2 md:gap-3 pt-2">
                <button 
                  onClick={() => setShowModal(false)}
                  className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEvent}
                  className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Assistant */}
      <AIAssistant darkMode={darkMode} />
    </div>
  );
};

export default CalendarComponent;
