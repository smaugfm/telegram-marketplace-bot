import { ManagedSale, PostedMessages } from "./types";
import { Sale } from "../sale/types";
import { Storage } from "./Storage";
import { ExtraCopyMessage } from "telegraf/typings/telegram-types";
import { epochDays, epochMinutes } from "../util";
import { Marketplace } from "./interface/Marketplace";
import { log } from "../log/log";

export class SalesFacade {
  public readonly maxSalesPerUser: number;
  private readonly storage: Storage;
  private readonly channel: Marketplace;

  constructor(maxSalesPerUser: number, storage: Storage, channel: Marketplace) {
    this.maxSalesPerUser = maxSalesPerUser;
    this.storage = storage;
    this.channel = channel;
  }

  async userHasAccessToChannel(userId: number): Promise<boolean> {
    return this.channel.userHasAccess(userId);
  }

  async canAddAnotherSale(userId: number): Promise<boolean> {
    return (await this.getActiveSales(userId)).length < this.maxSalesPerUser;
  }

  async getActiveSales(userId: number, includeSold = false): Promise<ManagedSale[]> {
    const sales = await this.storage.getSales(userId, includeSold, false);
    const exists = await Promise.all(
      sales.map(async sale => {
        if (!(await this.channel.checkExists(sale.posted))) {
          log.warn("Message was deleted externally: ", sale);
          await this.storage.modifySale(sale.id, { removed: true });
          return false;
        }
        return true;
      }),
    );

    return sales.filter((s, i) => exists[i]);
  }

  async forwardToIncludingSeparateDescription(posted: PostedMessages, targetChatId: number) {
    return this.channel.forwardTo(posted, targetChatId);
  }

  async copyTo(posted: PostedMessages, targetChatId: number, extra?: ExtraCopyMessage) {
    return this.channel.copyFirstTo(posted, targetChatId, extra);
  }

  async addNewSale(sale: Sale): Promise<ManagedSale | undefined> {
    if (!(await this.canAddAnotherSale(sale.user.id))) return undefined;

    const posted = await this.channel.postNewSale(sale);
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
}
