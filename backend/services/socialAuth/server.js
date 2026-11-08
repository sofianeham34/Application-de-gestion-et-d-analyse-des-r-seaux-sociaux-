// Variables d'environnement : .env du service, sinon backend/.env commun
// (chargées avant tout autre module, qui peuvent les lire dès leur import)
const { join } = require('node:path');
require('dotenv').config({ path: [join(__dirname, '.env'), join(__dirname, '../..', '.env')] });

const express = require("express");
const helmet = require('helmet');
const cors = require("cors");
const connectDB = require("./config/db");
const passport = require("passport");
const session = require("express-session");
const socialAuthRoutes = require("./routes/socialAuthRoutes");
connectDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
// Session requise uniquement pendant l'échange OAuth 1.0a avec Twitter
app.use(session({secret: process.env.SESSION_SECRET || process.env.JWT_SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(socialAuthRoutes);

const PORT = process.env.PORT_SOCIALAUTH || 3002;

// Lancement direct (les tests importent l'application sans démarrer de serveur)
if (require.main === module) {
    app.listen(PORT, () => console.log(`SocialAuth service running on port ${PORT}`));
}

module.exports = app;
