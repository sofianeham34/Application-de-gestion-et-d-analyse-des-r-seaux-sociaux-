const jwt = require('jsonwebtoken');

// Vérifie le JWT émis par le service users et expose l'utilisateur dans req.user.
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentification requise' });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
};

// Pour les routes de la forme /.../:id où :id est un identifiant utilisateur.
const sameUser = (param = 'id') => (req, res, next) => {
    if (req.params[param] !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
};

module.exports = { requireAuth, sameUser };
