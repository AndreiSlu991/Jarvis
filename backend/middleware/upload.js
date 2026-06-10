import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});

const AUDIO_EXT = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4'];
const FILE_EXT = ['.pdf', '.fit', '.csv'];

function makeFilter(allowed) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${ext}`));
  };
}

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: makeFilter(AUDIO_EXT)
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: makeFilter(FILE_EXT)
});
