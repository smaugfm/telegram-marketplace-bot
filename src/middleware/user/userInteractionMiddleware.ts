import { Composer, Middleware, NarrowedContext, Scenes } from "telegraf";
import { Ctx } from "../../telegraf/Context";
import { SalesManager } from "../../core/SalesManager";
import { testSale } from "../../util";
import { createSaleWizardScene } from "./createSaleWizardScene";
import { createMarkAsSoldUnsoldScene } from "./createMarkAsSoldUnsoldScene";
import { MountMap } from "telegraf/typings/telegram-types";

const createWizardId = "createSaleWizard";
const markAsSoldSceneId = "markAsSoldScene";
const markAsUnsoldSceneId = "markAsUnsoldScene";

export function userInteractionMiddleware(
  stage: Scenes.Stage<Ctx>,
  sales: SalesManager,
): Middleware<Ctx> {
  stage.register(
    createSaleWizardScene(createWizardId, async (ctx, sale) => {
      if (sale) {
        const managedSale = await sales.addNewSale(sale);
        if (!managedSale)
          return ctx.reply(
            `Ти вже продаєш ${sales.maxSalesPerUser} товарів` +
              "виставляти більше оголошень не можна. " +
              "Видали якесь поточне оголошення щоб виставити нове.",
          );
        await sales.forwardTo(managedSale.posted, ctx.from!.id);
      }
      return undefined;
    }),
  );
  stage.register(createMarkAsSoldUnsoldScene(markAsSoldSceneId, markAsUnsoldSceneId, sales, true));
  stage.register(createMarkAsSoldUnsoldScene(markAsSoldSceneId, markAsUnsoldSceneId, sales, false));

  const handler = new Composer<Ctx>();
  handler.command("new", async ctx => {
    return await newSaleHandler(sales, ctx);
  });
  handler.command("newtest", async ctx => {
    if (ctx.from.id.toString(10) === process.env["DEV_CHAT_ID"]) {
      const managedSale = await sales.addNewSale(testSale);
      await sales.forwardTo(managedSale!.posted, ctx.from!.id);
    }
  });

  handler.command("list", async ctx => {
    const managedSales = await sales.getActiveSales(ctx.from.id);
    return Promise.all(managedSales.map(x => sales.forwardTo(x.posted, ctx.from.id)));
  });

  handler.command("sold", async ctx => {
    return await markAsSoldUnsoldHandler(ctx, sales, true);
  });

  handler.command("unsold", async ctx => {
    return await markAsSoldUnsoldHandler(ctx, sales, false);
  });

  return handler;
}

async function newSaleHandler(sales: SalesManager, ctx: NarrowedContext<Ctx, MountMap["text"]>) {
  if (await sales.canAddAnotherSale(ctx.from.id)) {
    await ctx.reply(
      "Для створення нового оголошення заповни всі дані. Якщо хочеш вийти з форми відправ /exit",
    );
    return ctx.scene.enter(createWizardId, {
      createWizard: {
        sale: {
          price: {},
          photos: [],
          user: {
            id: ctx.from.id,
            username: ctx.from.username,
          },
        },
      },
    });
  } else {
    return ctx.reply(
      `Ти вже продаєш ${sales.maxSalesPerUser} товарів` +
        "виставляти більше оголошень не можна. " +
        "Видали якесь поточне оголошення щоб виставити нове.",
    );
  }
}

async function markAsSoldUnsoldHandler(
  ctx: NarrowedContext<Ctx, MountMap["text"]>,
  sales: SalesManager,
  asSold: boolean,
) {
  const managedSales = await sales.getActiveSales(ctx.from.id, !asSold);
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
