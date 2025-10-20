import React, { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Plus, 
  Trash, 
  Edit, 
  Save, 
  Upload, 
  Download,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  addTimetableEvent, 
  getTimetableEvents, 
  updateTimetableEvent, 
  deleteTimetableEvent 
} from '../firebaseUtils';
import { 
  cleanupDuplicateTimetableEvents, 
  deleteAllTimetableEvents 
} from '../utils/cleanup.js';
import useAuth from '../context/useAuth';
import AIAssistant from './AIAssistant';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const Timetable = ({ darkMode = false }) => {
  // Use Auth context
  const { currentUser } = useAuth();
  
  // Custom navigation function
  const navigateTo = (view) => {
    const event = new CustomEvent('navigate', { detail: view });
    window.dispatchEvent(event);
  };
  const [showModal, setShowModal] = useState(false);
  const [timetableEvents, setTimetableEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef();
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    color: '#3B82F6' // Default blue color
  });

  // Load events when user changes or component mounts
  useEffect(() => {
    // Migration function to move localStorage data to Firebase
    const migrateLocalStorageData = async () => {
      if (!currentUser) return;
      
      const localData = localStorage.getItem('timetableEvents');
      if (!localData) return;
      
      try {
        const localEvents = JSON.parse(localData);
        if (localEvents.length === 0) return;
        
        // Check if we already have Firebase data to avoid duplicate migration
        const existingEvents = await getTimetableEvents(currentUser.uid);
        if (existingEvents.length > 0) {
          // Clear localStorage since Firebase has data
          localStorage.removeItem('timetableEvents');
          return;
        }
        
        // Migrate each event to Firebase
        showNotification('Migrating your timetable data...', 'info');
        for (const event of localEvents) {
          const { id: _localId, ...eventData } = event; // Remove local ID
          await addTimetableEvent(currentUser.uid, eventData);
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem('timetableEvents');
        showNotification('Timetable data migrated successfully!', 'success');
        
      } catch (error) {
        console.error('Error migrating localStorage data:', error);
        showNotification('Error migrating data. Your local data is preserved.', 'error');
      }
    };

    const loadTimetableEvents = async () => {
      if (!currentUser) {
        setTimetableEvents([]);
        return;
      }
      
      setIsLoading(true);
      try {
        // First, try to migrate any localStorage data
        await migrateLocalStorageData();
        
        // Then load events from Firebase
        const events = await getTimetableEvents(currentUser.uid);
        
        // Remove any potential duplicates based on title + day + startTime
        const uniqueEvents = events.reduce((unique, event) => {
          const key = `${event.title}-${event.day}-${event.startTime}`;
          if (!unique.find(e => `${e.title}-${e.day}-${e.startTime}` === key)) {
            unique.push(event);
          }
          return unique;
        }, []);
        
        console.log('Loaded events from Firebase:', events.length);
        console.log('Unique events after deduplication:', uniqueEvents.length);
        setTimetableEvents(uniqueEvents);
      } catch (error) {
        console.error('Error loading timetable events:', error);
        showNotification('Error loading timetable events', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadTimetableEvents();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingEvent !== null) {
      setTimetableEvents(prevEvents => {
        const updatedEvents = [...prevEvents];
        updatedEvents[editingEvent] = {
          ...updatedEvents[editingEvent],
          [name]: value
        };
        return updatedEvents;
      });
    } else {
      setNewEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEvent = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      showNotification('Please sign in to add events', 'error');
      return;
    }
    
    // Check for required fields (only title and day are required)
    if (!newEvent.title || !newEvent.day) {
      showNotification('Please fill in the title and day', 'error');
      return;
    }
    
    // Auto-set end time if not provided (1 hour after start time)
    const eventToAdd = { ...newEvent };
    if (!eventToAdd.endTime || eventToAdd.endTime === eventToAdd.startTime) {
      const startHour = parseInt(eventToAdd.startTime.split(':')[0]);
      const nextHour = Math.min(startHour + 1, 20); // Don't go past 20:00
      eventToAdd.endTime = `${nextHour.toString().padStart(2, '0')}:00`;
    }
    
    // Check for duplicates
    const isDuplicate = timetableEvents.some(event => 
      event.title === eventToAdd.title && 
      event.day === eventToAdd.day && 
      event.startTime === eventToAdd.startTime
    );
    
    if (isDuplicate) {
      showNotification('An event with the same title, day, and time already exists', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      // Add new event to Firebase
      const eventId = await addTimetableEvent(currentUser.uid, eventToAdd);
      
      // Update local state with the new event (including the generated ID)
      setTimetableEvents(prev => [...prev, { ...eventToAdd, id: eventId }]);
      
      // Reset form
      setNewEvent({
        title: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        color: '#3B82F6'
      });
      
      setShowModal(false);
      showNotification('Event added successfully', 'success');
    } catch (error) {
      console.error('Error adding event:', error);
      showNotification('Error adding event', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = (index) => {
    setEditingEvent(index);
  };

  const handleDeleteEvent = async (index) => {
    if (!currentUser) {
      showNotification('Please sign in to delete events', 'error');
      return;
    }
    
    const eventToDelete = timetableEvents[index];
    if (!eventToDelete || !eventToDelete.id) {
      showNotification('Invalid event to delete', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteTimetableEvent(eventToDelete.id);
      setTimetableEvents(prev => prev.filter((_, i) => i !== index));
      showNotification('Event deleted', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('Error deleting event', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || editingEvent === null) {
      showNotification('Invalid edit operation', 'error');
      return;
    }
    
    const eventToUpdate = timetableEvents[editingEvent];
    if (!eventToUpdate || !eventToUpdate.id) {
      showNotification('Invalid event to update', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      // Extract the event data without the id and metadata
      const { id, createdAt: _createdAt, updatedAt: _updatedAt, userId: _userId, ...eventData } = eventToUpdate;
      await updateTimetableEvent(id, eventData);
      
      setEditingEvent(null);
      showNotification('Event updated', 'success');
    } catch (error) {
      console.error('Error updating event:', error);
      showNotification('Error updating event', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let uploadedEvents;
        
        // Try to parse as JSON
        try {
          uploadedEvents = JSON.parse(event.target.result);
        } catch {
          // If not JSON, try CSV format (simple parsing)
          const csvRows = event.target.result.split('\\n');
          const headers = csvRows[0].split(',');
          
          // Check for required fields in CSV
          const titleIndex = headers.findIndex(h => h.trim().toLowerCase() === 'title');
          const dayIndex = headers.findIndex(h => h.trim().toLowerCase() === 'day');
          const startTimeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'starttime' || h.trim().toLowerCase() === 'start time');
          
          if (titleIndex === -1 || dayIndex === -1 || startTimeIndex === -1) {
            throw new Error('CSV must have title, day, and startTime columns');
          }
          
          uploadedEvents = [];
          for (let i = 1; i < csvRows.length; i++) {
            if (!csvRows[i].trim()) continue;
            
            const values = csvRows[i].split(',');
            const event = {
              id: Date.now().toString() + i,
              title: values[titleIndex]?.trim() || 'Untitled',
              day: values[dayIndex]?.trim() || 'Monday',
              startTime: values[startTimeIndex]?.trim() || '09:00',
              endTime: values[startTimeIndex + 1]?.trim() || 
                      (values[startTimeIndex]?.trim() ? addOneHour(values[startTimeIndex].trim()) : '10:00'),
              color: '#3B82F6'
            };
            uploadedEvents.push(event);
          }
        }
        
        // Validate uploaded events
        if (!Array.isArray(uploadedEvents)) {
          throw new Error('Uploaded file must contain an array of events');
        }
        
        // Ensure each event has required fields
        const validatedEvents = uploadedEvents.map(event => ({
          id: event.id || Date.now().toString(),
          title: event.title || 'Untitled Event',
          day: DAYS_OF_WEEK.includes(event.day) ? event.day : 'Monday',
          startTime: isValidTime(event.startTime) ? event.startTime : '09:00',
          endTime: isValidTime(event.endTime) ? event.endTime : '10:00',
          location: event.location || '',
          color: isValidColor(event.color) ? event.color : '#3B82F6'
        }));
        
        setTimetableEvents(prev => [...prev, ...validatedEvents]);
        showNotification(`Successfully imported ${validatedEvents.length} events`, 'success');
        setShowUploadModal(false);
        
      } catch (error) {
        showNotification(`Error importing file: ${error.message}`, 'error');
      }
    };
    
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (timetableEvents.length === 0) {
      showNotification('No events to export', 'error');
      return;
    }
    
    // Create downloadable content
    const dataStr = JSON.stringify(timetableEvents, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create a download link and trigger it
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', 'timetable_events.json');
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
    
    showNotification('Timetable exported successfully', 'success');
  };

  // Cleanup functions
  const handleCleanupDuplicates = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const result = await cleanupDuplicateTimetableEvents();
      showNotification(`Cleanup complete! Kept ${result.unique} events, deleted ${result.deleted} duplicates`, 'success');
      
      // Reload events after cleanup
      const events = await getTimetableEvents(currentUser.uid);
      
      // Apply deduplication
      const uniqueEvents = events.reduce((unique, event) => {
        const key = `${event.title}-${event.day}-${event.startTime}`;
        if (!unique.find(e => `${e.title}-${e.day}-${e.startTime}` === key)) {
          unique.push(event);
        }
        return unique;
      }, []);
      
      console.log('Events after cleanup:', uniqueEvents.length);
      setTimetableEvents(uniqueEvents);
    } catch (error) {
      console.error('Cleanup error:', error);
      showNotification('Error during cleanup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const deleteCount = await deleteAllTimetableEvents();
      if (deleteCount !== undefined) {
        showNotification(`Deleted ${deleteCount} events`, 'success');
        setTimetableEvents([]);
      }
    } catch (error) {
      console.error('Delete all error:', error);
      showNotification('Error deleting events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper functions
  const isValidTime = (time) => {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };
  
  const isValidColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };
  
  const addOneHour = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const getEventsForTimeAndDay = (time, day) => {
    return timetableEvents.filter(
      event => event.startTime === time && event.day === day
    );
  };

  // Show sign-in message if not authenticated
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'} flex items-center justify-center`}>
        <div className={`text-center p-8 rounded-lg ${darkMode ? 'bg-midnight-card text-midnight-textPrimary' : 'bg-pastel-card text-pastel-textPrimary'}`}>
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-sm opacity-75 mb-4">Please sign in to access your timetable.</p>
          <button 
            onClick={() => navigateTo('dashboard')} 
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white hover:bg-midnight-primary/80' : 'bg-pastel-primary text-white hover:bg-pastel-primary/80'}`}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Header */}
      <div className={`px-3 md:px-4 py-4 md:py-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm`}>
        <div className="max-w-6xl mx-auto">
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
                Timetable
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUpload}
                className={`px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded-lg flex items-center gap-1 md:gap-2
                  ${darkMode ? 'border border-midnight-shadow text-midnight-textPrimary hover:bg-midnight-card' : 
                  'border border-pastel-shadow text-pastel-textPrimary hover:bg-pastel-card'}`}
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </button>
              
              <button 
                onClick={handleExport}
                className={`px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded-lg flex items-center gap-1 md:gap-2
                  ${darkMode ? 'border border-midnight-shadow text-midnight-textPrimary hover:bg-midnight-card' : 
                  'border border-pastel-shadow text-pastel-textPrimary hover:bg-pastel-card'}`}
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Cleanup button */}
              <button 
                onClick={handleCleanupDuplicates}
                className={`px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded-lg flex items-center gap-1 md:gap-2
                  ${darkMode ? 'border border-yellow-600 text-yellow-400 hover:bg-yellow-600/10' : 
                  'border border-yellow-600 text-yellow-600 hover:bg-yellow-50'}`}
                title="Remove duplicate events"
              >
                <Trash size={16} />
                <span className="hidden sm:inline">Cleanup</span>
              </button>

              {/* Delete All button */}
              <button 
                onClick={handleDeleteAll}
                className={`px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded-lg flex items-center gap-1 md:gap-2
                  ${darkMode ? 'border border-red-600 text-red-400 hover:bg-red-600/10' : 
                  'border border-red-600 text-red-600 hover:bg-red-50'}`}
                title="Delete all events (cannot be undone)"
              >
                <X size={16} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
              
              <button 
                onClick={() => setShowModal(true)}
                className={`p-1.5 md:p-2 rounded-lg flex items-center ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Timetable Grid */}
        <div className={`rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-md mb-6`}>
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className={`text-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                <Clock size={32} className="animate-spin mx-auto mb-2" />
                <p>Loading timetable...</p>
              </div>
            </div>
          ) : (
          <>
            {/* Desktop Grid View */}
            <div className="hidden md:block overflow-auto">
              <div className="min-w-[600px]">
            <div className="grid grid-cols-8 sticky top-0 z-10">
              {/* Empty corner cell */}
              <div className={`p-3 font-medium border-b ${darkMode ? 'bg-midnight-card border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-card border-pastel-shadow text-pastel-textPrimary'}`}>
                <Clock size={16} className="mx-auto" />
              </div>
              
              {/* Days of week header */}
              {DAYS_OF_WEEK.map(day => (
                <div 
                  key={day} 
                  className={`p-3 text-center font-medium border-b ${darkMode ? 'bg-midnight-card border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-card border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  {day.slice(0, 3)}
                </div>
              ))}
              
              {/* Time slots and events */}
              {TIME_SLOTS.map(time => (
                <Fragment key={time}>
                  {/* Time column */}
                  <div className={`p-2 text-center text-sm border-r ${darkMode ? 'border-midnight-shadow text-midnight-textSecondary' : 'border-pastel-shadow text-pastel-textSecondary'}`}>
                    {time}
                  </div>
                  
                  {/* Event cells for each day */}
                  {DAYS_OF_WEEK.map(day => {
                    const events = getEventsForTimeAndDay(time, day);
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        className={`p-1 border-r border-b min-h-[60px] ${darkMode ? 'border-midnight-shadow/20' : 'border-pastel-shadow/20'}`}
                      >
                        {events.map((event) => {
                          const globalIndex = timetableEvents.findIndex(e => e.id === event.id);
                          return (
                          <div 
                            key={event.id}
                            className={`p-2 rounded-md mb-1 relative overflow-hidden text-xs md:text-sm`}
                            style={{ 
                              backgroundColor: `${event.color}20`, // 20% opacity
                              borderLeft: `3px solid ${event.color}`,
                              cursor: editingEvent === globalIndex ? 'default' : 'pointer'
                            }}
                          >
                            {editingEvent === globalIndex ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  name="title"
                                  value={timetableEvents[globalIndex].title}
                                  onChange={handleInputChange}
                                  className={`w-full p-1 text-xs rounded border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                                />
                                <div className="flex gap-1">
                                  <select
                                    name="startTime"
                                    value={timetableEvents[globalIndex].startTime}
                                    onChange={handleInputChange}
                                    className={`w-1/2 p-1 text-xs rounded border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                                  >
                                    {TIME_SLOTS.map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                  <select
                                    name="endTime"
                                    value={timetableEvents[globalIndex].endTime}
                                    onChange={handleInputChange}
                                    className={`w-1/2 p-1 text-xs rounded border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                                  >
                                    {TIME_SLOTS.map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex justify-end gap-1 mt-1">
                                  <button
                                    onClick={() => setEditingEvent(null)}
                                    className="p-1 rounded text-xs hover:bg-gray-200"
                                  >
                                    <X size={14} />
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className={`p-1 rounded text-xs text-white ${darkMode ? 'bg-midnight-primary' : 'bg-pastel-primary'}`}
                                  >
                                    <Save size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium" style={{ color: event.color }}>
                                  {event.title}
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                                  {event.startTime} - {event.endTime}
                                </div>
                                {event.location && (
                                  <div className={`text-xs mt-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                                    📍 {event.location}
                                  </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEvent(globalIndex);
                                    }}
                                    className={`p-0.5 rounded-full hover:bg-white/20`}
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(globalIndex);
                                    }}
                                    className={`p-0.5 rounded-full hover:bg-white/20`}
                                  >
                                    <Trash size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
              </div>
            </div>
            
            {/* Mobile List View */}
            <div className="md:hidden">
              <div className="space-y-4 p-4">
                {DAYS_OF_WEEK.map(day => {
                  const dayEvents = timetableEvents.filter(event => event.day === day);
                  return (
                    <div key={day} className={`rounded-lg p-3 ${darkMode ? 'bg-midnight-background/50' : 'bg-pastel-background/50'}`}>
                      <h4 className={`font-medium mb-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                        {day}
                      </h4>
                      {dayEvents.length > 0 ? (
                        <div className="space-y-2">
                          {dayEvents.map((event, index) => (
                            <div 
                              key={index}
                              className={`p-2 rounded-md border-l-4 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}
                              style={{ borderLeftColor: event.color }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm" style={{ color: event.color }}>
                                    {event.title}
                                  </div>
                                  <div className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                                    {event.startTime} - {event.endTime}
                                  </div>
                                  {event.location && (
                                    <div className={`text-xs mt-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                                      📍 {event.location}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => handleEditEvent(timetableEvents.findIndex(e => e === event))}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-midnight-background/50 text-midnight-textSecondary' : 'hover:bg-pastel-background/50 text-pastel-textSecondary'}`}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(timetableEvents.findIndex(e => e === event))}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-midnight-background/50 text-midnight-textSecondary' : 'hover:bg-pastel-background/50 text-pastel-textSecondary'}`}
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-xs text-center py-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                          No events
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
          )}
        </div>
        
        {/* Event List for Mobile */}
        <div className="md:hidden">
          <h2 className={`font-semibold mb-3 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
            My Schedule
          </h2>
          
          {timetableEvents.length > 0 ? (
            <div className="space-y-2">
              {timetableEvents.map((event, index) => (
                <div 
                  key={event.id}
                  className={`p-3 rounded-lg ${darkMode ? 'bg-midnight-card shadow-sm shadow-midnight-shadow' : 'bg-pastel-card shadow-sm shadow-pastel-shadow'}`}
                >
                  <div className="flex justify-between">
                    <div 
                      className="flex-1"
                      style={{ borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: event.color, paddingLeft: '0.5rem' }}
                    >
                      <div className={`font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                        {event.title}
                      </div>
                      <div className={`text-xs flex items-center gap-2 mt-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                        <Clock size={12} />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                        {event.day}
                      </div>
                      {event.location && (
                        <div className={`text-xs mt-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-1">
                      <button
                        onClick={() => handleEditEvent(index)}
                        className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-midnight-background/50 text-midnight-textSecondary' : 'hover:bg-pastel-background/50 text-pastel-textSecondary'}`}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(index)}
                        className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-midnight-background/50 text-midnight-textSecondary' : 'hover:bg-pastel-background/50 text-pastel-textSecondary'}`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-midnight-card text-midnight-textSecondary' : 'bg-pastel-card text-pastel-textSecondary'}`}>
              No events yet. Click the "+" button to add your first event.
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-4 md:p-6`}>
            <h2 className={`text-lg md:text-xl font-semibold mb-4 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Add Schedule Event
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
                  placeholder="Class, Meeting, Study Session..."
                  className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 text-xs md:text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Day*
                  </label>
                  <select
                    name="day"
                    value={newEvent.day}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block mb-1 text-xs md:text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Start Time
                  </label>
                  <select
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
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
                      End Time (auto-calculated if not set)
                    </label>
                    <select
                      name="endTime"
                      value={newEvent.endTime}
                      onChange={handleInputChange}
                      className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={newEvent.location}
                      onChange={handleInputChange}
                      placeholder="Room number, building, etc."
                      className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                          className={`w-6 h-6 rounded-full ${newEvent.color === color ? 'ring-2 ring-offset-2' : ''}`}
                          style={{ backgroundColor: color }}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
              
              <div className="flex justify-end gap-2 md:gap-3 pt-2">
                <button 
                  onClick={() => setShowModal(false)}
                  className={`px-3 py-2 text-sm rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEvent}
                  className={`px-3 py-2 text-sm rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  Add to Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-4 md:p-6`}>
            <h2 className={`text-lg md:text-xl font-semibold mb-4 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Import Schedule
            </h2>
            
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className={darkMode ? 'text-midnight-warning' : 'text-pastel-warning'} />
                  <div className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    <p className="font-medium mb-1">Supported formats:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>JSON file with array of events</li>
                      <li>CSV file with headers: title, day, startTime, endTime (optional), location (optional)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6
                          border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                <Upload size={24} className="mb-2 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  CSV or JSON (Max size: 2MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv, .json"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`mt-4 px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  Select File
                </button>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className={`px-3 py-2 text-sm rounded-lg ${darkMode ? 'bg-midnight-card text-midnight-textPrimary border border-midnight-shadow' : 'bg-pastel-card text-pastel-textPrimary border border-pastel-shadow'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 max-w-xs p-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? darkMode ? 'bg-midnight-success/20 border border-midnight-success' : 'bg-pastel-success/20 border border-pastel-success' 
            : darkMode ? 'bg-midnight-error/20 border border-midnight-error' : 'bg-pastel-error/20 border border-pastel-error'
        }`}>
          <p className={`text-sm ${
            notification.type === 'success'
              ? darkMode ? 'text-midnight-success' : 'text-pastel-success'
              : darkMode ? 'text-midnight-error' : 'text-pastel-error'
          }`}>
            {notification.message}
          </p>
        </div>
      )}
      
      {/* AI Assistant */}
      <AIAssistant darkMode={darkMode} />
    </div>
  );
};

export default Timetable;
