const axios = require("axios");
const { DateTime } = require('luxon');
const Post = require("../models/Post");
const Recommandation = require("../models/Recommandation");
const { publishToNetworks } = require("../services/publisher");
const { getProviderTokens } = require("../utils/socialTokens");

const NETWORKS = ['twitter', 'facebook', 'instagram'];

// Accepte un tableau, une chaîne JSON ("["facebook"]") ou une valeur seule.
function parseNetworks(value) {
    let list = value;
    if (typeof value === 'string') {
        try { list = JSON.parse(value); } catch { list = [value]; }
    }
    if (!Array.isArray(list)) list = [list];
    return list.filter((n) => NETWORKS.includes(n));
}

// Récupère une publication en vérifiant qu'elle appartient à l'utilisateur connecté.
async function findOwnPost(req, res) {
    const post = await Post.findById(req.params.id);
    if (!post) {
        res.status(404).json({ message: 'Publication non trouvée' });
        return null;
    }
    if (post.userId.toString() !== req.user.id) {
        res.status(403).json({ message: 'Accès non autorisé' });
        return null;
    }
    return post;
}

const postController = {
    // Publier immédiatement sur les réseaux sélectionnés
    createPost: async (req, res) => {
        try {
            const networks = parseNetworks(req.body.networks);
            const message = (req.body.message || '').trim();
            if (!networks.length) return res.status(400).json({ error: "Aucun réseau sélectionné" });
            if (!message && !req.file) return res.status(400).json({ error: "Le message est vide" });
            if (networks.includes('instagram') && !req.file) {
                return res.status(400).json({ error: "Instagram requiert une image pour publier." });
            }

            const results = await publishToNetworks({
                userId: req.user.id,
                networks,
                message,
                fileBuffer: req.file?.buffer || null,
                mimeType: req.file?.mimetype || null,
            });

            // Historique de la publication (sans le fichier)
            const succeeded = results.filter((r) => r.ok);
            await Post.create({
                userId: req.user.id,
                content: message || '(image sans texte)',
                platform: networks,
                status: succeeded.length ? 'published' : 'failed',
                publishedAt: succeeded.length ? new Date() : undefined,
            });

            const status = succeeded.length === results.length ? 200 : succeeded.length ? 207 : 502;
            res.status(status).json({
                message: succeeded.length ? "Post publié" : "La publication a échoué",
                results,
            });
        } catch (error) {
            console.error("Erreur publication :", error.message);
            res.status(500).json({ error: "Erreur lors de la publication" });
        }
    },

    // Planifier une publication
    schedulePost: async (req, res) => {
        try {
            const networks = parseNetworks(req.body.networks);
            const message = (req.body.message || '').trim();
            const scheduledFor = DateTime.fromISO(req.body.scheduleDate || '', { zone: "Europe/Paris" });

            if (!networks.length) return res.status(400).json({ error: "Aucun réseau sélectionné" });
            if (!message) return res.status(400).json({ error: "Le message est vide" });
            if (!scheduledFor.isValid || scheduledFor < DateTime.now()) {
                return res.status(400).json({ error: "Date de planification invalide" });
            }

            const mediaFiles = req.file ? [{ data: req.file.buffer, contentType: req.file.mimetype }] : [];
            const post = await Post.create({
                userId: req.user.id,
                content: message,
                platform: networks,
                mediaFiles,
                scheduledFor: scheduledFor.toUTC().toJSDate(),
                status: "scheduled",
            });
            res.status(201).json({ message: "Post planifié", id: post._id });
        } catch (error) {
            res.status(400).json({ error: "Impossible de planifier la publication" });
        }
    },

    // Mettre à jour une publication planifiée (contenu, date, réseaux)
    updatePost: async (req, res) => {
        try {
            const post = await findOwnPost(req, res);
            if (!post) return;
            if (req.body.content !== undefined) post.content = req.body.content;
            if (req.body.platform !== undefined) post.platform = parseNetworks(req.body.platform);
            if (req.body.scheduledFor !== undefined) post.scheduledFor = req.body.scheduledFor;
            if (req.body.tags !== undefined) post.tags = req.body.tags;
            await post.save();
            res.json(post);
        } catch (error) {
            res.status(400).json({ error: "Mise à jour impossible" });
        }
    },

    // Recommandation IA du jour pour l'utilisateur connecté
    getRecommandation: async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const recommandations = await Recommandation.find({
                user_id: req.user.id,
                date: { $gte: today, $lt: tomorrow },
            });
            res.json(recommandations);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    getPostById: async (req, res) => {
        try {
            const post = await findOwnPost(req, res);
            if (post) res.json(post);
        } catch (error) {
            res.status(400).json({ error: "Identifiant invalide" });
        }
    },

    deletePost: async (req, res) => {
        try {
            const post = await findOwnPost(req, res);
            if (!post) return;
            await post.deleteOne();
            res.json({ message: 'Publication supprimée avec succès' });
        } catch (error) {
            res.status(400).json({ error: "Identifiant invalide" });
        }
    },

    getScheduledPostsByUser: async (req, res) => {
        try {
            const scheduledPosts = await Post.find({ userId: req.user.id, status: "scheduled" })
                .select('-mediaFiles')
                .sort({ scheduledFor: 1 });
            res.json(scheduledPosts);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    updateAnalytics: async (req, res) => {
        try {
            const post = await findOwnPost(req, res);
            if (!post) return;
            const { likes, shares, comments, reach } = req.body.analytics || {};
            Object.assign(post.analytics, { likes, shares, comments, reach });
            await post.save();
            res.json(post);
        } catch (error) {
            res.status(400).json({ error: "Mise à jour impossible" });
        }
    },

    // Utilisateurs engagés par jour sur chaque page Facebook
    getFacebookEngagement: async (req, res) => {
        try {
            const { dateStart, dateEnd } = req.query;
            const facebookTokens = await getProviderTokens(req.user.id, 'facebook');
            if (!facebookTokens) return res.json([]);

            const result = [];
            for (const page of facebookTokens.pages || []) {
                try {
                    const { data } = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/insights`, {
                        params: {
                            metric: 'page_engaged_users',
                            period: 'day',
                            since: dateStart,
                            until: dateEnd,
                            access_token: page.accessToken,
                        },
                    });
                    const values = data.data[0]?.values || [];
                    result.push({
                        pageName: page.name,
                        pageId: page.id,
                        dailyMetrics: values.map((day) => ({
                            date: day.end_time.split('T')[0],
                            engagedUsers: day.value,
                        })),
                        totalEngagedUsers: values.reduce((sum, day) => sum + (day.value || 0), 0),
                    });
                } catch (err) {
                    console.error(`Erreur pour la page ${page.name} :`, err.response?.data || err.message);
                }
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    },
};

module.exports = postController;
