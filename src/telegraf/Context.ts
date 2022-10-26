import { Context, Scenes } from "telegraf";
import {Sale} from "../sale/types";

export interface CtxSceneSession extends Scenes.WizardSessionData {
  sale: Partial<Sale>;
  state: {
    user: Sale["user"];
  };
}

export interface Ctx extends Context {
  scene: Scenes.SceneContextScene<Ctx, CtxSceneSession>;
  wizard: Scenes.WizardContextWizard<Ctx>;
}
