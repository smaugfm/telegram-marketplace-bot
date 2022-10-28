// noinspection TypeScriptValidateJSTypes

import { config } from "dotenv";
import { Scenes, Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import { Ctx } from "./telegraf/Context";
import { log } from "./log/log";
import { MarketplaceChannel } from "./core/MarketplaceChannel";
import { userInteractionMiddleware } from "./middleware/user/userInteractionMiddleware";
import { SalesManager } from "./core/SalesManager";
import { Storage } from "./core/Storage";

config();

const bot = new Telegraf<Ctx>(process.env["BOT_TOKEN"]!);
const channel = new MarketplaceChannel(
  bot.telegram,
  parseInt(process.env["MARKETPLACE_CHANNEL_ID"]!, 10),
);
const sales = new SalesManager(5, new Storage(), channel);
const stage = new Scenes.Stage<Ctx>();

bot.use(new LocalSession({ database: "session.json" }).middleware());
bot.use((ctx, next) => {
  log.debug("", ctx.message);
  return next();
});
bot.use(stage.middleware());
bot.use(userInteractionMiddleware(stage, sales));
//
// let posted: PostedMessages | undefined;
//
// bot.hears("post", async ctx => {
//   posted = await channel.post(testSale);
// });
//
// bot.hears("sold", async ctx => {
//   await channel.markSold(posted!, testSale);
// });
//
// bot.hears("unsold", async ctx => {
//   await channel.markUnsold(posted!, testSale);
// });
//
// bot.hears("remove", async ctx => {
//   await channel.remove(posted!);
// });

await bot.launch();
