// Variables d'environnement : .env du service, sinon backend/.env commun
// (chargées avant tout autre module, qui peuvent les lire dès leur import)
const { join } = require('node:path');
require('dotenv').config({ path: [join(__dirname, '.env'), join(__dirname, '..', '.env')] });

const express = require('express');
const proxy = require('express-http-proxy');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || true }));

// Les routes internes entre microservices ne sont jamais exposées publiquement.
app.use('/api/socialauth/internal', (req, res) => res.status(404).json({ error: 'Not found' }));

// Proxy vers un microservice ; renvoie 502 si le service ne répond pas.
const forward = (target, name) => proxy(target, {
    timeout: 30000,
    limit: '10mb',
    proxyErrorHandler: (err, res) => {
        console.error(`Service ${name} injoignable :`, err.code || err.message);
        res.status(502).json({ error: `Le service ${name} est indisponible` });
    },
});

app.use('/api/users', forward(process.env.PROXY_USERS || 'http://localhost:3001', 'users'));
app.use('/api/posts', forward(process.env.PROXY_POSTS || 'http://localhost:3003', 'posts'));
app.use('/api/socialauth', forward(process.env.PROXY_SOCIALAUTH || 'http://localhost:3002', 'socialauth'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Gateway running on port ${PORT}`);
    });
}

module.exports = app;
