// Publie les posts planifiés dont l'heure est passée (vérification chaque minute).
const cron = require("node-cron");
const Post = require("../models/Post");
const { publishToNetworks } = require("../services/publisher");

let running = false;

async function publishDuePosts() {
    // Évite deux exécutions simultanées si une publication dure plus d'une minute
    if (running) return;
    running = true;
    try {
        const posts = await Post.find({ scheduledFor: { $lte: new Date() }, status: "scheduled" });
        for (const post of posts) {
            try {
                const media = post.mediaFiles?.[0];
                const results = await publishToNetworks({
                    userId: post.userId.toString(),
                    networks: post.platform,
                    message: post.content,
                    fileBuffer: media?.data || null,
                    mimeType: media?.contentType || null,
                });
                const ok = results.some((r) => r.ok);
                post.status = ok ? "published" : "failed";
                post.publishedAt = ok ? new Date() : undefined;
                console.log(`Post planifié ${post._id} :`, results.map((r) => `${r.network}=${r.ok ? "ok" : r.error}`).join(", "));
            } catch (err) {
                // Le post n'est pas retenté indéfiniment (risque de doublons sur les réseaux)
                console.error(`Erreur lors de la publication du post ${post._id} :`, err.message);
                post.status = "failed";
            }
            await post.save();
        }
    } catch (err) {
        console.error("Erreur lors de la récupération des posts planifiés :", err.message);
    } finally {
        running = false;
    }
}

cron.schedule("* * * * *", publishDuePosts);

module.exports = { publishDuePosts };
