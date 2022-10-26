import { Composer, Markup, Middleware, Scenes } from "telegraf";
import { PhotoSize } from "telegraf/typings/core/types/typegram";
import { Ctx } from "../telegraf/Context";
import { SceneOptions } from "telegraf/typings/scenes/base";

export class CreateListingWizardBuilder {
  private readonly steps: Step[] = [];
  private readonly enter: (ctx: Ctx) => Promise<unknown> | unknown;

  constructor(enter: (ctx: Ctx) => Promise<unknown> | unknown) {
    this.enter = enter;
  }

  text(enter: string, onNext: OnNext<string>, error: string) {
    this.steps.push({
      type: "text",
      enter,
      error,
      onNext,
    });
    return this;
  }

  number(enter: string, onNext: OnNext<number>, error: string) {
    this.steps.push({
      type: "number",
      enter,
      error,
      onNext,
    });
    return this;
  }

  enumeration<T extends string>(
    choices: T[],
    enter: string,
    onNext: OnNext<T>,
    error = "Будь ласка вибери один з варіантів або відправ /exit",
  ) {
    this.steps.push({
      type: "enum",
      enter,
      error,
      choices,
      onNext: onNext as OnNext<string>,
    });
    return this;
  }

  photos(
    enter: string,
    finishButton: string,
    isEnoughPhotos: (ctx: Ctx) => boolean,
    onPhoto: OnNext<PhotoSize[]>,
    notEnoughPhotos: string,
    error: string,
  ) {
    this.steps.push({
      type: "photos",
      enter,
      error,
      finishButton,
      isEnoughPhotos,
      notEnoughPhotos,
      onPhoto,
    });
    return this;
  }

  build(
    id: string,
    onFinish: (ctx: Ctx, cancelled: boolean) => Promise<unknown> | unknown,
  ): Scenes.WizardScene<Ctx> {
    if (this.steps.length <= 0) throw new Error("Cannot create WizardScene without any steps.");

    const scene = new Scenes.WizardScene<Ctx>(id, {} as SceneOptions<Ctx>);
    scene.enter(async ctx => {
      await this.enter(ctx);
      return this.next(ctx, undefined, undefined, this.steps[0], () => {
        // do nothing
      });
    });

    for (let i = 0; i < this.steps.length; i++) {
      const prevStep = this.steps[i - 1];
      const step = this.steps[i]!;
      const nextStep = this.steps[i + 1];
      scene.steps.push(this.createHandler(prevStep, step, nextStep));
    }

    scene.leave((ctx, next) => {
      onFinish(ctx, ctx.wizard.cursor + 1 < (ctx.wizard["steps"] as Array<unknown>).length);
      ctx.scene.session.listing = {};
      return next();
    });

    return scene;
  }

  private createHandler(
    prevStep: TextStep | NumberStep | EnumStep | PhotosStep | undefined,
    step: TextStep | NumberStep | EnumStep | PhotosStep,
    nextStep: TextStep | NumberStep | EnumStep | PhotosStep | undefined,
  ): Middleware<Ctx> {
    switch (step.type) {
      case "text":
        return this.createBaseHandler(step, handler => {
          handler.on("text", async ctx => {
            return this.next(ctx, prevStep, step, nextStep, () =>
              step.onNext(ctx, ctx.message.text),
            );
          });
        });
      case "number":
        return this.createBaseHandler(step, handler => {
          handler.on("text", async (ctx, next) => {
            const num = parseInt(ctx.message.text, 10);
            if (isNaN(num)) {
              return next();
            } else {
              return this.next(ctx, prevStep, step, nextStep, () => step.onNext(ctx, num));
            }
          });
        });
      case "enum":
        return this.createBaseHandler(step, handler => {
          handler.hears(step.choices, ctx =>
            this.next(ctx, prevStep, step, nextStep, () => step.onNext(ctx, ctx.message.text)),
          );
        });
      case "photos":
        return this.createBaseHandler(step, handler => {
          handler.hears(step.finishButton, async ctx => {
            if (step.isEnoughPhotos(ctx)) {
              return this.next(ctx, prevStep, step, nextStep, () => {
                // do nothing
              });
            } else {
              return ctx.reply(step.notEnoughPhotos);
            }
          });
          handler.on("photo", async ctx => {
            await step.onPhoto(ctx, ctx.message.photo);
          });
        });
      default:
        throw new Error("Unknown step type " + step);
    }
  }

  private createBaseHandler(step: BaseStep, main: (handler: Composer<Ctx>) => void) {
    const handler = new Composer<Ctx>();
    this.handleExit(handler);
    main(handler);
    this.handleError(handler, step.error);

    return handler;
  }

  private async next(
    ctx: Ctx,
    prevStep: Step | undefined,
    curStep: Step | undefined,
    nextStep: Step | undefined,
    curStepAction: () => Promise<unknown> | unknown,
  ) {
    await curStepAction();
    if (nextStep) {
      switch (nextStep.type) {
        case "text":
          await ctx.reply(nextStep.enter, this.removeKeyboard(curStep, prevStep));
          break;
        case "number":
          await ctx.reply(nextStep.enter, this.removeKeyboard(curStep, prevStep));
          break;
        case "enum":
          await ctx.reply(
            nextStep.enter,
            Markup.keyboard(nextStep.choices.map(x => Markup.button.text(x))).resize(),
          );
          break;
        case "photos":
          await ctx.reply(
            nextStep.enter,
            Markup.keyboard([Markup.button.text(nextStep.finishButton)]).resize(),
          );
          break;
      }

      return ctx.wizard?.next();
    } else return ctx.scene.leave();
  }

  private removeKeyboard(curStep?: Step, prevStep?: Step) {
    return curStep?.type === "photos" || prevStep?.type === "enum"
      ? Markup.removeKeyboard()
      : undefined;
  }

  private handleExit(handler: Composer<Ctx>) {
    handler.command("exit", ctx => {
      ctx.scene.leave();
    });
  }

  private handleError(handler: Composer<Ctx>, error: string) {
    handler.use(ctx => {
      return ctx.reply(error);
    });
  }
}

interface BaseStep {
  enter: string;
  error: string;
}

interface TextStep extends BaseStep {
  type: "text";
  onNext: OnNext<string>;
}

interface NumberStep extends BaseStep {
  type: "number";
  onNext: OnNext<number>;
}

interface EnumStep extends BaseStep {
  type: "enum";
  choices: string[];
  onNext: OnNext<string>;
}

interface PhotosStep extends BaseStep {
  type: "photos";
  onPhoto: OnNext<PhotoSize[]>;
  isEnoughPhotos: (ctx: Ctx) => boolean;
  notEnoughPhotos: string;
  finishButton: string;
}

type Step = TextStep | NumberStep | EnumStep | PhotosStep;

type OnNext<T> = (ctx: Ctx, result: T) => Promise<unknown> | unknown;
