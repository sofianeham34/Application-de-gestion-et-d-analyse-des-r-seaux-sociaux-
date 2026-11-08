const multer = require('multer');

// Fichier gardé en mémoire (Buffer) : converti puis supprimé après publication.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            const err = new Error('Seules les images sont acceptées');
            err.status = 400;
            return cb(err);
        }
        cb(null, true);
    },
});

module.exports = upload;
