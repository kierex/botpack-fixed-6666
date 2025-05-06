const fs = require('fs');
const path = require('path');

const senderIDAdmin = "100070577903608"; // Admin user ID

module.exports.config = {
  name: "usePrefix",
  version: "1.0.0",
  hasPermission: 2,  // Only admin can use this
  description: "Enable or disable the usePrefix for a command",
  usePrefix: true,
  credits: "Vern",
  cooldowns: 5,
  commandCategory: "System"
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID } = event;

  // Check if the user is an admin
  if (senderID !== senderIDAdmin) {
    return api.sendMessage("❌ Not Authorized to Use This Command", event.threadID);
  }

  // Split and clean the arguments
  const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
  const commandName = splitArgs[0];
  const usePrefixValue = splitArgs[1];

  // Validate the input format
  if (!commandName || (usePrefixValue !== "true" && usePrefixValue !== "false")) {
    return api.sendMessage("⚠️ Usage: usePrefix [commandName] | [true/false]", event.threadID);
  }

  // Path to the command file
  const commandFilePath = path.join(__dirname, `${commandName}.js`);

  try {
    // Check if the command file exists
    if (!fs.existsSync(commandFilePath)) {
      return api.sendMessage(`⚠️ Command "${commandName}" does not exist.`, event.threadID);
    }

    // Read the command file content
    let fileContent = fs.readFileSync(commandFilePath, 'utf-8');

    // Regex to find the usePrefix value
    const usePrefixRegex = /usePrefix\s*:\s*(true|false)/;
    const currentUsePrefix = usePrefixRegex.exec(fileContent);

    // If the current usePrefix is already set to the desired value
    if (currentUsePrefix && currentUsePrefix[1] === usePrefixValue) {
      return api.sendMessage(`🔄 The command "${commandName}" already has usePrefix set to ${usePrefixValue}.`, event.threadID);
    }

    // If usePrefix exists, replace it
    if (usePrefixRegex.test(fileContent)) {
      fileContent = fileContent.replace(usePrefixRegex, `usePrefix: ${usePrefixValue}`);
    } else {
      // Otherwise, find the config block and add the usePrefix property
      const configRegex = /module\.exports\.config\s*=\s*{([^}]*)}/;
      const match = fileContent.match(configRegex);

      if (match) {
        const configBlock = match[1];

        // Add usePrefix to the config block
        const newConfigBlock = configBlock.trim().endsWith(',')
          ? `${configBlock}\n    usePrefix: ${usePrefixValue},`
          : `${configBlock},\n    usePrefix: ${usePrefixValue},`;

        fileContent = fileContent.replace(configRegex, `module.exports.config = {${newConfigBlock}}`);
      }
    }

    // Write the updated content back to the file
    fs.writeFileSync(commandFilePath, fileContent, 'utf-8');

    // Notify the user
    api.sendMessage(`✅ Successfully updated usePrefix for command "${commandName}" to ${usePrefixValue}.`, event.threadID);

  } catch (error) {
    // Catch any errors
    console.error("Error occurred:", error);
    api.sendMessage(`❌ An error occurred while updating the usePrefix for command "${commandName}". Please check logs for details.`, event.threadID);
  }
};
