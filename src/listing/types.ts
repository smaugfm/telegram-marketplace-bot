import { URL } from "url";

export type FileId = string;

export type Listing = {
  title: string;
  category: ListingCategory;
  price: {
    currency: Currency;
    value: number;
  };
  delivery: string;
  location: string;
  photos: FileId[];
  description: string;
  user: {
    id: number,
    username: string
  }
};

export enum Currency {
  UAH = "UAH",
  USD = "USD",
  EUR = "EUR",
}

export enum ListingCategory {
  Drums = "drums",
  Guitar = "guitar",
}

export const testListing = {
  title: "Електронні ударні Roland TD-1DMK",
  category: ListingCategory.Drums,
  price: "20 000 грн",
  delivery: "самовивіз",
  location: "Київ, метро Мінська",
  photos: [
    new URL("https://ireland.apollo.olxcdn.com/v1/files/07i8rgyh2anr-UA/image;s=1000x700"),
    new URL("https://ireland.apollo.olxcdn.com/v1/files/zzwfc7thf8mr3-UA/image;s=1000x700"),
    new URL("https://ireland.apollo.olxcdn.com/v1/files/pyia6aan7luj-UA/image;s=1000x700"),
    new URL("https://ireland.apollo.olxcdn.com/v1/files/737pgd0bzfrw1-UA/image;s=1000x700"),
    new URL("https://ireland.apollo.olxcdn.com/v1/files/7utbsr38sh5r3-UA/image;s=1000x700"),
    new URL("https://ireland.apollo.olxcdn.com/v1/files/x0kokc4ptqm02-UA/image;s=1000x700"),
  ],
  description: `Установку купив у лютому цього року, але в користуванні була всього десь місяців 5, в режимі 2-4 години на тиждень. Тобто, оскільки це Roland, всі педи і тарілки мають стан і вигляд нових: ніяких візуальних слідів використання (за винятком дуже мінорних протертостей, яких навіть не видно на фотках). Всі тригери працюють, жодних нарікань чи «нюансів».

Продається без педалі, без коврику і з оригінальним контролером hi-hat - все як в рідній комплектації.
І ще раз, на фотках стоїть контролер хай-хета FD-9 і він не продається в цьому оголошенні, а йде рідний FD-1, просто він складений в коробку. FD-9 можу продати окремо. Педаль TAMA також не продається (зовсім)
Тобто вам буде потрібно ще докупити педаль для бас-бочки і, можливо (дуже рекомендую) коврик.

Я можу скласти установку в рідну коробку і відправити НП, а можете забрати своїм транспортом в Києві. Якщо ви хочете зразу OLX доставку, то ви не зможете її перевірити після отримання і якщо вам щось не сподобається потім - назад я її не прийму. В принципі, можу записати відео того як спрацьовують тригери.
Під’їхати подивитися можна в м. Київ, 5хв від метро Мінська.`,
  telegramUsername: "@marchfpv",
};
