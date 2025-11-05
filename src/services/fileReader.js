import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (dataUrl) => {
  try {
    const pdf = await pdfjsLib.getDocument(dataUrl).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += pageText + '\n\n';
    }
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
};
