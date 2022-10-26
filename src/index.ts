// noinspection TypeScriptValidateJSTypes

import { config } from "dotenv";
import { Scenes, Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import { Ctx } from "./telegraf/Context";
import { log } from "./log/log";
import { createListingWizardScene } from "./listing/createListingWizardScene";
import { postListing } from "./listing/postListing";

config();

const bot = new Telegraf<Ctx>(process.env["BOT_TOKEN"]!);
const createWizardId = "createListingWizard";
const createWizard = createListingWizardScene(createWizardId, async (ctx, listing) => {
  if (!listing) {
    log.info("Form cancelled");
  } else {
    await postListing(ctx.telegram, listing.user.id, listing);
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

await bot.launch();
