const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure upload directories exist
const UPLOAD_DIRS = {
    photos: path.join(__dirname, '..', 'uploads', 'photos'),
    documents: path.join(__dirname, '..', 'uploads', 'documents'),
};

Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function createStorage(subDir) {
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIRS[subDir]),
        filename: (req, file, cb) => {
            const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
            cb(null, uniqueName);
        },
    });
}

// Photo upload - images only, 5MB limit
const uploadPhoto = multer({
    storage: createStorage('photos'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype.split('/')[1]);
        cb(null, ext && mime);
    },
});

// Document upload - common doc types, 20MB limit
// Validates both file extension AND MIME type to prevent spoofing
const DOCUMENT_MIME_MAP = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
};

const uploadDocument = multer({
    storage: createStorage('documents'),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const expectedMime = DOCUMENT_MIME_MAP[ext];
        cb(null, !!expectedMime && file.mimetype === expectedMime);
    },
});

module.exports = { uploadPhoto, uploadDocument, UPLOAD_DIRS };
