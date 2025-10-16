import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  List, 
  Plus, 
  Trash,
  XCircle,
  GripVertical,
  LogOut
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  getTasks, 
  addTask as fbAddTask, 
  updateTask as fbUpdateTask, 
  deleteTask as fbDeleteTask,
  toggleTaskComplete as fbToggleTaskComplete,
  getCurrentUser,
  onAuthChange,
  logOut
} from '../firebaseUtils';
import AuthForm from './AuthForm';

const Dashboard = ({ darkMode, currentView = 'dashboard' }) => {
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Show notification - defined early so it can be used throughout the component
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Filtering state
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, active
  const [filterPriority, setFilterPriority] = useState('all'); // all, low, medium, high
  const [filterSource, setFilterSource] = useState('all'); // all, dashboard, calendar, timetable
  const [filterCategory, setFilterCategory] = useState('all'); // all, general, work, personal, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Custom navigation function that can be used throughout the component
  // (Removed unused navigateTo function)
  
  // New/Edit task state
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    priority: 'medium',
    type: 'task',
    completed: false,
    source: 'dashboard',
    category: 'general' // Adding category support
  });
  
  // Track if we're editing an existing task
  const [editingTask, setEditingTask] = useState(null);
  
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
  
  // Current user state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Load tasks from Firebase using useCallback - defined before it's used in useEffect
  const loadTasks = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      // Get tasks from Firebase
      const taskData = await getTasks(userId);
      
      // We'll still incorporate events from localStorage for now
      // These could be moved to Firebase in a future update
      const timetableEvents = localStorage.getItem('timetableEvents');
      const calendarEvents = localStorage.getItem('calendarEvents');
      
      let allTasks = [...taskData];
      
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
          sourceData: event
        }));
        allTasks = [...allTasks, ...timetableTasks];
      }
      
      // Add calendar events as tasks
      if (calendarEvents) {
        const events = JSON.parse(calendarEvents);
        const calendarTasks = events.map(event => ({
          id: `calendar-${event.id}`,
          title: event.title,
          dueDate: event.date,
          dueTime: event.time || '09:00',
          priority: event.priority || 'medium',
          type: 'event',
          completed: false,
          source: 'calendar',
          sourceData: event
        }));
        allTasks = [...allTasks, ...calendarTasks];
      }
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Error loading tasks');
    }
  }, []);
  
  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadTasks(user.uid);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setTasks([]);
      }
    });
    
    return () => unsubscribe();
  }, [loadTasks]);
  
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
  
  // Function to navigate between components (using custom events)
  const handleNavigate = (view) => {
    // Dispatch a custom event that will be caught by App.jsx
    window.dispatchEvent(new CustomEvent('navigate', { detail: view }));
  };
  
  // Add or edit a task
  const saveTask = async () => {
    // Validate required fields
    if (!newTask.title || !newTask.dueDate || !newTask.dueTime) {
      showNotification('Please fill in all required fields');
      return;
    }
    
    // Check if user is authenticated
    if (!currentUser) {
      showNotification('Please sign in to save tasks');
      return;
    }
    
    try {
      // Set loading state if needed
      // setIsLoading(true);
      
      if (editingTask) {
        // Update existing task in Firebase
        await fbUpdateTask(editingTask, {
          ...newTask,
          userId: currentUser.uid,
          updatedAt: new Date()
        });
        
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === editingTask ? { ...newTask, id: editingTask } : task
          )
        );
        
        showNotification('Task updated successfully');
      } else {
        // Add new task to Firebase
        const newTaskWithUserId = {
          ...newTask,
          userId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add to Firebase and get the new ID
        const taskId = await fbAddTask(newTaskWithUserId);
        
        // Update local state
        setTasks(prevTasks => [
          ...prevTasks, 
          { ...newTaskWithUserId, id: taskId }
        ]);
        
        showNotification('Task added successfully');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Error saving task: ' + error.message);
    } finally {
      // Reset loading state if needed
      // setIsLoading(false);
      
      // Reset form and editing state
      setNewTask({
        title: '',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '12:00',
        priority: 'medium',
        type: 'task',
        completed: false,
        source: 'dashboard',
        category: 'general'
      });
      setEditingTask(null);
      setShowTaskModal(false);
    }
  };
  
  // Start editing a task
  const editTask = (taskId) => {
    const taskToEdit = tasks.find(task => task.id === taskId);
    
    if (taskToEdit && taskToEdit.source === 'dashboard') {
      setEditingTask(taskId);
      setNewTask({...taskToEdit});
      setShowTaskModal(true);
    } else if (taskToEdit) {
      showNotification(`Cannot edit ${taskToEdit.source} items directly`);
    }
  };
  
  // Toggle task completion status
  const toggleTaskComplete = async (taskId) => {
    try {
      // Find the task in our current state
      const taskToToggle = tasks.find(task => task.id === taskId);
      
      if (!taskToToggle) {
        showNotification('Task not found');
        return;
      }
      
      // Update state optimistically for better UX
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? {...task, completed: !task.completed} : task
      ));
      
      // If this is a Firebase task (from dashboard)
      if (taskToToggle.source === 'dashboard') {
        // Update in Firebase
        await fbToggleTaskComplete(taskId, !taskToToggle.completed);
      }
      // If task is from timetable or calendar, update in localStorage
      else if (taskToToggle.source === 'timetable') {
        updateTimetableEventCompletion(taskToToggle.sourceData.id, !taskToToggle.completed);
      } else if (taskToToggle.source === 'calendar') {
        updateCalendarEventCompletion(taskToToggle.sourceData.id, !taskToToggle.completed);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      showNotification('Error updating task');
      
      // Revert the state on error
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? {...task, completed: !task.completed} : task
      ));
    }
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
  const deleteTask = async (taskId) => {
    try {
      const taskToDelete = tasks.find(task => task.id === taskId);
      
      if (!taskToDelete) {
        showNotification('Task not found');
        return;
      }
      
      // If it's from timetable or calendar, show warning instead of deleting source data
      if (taskToDelete.source !== 'dashboard') {
        showNotification(`This ${taskToDelete.source} event is only hidden from tasks. Delete it from ${taskToDelete.source} to remove completely.`);
        // Just remove from the current view
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        return;
      }
      
      // If it's a dashboard task (stored in Firebase), delete it from Firebase
      await fbDeleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      showNotification('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Error deleting task: ' + error.message);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await logOut();
      showNotification('You have been logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      showNotification('Error logging out: ' + error.message);
    }
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
  
  // Filter tasks based on criteria
  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      // Filter by status
      if (filterStatus === 'completed' && !task.completed) return false;
      if (filterStatus === 'active' && task.completed) return false;
      
      // Filter by priority
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      
      // Filter by source
      if (filterSource !== 'all' && task.source !== filterSource) return false;
      
      // Filter by category (only for dashboard tasks that have categories)
      if (filterCategory !== 'all' && task.source === 'dashboard' && task.category !== filterCategory) return false;
      
      // Filter by search query
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterSource, filterCategory, searchQuery]);
  
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

  // Define a custom draggable task item component
  const DraggableTaskItem = ({ task, index, moveTask, darkMode }) => {
    const ref = useRef(null);
    
    // Task can be dragged
    const [{ isDragging }, drag] = useDrag({
      type: 'TASK',
      item: { id: task.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: task.source === 'dashboard', // Only dashboard tasks can be dragged
    });
    
    // Task can receive other dragged tasks
    const [, drop] = useDrop({
      accept: 'TASK',
      hover(item, monitor) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;
        
        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }
        
        // Determine rectangle on screen
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        
        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        
        // Determine mouse position
        const clientOffset = monitor.getClientOffset();
        
        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        
        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%
        
        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        
        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
        
        // Time to actually perform the action
        moveTask(dragIndex, hoverIndex);
        
        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });
    
    drag(drop(ref));
    
    return (
      <div 
        ref={ref}
        className={`p-4 rounded-lg border ${
          isDragging ? 'opacity-50' : ''
        } ${
          darkMode 
            ? 'border-midnight-shadow bg-midnight-background/30' 
            : 'border-pastel-shadow bg-pastel-background/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Drag handle (only for dashboard tasks) */}
          {task.source === 'dashboard' && (
            <div className={`cursor-move ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              <GripVertical size={16} />
            </div>
          )}
          
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
            <div className="flex flex-wrap gap-1 mt-1">
              {/* Source badge */}
              {task.source !== 'dashboard' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  task.source === 'timetable' 
                    ? (darkMode ? 'bg-midnight-primary/20 text-midnight-primary' : 'bg-pastel-primary/20 text-pastel-primary')
                    : (darkMode ? 'bg-midnight-accent/20 text-midnight-accent' : 'bg-pastel-accent/20 text-pastel-accent')
                }`}>
                  {task.source === 'timetable' ? 'Timetable' : 'Calendar'}
                </span>
              )}
              
              {/* Category badge - only for dashboard tasks */}
              {task.source === 'dashboard' && task.category && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  darkMode ? 'bg-midnight-warning/20 text-midnight-warning' : 'bg-pastel-warning/20 text-pastel-warning'
                }`}>
                  {task.category}
                </span>
              )}
            </div>
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
            
            <div className="flex items-center">
              {/* Edit button (only for dashboard tasks) */}
              {task.source === 'dashboard' && (
                <button
                  onClick={() => editTask(task.id)}
                  className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => deleteTask(task.id)}
                className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to move tasks (for drag and drop)
  const moveTask = (dragIndex, hoverIndex) => {
    // Only apply to dashboard tasks
    setTasks(prevTasks => {
      const dashboardTasks = prevTasks.filter(task => task.source === 'dashboard');
      const otherTasks = prevTasks.filter(task => task.source !== 'dashboard');
      
      // Reorder dashboard tasks
      const draggedTask = dashboardTasks[dragIndex];
      const newDashboardTasks = [...dashboardTasks];
      
      // Remove dragged item
      newDashboardTasks.splice(dragIndex, 1);
      // Add it at the new position
      newDashboardTasks.splice(hoverIndex, 0, draggedTask);
      
      // Combine tasks and update localStorage
      const updatedTasks = [...newDashboardTasks, ...otherTasks];
      localStorage.setItem('tasks', JSON.stringify(newDashboardTasks));
      
      return updatedTasks;
    });
  };

  return (
    <div className="flex-1 overflow-auto px-4 py-6 md:px-6">
      {!isAuthenticated ? (
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
            Welcome to MotiList
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            Please sign in to access your tasks and manage your schedule.
          </p>
          
          <AuthForm darkMode={darkMode} onAuthenticated={() => {
            // This will be called when authentication is successful
            const user = getCurrentUser();
            if (user) {
              loadTasks(user.uid);
            }
          }} />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <DndProvider backend={HTML5Backend}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Dashboard
              </h2>
              
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    {currentUser.email}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg 
                    ${darkMode ? 'bg-midnight-background text-midnight-textSecondary hover:text-midnight-primary' : 
                    'bg-pastel-background text-pastel-textSecondary hover:text-pastel-primary'}`}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Actions Section */}
            <section className="mb-6">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleNavigate('timetable')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  <Clock size={18} />
                  <span>My Timetable</span>
                </button>
                
                <button 
                  onClick={() => handleNavigate('calendar')}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
              My Tasks
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:bg-midnight-primary/10' : 'text-pastel-textSecondary hover:bg-pastel-primary/10'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </button>
              <button 
                onClick={() => setShowTaskModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
              >
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className={`mb-4 ${showFilters ? '' : 'hidden'}`}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Source
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="all">All</option>
                  <option value="dashboard">Tasks</option>
                  <option value="calendar">Calendar</option>
                  <option value="timetable">Timetable</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 text-xs font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="all">All</option>
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="study">Study</option>
                  <option value="health">Health</option>
                  <option value="shopping">Shopping</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Task List */}
          <div className="space-y-3">
            {tasks.length > 0 ? (
              getFilteredTasks().slice(0, showAllTasks ? getFilteredTasks().length : 5).map((task, index) => (
                <DraggableTaskItem 
                  key={task.id}
                  task={task}
                  index={index}
                  moveTask={moveTask}
                  darkMode={darkMode}
                />
              ))
            ) : (
              <div className={`p-8 text-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                <p className="mb-2 font-medium">No tasks yet</p>
                <p className="text-sm">Add tasks or events to your calendar or timetable</p>
              </div>
            )}
            
            {getFilteredTasks().length > 5 && (
              <button
                onClick={() => {
                  // Toggle showing all tasks vs limited tasks
                  setShowAllTasks(prev => !prev);
                }}
                className={`w-full py-2 text-center text-sm rounded-lg ${darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} hover:underline`}
              >
                {showAllTasks ? 'Show less tasks' : `View all ${getFilteredTasks().length} tasks`}
              </button>
            )}
          </div>
        </section>
      </DndProvider>
        </div>
      )}
      
      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                {editingTask ? 'Edit Task' : 'Add New Task'}
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
              
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Category
                </label>
                <select
                  name="category"
                  value={newTask.category}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 text-sm rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="study">Study</option>
                  <option value="health">Health</option>
                  <option value="shopping">Shopping</option>
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
                  onClick={saveTask}
                  className={`px-4 py-2 text-sm rounded-lg ${!newTask.title ? 'bg-gray-300 cursor-not-allowed text-gray-500' : darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                  disabled={!newTask.title}
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
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
