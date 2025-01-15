import subprocess
from flask import Flask, request, jsonify,Response
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import logging
import firebase_admin
from firebase_admin import credentials, storage
import io
from PIL import Image
import pytesseract
import subprocess
import sys
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Firebase Admin SDK setup
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'mindmapwebsitepdf.appspot.com'
})

# Set up Tesseract command path
pytesseract.pytesseract.tesseract_cmd = r'D:\tesseract-ocr\tesseract.exe'  # Update this path if needed

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Send a request to the URL
        response = requests.get(url)

        # Check if the request was successful
        if response.status_code != 200:
            return jsonify({"error": "Failed to retrieve the webpage"}), 400
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'lxml')

        # Extract data (example: all paragraphs)
        scraped_data = []
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)  # Ensure we get the text cleanly
            if text:  # Avoid adding empty strings
                scraped_data.append(text)

        # Create an in-memory byte stream
        file_stream = io.BytesIO()
        file_stream.write('\n\n'.join(scraped_data).encode('utf-8'))
        file_stream.seek(0)  # Reset stream position to the beginning

        # Upload the file to Firebase Storage in the "scraped" folder
        bucket = storage.bucket()
        blob = bucket.blob('scraped/scraped_data.txt')
        blob.upload_from_file(file_stream, content_type='text/plain; charset=utf-8')

        return jsonify({"message": "File uploaded successfully to Firebase Storage."}), 200

    except Exception as e:
        logging.error(f"Error occurred: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/extract-text', methods=['POST'])
def extract_text():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    try:
        # Get the image file from the request
        image_file = request.files['image']
        img = Image.open(image_file.stream)  # Open the image from the file stream
        
        # Perform OCR on the image
        text = pytesseract.image_to_string(img)
        
        # Create an in-memory byte stream for the text file
        file_stream = io.BytesIO()
        file_stream.write(text.encode('utf-8'))
        file_stream.seek(0)

        # Upload the extracted text to Firebase Storage in the "extracted" folder
        bucket = storage.bucket()
        blob = bucket.blob('extracted/extracted_text.txt')
        blob.upload_from_file(file_stream, content_type='text/plain; charset=utf-8')

        return jsonify({"message": "Extracted text uploaded successfully to Firebase Storage."}), 200

    except Exception as e:
        logging.error(f"Error occurred during OCR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    try:
        # Get the PDF file from the request
        pdf_file = request.files['pdf']
        
        # Upload the PDF file to Firebase Storage in the "pdf" folder
        bucket = storage.bucket()
        blob = bucket.blob(f'pdf/{pdf_file.filename}')
        blob.upload_from_file(pdf_file, content_type='application/pdf')

        return jsonify({"message": f"PDF file '{pdf_file.filename}' uploaded successfully to Firebase Storage."}), 200

    except Exception as e:
        logging.error(f"Error occurred while uploading PDF: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload-txt', methods=['POST'])
def upload_txt():
    if 'txt' not in request.files:
        return jsonify({"error": "No TXT file provided"}), 400

    try:
        # Get the TXT file from the request
        txt_file = request.files['txt']
        
        # Upload the TXT file to Firebase Storage in the "txt" folder
        bucket = storage.bucket()
        blob = bucket.blob(f'txt/{txt_file.filename}')
        blob.upload_from_file(txt_file, content_type='text/plain')

        return jsonify({"message": f"TXT file '{txt_file.filename}' uploaded successfully to Firebase Storage."}), 200

    except Exception as e:
        logging.error(f"Error occurred while uploading TXT: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/run-process-file', methods=['POST'])
def run_process_file():
    bucket = storage.bucket()
    file_path = 'process/cleaned_summary.txt'
    blob = bucket.blob(file_path)
    try:
        # Define the path to your script
        script_path = r'D:\import-file-app-new\import-file-app\backend-node\processFile.js'

        # Execute the script using subprocess
        result = subprocess.run(['node', script_path], capture_output=True, text=True)

        # Check for errors
        if result.returncode != 0:
            logging.error(f"Error executing processFile.js: {result.stderr}")
            return jsonify({"error": f"Failed to run processFile.js: {result.stderr}"}), 500
        
        summary_content = blob.download_as_text()
        
        return Response(summary_content, mimetype='text/plain')

    except Exception as e:
        logging.error(f"Error occurred while executing processFile.js: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/generate-mind-map', methods=['POST'])
def generate_mind_map():
    try:
        script_path = r'D:\import-file-app-new\import-file-app\backend-node\generate_mind_map.py'
        # Call the generate_mind_map.py script
        result = subprocess.run(['python', script_path], capture_output=True, text=True)

        # Check if the script ran successfully
        if result.returncode != 0:
            logging.error(f"Error running generate_mind_map.py: {result.stderr}")
            return jsonify({"error": "Error running generate_mind_map.py: " + result.stderr}), 500
        
        

        return jsonify({"message": "Mind map generated and uploaded successfully!"}), 200

    except Exception as e:
        logging.error(f"Error in generate_mind_map: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/get-summary', methods=['GET'])
def get_summary():

    bucket = storage.bucket()
    file_path = 'process/cleaned_summary.txt'
    blob = bucket.blob(file_path)
    try:
        # Specify the path to the cleaned_summary.txt file
    
        
        summary_content = blob.download_as_text()
        
        return Response(summary_content, mimetype='text/plain') 
    
    except Exception as e:
        logging.error(f"Error reading summary file: {e}")
        return jsonify({"error": "Failed to read summary file."}), 500

    

    
    
@app.route('/download-mind-map', methods=['POST'])
def download_mind_map():
    bucket = storage.bucket()
    file_path = 'mindmap/mind_map.png'
    destination = os.path.join('C:/Users/Ritika/Downloads', 'downloaded_mind_map.png')
    blob = bucket.blob(file_path)

    try:
        blob.download_to_filename(destination)  # Download the file to the specified destination
        return jsonify({"message": "Mind map downloaded"}), 200
    except Exception as e:
        print(f'Error downloading file {file_path}: {e}')
    

if __name__ == '__main__':
    app.run(debug=True)