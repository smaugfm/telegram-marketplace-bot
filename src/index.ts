// noinspection TypeScriptValidateJSTypes

import { config } from "dotenv";
import { Scenes, Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import { Ctx } from "./telegraf/Context";
import { log } from "./log/log";
import { createSaleWizardScene } from "./sale/createSaleWizardScene";
import { MarketplaceChannelManager } from "./core/MarketplaceChannelManager";
import { testSale } from "./util";
import { PostedMessages } from "./core/types";

config();

const bot = new Telegraf<Ctx>(process.env["BOT_TOKEN"]!);
const channelManager = new MarketplaceChannelManager(
  bot.telegram,
  process.env["MARKETPLACE_CHANNEL_ID"]!,
);

const createWizardId = "createSaleWizard";
const createWizard = createSaleWizardScene(createWizardId, async (ctx, sale) => {
  if (!sale) {
    log.info("Form cancelled");
  } else {
    await channelManager.post(sale);
  }
});

const stage = new Scenes.Stage<Ctx>([createWizard]);

bot.use(new LocalSession({ database: "session.json" }).middleware());
bot.use((ctx, next) => {
  log.debug("", ctx.message);
  return next();
});
bot.use(stage.middleware());

bot.command("new", ctx =>
  ctx.scene.enter(createWizardId, { user: { id: ctx.from.id, username: ctx.from.username } }),
);

let posted: PostedMessages | undefined;

bot.hears("post", async ctx => {
  posted = await channelManager.post(testSale);
});

bot.hears("sold", async ctx => {
  await channelManager.markSold(posted!, testSale);
});

bot.hears("unsold", async ctx => {
  await channelManager.markUnsold(posted!, testSale);
});

bot.hears("remove", async ctx => {
  await channelManager.remove(posted!);
});

await bot.launch();
