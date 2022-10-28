import { ManagedSale, PostedMessages } from "./types";
import { Sale } from "../sale/types";
import fsSync, { promises as fs } from "fs";
import _ from "lodash";
import { SaleNotExistError } from "./SaleNotExistError";

interface DbSchema {
  sales: ManagedSale[];
  idCounter: number;
}

export class Storage {
  private readonly db: DbSchema;
  private readonly filename: string;

  constructor(filename = "db.json") {
    this.db = this.read(filename);
    this.filename = filename;
  }

  private read(filename: string): DbSchema {
    let read: Partial<DbSchema> = {};
    if (fsSync.existsSync(filename)) {
      read = JSON.parse(fsSync.readFileSync(filename, "utf-8"));
    }

    return Object.assign(
      {
        sales: [],
        idCounter: 0,
      },
      read,
    );
  }

  private get chain() {
    return _.chain(this.db);
  }

  private write() {
    return fs.writeFile(this.filename, JSON.stringify(this.db, undefined, 2));
  }

  async addSale(userId: number, posted: PostedMessages, sale: Sale): Promise<ManagedSale> {
    const managedSale: ManagedSale = {
      id: this.db.idCounter++,
      sale,
      posted,
      soldAt: 0,
      removed: false,
    };

    this.chain.get("sales").push(managedSale).value();
    await this.write();

    return managedSale;
  }

  getSale(id: number): Promise<ManagedSale> {
    const result = this.chain.get("sales").find({ id }).value();
    if (result === undefined) throw new SaleNotExistError(id);
    return Promise.resolve(result);
  }

  getSales(userId: number, sold: boolean, removed: boolean): Promise<ManagedSale[]> {
    const sales = this.chain
      .get("sales")
      .filter(s => {
        return (
          s.sale.user.id === userId &&
          (sold ? s.soldAt > 0 : s.soldAt === 0) &&
          (removed ? s.removed : !s.removed)
        );
      })
      .value();

    return Promise.resolve(sales);
  }

  async modifySale(id: number, sale: Partial<Omit<ManagedSale, "id">>): Promise<ManagedSale> {
    const modified = this.chain.get("sales").find({ id }).assign(sale).value();
    if (modified === undefined) throw new SaleNotExistError(id);
    await this.write();
    return modified;
  }
}
