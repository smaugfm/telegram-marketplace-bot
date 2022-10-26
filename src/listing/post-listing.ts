import { Telegram } from "telegraf";
import { Listing } from "./types";
import { markdownv2 as fmt } from "telegram-format";

export async function postListing(telegram: Telegram, chatId: number, rawListing: Listing) {
  const listing = sanitizeMarkdownV2(rawListing);

  const caption = `${fmt.bold(listing.title)} 
Хто продає: ${fmt.userMention("@" + listing.user.username, listing.user.id)}
Де знаходиться: ${listing.location}
Отримання: ${listing.delivery}
Ціна: ${fmt.italic(`${listing.price.value} ${listing.price.currency}`)}

\\#${listing.category}
`;
  const captionWithDescription = `${caption}
${listing.description}
  `;
  if (captionWithDescription.length <= 1024) {
    await sendMessage(telegram, chatId, listing.photos, captionWithDescription);
  } else {
    const messages = await sendMessage(telegram, chatId, listing.photos, caption);
    await telegram.sendMessage(chatId, listing.description, {
      reply_to_message_id: messages?.[0]?.message_id,
    });
  }
}

async function sendMessage(
  telegram: Telegram,
  chatId: number,
  photos: Listing["photos"],
  caption: string,
) {
  return await telegram.sendMediaGroup(
    chatId,
    photos.map((x, i) => ({
      type: "photo",
      media: x.toString(),
      caption: i === 0 ? caption : undefined,
      parse_mode: "MarkdownV2",
    })),
  );
}

function sanitizeMarkdownV2(listing: Listing): Listing {
  const copy: Listing = { ...listing };

  copy.title = fmt.escape(listing.title);
  copy.delivery = fmt.escape(listing.delivery);
  copy.location = fmt.escape(listing.location);
  copy.description = fmt.escape(listing.description);

  return copy;
}
