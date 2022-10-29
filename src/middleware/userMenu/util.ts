import {Ctx} from "../../telegraf/Context";

export function replyNoAccessToChannel(ctx: Ctx) {
  return ctx.reply(
    "Щоб створювати нові оголошення і взємодіяти з цим ботом ти маєш бути у каналі " +
    process.env["MARKETPLACE_CHANNEL_NAME"],
  );
}
