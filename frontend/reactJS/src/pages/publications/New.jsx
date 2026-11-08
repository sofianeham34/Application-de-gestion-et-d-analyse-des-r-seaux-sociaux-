import { useState, useEffect, useRef } from "react";
import { EyeOff } from 'lucide-react';

import { DateTime } from "luxon";
import SelectCompte from "../../components/SelectCompte.jsx";
import AjoutFichierBouton from "../../components/AjoutFichierBouton.jsx";
import BarreHaut from "../../components/BarreHaut.jsx";
import SidebarPublication from "../../components/SideBarPublication.jsx";
import { axiosInstance } from "../../utils/axios";
import Previsualisation from "../../components/Previsualisation.jsx";

import { Bold, Italic, Underline, Wand2, Languages } from 'lucide-react';
function New() {
    const [message, setMessage] = useState("");
    const userId = localStorage.getItem("user_id");
    const [networks, setNetworks] = useState([]);
    const [action, setAction] = useState("");
    const [fichier, setFichier] = useState(null);
    const [scheduleDate, setScheduleDate] = useState("");
    const dateInputRef = useRef(null);
    const [infoComptes, setInfoComptes] = useState({});
    const [selectedTemplate, setSelectedTemplate] = useState("");

    const templates = {
        publicite: "Découvrez notre nouveau produit ! 🔥\n[Décrire le produit] \n\n\n\n#Promo #NouveauProduit #[NomProduit]",
        annonce: "Nous avons une grande nouvelle à partager avec vous ! 🎉\n[Faites votre annonce] \n\n\n\n#Annonce #Important",
        evenement: "Rejoignez-nous pour notre événement spécial ce week-end ! 🎈\n [Parlez de l'évènement] \n\n\n\n#Événement #Invitation",
        promotion : " ⚡  Offre limitée dans le temps ! Profitez de -[x]% sur tout le site aujourd'hui seulement. \n [www.exemple.com]\n\n\n\n#BonPlan #PromoDuJour #[NomBoutique] ",
        sondage : "📊 On a besoin de votre avis ! Préférez-vous [A] ou [B] ? Répondez en commentaire 👇 \n\n\n\n#Sondage #VotreAvisCompte #[ThemeDuSondage]",
        retourEvenement : "Merci à tous pour votre présence ce week-end 🙌 Revivez les meilleurs moments en images ! \n\n\n\n #AfterEvent #Souvenirs #[NomEvenement]"
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleActionChange = (e) => {
        const selectedAction = e.target.value;
        setAction(selectedAction);
        if (selectedAction === "best") {
            const bestDate = getMeilleurMoment();
            setScheduleDate(bestDate);
        }
    };

    const handlePublish = () => {
        if (message.trim() === "") {
            alert("Le message ne peut pas être vide !");
            return;
        }
        if (action === "maintenant") {
            publierMaintenant();
        } else if (action === "planifier" || action === "best") {
            planifierPublication();
        } else if (action === "brouillon") {
        } else {
            alert("Veuillez sélectionner une action !");
        }
    };

    const publierMaintenant = async () => {
        if (!networks.length) {
            alert("Veuillez sélectionner au moins un réseau !");
            return;
        }
        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("networks", JSON.stringify(networks));
            formData.append("message", message);

            if (fichier) {
                formData.append("file", fichier);
            }

            const response = await axiosInstance.post(
                "/api/posts",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            const data = await response.data;
            if (response.data) {
                console.log("Post publié avec succès :", data);
            }
            window.location.reload();
        } catch (err) {
            console.error("Erreur lors de la publication :", err.message);
        }
    };

    const planifierPublication = async () => {
        if (!networks.length) {
            alert("Veuillez sélectionner au moins un réseau !");
            return;
        }
        if (scheduleDate === "" || new Date(scheduleDate) < new Date()) {
            alert("Veuillez choisir une date de planification valide !");
            return;
        }
        try {
            const utcDate = DateTime.fromISO(scheduleDate, { zone: 'Europe/Paris' }).toUTC().toISO();
            const formData = new FormData();
            formData.append("userId", userId);
            networks.forEach(n => {
                formData.append("networks[]", n);
            });
            formData.append("message", message);

            if (fichier) {
                formData.append("file", fichier);
            }

            formData.append("scheduleDate", utcDate );

            const response = await axiosInstance.post(
                "/api/posts/schedule",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            const data = await response.data;
            if (response.data) {
                console.log("Post planifié avec succès :", data);
            }
            window.location.reload();
        } catch (err) {
            console.error("Erreur lors de la planification :", err.message);
        }
    };

    const getMeilleurMoment = () => {
        const now = DateTime.now().setZone("Europe/Paris"); // Très important

        const today1230 = now.set({ hour: 12, minute: 30, second: 0, millisecond: 0 });
        const today1500 = now.set({ hour: 15, minute: 0, second: 0, millisecond: 0 });
        const today1945 = now.set({ hour: 19, minute: 45, second: 0, millisecond: 0 });
        const tomorrow1230 = now.plus({ days: 1 }).set({ hour: 12, minute: 30, second: 0, millisecond: 0 });

        let bestTime;

        if (now < today1230) {
            bestTime = today1230;
        } else if (now < today1500) {
            bestTime = today1500;
        } else if (now < today1945) {
            bestTime = today1945;
        } else {
            bestTime = tomorrow1230;
        }
        return bestTime.toISO({ suppressMilliseconds: true }).slice(0, 16);
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    useEffect(() => {
        console.log("le fichier", fichier);
    }, [fichier]);

    useEffect(() => {
        if (action === "planifier" && dateInputRef.current) {
            setTimeout(() => {
                try {
                    dateInputRef.current.showPicker();
                } catch (e) {
                    console.warn("Impossible d'ouvrir le sélecteur de date automatiquement", e);
                }
            }, 100);
        }
    }, [action]);

    const stylizeText = (text, style) => {
        const toBold = (c) =>
            String.fromCodePoint((c >= 65 && c <= 90) ? c + 0x1D400 - 65 :
                (c >= 97 && c <= 122) ? c + 0x1D41A - 97 : c);
        const toItalic = (c) =>
            String.fromCodePoint((c >= 65 && c <= 90) ? c + 0x1D434 - 65 :
                (c >= 97 && c <= 122) ? c + 0x1D44E - 97 : c);

        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (style === "bold") return toBold(code);
            if (style === "italic") return toItalic(code);
            return char;
        }).join('');
    };

    const unStylizeText = (text) => {
        return text.split('').map(char => {
            const code = char.codePointAt(0);

            // Bold A-Z : 0x1D400-0x1D419, a-z : 0x1D41A-0x1D433
            if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(code - 0x1D400 + 65);
            if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(code - 0x1D41A + 97);

            // Italic A-Z : 0x1D434-0x1D44D, a-z : 0x1D44E-0x1D467
            if (code >= 0x1D434 && code <= 0x1D44D) return String.fromCharCode(code - 0x1D434 + 65);
            if (code >= 0x1D44E && code <= 0x1D467) return String.fromCharCode(code - 0x1D44E + 97);

            return char;
        }).join('');
    };
    const extractLetters = (text) => text.replace(/[^a-zA-Z]/g, "");

    const applyStyleToSelection = (style) => {
        const textarea = document.getElementById("message");
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.slice(start, end);

        if (!selected) return;

        let newText;

        if (style === "underline") {
            const isUnderlined = selected.startsWith("_") && selected.endsWith("_");
            newText = textarea.value.slice(0, start) +
                (isUnderlined ? selected.slice(1, -1) : "_" + selected + "_") +
                textarea.value.slice(end);
        } else {
            const normalText = unStylizeText(selected);
            const reStylized = stylizeText(normalText, style);

            const lettersOriginal = extractLetters(selected);
            const lettersStyled = extractLetters(reStylized);

            const alreadyStylized = lettersOriginal === lettersStyled;

            const replacement = alreadyStylized ? normalText : reStylized;

            newText = textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
        }

        setMessage(newText);
    };

    const corrigerTexte = async () => {
        if (!message.trim()) return;

        try {
            const response = await axiosInstance.post(
                "/api/posts/corriger",
                { message }, // ← ici on envoie un objet JSON
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const texteCorrige = response.data.message;
            setMessage(texteCorrige.replace(/^"(.*)"$/, "$1"));
        } catch (error) {
            console.error("Erreur lors de la correction :", error);
            alert("Une erreur est survenue pendant la correction.");
        }
    };

    const traduireTexte = async (langue) => {
        if (!message.trim() || !langue) return;
        try {
            const response = await axiosInstance.post(
                "/api/posts/traduire",
                { message, langue }, // ← idem ici
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const texteTraduit = response.data.message;
            setMessage(texteTraduit.replace(/^"(.*)"$/, "$1"));
        } catch (error) {
            console.error("Erreur lors de la traduction :", error);
            alert("Une erreur est survenue pendant la traduction.");
        }
    };






    return (
        <div>
            <BarreHaut />
            <SidebarPublication />
            {/* Marge droite : place réservée au panneau de prévisualisation (1/3 de l'écran) */}
            <div className="ml-64 mr-[33.333%] mt-16">
                <div className="min-h-screen flex bg-gray-100 overflow-hidden">
                    <div className="flex-1 h-screen bg-gray-100 overflow-y-auto p-6">
                        <SelectCompte networks={networks} setNetworks={setNetworks} setInfoComptes={setInfoComptes} />

                        <div className="mb-4">
                            <label className="block mb-2 text-gray-700 font-medium">Choisissez un modèle de message :</label>
                            <div className="flex gap-3 flex-wrap">
                                {Object.keys(templates).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            if (selectedTemplate === key) {
                                                setSelectedTemplate("");
                                                setMessage("");
                                            } else {
                                                setSelectedTemplate(key);
                                                setMessage(templates[key]);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-lg border font-medium ${
                                            selectedTemplate === key
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white hover:bg-red-100 text-red-500 border-red-500'
                                        }`}
                                    >
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </button>
                                ))}

                            </div>
                        </div>

                        <div className="relative mb-6">
                            <label htmlFor="message" className="block text-gray-700 mb-2">Votre message :</label>
                            <textarea
                                id="message"
                                className="w-full border border-gray-300 rounded-md p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                                style={{ minHeight: "300px", minWidth: "500px" }}
                                value={message}
                                onChange={handleMessageChange}
                            ></textarea>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <button onClick={() => applyStyleToSelection("bold")}><Bold className="w-5 h-5 text-gray-600" /></button>
                                <button onClick={() => applyStyleToSelection("italic")}><Italic className="w-5 h-5 text-gray-600" /></button>
                                <button onClick={() => applyStyleToSelection("underline")}><Underline className="w-5 h-5 text-gray-600" /></button>
                                <button onClick={corrigerTexte} className="flex items-center gap-1 text-blue-600 text-sm hover:underline"><Wand2 className="w-5 h-5" />Corriger</button>
                                <div className="flex items-center gap-1 text-green-700">
                                    <Languages className="w-5 h-5" />
                                    <label htmlFor="langues" className="text-sm">Traduire en</label>
                                    <select id="langues" className="border border-gray-300 rounded px-2 py-1 text-sm" onChange={(e) => traduireTexte(e.target.value)}>
                                        <option value="">Langue</option>
                                        <option value="Arabe">Arabe</option>
                                        <option value="Allemand">Allemand</option>
                                        <option value="Anglais">Anglais</option>
                                        <option value="Mandarin">Mandarin</option>
                                        <option value="Espagnol">Espagnol</option>
                                        <option value="Français">Français</option>
                                        <option value="Italien">Italien</option>
                                        <option value="Japonais">Japonais</option>
                                        <option value="Portugais">Portugais</option>
                                        <option value="Russe">Russe</option>
                                    </select>
                                </div>
                                <span className="ml-auto"><AjoutFichierBouton gestionFichier={setFichier} /></span>
                            </div>

                            {/*<div className="absolute bottom-2 right-3">
                                    <button className="bg-[#FF0035] hover:bg-red-700 text-white py-2 px-6 rounded-lg shadow"> Correction IA</button>
                                    <AjoutFichierBouton gestionFichier={setFichier} />
                                </div>*/}
                        </div>

                        <label htmlFor="publish-select">Choisissez une action : </label>
                        <select
                            id="publish-select"
                            className="bg-[#FF0035] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md w-fit mt-4"
                            value={action}
                            onChange={handleActionChange}
                        >
                            <option value="" disabled>-- Sélectionnez une option --</option>
                            <option value="maintenant">Publier Maintenant</option>
                            <option value="planifier">Planifier</option>
                            <option value="best">Publier au meilleur moment</option>
                        </select>
                        <button
                            onClick={handlePublish}
                            className="ml-4 bg-[#FF0035] hover:bg-red-700 text-white py-2 px-6 rounded-lg shadow"
                        >
                            Publier
                        </button>
                        {(action === "planifier" || action === "best") && (
                            <div className="mt-4">
                                <label className="block text-gray-700 mb-2" htmlFor="schedule-date">
                                    {action === "best" ? "Créneau optimal détecté :" : "Choisissez la date de planification :"}
                                </label>
                                <input
                                    id="schedule-date"
                                    type="datetime-local"
                                    ref={dateInputRef}
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="border p-2 rounded-md"
                                    disabled={action === "best"}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <div className="w-1/3 fixed right-0 top-16 h-screen overflow-y-auto p-6 border-l bg-white">
                <h2 className="text-xl font-semibold mb-4">Prévisualisation</h2>
                {networks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <EyeOff className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Rien à voir pour l'instant...</p>
                        <p className="text-sm">Sélectionnez un compte pour voir l’aperçu</p>
                    </div>
                ) : (
                    networks.map((account, index) => (
                        <Previsualisation
                            key={index}
                            platform={account.platform || account}
                            text={message}
                            image={fichier ? URL.createObjectURL(fichier) : null}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default New;