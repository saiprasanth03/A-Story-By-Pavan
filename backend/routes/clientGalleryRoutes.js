import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parse } from 'json2csv';
import { ZipArchive } from 'archiver';
import ClientGallery from '../models/ClientGallery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Initialize Google Drive API
const KEYFILEPATH = path.join(__dirname, '../google-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
let driveAuth = null;
let drive = null;

if (fs.existsSync(KEYFILEPATH)) {
  try {
    driveAuth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });
    drive = google.drive({ version: 'v3', auth: driveAuth });
  } catch (e) {
    console.error('Failed to initialize Google Drive API from google-credentials.json:', e.message);
  }
} else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
  if (rawCreds.startsWith('{')) {
    try {
      const credentials = JSON.parse(rawCreds);
      driveAuth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
      drive = google.drive({ version: 'v3', auth: driveAuth });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  } else {
    console.warn('⚠️ GOOGLE_SERVICE_ACCOUNT_JSON in .env contains a URL instead of Service Account JSON credentials object.');
  }
} else {
  console.warn('⚠️ google-credentials.json or GOOGLE_SERVICE_ACCOUNT_JSON env var not found! Google Drive API features will return configured instructions.');
}

function extractFolderId(link) {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/');
    if (pathParts.includes('folders')) {
      return pathParts[pathParts.indexOf('folders') + 1];
    }
    const idParam = url.searchParams.get('id');
    if (idParam) return idParam;
    return null;
  } catch (err) {
    return null;
  }
}

// Admin: Create Gallery
router.post('/', async (req, res) => {
  try {
    const { clientEmail, clientName, eventName, folderLink } = req.body;
    
    if (!drive) {
      return res.status(500).json({ 
        error: 'Google Drive API is not configured on the server.',
        message: 'Place your Google Service Account JSON file in backend/google-credentials.json OR paste the raw Service Account JSON key string into GOOGLE_SERVICE_ACCOUNT_JSON in backend/.env'
      });
    }

    const folderId = extractFolderId(folderLink);
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder link.' });
    }

    // Fetch images from Drive
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 1000
    });

    const driveFiles = response.data.files;
    if (!driveFiles || driveFiles.length === 0) {
      return res.status(400).json({ error: 'No images found in the provided folder, or the Service Account does not have viewer access.' });
    }

    const images = driveFiles.map(file => ({
      name: file.name,
      driveId: file.id,
      isSelected: false
    }));

    const gallery = new ClientGallery({
      clientEmail: clientEmail.toLowerCase().trim(),
      clientName,
      eventName,
      folderLink,
      images
    });

    await gallery.save();
    res.status(201).json({ message: 'Gallery created successfully!', gallery });
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ error: 'Failed to create gallery. Ensure the service account has access to the folder.' });
  }
});

// Admin: Get all galleries
router.get('/', async (req, res) => {
  try {
    const galleries = await ClientGallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch galleries' });
  }
});

// Admin: Export CSV
router.get('/:id/export', async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    const selectedImages = gallery.images.filter(img => img.isSelected);
    
    if (selectedImages.length === 0) {
      return res.status(400).json({ error: 'No images selected in this gallery' });
    }

    const csvData = selectedImages.map(img => ({ 'Image Name': img.name }));
    const csv = parse(csvData);

    const safeName = (gallery.clientName || 'client').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeEvent = (gallery.eventName || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeName}_${safeEvent}_selections.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csv);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

// Admin: Download ZIP of all selected images grouped by email
router.get('/download-all-selections', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).json({ 
        error: 'Google Drive API is not configured on the server.',
        message: 'Place your Google Service Account JSON file in backend/google-credentials.json OR paste the raw Service Account JSON key string into GOOGLE_SERVICE_ACCOUNT_JSON in backend/.env'
      });
    }

    const galleries = await ClientGallery.find({ status: 'Submitted' });
    
    // Find all selected images across all galleries
    let hasImages = false;
    for (const g of galleries) {
      if (g.images.some(img => img.isSelected)) {
        hasImages = true;
        break;
      }
    }

    if (!hasImages) {
      return res.status(400).json({ error: 'No selected images found across any galleries.' });
    }

    res.header('Content-Type', 'application/zip');
    res.attachment('all_client_selections.zip');

    const archive = new ZipArchive({
      zlib: { level: 9 } // max compression
    });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
    });

    archive.pipe(res);

    for (const gallery of galleries) {
      const selectedImages = gallery.images.filter(img => img.isSelected);
      const safeEmail = gallery.clientEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
      const safeEvent = (gallery.eventName || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();

      for (const img of selectedImages) {
        try {
          const driveResponse = await drive.files.get(
            { fileId: img.driveId, alt: 'media' },
            { responseType: 'stream' }
          );
          
          archive.append(driveResponse.data, { name: `${safeEvent}/${img.name}` });
        } catch (driveErr) {
          console.error(`Failed to fetch image ${img.name} (${img.driveId}) from drive:`, driveErr.message);
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP Export Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate ZIP' });
    }
  }
});

