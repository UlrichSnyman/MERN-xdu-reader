const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const Work = require('../models/Work');
const Page = require('../models/Page');
const Lore = require('../models/Lore');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload and process PDF
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { title, destination, synopsis, category } = req.body;
    
    if (!title || !destination) {
      return res.status(400).json({ error: 'Title and destination are required' });
    }

    if (!['library', 'lore'].includes(destination)) {
      return res.status(400).json({ error: 'Destination must be either "library" or "lore"' });
    }

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Clean the extracted text to remove page numbers and improve formatting
    const cleanText = (text) => {
      return text
        // Remove standalone page numbers (e.g., "1", "2", "Page 1", etc.)
        .replace(/^\s*(\d+|Page\s+\d+)\s*$/gm, '')
        // Remove page headers/footers that are repeated
        .replace(/\n\s*\d+\s*\n/g, '\n')
        // Remove excessive whitespace but preserve paragraph breaks
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove leading/trailing whitespace from each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Remove empty lines at start and end
        .trim();
    };

    const cleanedText = cleanText(pdfData.text);

    let result;

    if (destination === 'lore') {
      // Create lore entry
      const lore = new Lore({
        title,
        content: cleanedText,
        category: category || 'general'
      });
      
      await lore.save();
      result = { type: 'lore', data: lore };
    } else {
      // Create work with pages
      const work = new Work({
        title,
        synopsis: synopsis || `Extracted from PDF: ${req.file.originalname}`,
        category: 'library'
      });
      
      await work.save();

      // Split content into pages (roughly 3500 characters per page, cut at word boundaries)
      const pageSize = 3500;
      const content = cleanedText;
      
      const pages = [];
      let currentIndex = 0;
      let pageNumber = 1;
      
      while (currentIndex < content.length) {
        let endIndex = Math.min(currentIndex + pageSize, content.length);
        
        // If we're not at the end of content, find the nearest word boundary
        if (endIndex < content.length) {
          // Look backwards from endIndex to find the last space, period, or newline
          const lookbackDistance = Math.min(200, pageSize * 0.1); // Don't look back more than 200 chars or 10% of page size
          const searchStart = Math.max(currentIndex + pageSize - lookbackDistance, currentIndex);
          
          for (let i = endIndex; i >= searchStart; i--) {
            const char = content[i];
            if (char === ' ' || char === '\n' || char === '.' || char === '!' || char === '?') {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        const pageContent = content.substring(currentIndex, endIndex).trim();
        
        if (pageContent.length > 0) {
          const page = new Page({
            title: `${title} - Page ${pageNumber}`,
            content: pageContent,
            work: work._id,
            pageNumber: pageNumber
          });
          
          await page.save();
          work.pages.push(page._id);
          pages.push(page);
          pageNumber++;
        }
        
        currentIndex = endIndex;
      }
      
      await work.save();
      result = { type: 'work', data: work, pages: pages.length };
    }

    res.status(201).json({
      message: 'PDF processed successfully',
      result
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Server error while processing PDF' });
  }
};

module.exports = {
  upload,
  uploadPDF
};