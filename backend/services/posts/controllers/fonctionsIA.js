const axios = require("axios");
const { getUserTokens } = require("../utils/socialTokens");

const IA_MODEL = process.env.IA_MODEL || "google/gemma-3n-e4b-it:free";

// Appel commun à l'API OpenRouter
async function demanderIA(prompt) {
    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: IA_MODEL, messages: [{ role: "user", content: prompt }] },
        {
            headers: {
                Authorization: `Bearer ${process.env.CLE_API_IA}`,
                "Content-Type": "application/json",
                "X-Title": "Ascendia",
            },
            timeout: 30000,
        }
    );
    return response.data.choices[0].message.content.trim();
}

const traduireMessage = (message, langue) => demanderIA(`
Voici un message à traduire :
"${message}"

Traduis-le en ${langue}, dans un style naturel, fluide et adapté aux réseaux sociaux. Ne commence pas ta réponse par "Traduction :" ni aucune introduction. Ne change pas le ton du message, garde les emojis si présents.
`);

const corrigerMessage = (message) => demanderIA(`
Corrige le message suivant pour qu'il soit sans faute, clair et engageant sur les réseaux sociaux :
"${message}"

Ne change pas l’intention du message, garde les emojis et ne donne que le texte corrigé, sans aucune explication ni introduction.
`);

// Commentaires des publications Instagram de l'utilisateur
async function commentairesInstagram(account) {
    const api = "https://graph.instagram.com/v21.0";
    const { data: medias } = await axios.get(`${api}/${account.profile.id}/media`, {
        params: { fields: "id", access_token: account.accessToken },
    });
    const parMedia = await Promise.all((medias.data || []).map(async (media) => {
        const { data } = await axios.get(`${api}/${media.id}/comments`, {
            params: { fields: "text", access_token: account.accessToken },
        });
        return (data.data || []).map((c) => c.text);
    }));
    return parMedia.flat();
}

// Score de satisfaction (1 à 10) calculé par l'IA à partir des commentaires reçus
const getSentiment = async (req, res) => {
    try {
        const comptes = await getUserTokens(req.user.id);
        const instagram = comptes.find((c) => c.provider === "instagram");
        const commentaires = instagram ? await commentairesInstagram(instagram) : [];

        if (commentaires.length === 0) {
            return res.json({ sentimentScore: null, comments: 0 });
        }

        const reponse = await demanderIA(
            "Tu es une IA d'analyse de sentiments. On va t'envoyer une liste de commentaires. " +
            "Retourne uniquement un nombre de 1 à 10 indiquant le niveau général de satisfaction des utilisateurs.\n" +
            JSON.stringify(commentaires.slice(0, 200))
        );
        const score = parseInt(reponse.match(/\d+/)?.[0], 10);
        res.json({ sentimentScore: Number.isNaN(score) ? null : Math.min(10, Math.max(1, score)), comments: commentaires.length });
    } catch (error) {
        console.error("Erreur analyse de sentiments :", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur durant l'analyse de sentiments." });
    }
};

module.exports = { demanderIA, traduireMessage, corrigerMessage, getSentiment };
