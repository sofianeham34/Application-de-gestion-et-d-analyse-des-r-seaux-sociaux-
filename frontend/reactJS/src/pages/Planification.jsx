import { useState, useEffect } from "react";
import Calendar from "../components/Calendrier"; // Importation du composant Calendrier pour afficher le calendrier
import { axiosInstance } from "../utils/axios.jsx"; // Importation de l'instance axios pour effectuer les appels API
import BarreHaut from "../components/BarreHaut.jsx"; // Importation de la barre de navigation supérieure

const Planification = () => {
    // État pour stocker les événements du calendrier récupérés depuis l'API
    const [calendarEvents, setCalendarEvents] = useState([]);

    // État pour stocker le nombre d'événements par jour
    const [countPerDay, setCountPerDate] = useState(null);

    // État pour gérer le statut de chargement
    const [loading, setLoading] = useState(true);

    // Fonction asynchrone pour récupérer les publications programmées via l'API
    const fetchScheduledPosts = async () => {
        try {
            // Mise à jour de l'état de chargement avant l'appel API
            setLoading(true);

            // Appel API pour récupérer les publications programmées de l'utilisateur
            const res = await axiosInstance.get(`/api/posts/scheduled/${localStorage.getItem("user_id")}`);

            console.log("Publications a venir reçues :", res.data);

            // Mise à jour des événements du calendrier avec les publications reçues
            setCalendarEvents(res.data);

            // Calcul du nombre de publications par jour en réduisant les données récupérées
            setCountPerDate(res.data.reduce((acc, post) => {
                const dateStr = new Date(post.scheduledFor).toISOString().split("T")[0]; // Extraction de la date au format ISO
                acc[dateStr] = (acc[dateStr] || 0) + 1; // Comptage des publications pour chaque jour
                return acc;
            }, {}));
        } catch (err) {
            // Gestion des erreurs en cas de problème avec l'API
            console.error("Erreur récupération posts scheduled :", err);
        } finally {
            // Mise à jour de l'état de chargement à false une fois l'appel terminé (réussi ou en erreur)
            setLoading(false);
        }
    };

    // Utilisation du hook useEffect pour appeler la fonction fetchScheduledPosts lors du premier rendu du composant
    useEffect(() => {
        fetchScheduledPosts();
    }, []); // Le tableau vide [] signifie que la fonction sera appelée une seule fois lors du premier rendu

    return (
        <div>
            {/* Barre de navigation supérieure */}
            <BarreHaut />

            {/* Titre de la page */}
            <h1 className="text-xl font-bold text-center mb-4 pt-20" style={{ color: '#FF0035' }}>
                Page Planification
            </h1>

            {/* Affichage du loader si les données sont en cours de chargement */}
            {loading ? (
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FF0035]"></div> {/* Loader spinner */}
                </div>
            ) : (
                // Si le chargement est terminé, afficher le calendrier
                <Calendar events={calendarEvents} countPerDay={countPerDay} />
            )}
        </div>
    );
};

export default Planification;
