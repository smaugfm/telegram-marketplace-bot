import {Ctx} from "../../telegraf/Context";
import {Currency, Sale, SaleCategory} from "../../sale/types";
import {CreateSaleWizardBuilder} from "../../telegraf/CreateSaleWizardBuilder";

export function createSaleWizardScene(
  createWizardId: string,
  onFinish: (ctx: Ctx, sale?: Sale) => Promise<unknown> | unknown,
) {
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
    .build(createWizardId, (ctx, cancelled) =>
      onFinish(ctx, cancelled ? undefined : (ctx.scene.session.state.createWizard.sale as Sale)),
    );
}
