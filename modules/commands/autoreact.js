const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "autoreact",
  version: "1.2",
  hasPermssion: 0,
  credits: "Jonell Magallanes",
  description: "Auto react based on the context of users",
  usePrefix: true,
  commandCategory: "No Prefix",
  usage: "Type ?autoreact on or ?autoreact off to enable or disable the feature.",
  cooldowns: 3,
};

const autoreactFilePath = path.join(__dirname, 'autoreact.txt');

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (
      event.body &&
      (event.isGroup || event.threadID) && 
      (!event.attachments || event.attachments.length === 0)
    ) {
      let autoreactStatus = 'off';
      if (fs.existsSync(autoreactFilePath)) {
        autoreactStatus = fs.readFileSync(autoreactFilePath, 'utf8').trim();
      }

      if (autoreactStatus === 'on') {
        const res = await axios.get(`https://ccprojectapis.ddns.net/api/message/emoji?text=${encodeURIComponent(event.body)}`);
        const emoji = res.data?.emoji;

        if (emoji) {
          api.setMessageReaction(emoji, event.messageID, () => {}, true);
        }
      }
    }
  } catch (error) {
    console.error('AutoReact error:', error);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const option = args[0]?.toLowerCase();

  try {
    if (option === 'on') {
      fs.writeFileSync(autoreactFilePath, 'on', 'utf8');
      api.sendMessage('Auto react has been enabled.', event.threadID);
    } else if (option === 'off') {
      fs.writeFileSync(autoreactFilePath, 'off', 'utf8');
      api.sendMessage('Auto react has been disabled.', event.threadID);
    } else {
      api.sendMessage('Invalid option. Use "?autoreact on" to enable or "?autoreact off" to disable auto reactions.', event.threadID);
    }
  } catch (error) {
    console.error('Error updating auto react status:', error);
    api.sendMessage('An error occurred while updating auto react status.', event.threadID);
  }
};
