import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import { db, auth } from "./firebase";

// ========== AUTH FUNCTIONS ==========

// Sign up with email and password
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ========== FIRESTORE TASK FUNCTIONS ==========

// Get all tasks for a user
export const getTasks = async (userId) => {
  try {
    if (!userId) {
      console.error("No user ID provided to getTasks");
      return [];
    }
    
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      orderBy("dueDate", "asc"),
      orderBy("dueTime", "asc")
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      // Format timestamps before returning
      tasks.push(formatTaskTimestamps({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return tasks;
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw error;
  }
};

// Add a new task
export const addTask = async (taskData) => {
  try {
    const userId = getCurrentUser()?.uid;
    if (!userId) throw new Error("User not authenticated");
    
    // Ensure all required fields are present
    const taskWithMeta = {
      ...taskData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "tasks"), taskWithMeta);
    
    // Return the new task with the generated ID
    // Note: serverTimestamp() is null on the client until the write is complete
    // so we replace it with current date for immediate UI updates
    return { 
      id: docRef.id, 
      ...taskWithMeta,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskId, taskData) => {
  try {
    const userId = getCurrentUser()?.uid;
    if (!userId) throw new Error("User not authenticated");
    
    // Always include updatedAt timestamp but don't change createdAt
    const updates = {
      ...taskData,
      updatedAt: serverTimestamp()
    };
    
    // Don't update the userId field for security
    if (updates.userId) {
      delete updates.userId;
    }
    
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, updates);
    
    // Return the updated task with current date for immediate UI updates
    return { 
      id: taskId, 
      ...updates,
      updatedAt: new Date() 
    };
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
    return taskId;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Toggle task completion
export const toggleTaskComplete = async (taskId, isCompleted) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      completed: isCompleted,
      updatedAt: serverTimestamp()
    });
    
    return { id: taskId, completed: isCompleted };
  } catch (error) {
    console.error("Error toggling task completion:", error);
    throw error;
  }
};

// Get tasks by category or filter
// Helper function to convert Firestore timestamps to JS Date objects
export const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp) return null;
  
  // If it's already a JS Date, return it
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp, convert to JS Date
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Otherwise return null
  return null;
};

// Format a task's timestamps (modifies the task object)
export const formatTaskTimestamps = (task) => {
  if (!task) return task;
  
  // Create a new object to avoid mutating the original
  const formattedTask = {...task};
  
  // Convert createdAt and updatedAt if they exist
  if (formattedTask.createdAt) {
    formattedTask.createdAt = formatFirestoreTimestamp(formattedTask.createdAt);
  }
  
  if (formattedTask.updatedAt) {
    formattedTask.updatedAt = formatFirestoreTimestamp(formattedTask.updatedAt);
  }
  
  return formattedTask;
};

export const getFilteredTasks = async (userId, filters = {}) => {
  try {
    let tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    
    // Add filters
    if (filters.status === 'completed') {
      tasksQuery = query(tasksQuery, where("completed", "==", true));
    } else if (filters.status === 'active') {
      tasksQuery = query(tasksQuery, where("completed", "==", false));
    }
    
    if (filters.priority && filters.priority !== 'all') {
      tasksQuery = query(tasksQuery, where("priority", "==", filters.priority));
    }
    
    if (filters.source && filters.source !== 'all') {
      tasksQuery = query(tasksQuery, where("source", "==", filters.source));
    }
    
    if (filters.category && filters.category !== 'all') {
      tasksQuery = query(tasksQuery, where("category", "==", filters.category));
    }
    
    // Always order by due date and time
    tasksQuery = query(tasksQuery, orderBy("dueDate", "asc"), orderBy("dueTime", "asc"));
    
    const querySnapshot = await getDocs(tasksQuery);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      // Format timestamps before returning
      const taskData = doc.data();
      tasks.push(formatTaskTimestamps({
        id: doc.id,
        ...taskData
      }));
    });
    
    return tasks;
  } catch (error) {
    console.error("Error getting filtered tasks:", error);
    throw error;
  }
};