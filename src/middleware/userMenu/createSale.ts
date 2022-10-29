import { Currency, Sale, SaleCategory } from "../../sale/types";
import { CreateSaleWizardBuilder } from "../../telegraf/CreateSaleWizardBuilder";
import { SalesFacade } from "../../core/SalesFacade";
import { NarrowedContext } from "telegraf";
import { Ctx } from "../../telegraf/Context";
import { MountMap } from "telegraf/typings/telegram-types";
import { replyNoAccessToChannel } from "./util";
import { testSale } from "../../util";

const createWizardId = "createSaleWizard";

export async function createSaleHandler(
  facade: SalesFacade,
  ctx: NarrowedContext<Ctx, MountMap["text"]>,
) {
  if (!(await facade.userHasAccessToChannel(ctx.from.id))) {
    return replyNoAccessToChannel(ctx);
  }

  if (await facade.canAddAnotherSale(ctx.from.id)) {
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
      `Ти вже продаєш ${facade.maxSalesPerUser} товарів` +
        "виставляти більше оголошень не можна. " +
        "Видали якесь поточне оголошення щоб виставити нове.",
    );
  }
}

export function createSaleScene(facade: SalesFacade) {
  return new CreateSaleWizardBuilder()
    .text(
      "Назва товару:",
      (ctx, title) => (ctx.scene.session.state.createWizard.sale.title = title),
      "Будь ласка відправ назву товару або /exit щоб вийти",
    )
    .enumeration(
      Object.values(SaleCategory),
      "Категорія:",
      (ctx, category) => (ctx.scene.session.state.createWizard.sale.category = category),
    )
    .enumeration(
      Object.values(Currency),
      "Валюта:",
      (ctx, currency) => (ctx.scene.session.state.createWizard.sale.price!.currency = currency),
    )
    .number(
      "Ціна у вибраній валюті:",
      (ctx, price) => (ctx.scene.session.state.createWizard.sale.price!.value = price),
      "Будь ласка відправ ціну цифрами або /exit",
    )
    .text(
      "Спосіб отримання:",
      (ctx, delivery) => (ctx.scene.session.state.createWizard.sale.delivery = delivery),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .text(
      "Розташування:",
      (ctx, location) => (ctx.scene.session.state.createWizard.sale.location = location),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .photos(
      "Надішли фотки товару:",
      "Готово",
      ctx => {
        const photos = ctx.scene.session.state.createWizard.sale.photos;
        return Boolean(photos) && photos!.length > 0;
      },
      (ctx, photo) => {
        ctx.scene.session.state.createWizard.sale.photos!.push(photo.file_id);
      },
      "Скинь хоча б одну",
      "Будь ласка скидай тільки фотки або відправ /exit",
    )
    .text(
      "Опис:",
      (ctx, description) => (ctx.scene.session.state.createWizard.sale.description = description),
      "Будь ласка відправ опис або /exit",
    )
    .build(createWizardId, async (ctx, cancelled) => {
      if (cancelled) return;

      const sale = ctx.scene.session.state.createWizard.sale as Sale;
      const managedSale = await facade.addNewSale(sale);
      if (!managedSale)
        return ctx.reply(
          `Ти вже продаєш ${facade.maxSalesPerUser} товарів` +
            "виставляти більше оголошень не можна. " +
            "Видали якесь поточне оголошення щоб виставити нове.",
        );
      return await facade.forwardToIncludingSeparateDescription(managedSale.posted, ctx.from!.id);
    });
}

export async function createSaleTestHandler(
  ctx: NarrowedContext<Ctx, MountMap["text"]>,
  facade: SalesFacade,
) {
  if (ctx.from.id.toString(10) === process.env["DEVELOPER_CHAT_ID"]) {
    const managedSale = await facade.addNewSale({
      ...testSale,
      user: {
        id: parseInt(process.env["DEVELOPER_CHAT_ID"]!, 10),
        username: process.env["DEVELOPER_USERNAME"]!,
      },
    });
    await facade.forwardToIncludingSeparateDescription(managedSale!.posted, ctx.from!.id);
  }
}
