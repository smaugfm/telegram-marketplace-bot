import { CreateSaleWizardBuilder } from "./CreateSaleWizardBuilder";
import { Currency, Sale, SaleCategory } from "./types";
import { Ctx } from "../telegraf/Context";

export function createSaleWizardScene(
  id: string,
  onFinish: (ctx: Ctx, sale?: Sale) => Promise<unknown> | unknown,
) {
  return new CreateSaleWizardBuilder(ctx => {
    ctx.scene.session.sale = {
      price: {} as Sale["price"],
      user: ctx.scene.session.state.user,
      photos: [],
    };
  })
    .text(
      "Назва товару:",
      (ctx, title) => (ctx.scene.session.sale.title = title),
      "Будь ласка відправ назву товару або /exit щоб вийти",
    )
    .enumeration(
      Object.values(SaleCategory),
      "Категорія:",
      (ctx, category) => (ctx.scene.session.sale.category = category),
    )
    .enumeration(
      Object.values(Currency),
      "Валюта:",
      (ctx, currency) => (ctx.scene.session.sale.price!.currency = currency),
    )
    .number(
      "Ціна у вибраній валюті:",
      (ctx, price) => (ctx.scene.session.sale.price!.value = price),
      "Будь ласка відправ ціну цифрами або /exit",
    )
    .text(
      "Спосіб отримання:",
      (ctx, delivery) => (ctx.scene.session.sale.delivery = delivery),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .text(
      "Розташування:",
      (ctx, location) => (ctx.scene.session.sale.location = location),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .photos(
      "Надішли фотки товару:",
      "Готово",
      ctx => {
        const photos = ctx.scene.session.sale.photos;
        return Boolean(photos) && photos!.length > 0;
      },
      (ctx, photo) => {
        ctx.scene.session.sale.photos!.push(photo.file_id);
      },
      "Скинь хоча б одну",
      "Будь ласка скидай тільки фотки або відправ /exit",
    )
    .text(
      "Опис:",
      (ctx, description) => (ctx.scene.session.sale.description = description),
      "Будь ласка відправ опис або /exit",
    )
    .build(id, (ctx, cancelled) =>
      onFinish(ctx, cancelled ? undefined : (ctx.scene.session.sale as Sale)),
    );
}
