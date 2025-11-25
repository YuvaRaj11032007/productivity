import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Dialog, DialogContent, DialogTitle, IconButton, Box, Typography,
  CircularProgress, Drawer, TextField, Button, List, ListItem,
  ListItemText, Paper, Divider, Fab, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import aiService from '../services/aiService';

// Setting the worker path for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const PdfViewer = ({ open, onClose, file }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [fullScreen, setFullScreen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const contentRef = useRef(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{
    sender: 'ai',
    text: 'Hi! I\'m your AI Tutor. Ask me anything about this page!'
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Reset states when file changes
  useEffect(() => {
    if (open) {
      setZoom(1.0);
      setPageNumber(1);
      setMessages([{
        sender: 'ai',
        text: 'Hi! I\'m your AI Tutor. Ask me anything about this page!'
      }]);
    }
  }, [open, file]);

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
    setPdfDocument(pdf);
    setPageNumber(1);
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages));
  };

  const handleZoomIn = () => setZoom(prevZoom => Math.min(prevZoom + 0.2, 3.0));
  const handleZoomOut = () => setZoom(prevZoom => Math.max(prevZoom - 0.2, 0.5));

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // Extract text from current page
      let pageText = '';
      if (pdfDocument) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        pageText = textContent.items.map(item => item.str).join(' ');
      }

      const response = await aiService.generateTutorResponse(
        userMessage,
        pageText,
        file?.name || 'Current Subject'
      );

      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } catch (error) {
      console.error("Tutor error:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error analyzing this page." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth fullScreen={fullScreen} closeAfterTransition={false}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" noWrap sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="span" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: 1, borderRadius: 1, fontSize: '0.8em' }}>PDF</Box>
          {file?.name}
        </Typography>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 1, px: 1, mr: 2 }}>
            <IconButton size="small" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
              <NavigateBeforeIcon />
            </IconButton>
            <Typography variant="body2" sx={{ mx: 1 }}>
              {pageNumber} / {numPages || '--'}
            </Typography>
            <IconButton size="small" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
              <NavigateNextIcon />
            </IconButton>
          </Box>

          <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}><ZoomOutIcon /></IconButton>
          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</Typography>
          <IconButton onClick={handleZoomIn} disabled={zoom >= 3.0}><ZoomInIcon /></IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="AI Tutor">
            <IconButton onClick={() => setChatOpen(!chatOpen)} color={chatOpen ? "primary" : "default"}>
              <SmartToyIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={() => setFullScreen(!fullScreen)}><FullscreenIcon /></IconButton>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <DialogContent ref={contentRef} sx={{ p: 0, bgcolor: 'grey.100', flex: 1, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <Box sx={{ py: 4 }}>
            <Document
              file={file?.path}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<CircularProgress />}
              error={<Typography color="error" sx={{ p: 3 }}>Failed to load PDF.</Typography>}
            >
              <Paper elevation={4}>
                <Page
                  pageNumber={pageNumber}
                  scale={zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Paper>
            </Document>
          </Box>
        </DialogContent>

        {/* AI Tutor Sidebar */}
        <Drawer
          anchor="right"
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          variant="persistent"
          PaperProps={{
            sx: {
              width: 350,
              position: 'absolute',
              top: 0,
              height: '100%',
              borderLeft: 1,
              borderColor: 'divider'
            }
          }}
          sx={{
            width: chatOpen ? 350 : 0,
            flexShrink: 0,
            transition: 'width 0.3s',
            '& .MuiDrawer-paper': { position: 'relative' }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <SmartToyIcon />
              <Typography variant="h6">AI Tutor</Typography>
              <IconButton size="small" onClick={() => setChatOpen(false)} sx={{ ml: 'auto', color: 'inherit' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '85%',
                      bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                      color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2">{msg.text}</Typography>
                  </Paper>
                </Box>
              ))}
              {isTyping && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <CircularProgress size={16} />
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask about this page..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isTyping}
                />
                <IconButton color="primary" onClick={handleSendMessage} disabled={!input.trim() || isTyping}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </Dialog>
  );
};

export default PdfViewer;
