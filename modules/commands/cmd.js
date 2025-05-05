const { join } = require("path");

module.exports.config = {
  name: "cmd",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Mirai Team",
  description: "Manage/Control all bot modules",
  usePrefix: true,
  hide: true,
  commandCategory: "Admin",
  usages: "[load/unload/loadAll/unloadAll/info] [name module]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "child_process": "",
    "path": ""
  }
};

const loadCommand = function ({ moduleList, threadID, messageID }) {
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
        throw new Error("Module is malformed!");

      global.client.eventRegistered = global.client.eventRegistered.filter(info => info !== command.config.name);

      if (command.config.dependencies && typeof command.config.dependencies === "object") {
        const listPackage = JSON.parse(readFileSync("./package.json")).dependencies;
        const listBuiltinModules = require("module").builtinModules;

        for (const packageName in command.config.dependencies) {
          let loadSuccess = false;
          let error;
          const moduleDir = join(global.client.mainPath, "nodemodules", "node_modules", packageName);
          try {
            if (listPackage.hasOwnProperty(packageName) || listBuiltinModules.includes(packageName)) {
              global.nodemodule[packageName] = require(packageName);
            } else {
              global.nodemodule[packageName] = require(moduleDir);
            }
          } catch {
            logger.loader(`Not found package ${packageName} for module ${command.config.name}, installing...`, "warn");
            const insPack = {
              stdio: "inherit",
              env: process.env,
              shell: true,
              cwd: join(global.client.mainPath, "nodemodules")
            };
            execSync(`npm --package-lock false --save install ${packageName}${command.config.dependencies[packageName] ? "@" + command.config.dependencies[packageName] : ""}`, insPack);

            for (let i = 1; i <= 3; i++) {
              try {
                if (listPackage.hasOwnProperty(packageName) || listBuiltinModules.includes(packageName)) {
                  global.nodemodule[packageName] = require(packageName);
                } else {
                  global.nodemodule[packageName] = require(moduleDir);
                }
                loadSuccess = true;
                break;
              } catch (err) {
                error = err;
              }
            }

            if (!loadSuccess || error) {
              throw new Error(`Unable to load package ${packageName} for module ${command.config.name}, error: ${error.stack}`);
            }
          }
        }
        logger.loader(`Successfully downloaded dependencies for ${command.config.name}`);
      }

      if (command.config.envConfig && typeof command.config.envConfig === "object") {
        try {
          if (typeof global.configModule[command.config.name] === "undefined") global.configModule[command.config.name] = {};
          if (typeof configValue[command.config.name] === "undefined") configValue[command.config.name] = {};

          for (const [key, value] of Object.entries(command.config.envConfig)) {
            if (typeof configValue[command.config.name][key] !== "undefined") {
              global.configModule[command.config.name][key] = configValue[command.config.name][key];
            } else {
              global.configModule[command.config.name][key] = value || "";
              configValue[command.config.name][key] = value || "";
            }
          }
          logger.loader(`Loaded config for ${command.config.name}`);
        } catch (error) {
          throw new Error("Failed to load config module: " + error.message);
        }
      }

      if (typeof command.onLoad === "function") {
        try {
          command.onLoad({ configValue });
        } catch (error) {
          throw new Error(`Unable to onLoad module ${command.config.name}, error: ${error.message}`);
        }
      }

      if (command.handleEvent) global.client.eventRegistered.push(command.config.name);

      const disabledName = nameModule + ".js";
      const index1 = configValue.commandDisabled.indexOf(disabledName);
      const index2 = global.config.commandDisabled.indexOf(disabledName);
      if (index1 !== -1) configValue.commandDisabled.splice(index1, 1);
      if (index2 !== -1) global.config.commandDisabled.splice(index2, 1);

      global.client.commands.set(command.config.name, command);
      logger.loader("Loaded command " + command.config.name + "!");
    } catch (error) {
      errorList.push(`- ${nameModule} reason: ${error.message}`);
    }
  }

  if (errorList.length > 0) {
    api.sendMessage("Modules that had problems loading:\n" + errorList.join("\n"), threadID, messageID);
  }
  api.sendMessage("Loaded " + (moduleList.length - errorList.length) + " module(s)", threadID, messageID);

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");
};

const unloadModule = function ({ moduleList, threadID, messageID }) {
  const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath, api } = global.client;
  const logger = require(join(mainPath, "utils", "log"));

  delete require.cache[require.resolve(configPath)];
  const configValue = require(configPath);
  writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

  for (const nameModule of moduleList) {
    global.client.commands.delete(nameModule);
    global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
    configValue.commandDisabled.push(`${nameModule}.js`);
    global.config.commandDisabled.push(`${nameModule}.js`);
    logger.loader(`Unloaded command ${nameModule}!`);
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
  unlinkSync(configPath + ".temp");

  return api.sendMessage(`Unloaded ${moduleList.length} module(s)`, threadID, messageID);
};

module.exports.run = function ({ event, args, api }) {
  const { readdirSync } = global.nodemodule["fs-extra"];
  const { threadID, messageID } = event;

  let moduleList = args.slice(1);

  switch (args[0]) {
    case "load":
      if (moduleList.length === 0) return api.sendMessage("Module name cannot be empty!", threadID, messageID);
      return loadCommand({ moduleList, threadID, messageID });

    case "unload":
      if (moduleList.length === 0) return api.sendMessage("Module name cannot be empty!", threadID, messageID);
      return unloadModule({ moduleList, threadID, messageID });

    case "loadAll":
      moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example"));
      moduleList = moduleList.map(file => file.replace(/\.js$/, ""));
      return loadCommand({ moduleList, threadID, messageID });

    case "unloadAll":
      moduleList = readdirSync(__dirname).filter(file =>
        file.endsWith(".js") && !file.includes("example") && !file.includes("command")
      );
      moduleList = moduleList.map(file => file.replace(/\.js$/, ""));
      return unloadModule({ moduleList, threadID, messageID });

    case "info": {
      const command = global.client.commands.get(moduleList.join("") || "");
      if (!command) return api.sendMessage("The module you entered does not exist!", threadID, messageID);

      const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;
      return api.sendMessage(
        `=== ${name.toUpperCase()} ===\n` +
        `- Coded by: ${credits}\n` +
        `- Version: ${version}\n` +
        `- Permission: ${hasPermssion === 0 ? "User" : hasPermssion === 1 ? "Admin" : "Bot operator"}\n` +
        `- Cooldown: ${cooldowns} second(s)\n` +
        `- Dependencies: ${Object.keys(dependencies || {}).join(", ") || "None"}`,
        threadID, messageID
      );
    }

    default:
      return global.utils.throwError(this.config.name, threadID, messageID);
  }
};
