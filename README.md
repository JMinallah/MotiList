# 📝 MotiList - Smart Task & Schedule Management

MotiList is a comprehensive productivity application that combines task management, timetable scheduling, and calendar integration into one seamless experience. Built with React and Firebase, it offers both web and mobile-optimized interfaces for managing your daily activities.

## ✨ Features

### 🎯 **Task Management Dashboard**

- **Smart Task Creation**: Add tasks with priority levels, categories, and due dates
- **Drag & Drop Reordering**: Organize tasks by dragging them into your preferred order
- **Universal Edit/Delete**: Edit and delete tasks from any source (dashboard, timetable, calendar)
- **Advanced Filtering**: Filter by status, priority, source, category, and search terms
- **Progress Tracking**: Visual completion status with progress indicators

### 📅 **Timetable Management**

- **Weekly Schedule View**: Grid-based desktop view and mobile-friendly list view
- **Quick Event Creation**: Just add title and day - times are auto-calculated
- **Visual Color Coding**: Assign colors to different events for easy identification
- **Responsive Design**: Automatically adapts between desktop grid and mobile list views
- **Firebase Sync**: All timetable data synced across devices
- **CSV Import/Export**: Bulk import and export schedule data

### 🗓️ **Calendar Integration**

- **Google Calendar Sync**: Connect with your Google Calendar for seamless integration
- **Local Event Storage**: Create local events that integrate with your task flow
- **Monthly View**: Traditional calendar interface with event visualization
- **Quick Event Addition**: Streamlined forms for fast event creation
- **Cross-Platform Sync**: Events appear in task section for unified management

### 🔄 **Cross-Source Integration**

- **Unified Task View**: All tasks from dashboard, timetable, and calendar in one place
- **Source-Aware Management**: Edit and delete functionality respects original source
- **Consistent UI**: Same drag & drop, edit, and delete experience across all sources
- **Real-Time Updates**: Changes reflect immediately across all views

## 🛠️ **Technology Stack**

- **Frontend**: React 19.1.1 with Vite for fast development
- **Backend**: Firebase Firestore for data persistence
- **Authentication**: Firebase Auth with secure user management
- **Styling**: Tailwind CSS with custom dark/light themes
- **Drag & Drop**: react-dnd library for intuitive task reordering
- **Calendar**: Google Calendar API integration
- **State Management**: React hooks and context for efficient state handling

## 🎨 **Design Features**

### **Responsive Design**

- **Mobile-First**: Optimized for touch interfaces and small screens
- **No Horizontal Scroll**: Everything fits perfectly on mobile devices
- **Adaptive Layouts**: Different views for mobile and desktop experiences
- **Touch-Friendly**: Properly sized buttons and interaction areas

### **Theme Support**

- **Dark Mode**: Elegant dark theme for low-light environments
- **Light Mode**: Clean, bright interface for daytime use
- **Custom Color Palette**: Carefully crafted color schemes for both themes
- **Consistent Branding**: Unified visual language across all components

### **User Experience**

- **Progressive Disclosure**: Advanced options available but not overwhelming
- **Smart Defaults**: Reasonable defaults to speed up data entry
- **Instant Feedback**: Real-time notifications for all actions
- **Keyboard Shortcuts**: Efficient navigation for power users

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 16+
- npm or yarn
- Firebase project with Firestore enabled
- Google Calendar API credentials (for calendar integration)

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/JMinallah/MotiList.git
   cd MotiList
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file with your Firebase and Google API credentials:

   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_API_KEY=your_google_api_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

## 📱 **Usage Guide**

### **Getting Started**

1. **Sign Up**: Create an account or sign in with existing credentials
2. **Add Your First Task**: Use the "+" button to create a task in the dashboard
3. **Create a Schedule**: Switch to timetable view to add weekly recurring events
4. **Connect Calendar**: Link your Google Calendar for comprehensive integration
5. **Organize**: Use drag & drop to arrange tasks in your preferred order

### **Key Workflows**

**Quick Task Creation:**

- Click "+" → Enter title → Select priority → Save (3 seconds)

**Schedule an Event:**

- Go to Timetable → "+" → Enter title and day → Auto-calculated time

**Reorder Tasks:**

- Drag any task by its handle to reposition in your list

**Filter & Search:**

- Use filter bar to show specific task types or search for content

## 🔧 **Configuration**

### **Firebase Setup**

- Enable Firestore Database
- Configure Authentication providers
- Set up security rules for user data isolation

### **Google Calendar Integration**

- Create Google Cloud Project
- Enable Calendar API
- Generate OAuth 2.0 credentials
- Configure authorized domains

## 📂 **Project Structure**

```text
src/
├── components/          # React components
│   ├── dashboard.jsx   # Main task management interface
│   ├── timetable.jsx   # Weekly schedule management
│   ├── calender.jsx    # Calendar integration
│   └── AuthForm.jsx    # Authentication forms
├── context/            # React context providers
│   ├── AuthContext.jsx # Authentication state
│   └── useAuth.jsx     # Auth hook
├── utils/              # Utility functions
│   └── cleanup.js      # Database maintenance
├── firebaseUtils.js    # Firebase operations
└── firebase.js         # Firebase configuration
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **React Team** for the excellent framework
- **Firebase** for robust backend services
- **Tailwind CSS** for utility-first styling
- **Lucide React** for beautiful icons
- **Google Calendar API** for calendar integration

## 📧 **Support**

For support, email [your-email] or create an issue in this repository.

---

**Built with ❤️ by [JMinallah](https://github.com/JMinallah)**
