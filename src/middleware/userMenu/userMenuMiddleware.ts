import { Composer, Middleware, Scenes } from "telegraf";
import { Ctx } from "../../telegraf/Context";
import { SalesFacade } from "../../core/SalesFacade";
import { createSaleScene, createSaleHandler, createSaleTestHandler } from "./createSale";
import { markAsSoldUnsoldScene, markAsSoldUnsoldHandler } from "./markAsSoldUnsold";
import { listSalesHandler } from "./listSales";

export function userMenuMiddleware(stage: Scenes.Stage<Ctx>, facade: SalesFacade): Middleware<Ctx> {
  stage.register(createSaleScene(facade));
  stage.register(markAsSoldUnsoldScene(facade, true));
  stage.register(markAsSoldUnsoldScene(facade, false));

  const handler = new Composer<Ctx>();
  handler.command("new", ctx => createSaleHandler(facade, ctx));
  handler.command("newtest", ctx => createSaleTestHandler(ctx, facade));
  handler.command("list", ctx => listSalesHandler(facade, ctx));
  handler.command("sold", ctx => markAsSoldUnsoldHandler(ctx, facade, true));
  handler.command("unsold", ctx => markAsSoldUnsoldHandler(ctx, facade, false));

  return handler;
}
