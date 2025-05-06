const os = require('os');
const si = require('systeminformation');
const axios = require('axios');  // Ensure you have axios installed: npm install axios

module.exports.config = {
    name: "uptime",
    version: "1.0.0",
    hasPermission: 0,
    description: "Get detailed uptime and system information",
    usePrefix: true,
    credits: "Vern",
    cooldowns: 6,
    commandCategory: "System",
};

module.exports.run = async function ({ api, event }) {
    const load = await api.sendMessage("Loading....", event.threadID, event.messageID);

    try {
        // Gather uptime information
        const uptimeSeconds = os.uptime();
        const uptime = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);
        const currentDateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });

        // Gather system information
        const cpu = await si.cpu();
        const memory = await si.mem();
        const disk = await si.fsSize();
        const cpuUsage = await si.currentLoad();

        const totalMemory = (memory.total / 1024 / 1024 / 1024).toFixed(2);
        const usedMemory = ((memory.total - memory.available) / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (memory.available / 1024 / 1024 / 1024).toFixed(2);

        const totalDisk = (disk[0].size / 1024 / 1024 / 1024).toFixed(2);
        const usedDisk = (disk[0].used / 1024 / 1024 / 1024).toFixed(2);
        const freeDisk = (disk[0].available / 1024 / 1024 / 1024).toFixed(2);

        // Example of API Call - External data fetch
        const apiResponse = await axios.get('https://kaiz-apis.gleeze.com/api/uptime?instag=vrn.esg&ghub=vraxyxx&fb=vern&hours=5000&minutes=5000&seconds=5000&botname=5000');
        const externalData = apiResponse.data;  // Assuming the API returns useful data, like server status

        // Check if the external API has the required fields
        const apiStatus = externalData?.status || "Not available";
        const apiInfo = externalData?.info || "No additional information.";

        // Prepare the system information along with external API data
        const response = `𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝘁𝗶𝗺𝗲 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 
━━━━━━━━━━━━━━━━━━
            BotName: ${global.config.BOTNAME}
            Developer: ${global.config.OWNER}
            Uptime: ${uptime}
            Current Date & Time (Asia/Manila): ${currentDateTime}
            CPU: ${cpu.manufacturer} ${cpu.brand}
            CPU Usage: ${cpuUsage.currentLoad.toFixed(2)}%
            Total RAM: ${totalMemory} GB
            Used RAM: ${usedMemory} GB
            Free RAM: ${freeMemory} GB
            Total ROM: ${totalDisk} GB
            Used ROM: ${usedDisk} GB
            Free ROM: ${freeDisk} GB
            Server Region: ${os.hostname()}
            
            External API Status:
            API Response: ${apiStatus}  // Assuming the API returns a 'status' field
            More Info: ${apiInfo}  // Assuming the API provides more info
        `;

        api.editMessage(response, load.messageID, event.threadID, event.messageID);
    } catch (error) {
        // If an error occurs, send a message
        console.error(error);
        api.sendMessage(`❌ An error occurred: ${error.message}`, event.threadID);
    }
};
