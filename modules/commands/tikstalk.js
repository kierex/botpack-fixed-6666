const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "tikstalk",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Vern (Fixed by ChatGPT)",
  description: "Stalk TikTok user information",
  usePrefix: true,
  commandCategory: "tiktok",
  usage: "[username]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const username = args[0];
  if (!username)
    return api.sendMessage(
      "❌ Please provide a TikTok username.\nExample: ?tikstalk jelly09",
      event.threadID,
      event.messageID
    );

  const waitingMsg = await api.sendMessage("🔍 Fetching TikTok user info...", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://kaiz-apis.gleeze.com/api/tikstalk?username=${encodeURIComponent(username)}`);
    const data = res.data;

    if (!data || !data.username) {
      return api.sendMessage("⚠️ Could not find TikTok user.", event.threadID, event.messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const avatarPath = path.join(cacheDir, `${data.username}_avatar.jpg`);

    const avatarRes = await axios({
      url: data.avatarLarger,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(avatarPath);
    avatarRes.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(
        {
          body:
            `𝗧𝗶𝗸𝗧𝗼𝗸 𝗨𝘀𝗲𝗿 𝗜𝗻𝗳𝗼\n━━━━━━━━━━━━━━━\n` +
            `ID: ${data.id}\n` +
            `Username: ${data.username}\n` +
            `Nickname: ${data.nickname}\n` +
            `Signature: ${data.signature || "None"}\n` +
            `Videos: ${data.videoCount}\n` +
            `Followers: ${data.followerCount}\n` +
            `Following: ${data.followingCount}\n` +
            `Hearts: ${data.heartCount}`,
          attachment: fs.createReadStream(avatarPath),
        },
        event.threadID,
        () => fs.unlink(avatarPath),
        event.messageID
      );

      api.unsendMessage(waitingMsg.messageID);
    });

    writer.on("error", err => {
      console.error("File write error:", err);
      api.sendMessage("⚠️ Failed to process avatar image.", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error("TikTok API error:", error);
    api.sendMessage("❌ Error fetching TikTok data. Please try again later.", event.threadID, event.messageID);
  }
};
