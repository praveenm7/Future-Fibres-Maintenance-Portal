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
const uploadDocument = multer({
    storage: createStorage('documents'),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|txt/;
        cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
    },
});

module.exports = { uploadPhoto, uploadDocument, UPLOAD_DIRS };
