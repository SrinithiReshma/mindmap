import firebase_admin
from firebase_admin import credentials, storage

# Initialize Firebase Admin SDK
cred = credentials.Certificate('../backend/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'mindmapwebsitepdf.appspot.com'  # Your Firebase Storage bucket name
})

# Function to get the content of a specified file in Firebase Storage
def get_file_content(file_path):
    bucket = storage.bucket()
    blob = bucket.blob(file_path)

    try:
        content = blob.download_as_text()  # Download the file content as text
        return content  # Return the content instead of printing it
    except Exception as error:
        return f'Error downloading file {file_path}: {error}'

# Example usage
if __name__ == '__main__':
    file_path = 'process/cleaned_summary.txt'  # Specify the file path in Firebase Storage
    content = get_file_content(file_path)
    print(content)  # This line can be removed if you don't want any output in console
