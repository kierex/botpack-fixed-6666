const { join } = require("path");

module.exports.config = {
  name: "cmd",
  version: "1.0.0",
  hasPermssion: 0, // Accessible to everyone
  credits: "Mirai Team",
  description: "Manage/Control all bot modules",
  usePrefix: true,
  hide: true,
  commandCategory: "Admin",
  usages: "[load/unload/loadAll/unloadAll/info] [module name]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "child_process": "",
    "path": ""
  }
};

const loadCommand = ({ moduleList, threadID, messageID }) => {
  const { execSync } = global.nodemodule["child_process"];
  const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(join(mainPath, "utils", "log"));

  let errorList = [];
  delete require.cache[require.resolve(configPath)];
  let configValue = require(configPath);
  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

  for (const nameModule of moduleList) {
    try {
      const dirModule = join(__dirname, nameModule + ".js");
      delete require.cache[require.resolve(dirModule)];
      const command = require(dirModule);
      global.client.commands.delete(nameModule);

      if (!command.config || !command.run || !command.config.commandCategory)
        throw new Error("Malformed module!");

      global.client.eventRegistered = global.client.eventRegistered.filter(info => info !== command.config.name);

      // Load dependencies
      if (command.config.dependencies) {
        const listPackage = JSON.parse(readFileSync("./package.json")).dependencies;
        const listBuiltin = require("module").builtinModules;

        for (const pkg in command.config.dependencies) {
          let success = false;
          const moduleDir = join(global.client.mainPath, "nodemodules", "node_modules", pkg);
          try {
            global.nodemodule[pkg] = listPackage.hasOwnProperty(pkg) || listBuiltin.includes(pkg)
              ? require(pkg)
              : require(moduleDir);
          } catch {
            logger.loader(`Installing ${pkg}...`, "warn");
            execSync(`npm install ${pkg}${command.config.dependencies[pkg] ? "@" + command.config.dependencies[pkg] : ""}`, {
              stdio: "inherit",
              env: process.env,
              shell: true,
              cwd: join(global.client.mainPath, "nodemodules")
            });

            for (let i = 0; i < 3; i++) {
              try {
                global.nodemodule[pkg] = listPackage.hasOwnProperty(pkg) || listBuiltin.includes(pkg)
                  ? require(pkg)
                  : require(moduleDir);
                success = true;
                break;
              } catch (err) {}
            }

            if (!success) throw new Error(`Failed to load ${pkg}`);
          }
        }
      }

      // Load config
      if (command.config.envConfig) {
        if (!global.configModule[command.config.name]) global.configModule[command.config.name] = {};
        if (!configValue[command.config.name]) configValue[command.config.name] = {};

        for (const [key, val] of Object.entries(command.config.envConfig)) {
          global.configModule[command.config.name][key] = configValue[command.config.name][key] || val || "";
          configValue[command.config.name][key] = configValue[command.config.name][key] || val || "";
        }
      }

      if (typeof command.onLoad === "function") command.onLoad({ configValue });

      if (command.handleEvent) global.client.eventRegistered.push(command.config.name);

      const disabled = nameModule + ".js";
      global.config.commandDisabled = global.config.commandDisabled.filter(name => name !== disabled);
      configValue.commandDisabled = configValue.commandDisabled.filter(name => name !== disabled);

      global.client.commands.set(command.config.name, command);
      logger.loader("Loaded: " + command.config.name);
    } catch (err) {
      errorList.push(`- ${nameModule}: ${err.message}`);
    }
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");

  if (errorList.length > 0)
    return api.sendMessage("Load issues:\n" + errorList.join("\n"), threadID, messageID);
  api.sendMessage("Loaded " + moduleList.length + " module(s)", threadID, messageID);
};

const unloadModule = ({ moduleList, threadID, messageID }) => {
  const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(join(mainPath, "utils", "log"));

  delete require.cache[require.resolve(configPath)];
  const configValue = require(configPath);
  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

  for (const nameModule of moduleList) {
    global.client.commands.delete(nameModule);
    global.client.eventRegistered = global.client.eventRegistered.filter(name => name !== nameModule);
    configValue.commandDisabled.push(`${nameModule}.js`);
    global.config.commandDisabled.push(`${nameModule}.js`);
    logger.loader("Unloaded: " + nameModule);
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");

  api.sendMessage("Unloaded " + moduleList.length + " module(s)", threadID, messageID);
};

module.exports.run = ({ event, args, api }) => {
  const { readdirSync } = global.nodemodule["fs-extra"];
  const { threadID, messageID } = event;
  let moduleList = args.slice(1);

  switch (args[0]) {
    case "load":
      if (!moduleList.length) return api.sendMessage("Missing module name to load.", threadID, messageID);
      return loadCommand({ moduleList, threadID, messageID });

    case "unload":
      if (!moduleList.length) return api.sendMessage("Missing module name to unload.", threadID, messageID);
      return unloadModule({ moduleList, threadID, messageID });

    case "loadAll":
      moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example")).map(f => f.replace(".js", ""));
      return loadCommand({ moduleList, threadID, messageID });

    case "unloadAll":
      moduleList = readdirSync(__dirname).filter(file =>
        file.endsWith(".js") && !file.includes("example") && !file.includes("command")
      ).map(f => f.replace(".js", ""));
      return unloadModule({ moduleList, threadID, messageID });

    case "info": {
      const commandName = moduleList.join("").trim();
      const command = global.client.commands.get(commandName);
      if (!command) return api.sendMessage("Module not found.", threadID, messageID);

      const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;
      return api.sendMessage(
        `=== ${name.toUpperCase()} ===\n` +
        `• Author: ${credits}\n` +
        `• Version: ${version}\n` +
        `• Permission: ${hasPermssion === 0 ? "User" : hasPermssion === 1 ? "Admin" : "Bot operator"}\n` +
        `• Cooldown: ${cooldowns}s\n` +
        `• Dependencies: ${Object.keys(dependencies || {}).join(", ") || "None"}`,
        threadID, messageID
      );
    }

    default:
      return api.sendMessage("Invalid option. Use: load, unload, loadAll, unloadAll, or info.", threadID, messageID);
  }
};
