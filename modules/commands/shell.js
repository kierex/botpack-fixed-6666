const { exec } = require('child_process');

module.exports.config = {
    name: "shell",
    version: "1.0.0",
    hasPermssion: 2,
    description: "Execute shell commands",
    usePrefix: true,
    credits: "Vern",
    cooldowns: 3,
    commandCategory: "Utility",
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const command = args.join(" ");

    if (!command) {
        return api.sendMessage("Please provide a shell command to execute.", threadID, messageID);
    }

    try {
        const processingMsg = await api.sendMessage("Processing...", threadID, messageID);

        exec(command, (error, stdout, stderr) => {
            let output = "";

            if (error) {
                output = `Error: ${error.message}`;
            } else if (stderr) {
                output = `Stderr: ${stderr}`;
            } else {
                output = stdout || "Command executed successfully, but no output.";
            }

            // Prevent overly long messages
            if (output.length > 2000) {
                output = output.substring(0, 1990) + "... [truncated]";
            }

            api.editMessage(output, processingMsg.messageID, threadID);
        });

    } catch (err) {
        api.sendMessage(`Unexpected error: ${err.message}`, threadID, messageID);
    }
};
