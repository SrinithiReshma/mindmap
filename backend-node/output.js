// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.resolve(__dirname, '../backend/serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mindmapwebsitepdf.appspot.com'  // Your Firebase Storage bucket name
});

// Function to print the content of a specified file in Firebase Storage
async function printFileContent(filePath) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  try {
    const contents = await file.download(); // Download the file content as a Buffer
    console.log(`Content of ${filePath}:`);
    console.log(contents.toString('utf-8')); // Convert Buffer to string and print it
  } catch (error) {
    console.error(`Error downloading file ${filePath}:`, error);
  }
}

// Example usage
(async () => {
  const filePath = 'process/cleaned_summary.txt';  // Specify the file path in Firebase Storage
  await printFileContent(filePath);
})();
