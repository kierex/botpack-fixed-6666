const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
    name: "image",
    version: "1.0",
    hasPermission: 0,
    description: "Search and fetch images from Pinterest",
    credits: "Vern",
    usePrefix: false,
    commandCategory: "Search",
    usages: "<query> -<number>",
    cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
    const input = args.join(" ");
    const cachePath = path.join(__dirname, "cache");

    try {
        // Check for "-<number>" format
        if (!input.includes("-")) {
            return api.sendMessage(
                "⛔ Invalid usage.\n\nPlease use the format: <search term> -<number>\nExample: wallpaper -5",
                event.threadID, event.messageID
            );
        }

        api.sendMessage("🔍 Searching images, please wait...", event.threadID, event.messageID);

        // Extract query and number
        const [query, countStr] = input.split("-");
        const searchQuery = query.trim();
        let count = parseInt(countStr.trim());

        if (isNaN(count) || count < 1 || count > 10) {
            return api.sendMessage(
                "⛔ Invalid number of images.\nPlease enter a number between 1 and 10.\nExample: cat -3",
                event.threadID, event.messageID
            );
        }

        // API call
        const apiUrl = `https://jonellccprojectapis10.adaptable.app/api/pin?title=${encodeURIComponent(searchQuery)}&count=${count}`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.data || res.data.data.length === 0) {
            return api.sendMessage(
                `❌ No images found for "${searchQuery}". Try another search.`,
                event.threadID, event.messageID
            );
        }

        const images = res.data.data.slice(0, count);
        const attachments = [];

        await fs.ensureDir(cachePath);

        // Download images
        for (let i = 0; i < images.length; i++) {
            const imgRes = await axios.get(images[i], { responseType: "arraybuffer" });
            const imgPath = path.join(cachePath, `image_${i + 1}.jpg`);
            await fs.writeFile(imgPath, imgRes.data);
            attachments.push(fs.createReadStream(imgPath));
        }

        // Send message
        await api.sendMessage({
            body: `📸 Pinterest Image Results\nShowing ${count} result(s) for: "${searchQuery}"`,
            attachment: attachments
        }, event.threadID, event.messageID);

        // Cleanup
        await fs.remove(cachePath);

    } catch (err) {
        console.error("Image search error:", err);
        api.sendMessage("⚠️ An error occurred while fetching images. Try again later.", event.threadID, event.messageID);
        await fs.remove(cachePath);
    }
};
