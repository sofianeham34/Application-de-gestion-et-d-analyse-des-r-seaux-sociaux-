import { useEffect, useState } from "react";
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import SocialButton from "./SocialButton";
import { axiosInstance } from "../utils/axios.jsx";

function ConfigSocialMedia() {
    const [error, setError] = useState(null);
    const [socialConnections, setSocialConnections] = useState({
        facebook: false,
        twitter: false,
        instagram: false,
    });
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    const handleLinkSocialMedia = async (network) => {
        try {
            const authUrl = (import.meta.env.VITE_PROXY_GATEWAY || "") + `/api/socialauth/connect/${network}`;

            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const authWindow = window.open(
                authUrl,
                "_blank",
                `width=${width},height=${height},top=${top},left=${left}`,
            );

            const checkPopupClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkPopupClosed);
                    fetchSocial(); // Mise à jour après fermeture du popup
                }
            }, 1000);
        } catch (err) {
            setError(`Une erreur est survenue lors de la connexion au réseau social : ${err.message}`);
        }
    };

    const handleDisconnectSocialMedia = async (network) => {
        try {
            await axiosInstance.delete(`/api/socialauth/${userId}/${network}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            fetchSocial(); // Mise à jour après la déconnexion
        } catch (err) {
            setError(`Erreur lors de la déconnexion : ${err.message}`);
        }
    };

    const fetchSocial = async () => {
        if (!token || !userId) {
            console.warn("Token ou user_id non trouvé, l'utilisateur n'est peut-être pas connecté.");
            return;
        }

        try {
            const response = await axiosInstance.get(`/api/socialAuth/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = response.data;

            const connections = {
                facebook: data.some(item => item.provider === 'facebook'),
                twitter: data.some(item => item.provider === 'twitter'),
                instagram: data.some(item => item.provider === 'instagram'),
            };
            setSocialConnections(connections);
            setLoading(false);
        } catch (err) {
            setError(`Erreur lors de la récupération des données utilisateur : ${err.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSocial();
    }, [fetchSocial]);

    if (loading) {
        return <div className="text-center">Chargement...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Configurer vos réseaux sociaux</h2>
            <div className="space-y-4">
                <SocialButton
                    handleClick={() => handleLinkSocialMedia('facebook')}
                    handleDisconnect={handleDisconnectSocialMedia}
                    logo={<FaFacebook size={20} />}
                    network="facebook"
                    connected={socialConnections.facebook}
                />
                <SocialButton
                    handleClick={() => handleLinkSocialMedia('twitter')}
                    handleDisconnect={handleDisconnectSocialMedia}
                    logo={<FaTwitter size={30} />}
                    network="twitter"
                    connected={socialConnections.twitter}
                />
                <SocialButton
                    handleClick={() => handleLinkSocialMedia('instagram')}
                    handleDisconnect={handleDisconnectSocialMedia}
                    logo={<FaInstagram size={30} />}
                    network="instagram"
                    connected={socialConnections.instagram}
                />
            </div>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
    );
}

export default ConfigSocialMedia;
