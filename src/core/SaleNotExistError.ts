export class SaleNotExistError extends Error {
  constructor(saleId: number) {
    super(`Sale with id=${saleId} does not exist`);
  }
}
