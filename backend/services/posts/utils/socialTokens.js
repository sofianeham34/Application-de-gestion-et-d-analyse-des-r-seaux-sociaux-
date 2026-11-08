const axios = require('axios');

// Récupère les connexions (et tokens) d'un utilisateur auprès du service socialAuth.
// L'appel se fait de service à service avec une clé interne : les tokens ne
// transitent jamais par le navigateur.
async function getUserTokens(userId) {
    const { data } = await axios.get(
        `${process.env.SOCIALAUTH_URL || 'http://localhost:3002'}/internal/tokens/${userId}`,
        { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY }, timeout: 10000 }
    );
    return data;
}

async function getProviderTokens(userId, provider) {
    const tokens = await getUserTokens(userId);
    return tokens.find((item) => item.provider === provider) || null;
}

module.exports = { getUserTokens, getProviderTokens };
