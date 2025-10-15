import { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle, Clock, Settings, List, Plus } from 'lucide-react';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check user preference from system or localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    // Get the new dark mode state
    const newDarkMode = !darkMode;
    
    // Update the dark mode state
    setDarkMode(newDarkMode);
    
    // Toggle the 'dark' class on the document element
    document.documentElement.classList.toggle('dark');
    
    // Store the preference in localStorage
    localStorage.setItem('darkMode', newDarkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      {/* Header */}
      <header className={`p-4 flex justify-between items-center ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-sm`}>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
          MotiList
        </h1>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-midnight-primary/10 text-midnight-primary' : 'bg-pastel-primary/10 text-pastel-primary'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className={`p-2 rounded-full ${darkMode ? 'bg-midnight-card text-midnight-textSecondary' : 'bg-pastel-card text-pastel-textSecondary'}`}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 pt-8">
        {/* Stats Section */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-midnight-card shadow-md shadow-midnight-shadow' : 'bg-pastel-card shadow-md shadow-pastel-shadow'}`}>
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
      </main>
    </div>
  );
};

export default Dashboard;
