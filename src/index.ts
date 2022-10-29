// noinspection TypeScriptValidateJSTypes

import { config } from "dotenv";
import { Scenes, Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import { Ctx } from "./telegraf/Context";
import { log } from "./log/log";
import { MarketplaceChannel } from "./core/MarketplaceChannel";
import { SalesFacade } from "./core/SalesFacade";
import { Storage } from "./core/Storage";
import { userMenuMiddleware } from "./middleware/userMenu/userMenuMiddleware";

config();

const bot = new Telegraf<Ctx>(process.env["BOT_TOKEN"]!);
const channel = new MarketplaceChannel(
  bot.telegram,
  parseInt(process.env["MARKETPLACE_CHANNEL_ID"]!, 10),
);
const facade = new SalesFacade(
  parseInt(process.env["MAX_SALES_PER_USER"]!, 10),
  new Storage(),
  channel,
);
const stage = new Scenes.Stage<Ctx>();

bot.use(new LocalSession({ database: "session.json" }).middleware());
bot.use((ctx, next) => {
  log.debug("", ctx.message);
  return next();
});
bot.use(stage.middleware());
bot.use(userMenuMiddleware(stage, facade));

await bot.launch();
