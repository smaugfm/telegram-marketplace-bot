import { Currency, Sale, SaleCategory } from "./sale/types";

export function epochDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export function epochMinutes(minutes: number): number {
  return minutes * 60 * 1000;
}

export const testSale: Sale = {
  title: "Електронні ударні Roland TD-1DMK",
  category: SaleCategory.Drums,
  price: { value: 20000, currency: Currency.UAH },
  delivery: "самовивіз",
  location: "Київ, метро Мінська",
  photos: [
    "AgACAgIAAxkBAAIBlWNZX7Y51qPlmjnFDimtQWIEvRniAAIdxjEb8lPJSgMGYg33hOw9AQADAgADeQADKgQ",
    "AgACAgIAAxkBAAIBlmNZX7ZrMEVseVG1XWBF_ksKz9KwAAIfxjEb8lPJSvMzrZlfY9bVAQADAgADeQADKgQ",
    "AgACAgIAAxkBAAIBl2NZX7aRryUP64f9pNPu9_Bxh6xuAAK91TEb8lPRSoEOu9jYuf8RAQADAgADeQADKgQ",
    "AgACAgIAAxkBAAIBmGNZX7Y6GV7XX971zm5Ujmia17YBAAK-1TEb8lPRSnQYlQ_ACtKwAQADAgADeQADKgQ",
    "AgACAgIAAxkBAAIBmWNZX7Zvg_ccWtfSji3vznv0BfvGAAK_1TEb8lPRSn9zaoY7JlT5AQADAgADeQADKgQ",
  ],
  //   description: `Установку купив у лютому цього року, але в користуванні була всього десь місяців 5, в режимі 2-4 години на тиждень. Тобто, оскільки це Roland, всі педи і тарілки мають стан і вигляд нових: ніяких візуальних слідів використання (за винятком дуже мінорних протертостей, яких навіть не видно на фотках). Всі тригери працюють, жодних нарікань чи «нюансів».
  //
  // Продається без педалі, без коврику і з оригінальним контролером hi-hat - все як в рідній комплектації.
  // І ще раз, на фотках стоїть контролер хай-хета FD-9 і він не продається в цьому оголошенні, а йде рідний FD-1, просто він складений в коробку. FD-9 можу продати окремо. Педаль TAMA також не продається (зовсім)
  // Тобто вам буде потрібно ще докупити педаль для бас-бочки і, можливо (дуже рекомендую) коврик.
  //
  // Я можу скласти установку в рідну коробку і відправити НП, а можете забрати своїм транспортом в Києві. Якщо ви хочете зразу OLX доставку, то ви не зможете її перевірити після отримання і якщо вам щось не сподобається потім - назад я її не прийму. В принципі, можу записати відео того як спрацьовують тригери.
  // Під’їхати подивитися можна в м. Київ, 5хв від метро Мінська.`,
  description: `Установку купив у лютому цього року, але в користуванні була всього десь місяців 5, в режимі 2-4 години на тиждень. Тобто, оскільки це Roland, всі педи і тарілки мають стан і вигляд нових: ніяких візуальних слідів використання (за винятком дуже мінорних протертостей, яких навіть не видно на фотках). Всі тригери працюють, жодних нарікань чи «нюансів».`,
  user: {
    id: parseInt(process.env["DEV_CHAT_ID"] ?? "0", 10),
    username: "marchfpv",
  },
};
