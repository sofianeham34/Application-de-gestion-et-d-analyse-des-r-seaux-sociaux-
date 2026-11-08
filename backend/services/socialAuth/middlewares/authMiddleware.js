const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Vérifie le JWT émis par le service users et expose l'utilisateur dans req.user.
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({error: "Accès refusé"});
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({error: "Token invalide"});
    }
};

// Un utilisateur ne peut accéder qu'à ses propres connexions.
const sameUser = (param) => (req, res, next) => {
    if (req.params[param] !== req.user.id) {
        return res.status(403).json({error: "Accès non autorisé"});
    }
    next();
};

// Appels entre microservices (ex. le service posts qui a besoin des tokens
// d'un utilisateur pour publier). Jamais exposé au frontend.
const requireInternalKey = (req, res, next) => {
    const expected = process.env.INTERNAL_API_KEY;
    const received = req.headers["x-internal-key"];
    if (
        !expected ||
        typeof received !== "string" ||
        received.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    ) {
        return res.status(403).json({error: "Accès réservé aux services internes"});
    }
    next();
};

module.exports = {requireAuth, sameUser, requireInternalKey};
