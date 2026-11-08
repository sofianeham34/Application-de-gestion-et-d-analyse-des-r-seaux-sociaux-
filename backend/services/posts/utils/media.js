const crypto = require('crypto');
const fs = require('fs/promises');
const { join } = require('node:path');
const sharp = require('sharp');

// Dossier servi publiquement sur /uploads : Facebook et Instagram viennent y
// télécharger l'image à publier.
const UPLOAD_DIR = join(__dirname, '..', 'uploads');

// Convertit l'image en JPEG sous un nom aléatoire (jamais le nom fourni par
// l'utilisateur) et attend la fin de l'écriture avant de renvoyer son URL.
async function saveAsJpeg(buffer) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${crypto.randomUUID()}.jpeg`;
    const path = join(UPLOAD_DIR, fileName);
    await sharp(buffer).jpeg({ quality: 90 }).toFile(path);
    return { path, url: `${process.env.PUBLIC_POSTS_URL || 'http://localhost:3003'}/uploads/${fileName}` };
}

async function removeFile(path) {
    await fs.rm(path, { force: true });
}

module.exports = { UPLOAD_DIR, saveAsJpeg, removeFile };
