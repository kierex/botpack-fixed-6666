const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');

module.exports.config = {
  name: "music",
  hasPermission: 0,
  version: "1.0.0",
  description: "Get music",
  usePrefix: true,
  credits: "Jonell Magallanes",
  cooldowns: 10,
  commandCategory: "Utility"
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) {
    return api.sendMessage(`❌ Please enter a music name!`, event.threadID);
  }

  try {
    const song = args.join(" ");
    const findingMessage = await api.sendMessage(`🔍 | Finding "${song}". Please wait...`, event.threadID);

    const searchResults = await yts(song);
    const firstResult = searchResults.videos[0];

    if (!firstResult) {
      await api.sendMessage(`❌ | No results found for "${song}".`, event.threadID);
      return;
    }

    const { title, url } = firstResult;

    await api.editMessage(`⏱️ | Music Title has been Found: "${title}". Downloading...`, findingMessage.messageID);

    // Using the song name for the API URL
    const apiUrl = `https://kaiz-apis.gleeze.com/api/apple-music?search=${encodeURIComponent(song)}`;
    const response = await axios.get(apiUrl);

    const { audio } = response.data;

    if (!audio) {
      await api.sendMessage(`❌ | No audio found for "${song}".`, event.threadID);
      return;
    }

    const responseStream = await axios.get(audio, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const filePath = path.join(__dirname, 'cache', `${Date.now()}-${title}.mp3`);
    const fileStream = fs.createWriteStream(filePath);

    responseStream.data.pipe(fileStream);

    fileStream.on('finish', async () => {
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      if (fileSizeInMB > 25) {
        await api.sendMessage(`❌ | The file size exceeds the 25MB limit. Unable to send "${title}".`, event.threadID);
        fs.unlinkSync(filePath);
        return;
      }

      try {
        // Fetch the shortened link for the audio
        const responseShortLink = await axios.get(`https://jonellccprojectapis10.adaptable.app/api/tinyurl?url=${encodeURIComponent(audio)}`);
        const short = responseShortLink.data.shortenedUrl;

        await api.sendMessage({
          body: `🎵 | Here is your music: "${title}"\n\nTitle: ${title}\nYouTube Link: ${url}\nDownload Link: ${short}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID);

        fs.unlinkSync(filePath);
        api.unsendMessage(findingMessage.messageID);
      } catch (error) {
        console.error("Error generating shortened URL:", error);
        await api.sendMessage(`❌ | Sorry, there was an error generating the music link: ${error.message}`, event.threadID);
        fs.unlinkSync(filePath);
      }
    });

    fileStream.on('error', async (error) => {
      console.error("Error with file stream:", error);
      await api.sendMessage(`❌ | Error while downloading the music file: ${error.message}`, event.threadID);
      fs.unlinkSync(filePath);
    });

    responseStream.data.on('error', async (error) => {
      console.error("Error with response stream:", error);
      await api.sendMessage(`❌ | Sorry, there was an error downloading the music: ${error.message}`, event.threadID);
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error("Error during the process:", error);
    await api.sendMessage(`❌ | Sorry, there was an error getting the music: ${error.message}`, event.threadID);
  }
};
