import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from "firebase/firestore";
import { db, auth } from "../firebase";

// Function to clean up duplicate timetable events
export const cleanupDuplicateTimetableEvents = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be signed in to clean up data");
    return;
  }

  try {
    console.log("Starting cleanup of duplicate timetable events...");
    
    // Get all timetable events for the current user
    const q = query(
      collection(db, "timetableEvents"),
      where("userId", "==", currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const events = [];
    const duplicateIds = [];
    const seenTitles = new Map(); // Track by title + day + startTime combination
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const uniqueKey = `${data.title}-${data.day}-${data.startTime}`;
      
      if (seenTitles.has(uniqueKey)) {
        // This is a duplicate
        duplicateIds.push(doc.id);
        console.log(`Found duplicate: ${data.title} on ${data.day} at ${data.startTime}`);
      } else {
        seenTitles.set(uniqueKey, doc.id);
        events.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${events.length} unique events and ${duplicateIds.length} duplicates`);
    
    // Delete duplicates
    for (const duplicateId of duplicateIds) {
      await deleteDoc(doc(db, "timetableEvents", duplicateId));
      console.log(`Deleted duplicate event: ${duplicateId}`);
    }
    
    console.log("Cleanup completed!");
    return { 
      unique: events.length, 
      deleted: duplicateIds.length 
    };
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
};

// Function to clean up duplicate tasks (including timetable-derived ones)
export const cleanupDuplicateTasks = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be signed in to clean up data");
    return;
  }

  try {
    console.log("Starting cleanup of duplicate tasks...");
    
    // Get all tasks for the current user
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = [];
    const duplicateIds = [];
    const seenTasks = new Map(); // Track by title + dueDate + dueTime
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const uniqueKey = `${data.title}-${data.dueDate}-${data.dueTime}-${data.source}`;
      
      if (seenTasks.has(uniqueKey)) {
        // This is a duplicate
        duplicateIds.push(doc.id);
        console.log(`Found duplicate task: ${data.title} on ${data.dueDate}`);
      } else {
        seenTasks.set(uniqueKey, doc.id);
        tasks.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${tasks.length} unique tasks and ${duplicateIds.length} duplicates`);
    
    // Delete duplicates
    for (const duplicateId of duplicateIds) {
      await deleteDoc(doc(db, "tasks", duplicateId));
      console.log(`Deleted duplicate task: ${duplicateId}`);
    }
    
    console.log("Task cleanup completed!");
    return { 
      unique: tasks.length, 
      deleted: duplicateIds.length 
    };
    
  } catch (error) {        console.error("Error during task cleanup:", error);
    throw error;
  }
};

// Function to delete ALL timetable events (nuclear option)
export const deleteAllTimetableEvents = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be signed in to delete data");
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete ALL your timetable events? This cannot be undone!"
  );
  
  if (!confirmDelete) return;

  try {
    console.log("Deleting ALL timetable events...");
    
    const q = query(
      collection(db, "timetableEvents"),
      where("userId", "==", currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    let deleteCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, "timetableEvents", docSnapshot.id));
      deleteCount++;
    }
    
    console.log(`Deleted ${deleteCount} timetable events`);
    return deleteCount;
    
  } catch (error) {
    console.error("Error deleting all events:", error);
    throw error;
  }
};