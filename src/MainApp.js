import React, { useState } from "react";
import { Box, MenuItem, Select, InputLabel, FormControl, Button, TextField, Card, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from 'axios';
import { getStorage, ref, getDownloadURL } from "firebase/storage";


function MainApp() {
  const [inputType, setInputType] = useState("pdf");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);  // Loading state
  const [errorMessage, setErrorMessage] = useState("");  // Error message
  const [message, setMessage] = useState('');
  const [showUrlButton, setShowUrlButton] = useState(false); 
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [showSummaryButton, setShowSummaryButton] = useState(false); 
  const [loadingComment, setLoadingComment] = useState("");
  const [summary,setSummary] = useState(`Welcome to MindMesh.

Features:
    - Upload PDFs, images, URLs or text files.
    - Generate summaries with ease.
    - Create mind maps from summarized content.

Instructions:
    1. Choose your input method.
    2. Upload your file or enter a URL.
    3. Click 'Generate Summary' to view a concise description.
    4. Draw and download the mind map of your summary.` );

  const handleInputChange = (event) => {
    setInputType(event.target.value);
    setFile(null);
    setUrl("");
    setPreview("");
    setErrorMessage("");  // Reset error message
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setErrorMessage("");  // Reset error message

    if (inputType === "image") {
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreview(imageUrl);
    } else if (inputType === "txt") {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsText(selectedFile);
    } else if (inputType === "pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview("PDF file uploaded: " + selectedFile.name);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setPreview(event.target.value);
    setErrorMessage("");  // Reset error message
  };

  const handleGenerate = async () => {
    setLoading(true);  // Set loading state
    setLoadingComment("⏳ Loading your data...");
    setErrorMessage("");  // Reset error message

    try {
      if (inputType === "pdf" && file) {
        const formData = new FormData();
        formData.append("pdf", file);
        await axios.post("http://localhost:5000/upload-pdf", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(`PDF file "${file.name}" uploaded successfully.`);
        setOpenDialog(true);

      } else if (inputType === "url" && url) {
        const response = await axios.post("http://localhost:5000/scrape", { url });
        const blob = new Blob([response.data], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        //link.download = "scraped_data.txt";
        link.click();
        setMessage("URL data scraped and downloaded successfully.");
        setOpenDialog(true);
      } else if (inputType === "image" && file) {
        const formData = new FormData();
        formData.append("image", file);
        await axios.post("http://localhost:5000/extract-text", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(`Image "${file.name}" uploaded successfully.`);
        setOpenDialog(true); 

      } else if (inputType === "txt" && file) {
        const formData = new FormData();
        formData.append("txt", file);
        await axios.post("http://localhost:5000/upload-txt", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(`Text file "${file.name}" uploaded successfully.`);
        setOpenDialog(true); 
      } else {
        setMessage("Please upload a file or enter a URL.");
        setOpenDialog(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to process your request. Please try again.");
    } finally {
      setLoading(false);  // Reset loading state
      setInputType("");  // Reset input type
      setFile(null);  // Reset file
      setUrl("");  // Reset URL
      setPreview("");  // Reset preview
    }
  };

  
  const handleCreate = async () => {
    setLoading(true);  // Set loading state
    setLoadingComment("💭 Pondering Over It...");
    setErrorMessage("");  // Reset error message

    try {
        const response = await axios.post("http://localhost:5000/run-process-file");
        setSummary(response.data);
         // Show success message or output
        setShowSummaryButton(true);

    } catch (error) {
        console.error("Error:", error);
        setErrorMessage("Failed to run the process. Please try again.");
    } finally {
        setLoading(false);  // Reset loading state
    }
};


const handleDrawMindMap = async () => {
  setLoading(true);
  setLoadingComment("🚀 Taking Off...");
  setErrorMessage("");

  try {
    const response = await axios.post("http://localhost:5000/generate-mind-map");
    setMessage(`Mind map created.Click view Mind map to view it`);
    setOpenDialog(true); 
    setShowUrlButton(true);
    setShowDownloadButton(true);
  } catch (error) {
    console.error("Error:", error);
    setErrorMessage("Failed to generate mind map. Please try again.");
  } finally {
    setLoading(false);
  }
};

/*const handleViewSummary = async () => {
  setLoading(true);
  setErrorMessage("");

  try {
    const response = await axios.get("http://localhost:5000/get-summary");
    setSummary(response.data);
    // You can remove the alert line to avoid popups
  } catch (error) {
    console.error("Error:", error);
    setErrorMessage("Failed to retrieve summary. Please try again.");
  } finally {
    setLoading(false);
  }
};*/

// Call this function on the appropriate event, like onClick
const handleCloseDialog = () => {
  setOpenDialog(false);  // Close the dialog
};


return (
  <>
    <header className="header">
      <h1 className="logo">MindMesh</h1>
    </header>
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        minHeight: '100vh', 
        padding: 14, 
        maxWidth: 1800, 
        margin: 'auto' ,
        gap: 14
      }}
    >
      <Card 
        variant="outlined" 
        sx={{ 
          padding: 7,
          borderRadius: 4, 
          boxShadow: 2,
          width: '100%',
          flex: 1, // Adjust to fill the space
          mr: 2 // Margin to the right
        }}
      >
         
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
          <Button 
            variant={inputType === "pdf" ? "contained" : "outlined"} 
            color="secondary" 
            onClick={() => setInputType("pdf")}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' ,minWidth: '40px',minHeight: '20px',fontSize: '14px',textTransform: 'none', fontFamily: 'Poppins, sans-serif'}}
          >
            <img 
              src={require('./images/pd.png')} // Replace with the correct path to your image
              alt="PDF"
              style={{ width: '40px', height: '40px', marginBottom: '5px' }} // Style the image
            />
            PDF
          </Button>
          <Button 
            variant={inputType === "url" ? "contained" : "outlined"} 
            color="secondary" 
            onClick={() => setInputType("url")}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',fontSize: '14px',textTransform: 'none', fontFamily: 'Poppins, sans-serif' }}
          >
            <img 
              src={require('./images/search-engine.png')} // Replace with the correct path to your image
              alt="PDF"
              style={{ width: '40px', height: '40px', marginBottom: '5px' }} // Style the image
            />
            URL
          </Button>
          <Button 
            variant={inputType === "image" ? "contained" : "outlined"} 
            color="secondary" 
            onClick={() => setInputType("image")}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',fontSize: '14px' ,textTransform: 'none', fontFamily: 'Poppins, sans-serif'}} 
          >
            <img 
              src={require('./images/image-file.png')} // Replace with the correct path to your image
              alt="PDF"
              style={{ width: '40px', height: '40px', marginBottom: '5px' }} // Style the image
            />
            Image
          </Button>
          <Button 
            variant={inputType === "txt" ? "contained" : "outlined"} 
            color="secondary" 
            onClick={() => setInputType("txt")}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',fontSize: '14px',textTransform: 'none', fontFamily: 'Poppins, sans-serif' }} 
          >
             <img 
              src={require('./images/image.png')} // Replace with the correct path to your image
              alt="PDF"
              style={{ width: '40px', height: '40px', marginBottom: '5px' }} // Style the image
            />
            Text
          </Button>
        </Box>

        {inputType === "url" && (
          <Box>
            <TextField 
              label="Enter Website URL" 
              variant="outlined" 
              fullWidth 
              value={url} 
              onChange={handleUrlChange} 
              placeholder="https://example.com" 
              sx={{ mb: 2 }} 
            />
            {url && <Typography>URL Entered: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></Typography>}
          </Box>
        )}

        {inputType === "image" && (
          <Box>
            <input accept="image/*" type="file" onChange={handleFileChange} style={{ margin: '10px 0' }} />
            {preview && <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto' }} />}
          </Box>
        )}

        {inputType === "pdf" && (
          <Box>
            <input accept="application/pdf" type="file" onChange={handleFileChange} style={{ margin: '10px 0' }} />
            {preview && <Typography>{preview}</Typography>}
          </Box>
        )}

        {inputType === "txt" && (
          <Box>
            <input accept=".txt" type="file" onChange={handleFileChange} style={{ margin: '10px 0' }} />
            {preview && <Typography>File Preview: {preview}</Typography>}
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          <Button variant="outlined" color="secondary" fullWidth onClick={handleGenerate} >
            Load Data
          </Button>
      
          <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} onClick={handleCreate}>
            Generate Summary
          </Button>
          
          <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} onClick={handleDrawMindMap} >
            Draw Mind Map
          </Button>
          {showUrlButton && (
            <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} href="https://firebasestorage.googleapis.com/v0/b/mindmapwebsitepdf.appspot.com/o/mindmap%2Fmind_map.png?alt=media&token=f9d85688-56e2-4150-b081-53731fbabd96" target="_blank">
              View Mind Map
            </Button>
          )}
          
        </Box>
        {loading && <Typography sx={{ mt: 2}}>{loadingComment}</Typography>}
      </Card>

      {/* Summary Section */}
      <Card 
        variant="outlined" 
        sx={{ 
          width: 'auto',         // Auto width to expand based on content
          maxWidth: '2200px',    // Set a maximum width if needed
          padding: 7, 
          borderRadius: 4, 
          boxShadow: 2,
          overflowX: 'auto',     // Enable horizontal scrolling
          overflowY: 'hidden',   // Disable vertical scrolling
          flex: 1,               // Adjust to fill the space
          whiteSpace: 'nowrap',  // Prevent text from wrapping, forcing horizontal scroll
        }}
      >
        <Typography variant="h4" gutterBottom>
          Summary
        </Typography>
        <pre>{summary}</pre>
        
      </Card>
      <Dialog
  open={openDialog}
  onClose={handleCloseDialog}
  PaperProps={{
    sx: {
      borderRadius: 4, // Rounded corners
      padding: 3, // Adds padding for spacing
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)', // Elegant shadow
      maxWidth: '500px', // Set max width
      backgroundColor: '#f4f6f8', // Light background color
      transition: 'all 0.3s ease-in-out', // Smooth transition
    },
  }}
  TransitionProps={{
    onEnter: () => console.log('Entering...'),
  }}
>
  <DialogTitle sx={{ 
    textAlign: 'center', 
    fontSize: '1.5rem', 
    fontWeight: '600', 
    color: '#333',
    paddingBottom: '0.5rem',
    fontFamily: 'Poppins'
  }}>
    🎉 Mission Accomplished!
  </DialogTitle>

  <DialogContent>
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '1.1rem',
          color: '#666',
          fontFamily: 'Poppins'
        }}
      >
        {message}
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions
    sx={{
      justifyContent: 'center', // Centers the button horizontally
    }}
  >
    <Button
      onClick={handleCloseDialog}
      sx={{
        backgroundColor: '#1976d2', // Primary color
        color: '#fff', // White text
        borderRadius: '20px', // Rounded button
        padding: '0.5rem 1.5rem',
        '&:hover': {
          backgroundColor: '#1565c0', // Darker blue on hover
        },
        fontSize: '1rem', // Make text larger
        textTransform: 'none', // Keep button text normal
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', // Button shadow
      }}
    >
      OK
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  </>
);
}

export default MainApp;