import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

// Setting the worker path for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const PdfViewer = ({ open, onClose, file }) => {
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [fullScreen, setFullScreen] = useState(false);
  const contentRef = useRef(null);

  // Reset states when file changes
  useEffect(() => {
    if (open) {
      setZoom(1.0);
    }
  }, [open, file]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleZoomIn = () => setZoom(prevZoom => Math.min(prevZoom + 0.2, 3.0));
  const handleZoomOut = () => setZoom(prevZoom => Math.max(prevZoom - 0.2, 0.5));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen} closeAfterTransition={false}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" noWrap sx={{ flex: 1 }}>
          {file?.name}
        </Typography>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}><ZoomOutIcon /></IconButton>
          <Typography>{Math.round(zoom * 100)}%</Typography>
          <IconButton onClick={handleZoomIn} disabled={zoom >= 3.0}><ZoomInIcon /></IconButton>
          
          <IconButton onClick={() => setFullScreen(!fullScreen)}><FullscreenIcon /></IconButton>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers ref={contentRef} sx={{ overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <Document
            file={file?.path}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
            error={<Typography color="error">Failed to load PDF.</Typography>}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page 
                key={`page_${index + 1}`}
                pageNumber={index + 1} 
                scale={zoom}
                renderTextLayer={false} // Improves performance
                renderAnnotationLayer={false} // Improves performance
              />
            ))}
          </Document>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewer;
