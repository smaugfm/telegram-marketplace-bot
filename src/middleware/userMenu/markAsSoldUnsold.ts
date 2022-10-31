import { SalesFacade } from "../../core/SalesFacade";
import { Markup, NarrowedContext, Scenes } from "telegraf";
import { Ctx } from "../../telegraf/Context";
import { log } from "../../log/log";
import { MountMap } from "telegraf/typings/telegram-types";
import { replyNoAccessToChannel } from "./util";
import { SaleNotExistError } from "../../core/errors/SaleNotExistError";
import { MessageDoesNotExistError } from "../../core/errors/MessageDoesNotExistError";

const markAsSoldSceneId = "markAsSoldScene";
const markAsUnsoldSceneId = "markAsUnsoldScene";

export async function markAsSoldUnsoldHandler(
  ctx: NarrowedContext<Ctx, MountMap["text"]>,
  facade: SalesFacade,
  asSold: boolean,
) {
  if (!(await facade.userHasAccessToChannel(ctx.from.id))) {
    return replyNoAccessToChannel(ctx);
  }

  const managedSales = await facade.getActiveSales(ctx.from.id, !asSold);
  if (managedSales.length === 0) {
    return await ctx.reply(
      asSold ? "У тебе нема активних оголошень" : "У тебе нема оголошень що помічені як продані",
    );
  }
  return ctx.scene.enter(asSold ? markAsSoldSceneId : markAsUnsoldSceneId, {
    markAsSoldUnsoldScene: {
      currentPosted: managedSales.map(s => s.posted),
      saleIds: managedSales.map(s => s.id),
    },
  });
}

export function markAsSoldUnsoldScene(facade: SalesFacade, sold: boolean) {
  const scene = new Scenes.BaseScene<Ctx>(sold ? markAsSoldSceneId : markAsUnsoldSceneId);
  scene.enter(async ctx => {
    await ctx.reply(
      sold
        ? "Вибери оголошення яке ти хочеш помітити як продане:"
        : "Вибери оголошення яке ти хочеш повернути у продаж:",
    );

    const state = ctx.scene.session.state.markAsSoldUnsoldScene;
    await Promise.all(
      state.currentPosted.map((posted, i) => {
        facade.copyTo(posted, ctx.from!.id, {
          ...Markup.inlineKeyboard([
            Markup.button.callback(
              sold ? "продано" : "знову продається",
              state.saleIds[i]!.toString(),
            ),
          ]),
        });
      }),
    );
  });
  scene.on("callback_query", async (ctx, next) => {
    if (!ctx.callbackQuery.data) return next();
    const saleId = parseInt(ctx.callbackQuery.data, 10);
    if (isNaN(saleId)) {
      log.error("Callback query data is not a number. Original query: ", ctx.callbackQuery);
      return next();
    }
    await ctx.answerCbQuery();
    const state = ctx.scene.session.state.markAsSoldUnsoldScene;

    if (state.saleIds.includes(saleId)) {
      try {
        if (sold) {
          const sale = await facade.markSold(saleId);
          await facade.forwardToIncludingSeparateDescription(sale.posted, ctx.from!.id);
          return ctx.scene.leave();
        } else {
          const result = await facade.markUnsold(ctx.callbackQuery.from.id, saleId);
          switch (result.type) {
            case "cannotAndNewSale":
              return ctx.reply(
                `Ти вже продаєш ${facade.maxSalesPerUser} товарів` +
                  "виставляти більше оголошень не можна. " +
                  "Видали якесь поточне оголошення щоб виставити нове.",
              );
            case "tooOld":
              return ctx.reply(
                "Оголошення що були помічені як продані більш ніж 2 дні тому " +
                  "вже не можна повернути у продаж. Ти можеш створити нове оголошення.",
              );
            case "markedAsUnsold":
              await facade.forwardToIncludingSeparateDescription(result.sale.posted, ctx.from!.id);
              return ctx.scene.leave();
          }
        }
      } catch (e) {
        if (e instanceof SaleNotExistError || e instanceof MessageDoesNotExistError) {
          return ctx.reply("Нажаль виглядає так що оголошення було видалене");
        }
        throw e;
      }
    } else {
      log.error("Passed saleId not from the fetched list: Original query: ", ctx.callbackQuery);
      return next();
    }
  });
  scene.command("exit", ctx => ctx.scene.leave());
  scene.use(ctx => {
    return ctx.reply(
      sold
        ? "Будь ласка натисни на одну з кнопок щоб відмітити товар як проданий або надійшли /exit"
        : "Будь ласка натисни на одну з кнопок повернути оголошення у продаж або надійшли /exit",
    );
  });

  return scene;
}
