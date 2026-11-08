
import React, { useEffect, useState } from "react";
import { axiosInstance } from "../utils/axios.jsx";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FaHeart, FaCommentDots, FaCalendarAlt, FaChartLine, FaStar } from "react-icons/fa";

const TooltipBubble = ({ title, children }) => (
  <div className="absolute z-10 bg-white shadow-lg rounded p-3 text-sm border border-gray-200 w-56">
    <div className="font-bold text-gray-800 mb-2">{title}</div>
    <div>{children}</div>
  </div>
);

const KPIBlock = ({ icon: Icon, title, value, tooltipContent, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-white shadow rounded p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
    >
      <div className="text-2xl"><Icon /></div>
      <div className="text-right">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>
      {hovered && tooltipContent && (
        <div className="absolute top-full mt-2 left-0">
          <TooltipBubble title={title}>{tooltipContent}</TooltipBubble>
        </div>
      )}
    </div>
  );
};

const COLORS = ["#FF6384", "#36A2EB"];

const StatistiquesGlobales = () => {
  const [data, setData] = useState({ instagram: [], facebook: [] });
  const [kpi, setKpi] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [topPost, setTopPost] = useState(null);
  const [showPlatformBreakdown, setShowPlatformBreakdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    const userId = localStorage.getItem("user_id");
    //a modifier possiblement
    //const resfacebookengagement = await axiosInstance.get(`/api/stat/engagement/facebook/${userId}?dateStart=${dateRange.start}&dateEnd=${dateRange.end}`);
    //console.log("le resultat requete facebook stat",resfacebookengagement);

    const [igRes, fbRes] = await Promise.all([
      axiosInstance.get(`/api/posts/instagram/posts/${userId}`),
      axiosInstance.get(`/api/posts/facebook/posts/${userId}`)
    ]);

    let ig = igRes.data || [];
    let fb = fbRes.data || [];

    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      ig = ig.filter(post => new Date(post.timestamp) >= start && new Date(post.timestamp) <= end);
      fb = fb.filter(post => new Date(post.created_time) >= start && new Date(post.created_time) <= end);
    }

    setData({ instagram: ig, facebook: fb });

    const igLikes = ig.reduce((a, b) => a + (b.like_count || 0), 0);
    const fbLikes = fb.reduce((a, b) => a + (b.likes?.summary?.total_count || 0), 0);
    const igComments = ig.reduce((a, b) => a + (b.comments_count || 0), 0);
    const fbComments = fb.reduce((a, b) => a + (b.comments?.summary?.total_count || 0), 0);
    const posts = ig.length + fb.length;
    const engagement = posts ? ((igLikes + fbLikes + igComments + fbComments) / posts).toFixed(2) : 0;

    setKpi({
      likes: igLikes + fbLikes,
      comments: igComments + fbComments,
      posts,
      engagement,
      instagramPosts: ig.length,
      facebookPosts: fb.length,
      igEngagement: igLikes + igComments,
      fbEngagement: fbLikes + fbComments
    });

    const timelineMap = {};
    const mapPost = (post, dateField, src) => {
      const date = new Date(post[dateField]);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!timelineMap[month]) timelineMap[month] = { month, instagram: 0, facebook: 0 };
      timelineMap[month][src]++;
    };

    ig.forEach(post => mapPost(post, "timestamp", "instagram"));
    fb.forEach(post => mapPost(post, "created_time", "facebook"));
    setTimeline(Object.values(timelineMap).sort((a, b) => a.month.localeCompare(b.month)));

    const allPosts = [...ig, ...fb];
    const top = allPosts.reduce((max, post) => {
      const likes = post.like_count || post.likes?.summary?.total_count || 0;
      const comments = post.comments_count || post.comments?.summary?.total_count || 0;
      const engagement = likes + comments;
      return engagement > max.engagement ? { ...post, engagement } : max;
    }, { engagement: 0 });
    
    setTopPost(top);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Statistiques Globales</h1>

      {}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de début</label>
          <input type="date" className="border rounded p-2" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de fin</label>
          <input type="date" className="border rounded p-2" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>OK</button>
        <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={() => { setDateRange({ start: '', end: '' }); fetchData(); }}>Réinitialiser</button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBlock
          icon={FaHeart}
          title="Total J'aimes"
          value={kpi.likes}
          tooltipContent={<div>Instagram : <strong>{data.instagram.reduce((a, b) => a + (b.like_count || 0), 0)}</strong><br />Facebook : <strong>{data.facebook.reduce((a, b) => a + (b.likes?.summary?.total_count || 0), 0)}</strong></div>}
        />
        <KPIBlock
          icon={FaCommentDots}
          title="Commentaires total"
          value={kpi.comments}
          tooltipContent={<div>Instagram : <strong>{data.instagram.reduce((a, b) => a + (b.comments_count || 0), 0)}</strong><br />Facebook : <strong>{data.facebook.reduce((a, b) => a + (b.comments?.summary?.total_count || 0), 0)}</strong></div>}
        />
        <KPIBlock
          icon={FaCalendarAlt}
          title="Total Posts"
          value={kpi.posts}
          tooltipContent={<div>Instagram : <strong>{kpi.instagramPosts}</strong><br />Facebook : <strong>{kpi.facebookPosts}</strong></div>}
          onClick={() => setShowPlatformBreakdown(prev => !prev)}
        />
        <KPIBlock
          icon={FaChartLine}
          title="Engagement Moyen"
          value={kpi.engagement}
          tooltipContent={<div>Formule : (Likes + Comments) / Posts<br />Total : <strong>{(kpi.engagement * kpi.posts).toFixed(0)}</strong></div>}
        />
      </div>

      {}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-semibold mb-4">Comparatif d'engagement par mois</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="instagram" fill="#FF6384" name="Instagram" />
            <Bar dataKey="facebook" fill="#36A2EB" name="Facebook" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-semibold mb-4">Timeline d'activité</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="instagram" stroke="#FF6384" name="Instagram" />
            <Line type="monotone" dataKey="facebook" stroke="#36A2EB" name="Facebook" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h2 className="font-semibold mb-4">Répartition de l'engagement total</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[{ name: 'Instagram', value: kpi.igEngagement }, { name: 'Facebook', value: kpi.fbEngagement }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              <Cell fill="#FF6384" />
              <Cell fill="#36A2EB" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {}
      {topPost && (
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><FaStar className="text-yellow-400" /> Post le plus performant</h2>
          <div className="flex flex-col md:flex-row items-start gap-4">
            {topPost.media_url || topPost.full_picture ? (
              <img src={topPost.media_url || topPost.full_picture} alt="Top Post" className="w-full md:w-64 rounded" />
            ) : null}
            <div>
              <p className="font-semibold">Engagement : {topPost.engagement}</p>
              <p className="text-gray-600 mt-2">{topPost.caption || topPost.message || "Aucune description"}</p>
              <a
                href={topPost.permalink || topPost.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline mt-2 inline-block"
              >
                Voir le post
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatistiquesGlobales;
