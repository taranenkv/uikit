import { useState } from 'react';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type {
  UIViewControllerAnimatedTransitioning,
  UIViewControllerInteractiveTransitioning,
} from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIViewPropertyAnimator } from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { UITimingCurveProvider } from '../UIViewPropertyAnimator/UIViewPropertyAnimator.types';
import type { UIPercentDrivenInteractiveTransitionPendingAction } from './UIPercentDrivenInteractiveTransition.types';

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export class UIPercentDrivenInteractiveTransition implements UIViewControllerInteractiveTransitioning {
  wantsInteractiveStart = true;
  completionSpeed = 1;
  completionCurve: UITimingCurveProvider | null = null;

  private transitionContext: UIViewControllerContextTransitioning | null = null;
  private propertyAnimator: UIViewPropertyAnimator | null = null;
  private pendingPercentComplete = 0;
  private pendingAction: UIPercentDrivenInteractiveTransitionPendingAction = null;

  get percentComplete(): number {
    return this.propertyAnimator?.fractionComplete ?? this.pendingPercentComplete;
  }

  get duration(): number {
    return this.propertyAnimator?.duration ?? 0;
  }

  get isTransitionActive(): boolean {
    return this.transitionContext !== null;
  }

  startInteractiveTransition(
    transitionContext: UIViewControllerContextTransitioning,
    animator: UIViewControllerAnimatedTransitioning
  ): void {
    const propertyAnimator = animator.interruptibleAnimator?.(transitionContext) ?? null;

    if (!propertyAnimator) {
      animator.animateTransition(transitionContext);
      this.reset();
      return;
    }

    this.transitionContext = transitionContext;
    this.propertyAnimator = propertyAnimator;
    propertyAnimator.pauseAnimation();
    propertyAnimator.fractionComplete = this.pendingPercentComplete;
    transitionContext.updateInteractiveTransition(this.pendingPercentComplete);

    const pendingAction = this.pendingAction;

    this.pendingAction = null;

    if (pendingAction === 'finish') {
      this.finish();
    }

    if (pendingAction === 'cancel') {
      this.cancel();
    }
  }

  update(percentComplete: number): void {
    const fraction = clamp(percentComplete);

    if (!this.propertyAnimator || !this.transitionContext) {
      this.pendingPercentComplete = fraction;
      return;
    }

    this.propertyAnimator.fractionComplete = fraction;
    this.transitionContext.updateInteractiveTransition(fraction);
  }

  pause(): void {
    if (!this.propertyAnimator || !this.transitionContext) {
      return;
    }

    this.propertyAnimator.pauseAnimation();
    this.transitionContext.pauseInteractiveTransition();
  }

  finish(): void {
    this.complete('finish');
  }

  cancel(): void {
    this.complete('cancel');
  }

  private complete(action: Exclude<UIPercentDrivenInteractiveTransitionPendingAction, null>): void {
    const propertyAnimator = this.propertyAnimator;
    const transitionContext = this.transitionContext;

    if (!propertyAnimator || !transitionContext) {
      this.pendingAction = action;
      return;
    }

    if (action === 'finish') {
      transitionContext.finishInteractiveTransition();
    } else {
      transitionContext.cancelInteractiveTransition();
    }

    this.reset();
    propertyAnimator.isReversed = action === 'cancel';
    propertyAnimator.continueAnimation(
      this.completionCurve,
      1 / Math.max(this.completionSpeed, Number.EPSILON)
    );
  }

  private reset(): void {
    this.transitionContext = null;
    this.propertyAnimator = null;
    this.pendingPercentComplete = 0;
    this.pendingAction = null;
  }
}

export function useUIPercentDrivenInteractiveTransition(): UIPercentDrivenInteractiveTransition {
  const [interactiveTransition] = useState(() => new UIPercentDrivenInteractiveTransition());

  return interactiveTransition;
}
