import { Telegram } from "telegraf";
import { markdownv2 as fmt } from "telegram-format";
import { InputMediaPhoto } from "telegraf/types";
import { Sale } from "../sale/types";
import { MessageLayout, PostedMessages } from "./types";
import { ExtraCopyMessage } from "telegraf/typings/telegram-types";
import { log } from "../log/log";

export class MarketplaceChannel {
  private readonly tg: Telegram;
  private readonly chatId: number;

  constructor(telegram: Telegram, chatId: number) {
    this.tg = telegram;
    this.chatId = chatId;
  }

  async markSold(posted: PostedMessages, sale: Sale): Promise<void> {
    const layout = this.getSaleMessageLayout(sale, true);
    return await this.editLayout(layout, posted, true);
  }

  async markUnsold(posted: PostedMessages, sale: Sale): Promise<void> {
    const layout = this.getSaleMessageLayout(sale, false);
    return await this.editLayout(layout, posted, false);
  }

  async remove(posted: PostedMessages): Promise<void> {
    return await this.removeMessages(posted);
  }

  forwardTo(posted: PostedMessages, targetChatId: number) {
    return this.tg.forwardMessage(targetChatId, this.chatId, posted.photoMessageIds[0]!);
  }

  copyTo(posted: PostedMessages, targetChatId: number, extra?: ExtraCopyMessage) {
    return this.tg.copyMessage(targetChatId, this.chatId, posted.photoMessageIds[0]!, extra);
  }

  async userHasAdminRightsToChannel(userId: number) {
    const acceptableStatuses = ["member", "creator", "administrator"];
    return await this.hasMemberStatus(userId, acceptableStatuses);
  }

  async userHasAccessToChannel(userId: number) {
    const acceptableStatuses = ["member", "creator", "administrator"];
    return await this.hasMemberStatus(userId, acceptableStatuses);
  }

  async post(sale: Sale): Promise<PostedMessages> {
    const layout = this.getSaleMessageLayout(sale, false);
    return await this.postLayout(layout);
  }

  private async hasMemberStatus(userId: number, acceptableStatuses: string[]) {
    try {
      const member = await this.tg.getChatMember(this.chatId, userId);
      return member && acceptableStatuses.includes(member.status);
    } catch (e) {
      log.error("Unexpected error: ", e);
      return false;
    }
  }

  private async editLayout(layout: MessageLayout, posted: PostedMessages, sold: boolean) {
    await this.tg.editMessageCaption(
      this.chatId,
      posted.photoMessageIds[0],
      undefined,
      layout.caption,
      {
        parse_mode: "MarkdownV2",
      },
    );
    if (layout.separateDescription) {
      if (!posted.separateDescriptionMessageId) {
        throw new Error(
          "Layout calculated separate messageId to be present " +
            "but separateDescriptionMessageId is null",
        );
      }
      await this.tg.editMessageText(
        this.chatId,
        posted.separateDescriptionMessageId,
        undefined,
        layout.separateDescription,
        sold ? { parse_mode: "MarkdownV2" } : undefined,
      );
    }
  }

  private async postLayout(layout: MessageLayout): Promise<PostedMessages> {
    let separateDescriptionMessageId: number | undefined;
    const photoMessages = await this.sendMediaGroupWithCaption(
      this.tg,
      this.chatId,
      layout.photoFileIds,
      layout.caption,
    );
    if (layout.separateDescription) {
      separateDescriptionMessageId = (
        await this.tg.sendMessage(this.chatId, layout.separateDescription, {
          reply_to_message_id: photoMessages[0]!.message_id,
        })
      ).message_id;
    }
    return {
      mediaGroupId: photoMessages[0]?.media_group_id,
      photoMessageIds: photoMessages.map(x => x.message_id),
      separateDescriptionMessageId,
    };
  }

  private async removeMessages(posted: PostedMessages) {
    if (posted.separateDescriptionMessageId)
      await this.tg.deleteMessage(this.chatId, posted.separateDescriptionMessageId);
    await Promise.all(posted.photoMessageIds.map(id => this.tg.deleteMessage(this.chatId, id)));
  }

  private getSaleMessageLayout(sale: Sale, sold: boolean): MessageLayout {
    let caption = this.createCaptionWithDescription(this.createCaption(sale, sold), sale);
    if (caption.length < 1024) {
      return {
        photoFileIds: sale.photos,
        caption,
      };
    } else {
      caption = this.createCaption(sale, sold);
      return {
        photoFileIds: sale.photos,
        caption,
        separateDescription: this.createDescription(sale, sold),
      };
    }
  }

  private createDescription(sale: Sale, sold: boolean): string {
    if (sold)
      return `${fmt.bold("ПРОДАНО")}
      
${fmt.escape(sale.description)}
      
${fmt.bold("ПРОДАНО")} `;
    else return sale.description;
  }

  private createCaptionWithDescription(caption: string, sanitizedSale: Sale) {
    return `${caption}
${fmt.escape(sanitizedSale.description)}
  `;
  }

  private createCaption(sale: Sale, sold: boolean) {
    let price = fmt.italic(`${sale.price.value} ${sale.price.currency}`);
    if (sold) price = fmt.strikethrough(price) + ` ${fmt.bold("ПРОДАНО")}`;

    return `${fmt.bold(fmt.escape(sale.title))}
Хто продає: ${fmt.userMention("@" + sale.user.username, sale.user.id)}
Де знаходиться: ${fmt.escape(sale.location)}
Отримання: ${fmt.escape(sale.delivery)}
Ціна: ${price}

\\#${sale.category}
`;
  }

  private sendMediaGroupWithCaption(
    telegram: Telegram,
    chatId: number,
    photos: Sale["photos"],
    caption: string,
  ) {
    return telegram.sendMediaGroup(
      chatId,
      photos.map(
        (x, i) =>
          ({
            type: "photo",
            media: x.toString(),
            caption: i === 0 ? caption : undefined,
            parse_mode: "MarkdownV2",
          } as InputMediaPhoto),
      ),
    );
  }
}
