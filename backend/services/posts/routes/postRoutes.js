const express = require('express');
const upload = require('../middlewares/upload');
const { requireAuth, sameUser } = require('../middlewares/auth');
const postController = require('../controllers/postController');
const {
  getInstagramPosts,
  getInstagramPostById,
  getInstagramPostComments,
  getInstagramPostInsights,
  getInstagramStories
} = require("../controllers/instagramController");
const { getFacebookPosts, getFacebookPostById, getFacebookPostComments } = require("../controllers/facebookController");
const { traduireMessage, corrigerMessage, getSentiment } = require("../controllers/fonctionsIA");

const router = express.Router();

router.get("/alive", (req, res) => {res.status(200).send("OK");});

// Toutes les routes suivantes nécessitent un utilisateur connecté.
// Les routes "/.../:id" où :id est un utilisateur vérifient qu'il s'agit bien de lui.
router.use(requireAuth);

// Publications de l'application (immédiates et planifiées)
router.post('/', upload.single('file'), postController.createPost);
router.post('/schedule', upload.single('file'), postController.schedulePost);
router.get("/scheduled/:id", sameUser(), postController.getScheduledPostsByUser);
router.get('/recommandation/:id', sameUser(), postController.getRecommandation);
router.get("/sentiment/:id", sameUser(), getSentiment);
router.get('/stat/engagement/facebook/:id', sameUser(), postController.getFacebookEngagement);

// Instagram (les routes fixes sont déclarées avant les routes paramétrées)
router.get('/instagram/stories', getInstagramStories);
router.get('/instagram/posts/:id/insights', getInstagramPostInsights);
router.get('/instagram/posts/:id', sameUser(), getInstagramPosts);
router.get('/instagram/post/:id', getInstagramPostById);
router.get('/instagram/post/:id/comments', getInstagramPostComments);

// Facebook
router.get("/facebook/posts/:id", sameUser(), getFacebookPosts);
router.get('/facebook/post/:id', getFacebookPostById);
router.get('/facebook/post/:id/comments', getFacebookPostComments);

// Fonctions IA
router.post("/traduire", async (req, res) => {
  const { message, langue } = req.body;
  if (!message || !langue) {
    return res.status(400).json({ error: "Message ou langue manquant" });
  }
  try {
    res.json({ message: await traduireMessage(message, langue) });
  } catch (error) {
    res.status(502).json({ error: "Erreur lors de la traduction" });
  }
});

router.post("/corriger", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message manquant" });
  }
  try {
    res.json({ message: await corrigerMessage(message) });
  } catch (error) {
    res.status(502).json({ error: "Erreur lors de la correction" });
  }
});

// Une publication de l'application
router.get('/:id', postController.getPostById);
router.put('/:id', postController.updatePost);
router.put('/:id/analytics', postController.updateAnalytics);
router.delete('/:id', postController.deletePost);

module.exports = router;
