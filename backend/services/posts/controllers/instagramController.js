const axios = require('axios');
const { getProviderTokens } = require('../utils/socialTokens');

// Le token Instagram enregistré provient de la connexion Instagram (Instagram
// API with Instagram Login) : les appels passent donc par graph.instagram.com.
const IG_API = 'https://graph.instagram.com/v21.0';
const MEDIA_FIELDS = 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count';

// Récupère le compte Instagram connecté de l'utilisateur. Sans compte connecté,
// les listes sont simplement vides ; une publication précise renvoie 400.
async function instagramAccount(req, res, { emptyList = false } = {}) {
  const account = await getProviderTokens(req.user.id, 'instagram');
  if (!account) {
    if (emptyList) res.json([]);
    else res.status(400).json({ error: 'Compte Instagram non connecté.' });
    return null;
  }
  return account;
}

// 📥 Publications de l'utilisateur connecté
exports.getInstagramPosts = async (req, res) => {
  try {
    const account = await instagramAccount(req, res, { emptyList: true });
    if (!account) return;
    const { data } = await axios.get(`${IG_API}/${account.profile.id}/media`, {
      params: { access_token: account.accessToken, fields: MEDIA_FIELDS },
    });
    res.json(data.data || []);
  } catch (error) {
    console.error('Erreur Instagram (publications) :', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des publications Instagram.' });
  }
};

// 📥 Une publication
exports.getInstagramPostById = async (req, res) => {
  try {
    const account = await instagramAccount(req, res);
    if (!account) return;
    const { data } = await axios.get(`${IG_API}/${req.params.id}`, {
      params: { access_token: account.accessToken, fields: MEDIA_FIELDS },
    });
    res.json(data);
  } catch (error) {
    console.error('Erreur Instagram (publication) :', error.response?.data || error.message);
    res.status(500).json({ error: 'Impossible de récupérer la publication.' });
  }
};

// 💬 Commentaires d'une publication
exports.getInstagramPostComments = async (req, res) => {
  try {
    const account = await instagramAccount(req, res);
    if (!account) return;
    const { data } = await axios.get(`${IG_API}/${req.params.id}/comments`, {
      params: { access_token: account.accessToken, fields: 'id,text,username,like_count,timestamp' },
    });
    res.json(data.data || []);
  } catch (error) {
    console.error('Erreur Instagram (commentaires) :', error.response?.data || error.message);
    res.status(500).json({ error: 'Impossible de récupérer les commentaires.' });
  }
};

// 📊 Statistiques d'une publication (vues, portée, engagement)
exports.getInstagramPostInsights = async (req, res) => {
  const empty = { impressions: 0, reach: 0, engagement: 0, video_views: 0 };
  try {
    const account = await instagramAccount(req, res);
    if (!account) return;
    const { data } = await axios.get(`${IG_API}/${req.params.id}/insights`, {
      params: { access_token: account.accessToken, metric: 'reach,total_interactions,views' },
    });
    const insights = { ...empty };
    for (const metric of data.data || []) {
      const value = metric.values?.[0]?.value || 0;
      if (metric.name === 'reach') insights.reach = value;
      if (metric.name === 'total_interactions') insights.engagement = value;
      if (metric.name === 'views') insights.impressions = insights.video_views = value;
    }
    res.json(insights);
  } catch (error) {
    // Certaines métriques n'existent pas pour tous les types de médias :
    // on renvoie des zéros plutôt qu'une erreur qui casserait l'affichage.
    console.warn('Insights Instagram indisponibles :', error.response?.data?.error?.message || error.message);
    res.json(empty);
  }
};

// 📸 Stories en cours
exports.getInstagramStories = async (req, res) => {
  try {
    const account = await instagramAccount(req, res, { emptyList: true });
    if (!account) return;
    const { data } = await axios.get(`${IG_API}/${account.profile.id}/stories`, {
      params: { access_token: account.accessToken, fields: 'id,media_type,media_url,timestamp' },
    });
    res.json(data.data || []);
  } catch (error) {
    console.error('Erreur Instagram (stories) :', error.response?.data || error.message);
    res.status(502).json({ error: 'Impossible de récupérer les stories.' });
  }
};
