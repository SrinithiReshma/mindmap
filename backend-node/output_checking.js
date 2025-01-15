const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../backend/serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'mindmapwebsitepdf.appspot.com' // Your Firebase Storage bucket name
});

// Function to download a specified file from Firebase Storage
async function downloadFile(filePath, destination) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    try {
        await file.download({ destination }); // Download the file to the specified destination
        console.log(`Downloaded ${filePath} to ${destination}`);
    } catch (error) {
        console.error(`Error downloading file ${filePath}:`, error);
    }
}

// Example usage
const filePath = 'mindmap/mind_map.png'; // Specify the file path in Firebase Storage
const destination = path.join('C:/Users/Ritika/Downloads', 'downloaded_mind_map.png'); // Local path to save the image
downloadFile(filePath, destination);


