import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utils/axios.jsx";
import { FaHeart, FaCommentDots, FaPlus, FaArrowLeft } from "react-icons/fa";
import BarreHaut from "../../components/BarreHaut";
import SidebarPublication from "../../components/SideBarPublication";

const Instagram = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchInstagramPosts = async () => {
    const API_URL = `/api/posts/instagram/posts/${localStorage.getItem("user_id")}`;
    console.log("📡 Requête envoyée à :", API_URL);

    try {
      const res = await axiosInstance.get(API_URL);
      const basePosts = res.data;

      const postsWithViews = await Promise.all(
        basePosts.map(async (post) => {
          try {
            const insightsUrl = `/api/posts/instagram/posts/${post.id}/insights`;
            const insightsRes = await axiosInstance.get(insightsUrl);
            const views = insightsRes.data?.video_views || 0;
            return { ...post, views };
          } catch (err) {
            console.warn(`⛔ Pas de vues pour ${post.id}:`, err.message);
            return { ...post, views: 0 };
          }
        })
      );

      setPosts(postsWithViews);
    } catch (err) {
      console.error("Erreur chargement des publications :", err.message);
      setError("Erreur lors du chargement des publications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramStories = async () => {
    const API_URL = `/api/posts/instagram/stories`;
    console.log("📡 Requête stories envoyée à :", API_URL);

    try {
      const res = await axiosInstance.get(API_URL);
      const now = new Date();

      // Filtrer uniquement les stories < 24h
      const activeStories = (res.data || []).filter((story) => {
        const createdAt = new Date(story.timestamp);
        const ageInMs = now - createdAt;
        return ageInMs <= 24 * 60 * 60 * 1000;
      });

      setStories(activeStories);
    } catch (err) {
      console.warn("⚠️ Erreur récupération des stories :", err.message);
    }
  };

  useEffect(() => {
    fetchInstagramPosts();
    fetchInstagramStories();
  }, []);

  return (
    <div>
      <BarreHaut />
      <div className="flex">
        <SidebarPublication />
        <main className="flex-1 ml-64 mt-16 p-6 bg-gray-100 min-h-screen">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-sm text-gray-600 hover:text-[#FF0035]"
          >
            <FaArrowLeft className="mr-2" /> Retour
          </button>

          <h1 className="text-4xl font-bold text-center text-[#FF0035] mb-10">
            🎯 Publications Instagram
          </h1>

          {/* STORIES */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-center">📸 Stories Instagram (en cours)</h2>
            <div className="flex gap-4 overflow-x-auto px-4 py-2 bg-white rounded-xl shadow">
              {stories.length > 0 ? (
                stories.map((story) => (
                  <div key={story.id} className="min-w-[150px]">
                    {story.media_type === "VIDEO" ? (
                      <video controls className="w-full h-40 object-cover rounded-xl">
                        <source src={story.media_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={story.media_url}
                        alt="Story"
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    )}
                    <p className="text-xs text-center text-gray-600 mt-1">
                      {new Date(story.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center w-full">Aucune story active.</p>
              )}
            </div>
          </div>

          {/* POSTS */}
          {loading && <p className="text-gray-500 text-center">Chargement des publications...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {!loading && !error && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() =>
                    navigate("/analyses/statistiquesparpublication", {
                      state: { postId: post.id, reseau: "instagram", postData: post },
                    })
                  }
                  className="cursor-pointer bg-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform"
                >
                  {["IMAGE", "CAROUSEL_ALBUM"].includes(post.media_type) ? (
                    <img
                      src={post.media_url || post.thumbnail_url}
                      alt={post.caption || "Post Instagram"}
                      className="w-full h-64 object-cover rounded-xl mb-4"
                    />
                  ) : post.media_type === "VIDEO" ? (
                    <video controls className="w-full h-64 rounded-xl mb-4">
                      <source src={post.media_url} type="video/mp4" />
                    </video>
                  ) : null}

                  <div className="text-gray-800 space-y-2 text-sm">
                    {post.caption && (
                      <p className="line-clamp-3">
                        <strong>📝</strong> {post.caption}
                      </p>
                    )}
                    <p><strong>📷 Type:</strong> {post.media_type}</p>
                    <p><strong>🕒</strong> {new Date(post.timestamp).toLocaleString()}</p>

                    <div className="flex justify-between items-center pt-2">
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FF0035] font-semibold underline"
                      >
                        Voir sur Instagram
                      </a>
                      <div className="flex gap-4 text-sm text-gray-600 items-center">
                        <span className="flex items-center gap-1">
                          👁 {post.views}
                        </span>
                        {typeof post.like_count !== "undefined" && (
                          <span className="flex items-center gap-1">
                            <FaHeart className="text-red-500" /> {post.like_count}
                          </span>
                        )}
                        {typeof post.comments_count !== "undefined" && (
                          <span className="flex items-center gap-1">
                            <FaCommentDots className="text-blue-500" /> {post.comments_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ➕ Carte pour ajouter une publication */}
              <div
                onClick={() => navigate("/publications/new")}
                className="cursor-pointer flex flex-col justify-center items-center bg-white rounded-2xl border-2 border-dashed border-[#FF0035] p-6 hover:bg-[#fff0f3] transition"
              >
                <FaPlus className="text-[#FF0035] text-4xl mb-2" />
                <p className="text-[#FF0035] font-semibold">Ajouter une publication</p>
              </div>
            </div>
          ) : (
            !loading && !error && (
              <p className="text-center text-gray-600">Aucune publication trouvée.</p>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default Instagram;
