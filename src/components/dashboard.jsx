import { useState, useEffect, useCallback } from 'react';
import { 
  Sun, 
  Moon, 
  CheckCircle, 
  Clock, 
  Settings, 
  List, 
  Plus, 
  Menu, 
  X, 
  Home, 
  Calendar, 
  UserCircle, 
  Star, 
  BellRing,
  Trash,
  XCircle
} from 'lucide-react';

const Dashboard = ({ onNavigate, currentView = 'dashboard' }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // New task state
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    priority: 'medium',
    type: 'task',
    completed: false,
    source: 'dashboard'
  });
  
  // Helper function to get current date for day of week
  const getCurrentDateForDay = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 for Sunday
    const targetDayIndex = days.indexOf(dayName);
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7; // Get next occurrence
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    return targetDate.toISOString().split('T')[0];
  };
  
  // Load tasks from localStorage using useCallback
  const loadTasks = useCallback(() => {
    try {
      // Load tasks from all sources
      const savedTasks = localStorage.getItem('tasks');
      const timetableEvents = localStorage.getItem('timetableEvents');
      const calendarEvents = localStorage.getItem('calendarEvents');
      
      let allTasks = [];
      
      // Add dashboard tasks
      if (savedTasks) {
        allTasks = [...JSON.parse(savedTasks)];
      }
      
      // Add timetable events as tasks
      if (timetableEvents) {
        const events = JSON.parse(timetableEvents);
        const timetableTasks = events.map(event => ({
          id: `timetable-${event.id}`,
          title: event.title,
          dueDate: getCurrentDateForDay(event.day),
          dueTime: event.startTime,
          priority: 'medium',
          type: 'event',
          completed: false,
          source: 'timetable',
          sourceData: event,
          location: event.location || ''
        }));
        allTasks = [...allTasks, ...timetableTasks];
      }
      
      // Add calendar events as tasks (if calendar events exist)
      if (calendarEvents) {
        const events = JSON.parse(calendarEvents);
        const calendarTasks = events.map(event => {
          // Handle both formats - direct events from calendar component or Google Calendar events
          const start = event.start?.dateTime || event.startTime || event.date;
          let dueDate, dueTime;
          
          if (start) {
            if (typeof start === 'string' && start.includes('T')) {
              // ISO format from Google Calendar
              dueDate = start.split('T')[0];
              dueTime = new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
              // Our custom format
              dueDate = event.date;
              dueTime = event.startTime;
            }
          }
          
          return {
            id: `calendar-${event.id}`,
            title: event.title || event.summary || 'Untitled Event',
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            dueTime: dueTime || '12:00',
            priority: 'medium',
            type: 'event',
            completed: false,
            source: 'calendar',
            sourceData: event,
            description: event.description || ''
          };
        });
        allTasks = [...allTasks, ...calendarTasks];
      }
      
      // Sort tasks by due date and time
      allTasks.sort((a, b) => {
        const dateA = new Date(`${a.dueDate}T${a.dueTime}`);
        const dateB = new Date(`${b.dueDate}T${b.dueTime}`);
        return dateA - dateB;
      });
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    // Check user preference from system or localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Load tasks when component mounts or when currentView changes to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadTasks();
    }
  }, [currentView, loadTasks]);
  
  // Initial task loading and periodic refreshes
  useEffect(() => {
    loadTasks();
    
    // Set up periodic refresh to catch any external changes
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTasks();
      }
    }, 30000); // Refresh every 30 seconds when visible
    
    // Clean up
    return () => clearInterval(refreshInterval);
  }, [loadTasks]);

  // This second declaration needs to be removed to fix the error
  // const loadTasks = useCallback(() => {
  //   ...duplicate code...
  // }
  
  // Add a new task
  const addTask = () => {
    // Validate required fields
    if (!newTask.title || !newTask.dueDate || !newTask.dueTime) {
      showNotification('Please fill in all required fields');
      return;
    }
    
    const taskId = Date.now().toString();
    const taskToAdd = { ...newTask, id: taskId };
    
    // Add to state
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, taskToAdd];
      
      // Save dashboard tasks to localStorage
      const dashboardTasks = updatedTasks.filter(task => task.source === 'dashboard');
      localStorage.setItem('tasks', JSON.stringify(dashboardTasks));
      
      return updatedTasks;
    });
    
    // Reset form
    setNewTask({
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
      priority: 'medium',
      type: 'task',
      completed: false,
      source: 'dashboard'
    });
    
    setShowTaskModal(false);
    showNotification('Task added successfully');
  };
  
  // Toggle task completion status
  const toggleTaskComplete = (taskId) => {
    setTasks(prevTasks => {
      const taskToToggle = prevTasks.find(task => task.id === taskId);
      
      if (!taskToToggle) return prevTasks;
      
      const updatedTasks = prevTasks.map(task => 
        task.id === taskId ? {...task, completed: !task.completed} : task
      );
      
      // Update localStorage with dashboard tasks
      const dashboardTasks = updatedTasks.filter(task => task.source === 'dashboard');
      localStorage.setItem('tasks', JSON.stringify(dashboardTasks));
      
      // If task is from timetable or calendar, also update that source
      if (taskToToggle.source === 'timetable') {
        updateTimetableEventCompletion(taskToToggle.sourceData.id, !taskToToggle.completed);
      } else if (taskToToggle.source === 'calendar') {
        updateCalendarEventCompletion(taskToToggle.sourceData.id, !taskToToggle.completed);
      }
      
      return updatedTasks;
    });
  };
  
  // Update timetable event completion status
  const updateTimetableEventCompletion = (eventId, completed) => {
    try {
      const timetableEvents = JSON.parse(localStorage.getItem('timetableEvents') || '[]');
      const updatedEvents = timetableEvents.map(event => 
        event.id === eventId ? {...event, completed} : event
      );
      localStorage.setItem('timetableEvents', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Error updating timetable event completion:', error);
    }
  };
  
  // Update calendar event completion status
  const updateCalendarEventCompletion = (eventId, completed) => {
    try {
      const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
      const updatedEvents = calendarEvents.map(event => 
        event.id === eventId ? {...event, completed} : event
      );
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Error updating calendar event completion:', error);
    }
  };
  
  // Delete a task
  const deleteTask = (taskId) => {
    setTasks(prevTasks => {
      const taskToDelete = prevTasks.find(task => task.id === taskId);
      
      if (!taskToDelete) {
        showNotification('Task not found');
        return prevTasks;
      }
      
      // If it's from timetable or calendar, show warning instead of deleting source data
      if (taskToDelete.source !== 'dashboard') {
        showNotification(`This ${taskToDelete.source} event is only hidden from tasks. Delete it from ${taskToDelete.source} to remove completely.`);
      }
      
      const updatedTasks = prevTasks.filter(task => task.id !== taskId);
      
      // Update localStorage with dashboard tasks
      const dashboardTasks = updatedTasks.filter(task => task.source === 'dashboard');
      localStorage.setItem('tasks', JSON.stringify(dashboardTasks));
      
      // If it's a dashboard task, we're fully deleting
      if (taskToDelete.source === 'dashboard') {
        showNotification('Task deleted');
      }
      
      return updatedTasks;
    });
  };
  
  // Show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle input change for new task
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Helper functions for date handling
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  const isPast = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    return date < today;
  };
  
  const formatTaskTime = (task) => {
    if (isToday(task.dueDate)) {
      return `Today, ${formatTime(task.dueTime)}`;
    } else if (isPast(task.dueDate)) {
      return `Overdue`;
    } else {
      // Format as "Oct 16, 10:00 AM"
      const date = new Date(task.dueDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}, ${formatTime(task.dueTime)}`;
    }
  };
  
  const formatTime = (timeString) => {
    // Convert 24h time to 12h format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', newDarkMode);
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
    { icon: <Settings size={20} />, name: 'Settings', view: 'settings' },
  ].map(item => ({
    ...item,
    active: item.view === currentView
  }));
  
  // Handle navigation
  const handleNavigate = (view) => {
    if (onNavigate) {
      onNavigate(view);
      // Close sidebar when navigating on mobile
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Sidebar for larger screens */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 
        ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-lg 
        md:translate-x-0 md:static md:w-64 md:flex md:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar header */}
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'} border-b`}>
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
        
        {/* Navigation links */}
        <nav className="flex-1 py-4">
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <button 
                  onClick={() => handleNavigate(item.view)}
                  className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg w-full text-left
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
        
        {/* Sidebar footer with theme toggle */}
        <div className={`p-4 ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'} border-t`}>
          <button 
            onClick={toggleDarkMode}
            className={`flex items-center gap-2 w-full p-2 rounded-lg ${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
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
      <div className="flex-1 flex flex-col">
        {/* Header for mobile */}
        <header className={`flex justify-between items-center p-4 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm md:shadow-none`}>
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
              onClick={() => onNavigate('notifications')}
              className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
            >
              <BellRing size={20} />
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 py-6 md:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              Dashboard
            </h2>
            
            {/* Quick Actions Section */}
            <section className="mb-6">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => onNavigate('timetable')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  <Clock size={18} />
                  <span>My Timetable</span>
                </button>
                
                <button 
                  onClick={() => onNavigate('calendar')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 
                  ${darkMode ? 'border border-midnight-shadow text-midnight-textPrimary' : 'border border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <Calendar size={18} />
                  <span>Calendar</span>
                </button>
              </div>
            </section>

            {/* Stats Section */}
            <section className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Completed Tasks */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-midnight-success/10' : 'bg-pastel-success/10'}`}>
                    <CheckCircle size={24} className={darkMode ? 'text-midnight-success' : 'text-pastel-success'} />
                  </div>
                  <h3 className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>Completed</h3>
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  {tasks.filter(task => task.completed).length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>Tasks completed</p>
              </div>
              
              {/* Pending Tasks */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-midnight-primary/10' : 'bg-pastel-primary/10'}`}>
                    <List size={24} className={darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} />
                  </div>
                  <h3 className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>Pending</h3>
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  {tasks.filter(task => !task.completed).length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>Tasks remaining</p>
              </div>
              
              {/* Due Soon Tasks */}
              <div className={`col-span-2 md:col-span-1 mx-auto md:mx-0 w-full max-w-[50%] md:max-w-none p-6 rounded-xl ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-midnight-warning/10' : 'bg-pastel-warning/10'}`}>
                    <Clock size={24} className={darkMode ? 'text-midnight-warning' : 'text-pastel-warning'} />
                  </div>
                  <h3 className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>Due Soon</h3>
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  {tasks.filter(task => {
                    // Check if the task is due today
                    return isToday(task.dueDate) && !task.completed;
                  }).length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>Tasks due today</p>
              </div>
            </section>

            {/* Tasks Section */}
            <section className={`rounded-xl p-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  My Tasks
                </h2>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </div>
              
              {/* Task List */}
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.slice(0, showAllTasks ? tasks.length : 5).map(task => (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-lg border ${
                        darkMode 
                          ? 'border-midnight-shadow bg-midnight-background/30' 
                          : 'border-pastel-shadow bg-pastel-background/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Task Status Indicator */}
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className={`p-1 rounded-full flex-shrink-0 ${
                            task.completed 
                              ? (darkMode ? 'bg-midnight-success' : 'bg-pastel-success')
                              : task.priority === 'high' 
                                ? 'border border-red-500' 
                                : task.priority === 'medium' 
                                  ? (darkMode ? 'border border-midnight-primary' : 'border border-pastel-primary')
                                  : (darkMode ? 'border border-midnight-textSecondary' : 'border border-pastel-textSecondary')
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle size={16} className="text-white" />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </button>
                        
                        {/* Task Title */}
                        <p className={`flex-1 ${
                          task.completed 
                            ? (darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary') + ' line-through'
                            : darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'
                        }`}>
                          {task.title}
                          {task.source !== 'dashboard' && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                              task.source === 'timetable' 
                                ? (darkMode ? 'bg-midnight-primary/20 text-midnight-primary' : 'bg-pastel-primary/20 text-pastel-primary')
                                : (darkMode ? 'bg-midnight-accent/20 text-midnight-accent' : 'bg-pastel-accent/20 text-pastel-accent')
                            }`}>
                              {task.source === 'timetable' ? 'Timetable' : 'Calendar'}
                            </span>
                          )}
                        </p>
                        
                        {/* Task Due Time */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs whitespace-nowrap ${
                            isToday(task.dueDate) 
                              ? (darkMode ? 'text-midnight-accent' : 'text-pastel-accent') + ' font-medium'
                              : isPast(task.dueDate)
                                ? (darkMode ? 'text-midnight-warning' : 'text-pastel-warning') + ' font-medium'
                                : darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'
                          }`}>
                            {formatTaskTime(task)}
                          </span>
                          
                          <button
                            onClick={() => deleteTask(task.id)}
                            className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-8 text-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    <p className="mb-2 font-medium">No tasks yet</p>
                    <p className="text-sm">Add tasks or events to your calendar or timetable</p>
                  </div>
                )}
                
                {tasks.length > 5 && (
                  <button
                    onClick={() => {
                      // Toggle showing all tasks vs limited tasks
                      setShowAllTasks(prev => !prev);
                    }}
                    className={`w-full py-2 text-center text-sm rounded-lg ${darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} hover:underline`}
                  >
                    {showAllTasks ? 'Show less tasks' : `View all ${tasks.length} tasks`}
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Add New Task
              </h3>
              <button 
                onClick={() => setShowTaskModal(false)}
                className={`p-1 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Task Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  placeholder="Enter task title"
                  className={`w-full p-2.5 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Due Date*
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTask.dueDate}
                    onChange={handleInputChange}
                    className={`w-full p-2.5 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Due Time*
                  </label>
                  <input
                    type="time"
                    name="dueTime"
                    value={newTask.dueTime}
                    onChange={handleInputChange}
                    className={`w-full p-2.5 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Priority
                </label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className={`px-4 py-2 text-sm rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={addTask}
                  className={`px-4 py-2 text-sm rounded-lg ${!newTask.title ? 'bg-gray-300 cursor-not-allowed text-gray-500' : darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                  disabled={!newTask.title}
                >
                  Add Task
                </button>
              </div>
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

export default Dashboard;
