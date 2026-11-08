// Variables d'environnement : .env du service, sinon backend/.env commun
// (chargées avant tout autre module, qui peuvent les lire dès leur import)
const { join } = require('node:path');
require('dotenv').config({ path: [join(__dirname, '.env'), join(__dirname, '../..', '.env')] });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');


const app = express();
const PORT = process.env.PORT_USERS || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use(userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Erreur serveur'});
});

// Lancement direct (les tests importent l'application sans démarrer de serveur)
if (require.main === module) {
    app.listen(PORT, () => console.log(`Users service running on port ${PORT}`));
}

module.exports = app;
