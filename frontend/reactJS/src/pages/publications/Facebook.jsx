import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaCommentDots, FaPlus, FaArrowLeft } from "react-icons/fa";
import BarreHaut from "../../components/BarreHaut";
import SidebarPublication from "../../components/SideBarPublication";
import { axiosInstance } from "../../utils/axios.jsx";

const Facebook = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchFacebookPosts = async () => {
    const userId = localStorage.getItem("user_id");

    try {
      const res = await axiosInstance.get(`/api/posts/facebook/posts/${userId}`);

      console.log("📘 Publications Facebook reçues :", res.data);
      setPosts(res.data);
    } catch (err) {
      console.error("❌ Erreur récupération Facebook :", err);
      setError(`Erreur lors du chargement des publications. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacebookPosts();
  }, []);

  return (
    <div>
      <BarreHaut />
      <div className="flex">
        <SidebarPublication />
  
          <main className="flex-1 ml-64 mt-16 p-6 bg-gray-100 min-h-screen">
          <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center text-sm text-gray-600 hover:text-[#FF0035] transition"
            >
                <FaArrowLeft className="mr-2" /> Retour
            </button>
          <h1 className="text-4xl font-bold text-center text-blue-600 mb-10">
            🌐 Publications Facebook
          </h1>

          {/*<div className="mb-10 max-w-md mx-auto">
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full p-3 rounded-xl border border-blue-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="">📄 Sélectionnez une page Facebook</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
              </div>*/}

          {loading && <p className="text-gray-500 text-center">Chargement...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {!loading && !error && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() =>
                    navigate("/analyses/statistiquesparpublication", {
                      state: {
                        postId: post.id,
                        reseau: "facebook",
                        postData: post,
                      },
                    })
                  }
                  className="cursor-pointer bg-white rounded-2xl shadow-lg p-5 hover:shadow-2xl transition duration-300 hover:scale-[1.02]"
                >
                  {post.full_picture && (
                    <img
                      src={post.full_picture}
                      alt="Facebook post"
                      className="w-full h-64 object-cover rounded-xl mb-4"
                    />
                  )}

                  <div className="text-gray-800 space-y-2 text-sm">
                    {post.message && (
                      <p className="line-clamp-4">
                        <strong>📝</strong> {post.message}
                      </p>
                    )}
                    <p>
                      <strong>🕒</strong> {new Date(post.created_time).toLocaleString()}
                    </p>

                    <div className="flex justify-between items-center pt-2">
                      <a
                        href={post.permalink_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-semibold underline"
                      >
                        Voir sur Facebook
                      </a>
                      <div className="flex gap-4 text-sm text-gray-600 items-center">
                        {post.reactions?.summary?.total_count >= 0 && (
                          <span className="flex items-center gap-1">
                            <FaHeart className="text-red-500" /> {post.reactions.summary.total_count}
                          </span>
                        )}
                        {post.comments?.summary?.total_count >= 0 && (
                          <span className="flex items-center gap-1">
                            <FaCommentDots className="text-blue-500" /> {post.comments.summary.total_count}
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
                className="cursor-pointer flex flex-col justify-center items-center bg-white rounded-2xl border-2 border-dashed border-blue-600 p-6 hover:bg-blue-50 transition"
              >
                <FaPlus className="text-blue-600 text-4xl mb-2" />
                <p className="text-blue-600 font-semibold">Ajouter une publication</p>
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

export default Facebook;
