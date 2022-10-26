import { CreateListingWizardBuilder } from "./CreateListingWizardBuilder";
import { Currency, Listing, ListingCategory } from "./types";
import { Ctx } from "../telegraf/Context";

export function createListingWizardScene(
  id: string,
  onFinish: (ctx: Ctx, listing?: Listing) => Promise<unknown> | unknown,
) {
  return new CreateListingWizardBuilder(ctx => {
    ctx.scene.session.listing = {
      price: {} as Listing["price"],
      user: ctx.scene.session.state.user,
      photos: [],
    };
  })
    .text(
      "Назва товару:",
      (ctx, title) => (ctx.scene.session.listing.title = title),
      "Будь ласка відправ назву товару або /exit щоб вийти",
    )
    .enumeration(
      Object.values(ListingCategory),
      "Категорія:",
      (ctx, category) => (ctx.scene.session.listing.category = category),
    )
    .enumeration(
      Object.values(Currency),
      "Валюта:",
      (ctx, currency) => (ctx.scene.session.listing.price!.currency = currency),
    )
    .number(
      "Ціна у вибраній валюті:",
      (ctx, price) => (ctx.scene.session.listing.price!.value = price),
      "Будь ласка відправ ціну цифрами або /exit",
    )
    .text(
      "Спосіб отримання:",
      (ctx, delivery) => (ctx.scene.session.listing.delivery = delivery),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .text(
      "Розташування:",
      (ctx, location) => (ctx.scene.session.listing.location = location),
      "Будь ласка вкажи спосіб отримання товару або відправ /exit",
    )
    .photos(
      "Надішли фотки товару:",
      "Готово",
      ctx => {
        const photos = ctx.scene.session.listing.photos;
        return Boolean(photos) && photos!.length > 0;
      },
      (ctx, photosSizes) => {
        const first = photosSizes[0]!;
        ctx.scene.session.listing.photos!.push(first.file_id);
      },
      "Скинь хоча б одну",
      "Будь ласка скидай тільки фотки або відправ /exit",
    )
    .text(
      "Опис:",
      (ctx, description) => (ctx.scene.session.listing.description = description),
      "Будь ласка відправ опис або /exit",
    )
    .build(id, (ctx, cancelled) =>
      onFinish(ctx, cancelled ? undefined : (ctx.scene.session.listing as Listing)),
    );
}
