import { ManagedSale, PostedMessages } from "./types";
import { MarketplaceChannel } from "./MarketplaceChannel";
import { Sale } from "../sale/types";
import { Storage } from "./Storage";
import { ExtraCopyMessage } from "telegraf/typings/telegram-types";
import { epochDays, epochMinutes } from "../util";

export class SalesManager {
  public readonly maxSalesPerUser: number;
  private readonly storage: Storage;
  private readonly channel: MarketplaceChannel;

  constructor(maxSalesPerUser: number, storage: Storage, channel: MarketplaceChannel) {
    this.maxSalesPerUser = maxSalesPerUser;
    this.storage = storage;
    this.channel = channel;
  }

  async canAddAnotherSale(userId: number): Promise<boolean> {
    return (await this.getActiveSales(userId)).length < this.maxSalesPerUser;
  }

  async getActiveSales(userId: number, includeSold = false): Promise<ManagedSale[]> {
    return this.storage.getSales(userId, includeSold, false);
  }

  async forwardTo(posted: PostedMessages, targetChatId: number) {
    return this.channel.forwardTo(posted, targetChatId);
  }

  async copyTo(posted: PostedMessages, targetChatId: number, extra?: ExtraCopyMessage) {
    return this.channel.copyTo(posted, targetChatId, extra);
  }

  async addNewSale(sale: Sale): Promise<ManagedSale | undefined> {
    if (!(await this.canAddAnotherSale(sale.user.id))) return undefined;

    const posted = await this.channel.post(sale);
    return this.storage.addSale(sale.user.id, posted, sale);
  }

  async canMarkUnsold(saleId: number): Promise<boolean> {
    const sale = await this.storage.getSale(saleId);
    //with a safety buffer of 1 hour
    return Date.now() - sale.soldAt < epochDays(2) - epochMinutes(60);
  }

  async markSoldUnsold(saleId: number, sold: boolean): Promise<ManagedSale | undefined> {
    if (!sold && !(await this.canMarkUnsold(saleId))) return undefined;

    const modified = await this.storage.modifySale(saleId, {
      soldAt: sold ? Date.now() : 0,
    });
    if (sold) await this.channel.markSold(modified.posted, modified.sale);
    else await this.channel.markUnsold(modified.posted, modified.sale);
    return modified;
  }

  async removeSale(saleId: number): Promise<ManagedSale> {
    const modified = await this.storage.modifySale(saleId, {
      removed: true,
    });
    await this.channel.remove(modified.posted);
    return modified;
  }
}
