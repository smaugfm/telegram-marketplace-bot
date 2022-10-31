import { PostedMessages } from "../types";
import { Sale } from "../../sale/types";
import { ExtraCopyMessage } from "telegraf/typings/telegram-types";

export interface Marketplace {
  markSold(posted: PostedMessages, sale: Sale): Promise<void>;

  markUnsold(posted: PostedMessages, sale: Sale): Promise<void>;

  remove(posted: PostedMessages): Promise<void>;

  postNewSale(sale: Sale, chatId?: number): Promise<PostedMessages>;

  forwardTo(posted: PostedMessages, targetChatId: number): Promise<unknown>;

  checkExists(posted: PostedMessages): Promise<boolean>;

  copyFirstTo(
    posted: PostedMessages,
    targetChatId: number,
    extra?: ExtraCopyMessage,
  ): Promise<unknown>;

  userHasAdminRights(userId: number): Promise<boolean>;

  userHasAccess(userId: number): Promise<boolean>;

  chatIdEqualsChannelChatId(chatId: number): Promise<boolean>;
}
