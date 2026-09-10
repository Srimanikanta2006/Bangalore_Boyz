import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { AppError } from '../utils/errors';

/**
 * Local-disk evidence upload (Stage D decision: Option B — no external storage
 * provider). Files are served read-only via express.static at /media/evidence
 * (see app.ts). Limits: jpg/png/webp, <=5MB each, max 3 files per report.
 */

export const EVIDENCE_DIR = path.join(process.cwd(), 'uploads', 'evidence');
export const EVIDENCE_URL_PREFIX = '/media/evidence';

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCE_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] ?? path.extname(file.originalname) ?? '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const evidenceUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      cb(new AppError('UNSUPPORTED_MEDIA_TYPE', 'Only jpg, png, or webp images are accepted.', 415));
      return;
    }
    cb(null, true);
  },
}).array('evidence', 3);

/** Public URL for a stored evidence filename (never expose the disk path). */
export function evidenceUrl(filename: string): string {
  return `${EVIDENCE_URL_PREFIX}/${filename}`;
}
