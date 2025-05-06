module.exports.config = {
    name: "tid",
    version: "1.0.0",
    hasPermission: 0,  // Fixed the typo here
    description: "Get thread ID",
    credits: "Vern",
    usePrefix: true,
    hide: true,
    commandCategory: "System",
    cooldowns: 0,
};

module.exports.run = async function ({ api, event }) { 
    const tid = event.threadID;
    // Corrected the message format for sendMessage
    api.sendMessage(`Thread ID: ${tid}`, event.threadID);  // Sending the thread ID back to the thread
};
