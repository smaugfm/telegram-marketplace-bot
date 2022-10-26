export type FileId = string;

export type Sale = {
  title: string;
  category: SaleCategory;
  price: {
    currency: Currency;
    value: number;
  };
  delivery: string;
  location: string;
  photos: FileId[];
  description: string;
  user: {
    id: number;
    username: string;
  };
};

export enum Currency {
  UAH = "UAH",
  USD = "USD",
  EUR = "EUR",
}

export enum SaleCategory {
  Drums = "drums",
  Guitar = "guitar",
}
