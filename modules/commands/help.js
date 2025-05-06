module.exports.config = {
    name: "help",
    version: "1.0.2",
    hasPermission: 0, // Allow everyone to access this command (0 = no restriction)
    credits: "developer",
    description: "Beginner's Guide To All Bot Commands",
    usePrefix: true,
    commandCategory: "System",
    usages: "[ help ]",
    cooldowns: 7,
    envConfig: {
        autoUnsend: true,
        delayUnsend: 500
    }
};

module.exports.languages = {
    "en": {
        "moduleInfo": "「 %1 」\n%2\n\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 seconds(s)\n❯ Permission: %6\n\n» Module code by %7 «",
        "helpList": '[ There are %1 commands on this bot, Use: "%2help nameCommand" to know how to use! ]',
        "user": "User", // This will show for users with 'hasPermission: 0'
        "adminGroup": "Admin group", // For group admins
        "adminBot": "Admin bot" // For bot admins
    }
};

module.exports.handleEvent = function ({ api, event, getText }) {
    const { commands } = global.client;
    const { threadID, messageID, body } = event;

    if (!body || typeof body === "undefined" || body.indexOf("help") !== 0) return;

    const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
    if (splitBody.length === 1 || !commands.has(splitBody[1].toLowerCase())) return;

    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const command = commands.get(splitBody[1].toLowerCase());
    const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

    // Send module information of the requested command
    return api.sendMessage(
        getText(
            "moduleInfo",
            command.config.name,
            command.config.description,
            `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
            command.config.commandCategory,
            command.config.cooldowns,
            ((command.config.hasPermission === 0) ? getText("user") : (command.config.hasPermission === 1) ? getText("adminGroup") : getText("adminBot")),
            command.config.credits
        ),
        threadID,
        messageID
    );
};

module.exports.run = function ({ api, event, args, getText }) {
    const { commands } = global.client;
    const { threadID, messageID } = event;
    const command = commands.get((args[0] || "").toLowerCase());
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
    const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

    if (!command) {
        const arrayInfo = [];
        const page = parseInt(args[0]) || 1;
        const numberOfOnePage = 9999; // Total number of commands to display per page
        let i = 0;
        let msg = "";

        // Loop through all commands and add them to the list
        for (let [name] of commands) {
            arrayInfo.push(name);
        }

        // Sort the command list alphabetically
        arrayInfo.sort();

        const startSlice = numberOfOnePage * page - numberOfOnePage;
        i = startSlice;
        const returnArray = arrayInfo.slice(startSlice, startSlice + numberOfOnePage);

        for (let item of returnArray) msg += `「 ${++i} 」${prefix}${item}\n`;

        const siu = `== 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧 ==`;

        const text = `\n𝗣𝗔𝗚𝗘 » ${page}/${Math.ceil(arrayInfo.length / numberOfOnePage)} «`;

        return api.sendMessage(
            siu + "\n\n" + msg + text,
            threadID,
            async (error, info) => {
                if (autoUnsend) {
                    await new Promise(resolve => setTimeout(resolve, delayUnsend * 1000));
                    return api.unsendMessage(info.messageID);
                } else return;
            },
            event.messageID
        );
    }

    // If the specific command is found, show its info
    return api.sendMessage(
        getText(
            "moduleInfo",
            command.config.name,
            command.config.description,
            `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
            command.config.commandCategory,
            command.config.cooldowns,
            ((command.config.hasPermission === 0) ? getText("user") : (command.config.hasPermission === 1) ? getText("adminGroup") : getText("adminBot")),
            command.config.credits
        ),
        threadID,
        messageID
    );
};
