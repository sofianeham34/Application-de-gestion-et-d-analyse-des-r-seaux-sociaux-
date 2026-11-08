// Génère chaque heure, pour chaque utilisateur ayant des publications, une
// recommandation IA du jour (une seule par jour et par utilisateur).
const cron = require("node-cron");
const Recommandation = require("../models/Recommandation");
const Post = require("../models/Post");
const { demanderIA } = require("../controllers/fonctionsIA");

function debutDuJour() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

async function genererRecommandations() {
    try {
        const userIds = await Post.distinct("userId");

        for (const userId of userIds) {
            const dejaGeneree = await Recommandation.exists({ user_id: userId, date: { $gte: debutDuJour() } });
            if (dejaGeneree) continue;

            // Seules les informations utiles sont envoyées à l'IA (pas les fichiers)
            const posts = await Post.find({ userId })
                .select("content platform status scheduledFor publishedAt analytics -_id")
                .sort({ createdAt: -1 })
                .limit(30)
                .lean();

            const texte = await demanderIA(`
Voici les dernières publications d'un utilisateur avec leurs données analytiques :
${JSON.stringify(posts)}

Donne-moi UNE recommandation simple et concrète pour améliorer ses performances sur les réseaux sociaux aujourd'hui.
Ta réponse doit être en texte brut, sans mise en forme (pas de gras, pas de tirets, pas de listes, pas de markdown), en revanche tu peux intégrer des smiley pour rendre la recommandation conviviale. Ne commence pas par "Voici une recommandation :".
`);

            await Recommandation.create({ user_id: userId, contenu: texte });
        }
    } catch (err) {
        console.error("Erreur dans la génération des recommandations :", err.response?.data || err.message);
    }
}

cron.schedule("0 * * * *", genererRecommandations);
// Première génération peu après le démarrage du service
setTimeout(genererRecommandations, 30_000).unref();

module.exports = { genererRecommandations };
