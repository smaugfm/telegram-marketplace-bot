import { Composer, Markup, Middleware, Scenes } from "telegraf";
import { PhotoSize } from "telegraf/typings/core/types/typegram";
import { Ctx } from "./Context";
import { SceneOptions } from "telegraf/typings/scenes/base";
import _ from "lodash";
import { Sale } from "../sale/types";

export class CreateSaleWizardBuilder {
  private readonly steps: Step[] = [];
  private readonly enter: ((ctx: Ctx) => Promise<unknown> | unknown) | undefined;

  constructor(enter?: (ctx: Ctx) => Promise<unknown> | unknown) {
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
    error = "Будь ласка вибери один з варіантів або відправ /abort",
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
    onPhoto: OnNext<PhotoSize>,
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

  confirmation(
    enter: string,
    confirmation: string,
    abort: string,
    onConfirm: (ctx: Ctx) => Promise<unknown>,
    error: string,
  ) {
    this.steps.push({
      type: "confirmation",
      enter,
      error,
      confirmation,
      onConfirm,
      abort,
    });
    return this;
  }

  build(
    id: string,
    onFinish: (ctx: Ctx, sale?: Sale) => Promise<unknown> | unknown,
  ): Scenes.WizardScene<Ctx> {
    if (this.steps.length <= 0) throw new Error("Cannot create WizardScene without any steps.");
    const confirmationIndex = this.steps.findIndex(x => x.type === "confirmation");
    if (confirmationIndex > 0 && confirmationIndex !== this.steps.length - 1) {
      throw new Error("Confirmation step must be the last step.");
    }

    const scene = new Scenes.WizardScene<Ctx>(id, {} as SceneOptions<Ctx>);
    scene.enter(async ctx => {
      ctx.scene.session.state.createWizard.aborted = false;
      await this.enter?.(ctx);
      return this.next(ctx, this.steps[0], () => {
        // do nothing
      });
    });

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i]!;
      const nextStep = this.steps[i + 1];
      scene.steps.push(this.createHandler(step, nextStep));
    }

    scene.leave(async (ctx, next) => {
      const aborted = ctx.scene.session.state.createWizard.aborted;
      if (aborted) {
        await ctx.reply("Форму відмінено", Markup.removeKeyboard());
        onFinish(ctx, undefined);
      } else {
        await ctx.reply("Форму завершено", Markup.removeKeyboard());
        onFinish(ctx, ctx.scene.session.state.createWizard.sale as Sale);
      }
      return next();
    });

    return scene;
  }

  private createHandler(step: Step, nextStep: Step | undefined): Middleware<Ctx> {
    switch (step.type) {
      case "text":
        return this.createBaseHandler(step, handler => {
          handler.on("text", async ctx => {
            return this.next(ctx, nextStep, () => step.onNext(ctx, ctx.message.text));
          });
        });
      case "number":
        return this.createBaseHandler(step, handler => {
          handler.on("text", async (ctx, next) => {
            const num = parseInt(ctx.message.text, 10);
            if (isNaN(num)) {
              return next();
            } else {
              return this.next(ctx, nextStep, () => step.onNext(ctx, num));
            }
          });
        });
      case "enum":
        return this.createBaseHandler(step, handler => {
          handler.hears(step.choices, ctx =>
            this.next(ctx, nextStep, () => step.onNext(ctx, ctx.message.text)),
          );
        });
      case "photos":
        return this.createBaseHandler(step, handler => {
          handler.hears(step.finishButton, async ctx => {
            if (step.isEnoughPhotos(ctx)) {
              return this.next(ctx, nextStep, () => {
                // do nothing
              });
            } else {
              return ctx.reply(step.notEnoughPhotos);
            }
          });
          handler.on("photo", async ctx => {
            await step.onPhoto(ctx, this.getBiggestPhotoSize(ctx.message.photo)!);
          });
        });
      case "confirmation":
        return this.createBaseHandler(step, handler => {
          handler.hears(step.confirmation, async ctx =>
            this.next(ctx, nextStep, () => {
              // do nothing
            }),
          );
          handler.hears(step.abort, ctx => this.abort(ctx));
        });
      default:
        throw new Error("Unknown step type " + step);
    }
  }

  private getBiggestPhotoSize(photoSizes: PhotoSize[]): PhotoSize | undefined {
    return _.maxBy(photoSizes, x => x.file_size);
  }

  private createBaseHandler(step: BaseStep, main: (handler: Composer<Ctx>) => void) {
    const handler = new Composer<Ctx>();
    this.handleAbort(handler);
    main(handler);
    this.handleError(handler, step.error);

    return handler;
  }

  private async next(
    ctx: Ctx,
    nextStep: Step | undefined,
    curStepAction: () => Promise<unknown> | unknown,
  ) {
    await curStepAction();
    if (nextStep) {
      switch (nextStep.type) {
        case "text":
        case "number":
          await ctx.reply(nextStep.enter, Markup.removeKeyboard());
          break;
        case "confirmation":
          await ctx.reply(
            nextStep.enter,
            Markup.keyboard([
              Markup.button.text(nextStep.confirmation),
              Markup.button.text(nextStep.abort),
            ]).resize(),
          );
          await nextStep.onConfirm(ctx);
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

  private handleAbort(handler: Composer<Ctx>) {
    handler.command("abort", ctx => {
      this.abort(ctx);
    });
  }

  private handleError(handler: Composer<Ctx>, error: string) {
    handler.use(ctx => {
      return ctx.reply(error);
    });
  }

  private abort(ctx: Ctx) {
    ctx.scene.session.state.createWizard.aborted = true;
    return ctx.scene.leave();
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
  onPhoto: OnNext<PhotoSize>;
  isEnoughPhotos: (ctx: Ctx) => boolean;
  notEnoughPhotos: string;
  finishButton: string;
}

interface ConfirmationStep extends BaseStep {
  type: "confirmation";
  onConfirm: (ctx: Ctx) => Promise<unknown>;
  confirmation: string;
  abort: string;
}

type Step = TextStep | NumberStep | EnumStep | PhotosStep | ConfirmationStep;

type OnNext<T> = (ctx: Ctx, result: T) => Promise<unknown> | unknown;
