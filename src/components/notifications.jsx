import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bell,
  Calendar,
  Clock, 
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  MoreVertical,
  Trash,
  CheckCheck,
  Filter,
  Search
} from 'lucide-react';

const Notifications = ({ onNavigate }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Notification categories
  const filters = [
    { id: 'all', name: 'All' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'events', name: 'Events' },
    { id: 'system', name: 'System' }
  ];

  // Generate mock notifications
  useEffect(() => {
    // Check user preference for dark mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    // Generate sample notifications
    const sampleNotifications = [
      {
        id: 1,
        title: 'Task Deadline Approaching',
        message: 'Complete project proposal is due in 3 hours',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 30), // 30 minutes ago
        type: 'tasks',
        priority: 'high',
        read: false
      },
      {
        id: 2,
        title: 'Calendar Event',
        message: 'Team meeting starts in 15 minutes',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60), // 1 hour ago
        type: 'events',
        priority: 'medium',
        read: false
      },
      {
        id: 3,
        title: 'Task Completed',
        message: 'You completed "Design new user interface"',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
        type: 'tasks',
        priority: 'low',
        read: true
      },
      {
        id: 4,
        title: 'System Update',
        message: 'MotiList has been updated to version 1.2.0',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // 1 day ago
        type: 'system',
        priority: 'low',
        read: true
      },
      {
        id: 5,
        title: 'New Timetable Event',
        message: 'Math class added to your timetable for Monday at 10:00',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 28), // 28 hours ago
        type: 'events',
        priority: 'medium',
        read: true
      },
      {
        id: 6,
        title: 'Task Assigned',
        message: 'New task "Finalize presentation slides" assigned to you',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 30), // 30 hours ago
        type: 'tasks',
        priority: 'high',
        read: false
      },
      {
        id: 7,
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Oct 16, 2025',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 48), // 2 days ago
        type: 'system',
        priority: 'medium',
        read: true
      },
      {
        id: 8,
        title: 'Event Reminder',
        message: 'Doctor appointment tomorrow at 2:30 PM',
        timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 50), // ~2 days ago
        type: 'events',
        priority: 'high',
        read: false
      }
    ];
    
    setNotifications(sampleNotifications);
  }, []);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? {...notification, read: true} : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({...notification, read: true})));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  // Filter notifications
  const getFilteredNotifications = () => {
    return notifications
      .filter(notification => 
        (selectedFilter === 'all' || notification.type === selectedFilter) &&
        (searchQuery === '' || notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  // Group notifications by date
  const groupNotificationsByDate = (notificationsList) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);
    
    const groups = {
      today: [],
      yesterday: [],
      older: []
    };
    
    notificationsList.forEach(notification => {
      const notificationDate = new Date(notification.timestamp).setHours(0, 0, 0, 0);
      
      if (notificationDate === today) {
        groups.today.push(notification);
      } else if (notificationDate === yesterday) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });
    
    return groups;
  };

  // Format time
  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };
  
  // Format date
  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'tasks':
        return <CheckCircle size={20} className={
          priority === 'high' ? 'text-red-500' : 
          priority === 'medium' ? (darkMode ? 'text-midnight-primary' : 'text-pastel-primary') : 
          (darkMode ? 'text-midnight-success' : 'text-pastel-success')
        } />;
      case 'events':
        return <Calendar size={20} className={
          priority === 'high' ? 'text-red-500' : 
          priority === 'medium' ? (darkMode ? 'text-midnight-accent' : 'text-pastel-accent') : 
          (darkMode ? 'text-midnight-primary' : 'text-pastel-primary')
        } />;
      case 'system':
        return <Info size={20} className={
          priority === 'high' ? 'text-red-500' : 
          priority === 'medium' ? (darkMode ? 'text-midnight-warning' : 'text-pastel-warning') : 
          (darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary')
        } />;
      default:
        return <Bell size={20} className={darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'} />;
    }
  };

  // Get number of unread notifications
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  // Get filtered notifications
  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some(notification => !notification.read);
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Header */}
      <div className={`px-4 py-4 md:py-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-midnight-primary/10 text-midnight-textPrimary' : 'hover:bg-pastel-primary/10 text-pastel-textPrimary'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                <Bell size={24} className="hidden md:inline" />
                Notifications
                {getUnreadCount() > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white`}>
                    {getUnreadCount()}
                  </span>
                )}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {!isSearchOpen && (
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                >
                  <Search size={20} />
                </button>
              )}
              
              {hasUnreadNotifications && (
                <button 
                  onClick={markAllAsRead}
                  className={`p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                  title="Mark all as read"
                >
                  <CheckCheck size={20} />
                </button>
              )}
              
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className={`p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
                  title="Clear all notifications"
                >
                  <Trash size={20} />
                </button>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          {isSearchOpen && (
            <div className="mt-3 flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-midnight-background text-midnight-textPrimary border border-midnight-shadow focus:border-midnight-primary' 
                      : 'bg-pastel-background text-pastel-textPrimary border border-pastel-shadow focus:border-pastel-primary'
                  } focus:outline-none`}
                  autoFocus
                />
                <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`} />
              </div>
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className={`ml-2 p-2 rounded-lg ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}
              >
                <XCircle size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <div className={`flex items-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            <Filter size={16} className="mr-1" /> 
            <span className="text-sm">Filter:</span>
          </div>
          
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-lg whitespace-nowrap ${
                selectedFilter === filter.id 
                  ? `${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`
                  : `${darkMode ? 'bg-midnight-card text-midnight-textSecondary' : 'bg-pastel-card text-pastel-textSecondary'}`
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        {/* Today's Notifications */}
        {groupedNotifications.today.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-sm font-medium mb-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              Today
            </h2>
            
            <div className="space-y-2">
              {groupedNotifications.today.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  darkMode={darkMode}
                  formatTime={formatTime}
                  getNotificationIcon={getNotificationIcon}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Yesterday's Notifications */}
        {groupedNotifications.yesterday.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-sm font-medium mb-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              Yesterday
            </h2>
            
            <div className="space-y-2">
              {groupedNotifications.yesterday.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  darkMode={darkMode}
                  formatTime={formatTime}
                  getNotificationIcon={getNotificationIcon}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Older Notifications */}
        {groupedNotifications.older.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-sm font-medium mb-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
              Earlier
            </h2>
            
            <div className="space-y-2">
              {groupedNotifications.older.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  darkMode={darkMode}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  getNotificationIcon={getNotificationIcon}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                  showDate={true}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className={`py-12 text-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            <div className="flex justify-center mb-4">
              <Bell size={48} className="opacity-20" />
            </div>
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-sm">
              {notifications.length === 0 
                ? "You're all caught up! Notifications will appear here."
                : "No notifications match your current filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ 
  notification, 
  darkMode, 
  formatTime, 
  formatDate, 
  getNotificationIcon, 
  markAsRead, 
  deleteNotification,
  showDate = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div 
      className={`relative p-3 rounded-lg ${
        notification.read 
          ? darkMode ? 'bg-midnight-card' : 'bg-pastel-card' 
          : darkMode ? 'bg-midnight-card border-l-4 border-midnight-primary' : 'bg-pastel-card border-l-4 border-pastel-primary'
      } ${notification.priority === 'high' ? 'animate-pulse-slow' : ''}`}
      onClick={() => !notification.read && markAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-medium ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'} ${notification.read ? '' : 'font-semibold'}`}>
            {notification.title}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            {notification.message}
          </p>
          <div className={`text-xs mt-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            {showDate ? formatDate(notification.timestamp) : ''} {formatTime(notification.timestamp)}
          </div>
        </div>
        
        <div className="flex-shrink-0 relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-midnight-background text-midnight-textSecondary' : 'hover:bg-pastel-background text-pastel-textSecondary'}`}
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div 
              className={`absolute right-0 top-full mt-1 z-10 rounded-lg shadow-lg w-36 ${darkMode ? 'bg-midnight-card border border-midnight-shadow' : 'bg-pastel-card border border-pastel-shadow'}`}
            >
              <ul>
                {!notification.read && (
                  <li>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                        setShowMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${darkMode ? 'hover:bg-midnight-background text-midnight-textPrimary' : 'hover:bg-pastel-background text-pastel-textPrimary'}`}
                    >
                      Mark as read
                    </button>
                  </li>
                )}
                <li>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm text-red-500`}
                  >
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {notification.priority === 'high' && (
        <span className="absolute top-2 right-8 h-2 w-2 rounded-full bg-red-500"></span>
      )}
    </div>
  );
};

export default Notifications;
