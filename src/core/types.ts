import { Sale } from "../sale/types";

export type TimeOfDaySchedule = OncePerDay;
export type OncePerDay = {
  type: "once";
  hour: number;
  minute: number;
};

export type DayToDaySchedule = EveryNthDay;
export type EveryNthDay = {
  type: "everyNthDay";
  nth: number;
};

export type PostedMessages = {
  photoMessageIds: number[];
  mediaGroupId: string | undefined;
  separateDescriptionMessageId: number | undefined;
};

export type ManagedSale = Readonly<{
  id: number;
  sale: Sale;

  posted: PostedMessages;

  sold: boolean;
  removed: boolean;
}>;

export type MessageLayout = {
  photoFileIds: string[];
  caption: string;
  separateDescription?: string;
};
