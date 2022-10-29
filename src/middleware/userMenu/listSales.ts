import { SalesFacade } from "../../core/SalesFacade";
import { NarrowedContext } from "telegraf";
import { Ctx } from "../../telegraf/Context";
import { MountMap } from "telegraf/typings/telegram-types";
import { replyNoAccessToChannel } from "./util";

export async function listSalesHandler(
  facade: SalesFacade,
  ctx: NarrowedContext<Ctx, MountMap["text"]>,
) {
  if (!(await facade.userHasAccessToChannel(ctx.from.id))) {
    return replyNoAccessToChannel(ctx);
  }

  const managedSales = await facade.getActiveSales(ctx.from.id);
  if (managedSales.length > 0)
    return Promise.all(
      managedSales.map(x => facade.forwardToIncludingSeparateDescription(x.posted, ctx.from.id)),
    );
  else {
    return ctx.reply("У тебе нема активних оголошень");
  }
}
