import { Sale } from "../sale/types";

export type PostedMessages = {
  photoMessageIds: number[];
  mediaGroupId: string | undefined;
  separateDescriptionMessageId: number | undefined;
};

export type ManagedSale = Readonly<{
  id: number;
  sale: Sale;

  posted: PostedMessages;

  soldAt: number;
  removed: boolean;
}>;

export type MessageLayout = {
  photoFileIds: string[];
  caption: string;
  separateDescription?: string;
};
