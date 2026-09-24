import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-template');
  const ClientGallery = mongoose.model('ClientGallery', new mongoose.Schema({ clientEmail: String, eventName: String, folderLink: String, images: Array }, { strict: false }));
  
  const galleries = await ClientGallery.find({ clientEmail: 'tiru@gmail.com' });
  for (const gallery of galleries) {
    console.log('Testing gallery:', gallery.eventName, 'Folder link:', gallery.folderLink);
    
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

    const folderId = extractFolderId(gallery.folderLink);
    console.log('Extracted folderId:', folderId);

    const auth = new google.auth.GoogleAuth({
      keyFile: 'google-credentials.json',
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 1000,
      });
      console.log('SUCCESS: Files found:', response.data.files?.length);
    } catch (err) {
      console.error('FAILED TO FETCH FILES:', err.message, err.response?.data);
    }
  }
  process.exit(0);
}

test();
