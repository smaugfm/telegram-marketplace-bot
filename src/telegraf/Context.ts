import { Context, Scenes } from "telegraf";
import { Listing } from "../listing/types";

export interface CtxSceneSession extends Scenes.WizardSessionData {
  listing: Partial<Listing>;
  state: {
    user: Listing["user"];
  };
}

export interface Ctx extends Context {
  scene: Scenes.SceneContextScene<Ctx, CtxSceneSession>;
  wizard: Scenes.WizardContextWizard<Ctx>;
}
