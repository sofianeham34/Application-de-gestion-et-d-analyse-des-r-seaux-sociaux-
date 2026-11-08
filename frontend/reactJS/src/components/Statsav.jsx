// Fichier : StatistiquesAvancees.jsx

import React, { useEffect, useState } from "react";
import { axiosInstance } from "../utils/axios.jsx";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FaInstagram, FaFacebookSquare } from "react-icons/fa";

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56"];

const StatistiquesAvancees = () => {
  const [data, setData] = useState({ instagram: [], facebook: [] });
  const [platform, setPlatform] = useState("instagram");
  const [filtered, setFiltered] = useState([]);
  const [typeDistribution, setTypeDistribution] = useState([]);
  const [engagementTimeline, setEngagementTimeline] = useState([]);
  const [likesTimeline, setLikesTimeline] = useState([]);
  const [commentsTimeline, setCommentsTimeline] = useState([]);
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [likesByPost, setLikesByPost] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("user_id");
      const [igRes, fbRes] = await Promise.all([
        axiosInstance.get(`/api/posts/instagram/posts/${userId}`),
        axiosInstance.get(`/api/posts/facebook/posts/${userId}`)
      ]);
      setData({ instagram: igRes.data || [], facebook: fbRes.data || [] });
    };
    fetchData();
  }, []);

  useEffect(() => {
    let posts = data[platform];

    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      posts = posts.filter(p => {
        const date = new Date(p.timestamp || p.created_time);
        return date >= start && date <= end;
      });
    }

    const filteredPosts = posts.map(post => {
      const date = new Date(post.timestamp || post.created_time);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const type = post.media_type || (post.full_picture ? "image" : "autre");
      const likes = post.like_count || post.likes?.summary?.total_count || 0;
      const comments = post.comments_count || post.comments?.summary?.total_count || 0;
      return {
        id: post.id,
        type,
        month,
        engagement: likes + comments,
        likes,
        comments,
        caption: post.caption || post.message,
        image: post.media_url || post.full_picture,
        link: post.permalink || post.permalink_url
      };
    });

    const filteredByType = mediaTypeFilter === "all"
      ? filteredPosts
      : filteredPosts.filter(p => (p.type || "").toLowerCase() === mediaTypeFilter.toLowerCase());

    const filteredBySearch = searchTerm
      ? filteredByType.filter(p => p.caption?.toLowerCase().includes(searchTerm.toLowerCase()))
      : filteredByType;

    const hashtagFiltered = selectedHashtags.length === 0
      ? filteredBySearch
      : filteredBySearch.filter(post => {
          const tags = (post.caption?.match(/#[\w-]+/g) || []).map(t => t.toLowerCase());
          return selectedHashtags.some(tag => tags.includes(tag));
        });

    const sorted = [...hashtagFiltered];
    if (sortOption === "likes") {
      sorted.sort((a, b) => b.likes - a.likes);
    } else if (sortOption === "comments") {
      sorted.sort((a, b) => b.comments - a.comments);
    } else if (sortOption === "date") {
      sorted.sort((a, b) => new Date(b.month) - new Date(a.month));
    }

    const types = {};
    const engagement = {};
    const likes = {};
    const comments = {};

    sorted.forEach(p => {
      types[p.type] = (types[p.type] || 0) + 1;
      if (!engagement[p.month]) engagement[p.month] = { month: p.month, engagement: 0 };
      if (!likes[p.month]) likes[p.month] = { month: p.month, likes: 0 };
      if (!comments[p.month]) comments[p.month] = { month: p.month, comments: 0 };
      engagement[p.month].engagement += p.engagement;
      likes[p.month].likes += p.likes;
      comments[p.month].comments += p.comments;
    });

    const likesData = sorted.map(p => ({
      name: p.caption?.slice(0, 20) || p.id,
      value: p.likes
    }));
    const commentsData = sorted.map(p => ({
      name: p.caption?.slice(0, 20) || p.id,
      value: p.comments
    }));

    setFiltered(sorted);
    setTypeDistribution(Object.entries(types).map(([key, value]) => ({ name: key, value })));
    setEngagementTimeline(Object.values(engagement).sort((a, b) => a.month.localeCompare(b.month)));
    setLikesTimeline(Object.values(likes).sort((a, b) => a.month.localeCompare(b.month)));
    setCommentsTimeline(Object.values(comments).sort((a, b) => a.month.localeCompare(b.month)));
    setLikesByPost(likesData);
    setCommentsByPost(commentsData);
  }, [platform, data, mediaTypeFilter, dateRange, searchTerm, selectedHashtags, sortOption]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filtered.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filtered.length / postsPerPage);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Statistiques Avancées</h1>
  
      <div className="flex flex-wrap gap-4 items-end">
        <button onClick={() => setPlatform("instagram")} className={`px-4 py-2 rounded ${platform === "instagram" ? "bg-pink-500 text-white" : "bg-gray-200"}`}><FaInstagram className="inline mr-2" />Instagram</button>
        <button onClick={() => setPlatform("facebook")} className={`px-4 py-2 rounded ${platform === "facebook" ? "bg-blue-600 text-white" : "bg-gray-200"}`}><FaFacebookSquare className="inline mr-2" />Facebook</button>
  
        <select className="p-2 border rounded" value={mediaTypeFilter} onChange={e => setMediaTypeFilter(e.target.value)}>
          <option value="all">Tous les types</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Vidéo</option>
        </select>
  
        <input type="date" className="p-2 border rounded" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
        <input type="date" className="p-2 border rounded" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
        <input type="text" placeholder="Recherche légende..." className="p-2 border rounded" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <button
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          onClick={() => {
            setDateRange({ start: '', end: '' });
            setMediaTypeFilter("all");
            setSearchTerm("");
            setSelectedHashtags([]);
            setSortOption("");
          }}
        >
          Réinitialiser
        </button>
      </div>
  
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h2 className="font-semibold mb-4">Engagement par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
  
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h2 className="font-semibold mb-4">Répartition par type de contenu</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
  
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h2 className="font-semibold mb-4">Likes par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={likesTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="likes" fill="#FF6384" />
            </BarChart>
          </ResponsiveContainer>
        </div>
  
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h2 className="font-semibold mb-4">Commentaires par mois</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commentsTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="comments" fill="#36A2EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
  
      {/* Tableau des posts */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-semibold mb-4">Tableau des posts filtrés</h2>
  
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <select
            multiple
            className="p-2 border rounded min-w-[200px]"
            value={selectedHashtags}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedHashtags(selected);
            }}
          >
            {[...new Set(filtered.map(p =>
              (p.caption?.match(/#[\w-]+/g) || []).map(tag => tag.toLowerCase())
            ).flat())].map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
  
          <select
            className="p-2 border rounded"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="">🔠 Aucun tri</option>
            <option value="likes">🔥 Plus de likes</option>
            <option value="date">🕒 Plus récent</option>
            <option value="comments">💬 Plus de commentaires</option>
          </select>
        </div>
  
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Image</th>
                <th className="px-4 py-2 border">Légende</th>
                <th className="px-4 py-2 border">Engagement</th>
                <th className="px-4 py-2 border">Likes</th>
                <th className="px-4 py-2 border">Commentaires</th>
                <th className="px-4 py-2 border">Mois</th>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Lien</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {post.image && (
                      <img src={post.image} alt="" className="h-12 w-12 object-cover rounded" />
                    )}
                  </td>
                  <td className="border px-4 py-2 max-w-xs truncate">{post.caption}</td>
                  <td className="border px-4 py-2">{post.engagement}</td>
                  <td className="border px-4 py-2">{post.likes}</td>
                  <td className="border px-4 py-2">{post.comments}</td>
                  <td className="border px-4 py-2">{post.month}</td>
                  <td className="border px-4 py-2">{post.type}</td>
                  <td className="border px-4 py-2">
                    <a href={post.link} className="text-blue-500 underline text-xs" target="_blank" rel="noopener noreferrer">Voir</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="mt-4 flex justify-center gap-2">
          {[...Array(totalPages).keys()].map(num => (
            <button
              key={num + 1}
              className={`px-3 py-1 rounded border ${currentPage === num + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setCurrentPage(num + 1)}
            >
              {num + 1}
            </button>
          ))}
        </div>
      </div>
  
      {/* Statistiques sociales (camemberts par post) */}
      <div className="mt-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h2 className="font-semibold mb-4">Répartition des likes par post</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={likesByPost}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {likesByPost.map((entry, index) => (
                    <Cell key={`like-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
  
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h2 className="font-semibold mb-4">Répartition des commentaires par post</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commentsByPost}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {commentsByPost.map((entry, index) => (
                    <Cell key={`comment-cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default StatistiquesAvancees;
