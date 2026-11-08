const express = require("express");
const passport = require("passport");
const axios = require("axios");
const socialAuthController = require("../controllers/socialAuthController");
const {requireAuth, sameUser, requireInternalKey} = require("../middlewares/authMiddleware");
const {enabled} = require("../config/passport");
const router = express.Router();

const callbackUrl = (network) => `${process.env.PROXY_GATEWAY}/api/socialauth/connect/${network}/callback`;
const frontendCallback = (params) =>
    `${process.env.FRONTEND_URL}/socialauth/callback?${new URLSearchParams(params).toString()}`;

router.get("/alive", (req, res) => {res.status(200).send("OK");});

// Tokens complets d'un utilisateur : uniquement pour les autres microservices.
router.get("/internal/tokens/:user_id", requireInternalKey, socialAuthController.getSocialMediaByUserId);

// Routes appelées par le frontend (utilisateur connecté, sur ses propres données)
router.post("/save", requireAuth, socialAuthController.save);
router.get("/:user_id", requireAuth, sameUser("user_id"), socialAuthController.getSocialMediaProviderByUserId);
router.delete("/:user_id/:network", requireAuth, sameUser("user_id"), socialAuthController.DeleteSocialMedia);

// Routes de connexion OAuth aux réseaux sociaux (redirections du navigateur)

router.use("/connect/:network", (req, res, next) => {
    if (!enabled[req.params.network]) {
        return res.status(503).send(`La connexion ${req.params.network} n'est pas configurée sur ce serveur (clés API manquantes).`);
    }
    next();
});

router.get("/connect/facebook", passport.authenticate("facebook", {
        scope: ["email", "public_profile", "pages_read_user_content", "read_insights", "pages_show_list",
            "business_management", "pages_read_engagement", "pages_manage_metadata", "pages_manage_posts",
            "instagram_basic", "instagram_content_publish", "ads_management", "instagram_manage_insights",
            "ads_read"
        ]
    }));

router.get("/connect/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login",session: false }), (req, res) => {
    if (!req.user?.accessToken) {
        return res.redirect(frontendCallback({network: "facebook", error: "token"}));
    }
    res.redirect(frontendCallback({network: "facebook", token: req.user.accessToken}));
});

router.get("/connect/instagram", passport.authenticate("instagram"));

router.get("/connect/instagram/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Code d'autorisation manquant");
    }

    try {
        // Étape 1 : échanger le code d'autorisation contre un token court terme
        const { data: shortTerm } = await axios.post("https://api.instagram.com/oauth/access_token", new URLSearchParams({
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: callbackUrl("instagram"),
            code,
        }));

        // Étape 2 : échanger le token court terme contre un token long terme (60 jours)
        const { data: longTerm } = await axios.get("https://graph.instagram.com/access_token", {
            params: {
                grant_type: "ig_exchange_token",
                client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
                access_token: shortTerm.access_token,
            },
        });

        res.redirect(frontendCallback({network: "instagram", token: longTerm.access_token}));
    } catch (error) {
        console.error("Erreur OAuth Instagram :", error.response?.data || error.message);
        res.redirect(frontendCallback({network: "instagram", error: "token"}));
    }
});

router.get("/connect/twitter", passport.authenticate("twitter", {
        scope: [
            "tweet.read", "tweet.write", "users.read", "follows.read", "follows.write",
            "offline.access", "like.read", "like.write", "list.read", "list.write",
            "bookmark.read", "bookmark.write"
        ]
    }));

router.get("/connect/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login",session: false }), (req, res) => {
    if (!req.user?.token) {
        return res.redirect(frontendCallback({network: "twitter", error: "token"}));
    }
    const {token, tokenSecret} = req.user;
    res.redirect(frontendCallback({network: "twitter", token, tokenSecret}));
});

module.exports = router;
