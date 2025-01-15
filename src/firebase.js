// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";  // Import getStorage for Firebase storage
// Remove the unused analytics import if it's not needed
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-3ZayT8SjQSbJNcTJms1aTFDb1YbcGIA",
  authDomain: "mindmapwebsitepdf.firebaseapp.com",
  projectId: "mindmapwebsitepdf",
  storageBucket: "mindmapwebsitepdf.appspot.com",
  messagingSenderId: "1062809488800",
  appId: "1:1062809488800:web:883c2da2315b7aca9768c5",
  measurementId: "G-QY57RSDL7M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);  // Initialize Firebase storage

// Export the storage for use in other files
export { storage };
