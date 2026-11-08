// Variables d'environnement : .env du service, sinon backend/.env commun
// (chargées avant tout autre module, qui peuvent les lire dès leur import)
const { join } = require('node:path');
require('dotenv').config({ path: [join(__dirname, '.env'), join(__dirname, '../..', '.env')] });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');


const connectDB = require('./config/db');
const postRoutes = require('./routes/postRoutes');
const { UPLOAD_DIR } = require('./utils/media');

const app = express();
const PORT = process.env.PORT_POSTS || 3003;

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json());
// Images temporaires téléchargées par Facebook / Instagram lors d'une publication
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(postRoutes);

// Erreurs d'upload (fichier trop gros, mauvais format…)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError' || err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Lancement direct : serveur + tâches planifiées (publication, recommandations IA).
// Les tests importent l'application sans démarrer ni serveur ni tâches.
if (require.main === module) {
  require('./jobs/cronScheduler');
  require('./jobs/PromptRecommandations');
  app.listen(PORT, () => {
    console.log(`Posts service running on port ${PORT}`);
  });
}

module.exports = app;
