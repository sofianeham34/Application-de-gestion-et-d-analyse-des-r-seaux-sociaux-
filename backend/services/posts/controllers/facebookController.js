const axios = require("axios");
const { getProviderTokens } = require("../utils/socialTokens");

const FB_API = "https://graph.facebook.com/v19.0";
const POST_FIELDS = "id,message,full_picture,created_time,permalink_url,likes.summary(true),comments.summary(true)";

// Première page Facebook gérée par l'utilisateur connecté (avec son token de page).
// Sans page connectée, les listes sont simplement vides.
async function facebookPage(req, res, { emptyList = false } = {}) {
  const account = await getProviderTokens(req.user.id, "facebook");
  const page = account?.pages?.[0];
  if (!page) {
    if (emptyList) res.json([]);
    else res.status(400).json({ error: "Aucune page Facebook connectée." });
    return null;
  }
  return page;
}

// Publications de la page
exports.getFacebookPosts = async (req, res) => {
  try {
    const page = await facebookPage(req, res, { emptyList: true });
    if (!page) return;
    const { data } = await axios.get(`${FB_API}/${page.id}/feed`, {
      params: { access_token: page.accessToken, fields: POST_FIELDS },
    });
    res.json(data.data || []);
  } catch (error) {
    console.error("Erreur Facebook (publications) :", error.response?.data || error.message);
    res.status(500).json({ error: "Erreur lors de la récupération des publications Facebook." });
  }
};

// Une publication
exports.getFacebookPostById = async (req, res) => {
  try {
    const page = await facebookPage(req, res);
    if (!page) return;
    const { data } = await axios.get(`${FB_API}/${req.params.id}`, {
      params: { access_token: page.accessToken, fields: POST_FIELDS },
    });
    res.json(data);
  } catch (error) {
    console.error("Erreur Facebook (publication) :", error.response?.data || error.message);
    res.status(500).json({ error: "Impossible de récupérer la publication." });
  }
};

// Commentaires d'une publication
exports.getFacebookPostComments = async (req, res) => {
  try {
    const page = await facebookPage(req, res);
    if (!page) return;
    const { data } = await axios.get(`${FB_API}/${req.params.id}/comments`, {
      params: { access_token: page.accessToken, fields: "id,message,from,like_count,created_time" },
    });
    // Même forme que les commentaires Instagram pour l'affichage
    res.json((data.data || []).map((c) => ({
      id: c.id,
      text: c.message,
      username: c.from?.name,
      like_count: c.like_count || 0,
      timestamp: c.created_time,
    })));
  } catch (error) {
    console.error("Erreur Facebook (commentaires) :", error.response?.data || error.message);
    res.status(500).json({ error: "Impossible de récupérer les commentaires." });
  }
};
