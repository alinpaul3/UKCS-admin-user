import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for Multer Request
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure Multer for temporary storage
  const upload = multer({ dest: 'uploads/' });

  // Serve uploads statically
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.post('/api/upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check if Cloudinary credentials are fully defined
      const isCloudinaryConfigured = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET;

      if (isCloudinaryConfigured) {
        try {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'ukcs_certificates',
            resource_type: 'auto',
          });

          // Clean up local temp file as it's uploaded to Cloudinary
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          return res.json({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
          });
        } catch (cloudinaryError) {
          console.warn('Cloudinary upload errored, falling back to local file storage:', cloudinaryError);
        }
      }

      // Local Fallback Strategy:
      // Keep file local, rename with correct extension to serve it perfectly
      const extension = path.extname(req.file.originalname) || '.pdf';
      const storedFilename = `${req.file.filename}${extension}`;
      const finalLocalPath = path.join(uploadsDir, storedFilename);

      await fs.promises.rename(req.file.path, finalLocalPath);

      // Construct a valid file URL
      const host = req.get('host');
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${storedFilename}`;

      res.json({
        secure_url: fileUrl,
        public_id: `local_${storedFilename}`,
        format: extension.replace('.', ''),
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file successfully' });
    }
  });

  app.delete('/api/delete-asset', express.json(), async (req: Request, res: Response) => {
    try {
      const { public_id } = req.body;
      if (!public_id) {
        return res.status(400).json({ error: 'Missing public_id' });
      }

      // Check if delete is local asset
      if (typeof public_id === 'string' && public_id.startsWith('local_')) {
        const filename = public_id.replace('local_', '');
        const targetPath = path.join(uploadsDir, filename);
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
        return res.json({ result: 'ok', message: 'Local file deleted' });
      }

      const result = await cloudinary.uploader.destroy(public_id);
      res.json(result);
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      res.status(500).json({ error: 'Failed to delete from Cloudinary' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
