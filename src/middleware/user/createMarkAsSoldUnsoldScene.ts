import {SalesManager} from "../../core/SalesManager";
import {Markup, Scenes} from "telegraf";
import {Ctx} from "../../telegraf/Context";
import {log} from "../../log/log";
import {SaleNotExistError} from "../../core/SaleNotExistError";

export function createMarkAsSoldUnsoldScene(
  markAsSoldSceneId: string,
  markAsUnsoldSceneId: string,
  sales: SalesManager,
  sold: boolean,
): Scenes.BaseScene<Ctx> {
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
        sales.copyTo(posted, ctx.from!.id, {
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
        const sale = await sales.markSoldUnsold(saleId, sold);
        if (sale) {
          await sales.forwardTo(sale.posted, ctx.from!.id);
          return ctx.scene.leave();
        } else {
          return ctx.reply(
            "Оголошення що були помічені як продані більш ніж 2 дні тому " +
              "вже не можна повернути у продаж. Ти можеш створити нове оголошення.",
          );
        }
      } catch (e) {
        if (e instanceof SaleNotExistError) {
          return next();
        }
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
