import { useState, useEffect, useCallback } from 'react';
import { Bot, MessageCircle, X } from 'lucide-react';

const AIAssistant = ({ darkMode = false }) => {
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessage, setAIMessage] = useState('');
  const [aiConversation, setAIConversation] = useState([]);
  
  // AI Assistant floating button position state
  const [aiButtonPosition, setAIButtonPosition] = useState(() => {
    // Try to restore saved position, fallback to default
    const saved = localStorage.getItem('aiButtonPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate the saved position is still within bounds
        const maxX = window.innerWidth - 72;
        const maxY = window.innerHeight - 72;
        return {
          x: Math.max(8, Math.min(parsed.x, maxX)),
          y: Math.max(8, Math.min(parsed.y, maxY))
        };
      } catch {
        // Fall through to default if parsing fails
      }
    }
    // Safe initial positioning that works on all screen sizes
    return { x: 24, y: Math.max(window.innerHeight - 100, 100) };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // AI Assistant functions (placeholder)
  const handleAIMessage = async (message) => {
    try {
      // Add user message to conversation
      setAIConversation(prev => [...prev, { role: 'user', content: message }]);
      
      // Placeholder AI response
      const aiResponse = {
        role: 'assistant',
        content: `I'm your AI assistant! You asked: "${message}". This is a placeholder response. I'll help you manage your tasks and schedule once I'm fully implemented.`
      };
      
      // Add AI response after a short delay to simulate processing
      setTimeout(() => {
        setAIConversation(prev => [...prev, aiResponse]);
      }, 1000);
      
      setAIMessage('');
    } catch (error) {
      console.error('AI Assistant error:', error);
    }
  };

  const handleSendAIMessage = () => {
    if (aiMessage.trim()) {
      handleAIMessage(aiMessage.trim());
    }
  };

  // AI Assistant button drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport bounds (with some padding)
    const maxX = window.innerWidth - 72; // 72px = button width + padding
    const maxY = window.innerHeight - 72; // 72px = button height + padding
    
    const newPosition = {
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY))
    };
    
    setAIButtonPosition(newPosition);
    // Save position to localStorage
    localStorage.setItem('aiButtonPosition', JSON.stringify(newPosition));
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    // Small delay to prevent click after drag
    setTimeout(() => setIsDragging(false), 100);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile drag support
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // Constrain to viewport bounds
    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 72;
    
    const newPosition = {
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY))
    };
    
    setAIButtonPosition(newPosition);
    // Save position to localStorage
    localStorage.setItem('aiButtonPosition', JSON.stringify(newPosition));
    e.preventDefault();
  }, [isDragging, dragOffset]);

  const handleTouchEnd = useCallback(() => {
    // Small delay to prevent click after drag
    setTimeout(() => setIsDragging(false), 100);
  }, []);

  // Add global touch event listeners for mobile dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  return (
    <>
      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className={`w-full md:w-full md:max-w-md h-[70vh] md:h-auto md:max-h-[80vh] rounded-t-xl md:rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} flex flex-col`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${darkMode ? 'bg-midnight-primary/20' : 'bg-pastel-primary/20'}`}>
                  <Bot size={20} className={darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} />
                </div>
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                    AI Assistant
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Your productivity helper
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAIAssistant(false)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-midnight-background/50 text-midnight-textSecondary' : 'hover:bg-pastel-background/50 text-pastel-textSecondary'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Conversation Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${darkMode ? 'bg-midnight-background/30' : 'bg-pastel-background/30'}`}>
              {aiConversation.length === 0 ? (
                <div className="text-center py-8">
                  <Bot size={48} className={`mx-auto mb-4 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`} />
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
                    Welcome to AI Assistant!
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
                    Ask me anything about your tasks, schedule, or productivity tips!
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
                      💡 "What are my high priority tasks?"
                    </div>
                    <div className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
                      📅 "Help me organize my schedule"
                    </div>
                    <div className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'}`}>
                      ⚡ "Give me productivity tips"
                    </div>
                  </div>
                </div>
              ) : (
                aiConversation.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'
                        : darkMode ? 'bg-midnight-card border border-midnight-shadow' : 'bg-pastel-card border border-pastel-shadow'
                    }`}>
                      <div className={`text-sm ${
                        message.role === 'user' 
                          ? 'text-white' 
                          : darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Input Area */}
            <div className={`p-4 border-t ${darkMode ? 'border-midnight-shadow' : 'border-pastel-shadow'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAIMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendAIMessage()}
                  placeholder="Ask me anything..."
                  className={`flex-1 p-3 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary placeholder-midnight-textSecondary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary placeholder-pastel-textSecondary'}`}
                />
                <button 
                  onClick={handleSendAIMessage}
                  disabled={!aiMessage.trim()}
                  className={`px-4 py-3 rounded-lg ${
                    aiMessage.trim() 
                      ? darkMode ? 'bg-midnight-primary text-white hover:bg-midnight-primary/90' : 'bg-pastel-primary text-white hover:bg-pastel-primary/90'
                      : darkMode ? 'bg-midnight-background/50 text-midnight-textSecondary' : 'bg-pastel-background/50 text-pastel-textSecondary'
                  }`}
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating AI Assistant Button */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          // Only open modal if we're not dragging
          if (!isDragging) {
            setShowAIAssistant(true);
          }
        }}
        style={{
          left: `${aiButtonPosition.x}px`,
          top: `${aiButtonPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        className={`fixed p-4 rounded-full shadow-lg z-40 transition-all duration-200 ${
          isDragging ? 'scale-110' : 'hover:scale-110'
        } ${
          darkMode 
            ? 'bg-midnight-primary text-white hover:bg-midnight-primary/90' 
            : 'bg-pastel-primary text-white hover:bg-pastel-primary/90'
        }`}
        title={isDragging ? 'Drag to reposition' : 'AI Assistant - Click to open, drag to move'}
      >
        <Bot size={24} />
        
        {/* Visual indicator that button is draggable */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          darkMode ? 'bg-midnight-accent' : 'bg-pastel-accent'
        } opacity-60`} />
      </button>
    </>
  );
};

export default AIAssistant;