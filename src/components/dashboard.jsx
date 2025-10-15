import { useState, useEffect } from 'react';
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
  BellRing
} from 'lucide-react';

const Dashboard = ({ onNavigate, currentView = 'dashboard' }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check user preference from system or localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
    { icon: <Star size={20} />, name: 'Tasks', view: 'tasks' },
    { icon: <Calendar size={20} />, name: 'Calendar', view: 'calendar' },
    { icon: <Clock size={20} />, name: 'Timetable', view: 'timetable' },
    { icon: <BellRing size={20} />, name: 'Notifications', view: 'notifications' },
    { icon: <UserCircle size={20} />, name: 'Profile', view: 'profile' },
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
            {/* Settings button */}
            <button className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}>
              <BellRing size={20} />
            </button>
            <button className={`p-2 rounded-full ${darkMode ? 'text-midnight-textSecondary hover:text-midnight-textPrimary' : 'text-pastel-textSecondary hover:text-pastel-textPrimary'}`}>
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
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>12</p>
                <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>Tasks this week</p>
              </div>
              
              {/* Pending Tasks */}
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-midnight-primary/10' : 'bg-pastel-primary/10'}`}>
                    <List size={24} className={darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} />
                  </div>
                  <h3 className={darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}>Pending</h3>
                </div>
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>8</p>
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
                <p className={`text-3xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>3</p>
                <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>Tasks due today</p>
              </div>
            </section>

            {/* Tasks Section */}
            <section className={`rounded-xl p-6 ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                  My Tasks
                </h2>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'}`}>
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </div>
              
              {/* Task List */}
              <div className="space-y-3">
                {/* Task Item - Completed */}
                <div className={`p-4 rounded-lg border ${darkMode ? 'border-midnight-shadow bg-midnight-background/30' : 'border-pastel-shadow bg-pastel-background/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${darkMode ? 'bg-midnight-success' : 'bg-pastel-success'}`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <p className={`flex-1 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'} line-through`}>
                      Complete project proposal
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                      Yesterday
                    </span>
                  </div>
                </div>
                
                {/* Task Item - Pending */}
                <div className={`p-4 rounded-lg border ${darkMode ? 'border-midnight-shadow bg-midnight-background/30' : 'border-pastel-shadow bg-pastel-background/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full border ${darkMode ? 'border-midnight-primary' : 'border-pastel-primary'}`}>
                      <div className="w-4 h-4"></div>
                    </div>
                    <p className={`flex-1 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                      Design new user interface
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-midnight-accent' : 'text-pastel-accent'} font-medium`}>
                      Today
                    </span>
                  </div>
                </div>
                
                {/* Task Item - Due Soon */}
                <div className={`p-4 rounded-lg border ${darkMode ? 'border-midnight-shadow bg-midnight-background/30' : 'border-pastel-shadow bg-pastel-background/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full border ${darkMode ? 'border-midnight-warning' : 'border-pastel-warning'}`}>
                      <div className="w-4 h-4"></div>
                    </div>
                    <p className={`flex-1 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                      Finalize presentation slides
                    </p>
                    <span className={`text-xs ${darkMode ? 'text-midnight-warning' : 'text-pastel-warning'} font-medium`}>
                      Due in 3 hours
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
