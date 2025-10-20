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
  LogOut,
  Edit
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  getTasks, 
  addTask as fbAddTask, 
  updateTask as fbUpdateTask, 
  deleteTask as fbDeleteTask,
  toggleTaskComplete as fbToggleTaskComplete,
  batchUpdateTaskOrders,
  getTimetableEvents,
  updateTimetableEvent,
  deleteTimetableEvent,
  logOut
} from '../firebaseUtils';
import useAuth from '../context/useAuth';
import AIAssistant from './AIAssistant';

const Dashboard = ({ darkMode, currentView = 'dashboard' }) => {
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  
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
  const [editingTimetableEvent, setEditingTimetableEvent] = useState(null);
  const [editingCalendarEvent, setEditingCalendarEvent] = useState(null);
  
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
  
  // Use Auth context for user state
  const { currentUser, isAuthenticated } = useAuth();
  
  // Load tasks from Firebase using useCallback - defined before it's used in useEffect
  const loadTasks = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      // Get tasks from Firebase
      const taskData = await getTasks(userId);
      
      // Get timetable events from Firebase
      const timetableEvents = await getTimetableEvents(userId);
      
      // Get calendar events from localStorage (can be migrated later)
      const calendarEvents = localStorage.getItem('calendarEvents');
      
      let allTasks = [...taskData];
      
      // Add timetable events as tasks
      if (timetableEvents && timetableEvents.length > 0) {
        const timetableTasks = timetableEvents.map(event => ({
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
      
      // Remove duplicates based on ID
      const uniqueTasks = allTasks.reduce((unique, task) => {
        if (!unique.find(t => t.id === task.id)) {
          unique.push(task);
        }
        return unique;
      }, []);
      
      setTasks(uniqueTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Error loading tasks');
    }
  }, []);
  
  // Load tasks when user is authenticated or when currentView changes to dashboard
  useEffect(() => {
    if (currentUser && currentView === 'dashboard') {
      loadTasks(currentUser.uid);
    } else if (!currentUser) {
      setTasks([]);
    }
  }, [currentUser, currentView, loadTasks]);
  
  // Set up periodic refresh to catch any external changes
  useEffect(() => {
    if (!currentUser || currentView !== 'dashboard') return;
    
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTasks(currentUser.uid);
      }
    }, 30000); // Refresh every 30 seconds when visible
    
    // Clean up
    return () => clearInterval(refreshInterval);
  }, [currentUser, currentView, loadTasks]);
  
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
    
    if (!taskToEdit) {
      showNotification('Task not found');
      return;
    }

    if (taskToEdit.source === 'dashboard') {
      setEditingTask(taskId);
      setNewTask({...taskToEdit});
      setShowTaskModal(true);
    } else if (taskToEdit.source === 'timetable') {
      setEditingTimetableEvent(taskToEdit.sourceData);
      setShowTimetableModal(true);
    } else if (taskToEdit.source === 'calendar') {
      setEditingCalendarEvent(taskToEdit.sourceData);
      setShowCalendarModal(true);
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
      
      // Confirm deletion for non-dashboard items
      if (taskToDelete.source !== 'dashboard') {
        const confirmDelete = window.confirm(
          `Delete this ${taskToDelete.source} item permanently? This will remove it from both the task list and the ${taskToDelete.source}.`
        );
        
        if (!confirmDelete) return;
        
        // Delete from the source (timetable or calendar)
        if (taskToDelete.source === 'timetable' && taskToDelete.sourceData) {
          await deleteTimetableEvent(taskToDelete.sourceData.id);
          showNotification('Timetable event deleted');
        } else if (taskToDelete.source === 'calendar' && taskToDelete.sourceData) {
          // For calendar events, we'll remove from localStorage for now
          const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
          const updatedEvents = calendarEvents.filter(event => event.id !== taskToDelete.sourceData.id);
          localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
          showNotification('Calendar event deleted');
        }
      } else {
        // If it's a dashboard task (stored in Firebase), delete it from Firebase
        await fbDeleteTask(taskId);
        showNotification('Task deleted');
      }
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
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
      canDrag: true, // All tasks can be dragged for reordering
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
        className={`p-4 rounded-lg border transition-all duration-200 ${
          isDragging 
            ? 'opacity-50 scale-105 shadow-lg ' + (darkMode ? 'border-midnight-primary bg-midnight-primary/10' : 'border-pastel-primary bg-pastel-primary/10')
            : darkMode 
              ? 'border-midnight-shadow bg-midnight-background/30 hover:bg-midnight-background/50' 
              : 'border-pastel-shadow bg-pastel-background/50 hover:bg-pastel-background/70'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Drag handle (for all tasks) */}
          <div 
            className={`cursor-move ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}
            title={task.source === 'dashboard' ? 'Drag to reorder' : `Drag to reorder (${task.source} item)`}
          >
            <GripVertical size={16} />
          </div>
          
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
          <div className={`flex-1 ${
            task.completed 
              ? (darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary') + ' line-through'
              : darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'
          }`}>
            <p>{task.title}</p>
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
          </div>
          
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
              {/* Edit button (for all task types) */}
              <button
                onClick={() => editTask(task.id)}
                className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
                title={task.source === 'dashboard' ? 'Edit task' : `Edit ${task.source} item`}
              >
                <Edit size={14} />
              </button>
              
              <button
                onClick={() => deleteTask(task.id)}
                className={`p-1 rounded-full hover:bg-opacity-20 ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
                title="Delete task"
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
  const moveTask = async (dragIndex, hoverIndex) => {
    setIsReordering(true);
    
    setTasks(prevTasks => {
      const allTasks = [...prevTasks];
      
      // Reorder all tasks (regardless of source)
      const draggedTask = allTasks[dragIndex];
      
      // Remove dragged item
      allTasks.splice(dragIndex, 1);
      // Add it at the new position
      allTasks.splice(hoverIndex, 0, draggedTask);
      
      // Only update Firebase order for dashboard tasks
      const dashboardTasks = allTasks.filter(task => task.source === 'dashboard');
      if (dashboardTasks.length > 0) {
        const taskUpdates = dashboardTasks.map((task, index) => ({
          taskId: task.id,
          order: index
        }));
        
        // Persist order changes to Firebase (async) - only for dashboard tasks
        batchUpdateTaskOrders(taskUpdates)
          .then(() => {
            setIsReordering(false);
          })
          .catch(error => {
            console.error('Error updating task order:', error);
            showNotification('Error saving task order');
            setIsReordering(false);
          });
      } else {
        setIsReordering(false);
      }
      
      // Save the task display order to localStorage for visual order persistence
      const taskOrder = allTasks.map(task => ({
        id: task.id,
        source: task.source
      }));
      localStorage.setItem('taskDisplayOrder', JSON.stringify(taskOrder));
      
      return allTasks;
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
          
          {/* Using our updated AuthForm that handles navigation internally */}
          <AuthForm darkMode={darkMode} />
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
          <div className={`space-y-3 ${isReordering ? 'opacity-75' : ''}`}>
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
      
      {/* Edit Timetable Event Modal */}
      {showTimetableModal && editingTimetableEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Edit Timetable Event
              </h3>
              <button 
                onClick={() => {
                  setShowTimetableModal(false);
                  setEditingTimetableEvent(null);
                }}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Event Title
                </label>
                <input
                  type="text"
                  value={editingTimetableEvent.title || ''}
                  onChange={(e) => setEditingTimetableEvent(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Day
                </label>
                <select
                  value={editingTimetableEvent.day || 'Monday'}
                  onChange={(e) => setEditingTimetableEvent(prev => ({ ...prev, day: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editingTimetableEvent.startTime || '09:00'}
                    onChange={(e) => setEditingTimetableEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editingTimetableEvent.endTime || '10:00'}
                    onChange={(e) => setEditingTimetableEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={editingTimetableEvent.location || ''}
                  onChange={(e) => setEditingTimetableEvent(prev => ({ ...prev, location: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                  placeholder="Room number, building, etc."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowTimetableModal(false);
                    setEditingTimetableEvent(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      // Update the timetable event in Firebase
                      const { id, createdAt: _createdAt, updatedAt: _updatedAt, userId: _userId, ...eventData } = editingTimetableEvent;
                      await updateTimetableEvent(id, eventData);
                      
                      // Reload tasks to reflect the changes
                      if (currentUser) {
                        await loadTasks(currentUser.uid);
                      }
                      
                      setShowTimetableModal(false);
                      setEditingTimetableEvent(null);
                      showNotification('Timetable event updated');
                    } catch (error) {
                      console.error('Error updating timetable event:', error);
                      showNotification('Error updating event');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  Update Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Calendar Event Modal */}
      {showCalendarModal && editingCalendarEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                Edit Calendar Event
              </h3>
              <button 
                onClick={() => {
                  setShowCalendarModal(false);
                  setEditingCalendarEvent(null);
                }}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Event Title
                </label>
                <input
                  type="text"
                  value={editingCalendarEvent.title || ''}
                  onChange={(e) => setEditingCalendarEvent(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={editingCalendarEvent.date || ''}
                  onChange={(e) => setEditingCalendarEvent(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Time
                </label>
                <input
                  type="time"
                  value={editingCalendarEvent.time || '09:00'}
                  onChange={(e) => setEditingCalendarEvent(prev => ({ ...prev, time: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                  Priority
                </label>
                <select
                  value={editingCalendarEvent.priority || 'medium'}
                  onChange={(e) => setEditingCalendarEvent(prev => ({ ...prev, priority: e.target.value }))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowCalendarModal(false);
                    setEditingCalendarEvent(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      // Update the calendar event in localStorage
                      const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
                      const updatedEvents = calendarEvents.map(event => 
                        event.id === editingCalendarEvent.id ? editingCalendarEvent : event
                      );
                      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
                      
                      // Reload tasks to reflect the changes
                      if (currentUser) {
                        await loadTasks(currentUser.uid);
                      }
                      
                      setShowCalendarModal(false);
                      setEditingCalendarEvent(null);
                      showNotification('Calendar event updated');
                    } catch (error) {
                      console.error('Error updating calendar event:', error);
                      showNotification('Error updating event');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}
                >
                  Update Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Assistant */}
      <AIAssistant darkMode={darkMode} />
      
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
