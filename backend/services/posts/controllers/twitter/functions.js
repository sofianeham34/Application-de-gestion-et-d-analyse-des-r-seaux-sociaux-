// Publie un tweet, avec une image si un fichier est fourni.
// Les erreurs sont propagées pour que l'appelant sache si la publication a échoué.
const tweetWithImage = async (fileBuffer, mimeType, text, twitterClient) => {
    if (fileBuffer) {
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(fileBuffer), { mimeType });
        await twitterClient.v2.tweet({ text, media: { media_ids: [mediaId] } });
    } else {
        await twitterClient.v2.tweet(text);
    }
};

module.exports = { tweetWithImage };
