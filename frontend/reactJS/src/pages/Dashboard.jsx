import { useState, useEffect } from "react";
import BarreHaut from "../components/BarreHaut";
import { axiosInstance } from "../utils/axios.jsx";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

import { DateTime } from "luxon";



//import { PieChart } from 'react-minimal-pie-chart'; // Librairie pour afficher un camembert (statistiques)

export default function Dashboard() {
    // Déclaration des états nécessaires
    const [username, setUsername] = useState(""); // Nom de l'utilisateur
    const [postPlanifier, setPostPlanifier] = useState([]); // Liste des publications planifiées
    const [recommandation, setRecommandation] = useState(""); // Recommandation IA
    const [isLoading, setIsLoading] = useState(true); // État de chargement
    const [totalEngagement, setTotalEngagement] = useState(0); // Engagement total
    const [totalPostsThisMonth, setTotalPostsThisMonth] = useState(0);
    const [sentimentScore, setSentimentScore] = useState(null); // Score IA de 1 à 10 (null = pas de données)
    const [topPost, setTopPost] = useState(null); //post plus performant



    // Effet de récupération des données lorsque le composant est monté
    useEffect(() => {

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");
        console.log("→ userId:", userId);
        console.log("→ token:", token);

        if (!token || !userId) {
            setUsername("Non connecté");
            setIsLoading(false);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Chargement rapide : username + posts planifiés
        const loadBasicInfos = async () => {
            try {
                const [userRes, scheduledRes] = await Promise.all([
                    axiosInstance.get(`/api/users/${userId}`, { headers }),
                    axiosInstance.get(`/api/posts/scheduled/${userId}`, { headers }),
                ]);
                setUsername(userRes.data.username || "Utilisateur inconnu");
                setPostPlanifier(scheduledRes.data || []);
            } catch (error) {
                handleAPIError(error);
            } finally {
                setIsLoading(false); // on affiche déjà le dashboard de base
            }
        };

        // Chargement différé : recommandations + engagement
        const loadAdvancedInfos = async () => {
            try {
                // Analyse de sentiment (appel IA, plus lent) chargée à part
                axiosInstance.get(`/api/posts/sentiment/${userId}`)
                    .then((res) => setSentimentScore(res.data.sentimentScore))
                    .catch(() => setSentimentScore(null));

                const [recRes, fbRes, igRes] = await Promise.all([
                    axiosInstance.get(`/api/posts/recommandation/${userId}`, { headers }),
                    axiosInstance.get(`/api/posts/facebook/posts/${userId}`, { headers }),
                    axiosInstance.get(`/api/posts/instagram/posts/${userId}`, { headers }),
                ]);
                setRecommandation(recRes.data[0]?.contenu || "");

                const facebookPosts = fbRes.data || [];
                const instagramPosts = igRes.data || [];

                const engagementFacebook = facebookPosts.reduce((acc, post) => {
                    const likes = post.likes?.summary?.total_count || 0;
                    const comments = post.comments?.summary?.total_count || 0;
                    return acc + likes + comments;
                }, 0);

                const engagementInstagram = instagramPosts.reduce(
                    (acc, post) => acc + (post.like_count || 0) + (post.comments_count || 0),
                    0
                );

                setTotalEngagement(engagementFacebook + engagementInstagram);

                const isThisMonth = (dateStr) => {
                    const date = new Date(dateStr);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                };

                const allPosts = [
                    ...facebookPosts.map((post) => ({ ...post, publishedAt: post.created_time })),
                    ...instagramPosts.map((post) => ({ ...post, publishedAt: post.timestamp })),
                ];

                setTotalPostsThisMonth(allPosts.filter((post) => isThisMonth(post.publishedAt)).length);
            } catch (error) {
                handleAPIError(error);
            }
        };

        const handleAPIError = (error) => {
            console.error("Erreur API :", error);

            if (error.response && error.response.status === 401) {
                console.warn("Token expiré ou invalide, déconnexion");
                localStorage.removeItem("token");
                localStorage.removeItem("user_id");
                window.location.reload();
            }
        };

        loadBasicInfos();
        loadAdvancedInfos();
    }, []);

    useEffect(() => {
        const fetchTopPost = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) return;

            try {
                const [igRes, fbRes] = await Promise.all([
                    axiosInstance.get(`/api/posts/instagram/posts/${userId}`),
                    axiosInstance.get(`/api/posts/facebook/posts/${userId}`)
                ]);

                const igPosts = igRes.data || [];
                const fbPosts = fbRes.data || [];

                const allPosts = [...igPosts, ...fbPosts];

                const top = allPosts.reduce((max, post) => {
                    const likes = post.like_count || post.likes?.summary?.total_count || 0;
                    const comments = post.comments_count || post.comments?.summary?.total_count || 0;
                    const engagement = likes + comments;
                    return engagement > max.engagement ? { ...post, engagement } : max;
                }, { engagement: 0 });

                setTopPost(top.engagement > 0 ? top : null);
            } catch (error) {
                console.error("Erreur lors de la récupération du Top Post :", error);
            }
        };

        fetchTopPost();
    }, []);





    // Fonction pour obtenir l'icône d'un réseau social basé sur son nom
    function getPlatformIcon(platform) {
        switch (platform) {
            case "facebook":
                return <FaFacebook className="text-blue-600 text-lg" />;
            case "instagram":
                return <FaInstagram className="text-pink-500 text-lg" />;
            case "twitter":
                return <FaTwitter className="text-blue-400 text-lg" />;
            default:
                return null;
        }

    }
    const getSmiley = (score) => {
        if (score >= 9) return '😍';       // Très content
        if (score >= 7) return '😊';       // Content
        if (score >= 5) return '😐';       // Neutre
        if (score >= 3) return '😕';       // Pas content
        return '😡';                       // Très mécontent
    };

    const formatDateDashboard = (dateISO) => {
        return DateTime.fromISO(dateISO)
            .toFormat("dd/MM/yyyy HH:mm");
    };


    return (
        <div className="min-h-screen bg-pink-50">
            {/* BarreHaut : en-tête globale */}
            <BarreHaut />

            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
                {/* Titre de page : “Bonjour {username}” */}
                <h1 className="text-3xl font-bold text-gray-700 mb-8">
                    Bonjour <span className="text-red-500">{username}</span>
                </h1>

                {/* Affichage du spinner si les données sont en cours de chargement */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-16 h-16 border-t-4 border-red-500 border-solid rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Première rangée : 3 stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-6">
                                <p className="text-gray-500 mb-2">Publications programmées</p>
                                <p className="text-3xl font-semibold text-gray-800">{postPlanifier.length}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-6">
                                <p className="text-gray-500 mb-2">Publications ce mois</p>
                                <p className="text-3xl font-semibold text-gray-800">{totalPostsThisMonth}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-6">
                                <p className="text-gray-500 mb-2">Engagement total</p>
                                <p className="text-3xl font-semibold text-gray-800">{totalEngagement.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Deuxième rangée : graphiques et informations supplémentaires */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {/* Card “Sentiments des utilisateurs” */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-700 mb-4">😊 Sentiment des utilisateurs</h2>
                                {sentimentScore === null ? (
                                    <p className="text-gray-400 italic">
                                        Pas encore assez de commentaires pour analyser le sentiment.
                                    </p>
                                ) : (
                                    <div className="flex flex-col justify-center items-center h-48">
                                        <span className="text-7xl">{getSmiley(sentimentScore)}</span>
                                        <span className="mt-2 text-gray-500 font-semibold">{sentimentScore} / 10</span>
                                    </div>
                                )}
                            </div>

                            {/* Card “Top Post” */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-700 mb-4">🔥 Top Post</h2>

                                {topPost ? (
                                    <>
                                        {topPost.media_url || topPost.full_picture ? (
                                            <img
                                                src={topPost.media_url || topPost.full_picture}
                                                alt="Top Post"
                                                className="w-full h-40 object-cover rounded-md mb-4"
                                            />
                                        ) : (
                                            <div className="h-40 bg-gray-100 flex items-center justify-center rounded-md mb-4 text-gray-400 text-sm">
                                                Aucune image
                                            </div>
                                        )}

                                        <p className="text-gray-700 mb-2">{topPost.caption || topPost.message || "Pas de description."}</p>

                                        <div className="flex items-center justify-between text-gray-600 text-sm mt-4">
                                            <p>Engagement : <span className="font-semibold">{topPost.engagement}</span></p>
                                            {topPost.permalink || topPost.permalink_url ? (
                                                <a
                                                    href={topPost.permalink || topPost.permalink_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Voir
                                                </a>
                                            ) : null}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-400 italic">Aucun top post pour l'instant.</p>
                                )}
                            </div>


                            {/* Card “Recommandation IA” */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-700 mb-4">🤖 Recommandation du jour</h2>
                                {recommandation ? (
                                    <p className="text-gray-600 whitespace-pre-line">{recommandation}</p>
                                ) : (
                                    <p className="text-gray-400 italic">Aucune recommandation disponible pour le moment.</p>
                                )}
                            </div>
                        </div>

                        {/* Troisième rangée : Prochaines publications */}
                        <div className="bg-white rounded-lg shadow p-6 mt-8">
                            <h2 className="text-xl font-bold text-gray-700 mb-4">Prochaines publications</h2>
                            {/* Si pas de posts planifiés */}
                            {postPlanifier.length === 0 && (
                                <p className="text-gray-500">Aucune publication planifiée pour le moment.</p>
                            )}

                            {/* Sinon, on liste */}
                            <ul className="space-y-4">
                                {[...postPlanifier]
                                    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
                                    .map((post) => (
                                        <li key={post._id}>
                                            <div className="flex items-center gap-2">
                                                {post.platform.map((p, idx) => (
                                                    <span key={idx}>{getPlatformIcon(p)}</span>
                                                ))}
                                                <span className="text-sm text-gray-500">
                                                     — {formatDateDashboard(post.scheduledFor)}

                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">{post.content}</p>
                                        </li>
                                    ))}
                            </ul>

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}