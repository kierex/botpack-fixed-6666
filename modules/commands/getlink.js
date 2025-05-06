module.exports.config = {
  name: "getlink",
  version: "1.0.1",
  hasPermission: 0,  // Fixed typo
  credits: "Vern",
  description: "Get the URL Download from Video, Audio is sent from the group",
  usePrefix: false,
  commandCategory: "Tool",
  usages: "getLink",
  cooldowns: 5,
};

module.exports.languages = {
  "vi": {
    "invalidFormat": "❌ Tin nhắn bạn phản hồi phải là một audio, video, ảnh nào đó" // Fixed typo
  },
  "en": {
    "invalidFormat": "❌ You need to reply with a message that contains an audio, video, or picture" // Fixed typo
  }
}

module.exports.run = async ({ api, event, getText }) => {
  if (event.type !== "message_reply") return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID); // Fixed typo

  const messageReply = event.messageReply;
  
  if (!messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID);
  }

  if (messageReply.attachments.length > 1) {
    return api.sendMessage(getText("invalidFormat"), event.threadID, event.messageID);
  }

  const attachmentUrl = messageReply.attachments[0].url;
  return api.sendMessage(attachmentUrl, event.threadID, event.messageID);
}
