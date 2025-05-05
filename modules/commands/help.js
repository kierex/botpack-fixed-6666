module.exports.config = {
  name: "help",
  version: "1.0.0",
  hasPermission: 0,
  credits: "august",
  description: "Guide for new users",
  commandCategory: "system",
  usages: "/help",
  hide: true,
  usePrefix: true,
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 60
  }
};

const mathSansBold = {
  A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨",
  J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬", N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱",
  S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹",
  a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂",
  j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆", n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋",
  s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓"
};

module.exports.handleEvent = function ({ api, event, getText }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || typeof body !== "string" || !body.startsWith("commands")) return;

  const splitBody = body.trim().split(/\s+/);
  if (splitBody.length < 2) return;

  const commandName = splitBody[1].toLowerCase();
  if (!commands.has(commandName)) return;

  const command = commands.get(commandName);
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  return api.sendMessage(
    getText("moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${(command.config.usages || "")}`,
      command.config.commandCategory,
      command.config.cooldowns,
      (command.config.hasPermission === 0) ? getText("user") :
      (command.config.hasPermission === 1) ? getText("adminGroup") :
      getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, args }) {
  const uid = event.senderID;
  const userInfo = await api.getUserInfo(uid);
  const userName = userInfo[uid]?.name || "User";

  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const { autoUnsend, delayUnsend } = global.configModule[this.config.name] || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  const categories = new Set();
  const categorizedCommands = new Map();

  for (const [name, value] of commands) {
    if (value.config.hide) continue;
    const category = value.config.commandCategory;
    if (!categories.has(category)) {
      categories.add(category);
      categorizedCommands.set(category, []);
    }
    categorizedCommands.get(category).push(`│ ✧ ${value.config.name}`);
  }

  let msg = `𝖧𝖾𝗒 ${userName}, 𝗍𝗁𝖾𝗌𝖾 𝖺𝗋𝖾 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌 𝗍𝗁𝖺𝗍 𝗆𝖺𝗒 𝗁𝖾𝗅𝗉 𝗒𝗈𝗎:\n\n`;

  for (const category of categories) {
    const fancyCategory = category.split("").map(c => mathSansBold[c] || c).join("");
    msg += `╭─❍「 ${fancyCategory} 」\n`;
    msg += categorizedCommands.get(category).join("\n");
    msg += "\n╰
