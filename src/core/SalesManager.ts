import { ManagedSale, PostedMessages } from "./types";
import { MarketplaceChannelManager } from "./MarketplaceChannelManager";
import { Sale } from "../sale/types";

class Storage {
  addSale(userId: number, posted: PostedMessages, sale: Sale): Promise<ManagedSale> {
    throw new Error("Method not implemented.");
  }

  getSales(userId: number, includeSold: boolean, includeRemoved: boolean): Promise<ManagedSale[]> {
    throw new Error("Method not implemented.");
  }

  modifySale(sale: ManagedSale): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class SalesManager {
  private readonly maxSalesPerUser: number;
  private readonly storage: Storage;
  private readonly marketplaceChannelManager: MarketplaceChannelManager;

  constructor(
    maxSalesPerUser: number,
    storage: Storage,
    marketplaceChannelManager: MarketplaceChannelManager,
  ) {
    this.maxSalesPerUser = maxSalesPerUser;
    this.storage = storage;
    this.marketplaceChannelManager = marketplaceChannelManager;
  }

  async canAddAnotherSale(userId: number): Promise<boolean> {
    return (await this.salesRemaining(userId)) < this.maxSalesPerUser;
  }

  async salesRemaining(userId: number): Promise<number> {
    return this.maxSalesPerUser - (await this.storage.getSales(userId, false, false)).length;
  }

  async addNewSale(sale: Sale): Promise<ManagedSale | undefined> {
    if (!(await this.canAddAnotherSale(sale.user.id))) return undefined;

    const posted = await this.marketplaceChannelManager.post(sale);
    return this.storage.addSale(sale.user.id, posted, sale);
  }

  async markSold(sale: ManagedSale): Promise<ManagedSale> {
    const modified = {
      ...sale,
      sold: true,
    };
    await this.storage.modifySale(modified);
    await this.marketplaceChannelManager.markSold(sale.posted, sale.sale);
    return modified;
  }

  async removeSale(sale: ManagedSale): Promise<void> {
    await this.storage.modifySale({
      ...sale,
      removed: true,
    });
    await this.marketplaceChannelManager.remove(sale.posted);
  }
}
