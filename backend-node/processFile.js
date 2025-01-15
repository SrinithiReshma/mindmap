//processFile.js
const admin = require('firebase-admin');
const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const { exec } = require('child_process'); 

console.log("processFile.js running");

// Initialize Firebase Admin SDK
const serviceAccount = require('../backend/serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'mindmapwebsitepdf.appspot.com' // Your Firebase Storage bucket name
});

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI("AIzaSyCbzwmZgzmrz_YajlMLXOhTc-GvVo6FfYI");

// Function to get the latest file from Firebase Storage
async function getLatestFileFromFirebase() {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles();

    if (files.length === 0) {
        throw new Error('No files found in Firebase Storage');
    }

    const sortedFiles = files.sort((a, b) => new Date(b.metadata.timeCreated) - new Date(a.metadata.timeCreated));
    console.log(`Latest file found: ${sortedFiles[0].name}`);
    return sortedFiles[0]; // Return the latest file object
}

// Function to download the latest file from Firebase as a buffer
async function downloadFileAsBuffer(latestFile) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(latestFile.name);
    const [fileBuffer] = await file.download();
    return fileBuffer; // Return the file buffer
}

// Function to extract text from a PDF buffer
async function extractTextFromPDFBuffer(pdfBuffer) {
    const data = await pdf(pdfBuffer);
    return data.text; // Extracted text from PDF
}

// Function to extract text from a text file buffer with encoding detection
async function extractTextFromTxtBuffer(txtBuffer) {
    // Detect encoding of the buffer
    const detectedEncoding = chardet.detect(txtBuffer);
    console.log(`Detected encoding: ${detectedEncoding}`);

    
    try {
        // Convert the buffer to a string using the detected encoding, or fallback to 'utf-8'
        const encoding = detectedEncoding || 'utf-8';
        const text = iconv.decode(txtBuffer, encoding);
        return text;
    } catch (error) {
        console.error("Error reading text from txt buffer:", error);
        throw new Error("Failed to read text from txt buffer.");
    }
}

// Function to generate a hierarchical summary using Google Generative AI
async function generateSummary(text, retries = 3, delay = 5000) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    for (let attempt = 1; attempt <= retries; attempt++) {
    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Provide a detailed summary of the paragraphs  that is structured in a hierarchical format. Break down the information as much as possible into multiple levels of subtopics. Use indentation to represent the levels, ensuring that The top level contains main headings with no indentation.Each subheading should be indented with 2 spaces, and further breakdowns should be indented 4 spaces, 6 spaces, and so on.Continue breaking down topics into smaller subtopics where applicable let the  main heading be in all upercase.dontuse any numbers to represent the points use only indentation.give as many level of indentation as possible.even if there is comma if it can be indentended again then that also indententt it to a meaning full one.if possible to indent till a getting a word then indent it also .give the detailed summary withsimple sentence containg 5 or 6 words.give manysubheading.give with atleast 5 level of indentation.give in such way that the one level of indentation's is related to the its parent indentation.dont giverandomlevel of indentation.give sub heading in one level and its content in next level of indentation.it is very important to have atleast 7 level of indentation(if more than 2 paragraph) .breakdown sentence in a such a way that there should not be more than 3 words in a sentence.dont provide separete section for summary:: ${text}`

                        }
                    ]
                }
            ]
        });

        // Save the summary directly to Firebase Storage
        const summaryPath = 'summary/summary.txt';
        const bucket = admin.storage().bucket();
        const file = bucket.file(summaryPath);

        await file.save(result.response.text(), {
            metadata: {
                contentType: 'text/plain'
            }
        });

        console.log('Summary saved to Firebase Storage at summary/summary.txt');
        return summaryPath; // Return the path of the summary in Firebase
    } catch (error) {
        {
            if (error.status === 503 && attempt < retries) {
                console.log(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
            }else {
        console.error("Error generating summary:", error);
        throw new Error('Failed to generate summary.');}
    }
}}}

// Function to clean the generated summary text
async function cleanSummaryText(summaryPath) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(summaryPath);
    
    const [data] = await file.download(); // Download summary content from Firebase
    const cleanedData = data.toString().replace(/[*#]/g, '').trim(); // Clean the data

    // Write the cleaned text to Firebase Storage
    const cleanedSummaryPath = 'process/cleaned_summary.txt';
    const cleanedFile = bucket.file(cleanedSummaryPath);

    await cleanedFile.save(cleanedData, {
        metadata: {
            contentType: 'text/plain'
        }
    });

    console.log(`Cleaned summary uploaded to Firebase Storage at ${cleanedSummaryPath}`);

    const localCleanedSummaryPath = path.join(__dirname, 'cleaned_summary.txt');
    fs.writeFileSync(localCleanedSummaryPath, cleanedData);
    console.log(`Cleaned summary saved locally at ${localCleanedSummaryPath}`);
    //await runMindMapScript();

}
//not using currently
/*async function runMindMapScript() {
    return new Promise((resolve, reject) => {
        console.log('Executing runMindMapScript...');
        exec('node run_mindmap.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing run_mindmap.js: ${error.message}`);
                return reject(new Error(`Failed to run run_mindmap.js: ${stderr}`));
            }
            if (stderr) {
                console.error(`run_mindmap.js stderr: ${stderr}`);
            }
            console.log(`run_mindmap.js output: ${stdout}`);
            resolve(stdout);
        });
    });
}*/

// Main function to process the file (PDF or TXT) and generate a summary
async function main() {
    try {
        const latestFile = await getLatestFileFromFirebase();
        const fileExtension = path.extname(latestFile.name);

        let extractedText;
        const fileBuffer = await downloadFileAsBuffer(latestFile); // Get file as buffer

        if (fileExtension === '.pdf') {
            // If the file is a PDF, extract text from the PDF buffer
            extractedText = await extractTextFromPDFBuffer(fileBuffer);
        } else if (fileExtension === '.txt') {
            // If the file is a text file, read the text content directly
            extractedText = await extractTextFromTxtBuffer(fileBuffer);
        } else {
            throw new Error('Unsupported file type. Only PDF and TXT files are supported.');
        }

        // Generate a summary from the extracted text and save it to Firebase
        const summaryPath = await generateSummary(extractedText);

        // Clean the generated summary text and upload it to Firebase
        await cleanSummaryText(summaryPath);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Run the main function
main();