// Admin: Download ZIP of selected images for a specific email
router.get('/download-email/:email', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).json({ 
        error: 'Google Drive API is not configured on the server.',
        message: 'Place your Google Service Account JSON file in backend/google-credentials.json OR paste the raw Service Account JSON key string into GOOGLE_SERVICE_ACCOUNT_JSON in backend/.env'
      });
    }

    const email = req.params.email.toLowerCase().trim();
    const galleries = await ClientGallery.find({ clientEmail: email, status: 'Submitted' });

    let hasImages = false;
    for (const g of galleries) {
      if (g.images.some(img => img.isSelected)) {
        hasImages = true;
        break;
      }
    }

    if (!hasImages) {
      return res.status(400).json({ error: 'No selected images found for this email.' });
    }

    const safeEmail = email.replace(/[^a-zA-Z0-9@.-]/g, '_');
    res.header('Content-Type', 'application/zip');
    res.attachment(`${safeEmail}_selections.zip`);

    const archive = new ZipArchive({
      zlib: { level: 9 }
    });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
    });

    archive.pipe(res);

    for (const gallery of galleries) {
      const selectedImages = gallery.images.filter(img => img.isSelected);
      const safeEvent = (gallery.eventName || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();

      for (const img of selectedImages) {
        try {
          const driveResponse = await drive.files.get(
            { fileId: img.driveId, alt: 'media' },
            { responseType: 'stream' }
          );
          
          archive.append(driveResponse.data, { name: `${safeEvent}/${img.name}` });
        } catch (driveErr) {
          console.error(`Failed to fetch image ${img.name} (${img.driveId}) from drive:`, driveErr.message);
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP Export Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate ZIP' });
    }
  }
});

// Admin: Download ZIP of selected images for a single gallery
router.get('/:id/download-selections', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).json({ 
        error: 'Google Drive API is not configured on the server.',
        message: 'Place your Google Service Account JSON file in backend/google-credentials.json OR paste the raw Service Account JSON key string into GOOGLE_SERVICE_ACCOUNT_JSON in backend/.env'
      });
    }

    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    const selectedImages = gallery.images.filter(img => img.isSelected);
    
    if (selectedImages.length === 0) {
      return res.status(400).json({ error: 'No images selected in this gallery' });
    }

    const safeEvent = (gallery.eventName || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.header('Content-Type', 'application/zip');
    res.attachment(`${safeEvent}_selections.zip`);

    const archive = new ZipArchive({
      zlib: { level: 9 }
    });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
    });

    archive.pipe(res);

    for (const img of selectedImages) {
      try {
        const driveResponse = await drive.files.get(
          { fileId: img.driveId, alt: 'media' },
          { responseType: 'stream' }
        );
        
        archive.append(driveResponse.data, { name: `${safeEvent}/${img.name}` });
      } catch (driveErr) {
        console.error(`Failed to fetch image ${img.name} (${img.driveId}) from drive:`, driveErr.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Single ZIP Export Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate ZIP' });
    }
  }
});

// Admin: Sync images from Google Drive for an existing gallery
router.put('/:id/sync', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).json({ 
        error: 'Google Drive API is not configured on the server.',
        message: 'Place your Google Service Account JSON file in backend/google-credentials.json OR paste the raw Service Account JSON key string into GOOGLE_SERVICE_ACCOUNT_JSON in backend/.env'
      });
    }

    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

    // Optional folderLink override if admin provided a new one
    const folderLink = req.body?.folderLink || gallery.folderLink;
    const folderId = extractFolderId(folderLink);
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder link.' });
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 1000,
    });

    const driveFiles = (response.data.files || []).filter(f => f.mimeType && f.mimeType.startsWith('image/'));
    if (driveFiles.length === 0) {
      return res.status(400).json({ error: 'No images found in the folder or Service Account lacks access.' });
    }

    // Preserve existing isSelected states
    const existingMap = new Map();
    gallery.images.forEach(img => {
      existingMap.set(img.driveId, img.isSelected);
    });

    const updatedImages = driveFiles.map(file => ({
      name: file.name,
      driveId: file.id,
      isSelected: existingMap.has(file.id) ? existingMap.get(file.id) : false,
    }));

    gallery.folderLink = folderLink;
    gallery.images = updatedImages;
    await gallery.save();

    res.json({ message: `Successfully synced ${updatedImages.length} images!`, gallery });
  } catch (error) {
    console.error('Sync error:', error);
    if (error.code === 404) {
      return res.status(404).json({ error: 'Folder not found. Make sure the folder link is correct and shared with the Service Account.' });
    }
    if (error.code === 403) {
      return res.status(403).json({ error: 'Access denied. The Service Account does not have permission to view this folder.' });
    }
    res.status(500).json({ error: 'Failed to sync images from Google Drive folder. ' + (error.message || '') });
  }
});

// Admin: Delete gallery
router.delete('/:id', async (req, res) => {
  try {
    await ClientGallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gallery deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery' });
  }
});

// Admin: Update gallery
router.put('/:id', async (req, res) => {
  try {
    const gallery = await ClientGallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update gallery' });
  }
});

// Client: Verify email and get assigned galleries
router.post('/verify', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const galleries = await ClientGallery.find({ clientEmail: email.toLowerCase().trim() }).sort({ createdAt: -1 });
    if (galleries.length === 0) {
      return res.status(404).json({ error: 'No galleries found for this email address.' });
    }

    res.json(galleries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Client: Submit selection
router.put('/:id/submit', async (req, res) => {
  try {
    const { selectedDriveIds } = req.body; // Array of driveIds that are selected
    const gallery = await ClientGallery.findById(req.params.id);
    
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
    // if (gallery.status === 'Submitted') return res.status(400).json({ error: 'Selection has already been submitted.' });

    gallery.images.forEach(img => {
      img.isSelected = selectedDriveIds.includes(img.driveId);
    });

    gallery.status = 'Submitted';
    gallery.submittedAt = new Date();
    await gallery.save();

    res.json({ message: 'Selection submitted successfully!', gallery });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit selection' });
  }
});

// Image streaming proxy (allows displaying images even if folder is restricted)
router.get('/image/:driveId', async (req, res) => {
  try {
    if (!drive) {
      return res.status(500).send('Drive API not initialized');
    }
    const { driveId } = req.params;
    const response = await drive.files.get(
      { fileId: driveId, alt: 'media' },
      { responseType: 'stream' }
    );
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (response.headers && response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy image error:', error.message);
    res.status(404).send('Image not found');
  }
});

export default router;
