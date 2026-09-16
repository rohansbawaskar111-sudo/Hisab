import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `img-${uuidv4().substring(0, 12)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP and GIF images are allowed'));
    }
  },
});

// POST /api/upload
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Image upload failed' });
      return;
    }

    if (!req.file) {
      // Check if base64 provided in body
      const { base64Data } = req.body;
      if (base64Data && base64Data.startsWith('data:image')) {
        try {
          const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!matches) {
            res.status(400).json({ error: 'Invalid base64 image format' });
            return;
          }
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          if (buffer.length > 5 * 1024 * 1024) {
            res.status(400).json({ error: 'Image exceeds 5MB limit' });
            return;
          }
          const fileName = `img-${uuidv4().substring(0, 12)}.${ext}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
          res.json({ url: `/uploads/${fileName}` });
          return;
        } catch (e: any) {
          res.status(400).json({ error: 'Failed to process base64 image' });
          return;
        }
      }

      res.status(400).json({ error: 'No image file or data provided' });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

export default router;
