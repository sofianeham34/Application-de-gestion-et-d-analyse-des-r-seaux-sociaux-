// Publication d'un message (et d'une image facultative) sur les réseaux de
// l'utilisateur. Utilisé par la publication immédiate et par la tâche de
// publication planifiée.
const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const { tweetWithImage } = require('../controllers/twitter/functions');
const { getUserTokens } = require('../utils/socialTokens');
const { saveAsJpeg, removeFile } = require('../utils/media');

async function publishTwitter(tokens, { message, fileBuffer, mimeType }) {
    const client = new TwitterApi({
        appKey: process.env.TWITTER_KEY,
        appSecret: process.env.TWITTER_SECRET,
        accessToken: tokens.accessToken,
        accessSecret: tokens.secretToken,
    });
    await tweetWithImage(fileBuffer, mimeType, message, client.readWrite);
}

async function publishFacebook(tokens, { message, imageUrl }) {
    const page = tokens.pages?.[0];
    if (!page) throw new Error('Aucune page Facebook associée au compte');
    if (imageUrl) {
        await axios.post(`https://graph.facebook.com/${page.id}/photos`, null, {
            params: { url: imageUrl, message, access_token: page.accessToken },
        });
    } else {
        await axios.post(`https://graph.facebook.com/${page.id}/feed`, { message, access_token: page.accessToken });
    }
}

async function publishInstagram(tokens, { message, imageUrl }) {
    if (!imageUrl) throw new Error('Instagram requiert une image pour publier');
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    // Étape 1 : créer le média, étape 2 : le publier
    const { data: media } = await axios.post(
        `https://graph.instagram.com/${tokens.profile.id}/media`,
        { image_url: imageUrl, caption: message },
        { headers }
    );
    await axios.post(
        `https://graph.instagram.com/${tokens.profile.id}/media_publish`,
        { creation_id: media.id },
        { headers }
    );
}

const PUBLISHERS = { twitter: publishTwitter, facebook: publishFacebook, instagram: publishInstagram };

// Renvoie le résultat réseau par réseau : [{ network, ok, error? }]
async function publishToNetworks({ userId, networks, message, fileBuffer, mimeType }) {
    const tokens = await getUserTokens(userId);
    // Facebook et Instagram récupèrent l'image via une URL publique
    const needsUrl = fileBuffer && networks.some((n) => n === 'facebook' || n === 'instagram');
    const image = needsUrl ? await saveAsJpeg(fileBuffer) : null;

    const results = [];
    try {
        for (const network of networks) {
            const publish = PUBLISHERS[network];
            const networkTokens = tokens.find((item) => item.provider === network);
            if (!publish || !networkTokens) {
                results.push({ network, ok: false, error: 'Compte non connecté' });
                continue;
            }
            try {
                await publish(networkTokens, { message, fileBuffer, mimeType, imageUrl: image?.url });
                results.push({ network, ok: true });
            } catch (err) {
                const detail = err.response?.data?.error?.message || err.message;
                console.error(`Publication ${network} échouée :`, detail);
                results.push({ network, ok: false, error: detail });
            }
        }
    } finally {
        if (image) await removeFile(image.path);
    }
    return results;
}

module.exports = { publishToNetworks };
