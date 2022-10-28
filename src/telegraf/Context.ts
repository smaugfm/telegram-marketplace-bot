import { Context, Scenes } from "telegraf";
import { Sale } from "../sale/types";
import { PostedMessages } from "../core/types";

export interface CtxSceneSession extends Scenes.WizardSessionData {
  state: {
    createWizard: {
      sale: Partial<Sale>;
    };
    markAsSoldUnsoldScene: {
      currentPosted: PostedMessages[];
      saleIds: number[];
    };
  };
}

export interface Ctx extends Context {
  scene: Scenes.SceneContextScene<Ctx, CtxSceneSession>;
  wizard: Scenes.WizardContextWizard<Ctx>;
}
