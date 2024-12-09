const TelegramBot = require("node-telegram-bot-api");
const _ = require("lodash");
const moment = require("moment");

class Bot {
  init(options) {
    if (!this.bot) {
      console.log("Initializing bot...");
      this.bot = new TelegramBot(options.accessKey, { polling: true });
      this.initDate = moment();
      this.commands = options.commands
        ? _.mapKeys(options.commands, (value, key) => key.toLowerCase())
        : {};
      this._setCommandsListener();
      this.allowedClientIds = [...(options.allowedClientIds || [])];
      
      this.sendMessage("Bot is successfully initialized!");
    }
  }

  _setCommandsListener() {
    this.bot.onText(/^\/(\w+)\s*(.*)/, async (msg, match) => {
      const fromId = msg.from.id;
      if (!this.allowedClientIds.includes(fromId)) {
        return;
      }

      // Ignore messages that were sent to bot before it woke up
      const msgDate = moment(msg.date * 1000);
      if (msgDate.isBefore(this.initDate)) {
        return;
      }

      const command = String(match[1]).trim().toLowerCase();
      const commandArgs = String(match[2])
        .trim()
        .split(/\s+/)
        .filter((arg) => arg.length);
      console.log(command, commandArgs);
      const commandFn = this.commands[command];
      if (commandFn) {
        await commandFn(this, ...commandArgs);
      } else {
        await this.sendMessage("Invalid command");
      }
    });
  }

  async sendMessage(text) {
    for (let clientId of this.allowedClientIds) {
      await this.bot.sendMessage(clientId, text, {
        disable_web_page_preview: false,
        link_preview: false,
        preview: false,
      });
    }
  }

  async kill() {
    console.log("Bye!");
    process.exit(0);
  }
}

module.exports.Bot = Bot;
