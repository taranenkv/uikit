import { forwardRef, useMemo } from 'react';
import styles from './UIViewControllerAnimatedTransitioning.module.css';
import { UIViewControllerAnimatedTransitioningContext } from './UIViewControllerAnimatedTransitioning.context';
import { UIViewControllerContextTransitioningContext } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.context';
import { UIViewPropertyAnimatorContext } from '../UIViewPropertyAnimator/UIViewPropertyAnimator.context';
import {
  UICubicTimingParameters,
  UIViewPropertyAnimator,
} from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type {
  UIViewControllerAnimatedTransitioning as UIViewControllerAnimatedTransitioningProtocol,
  UIViewControllerAnimatedTransitioningContextValue,
  UIViewControllerAnimatedTransitioningProps,
  UIViewControllerTransitionRequest,
} from './UIViewControllerAnimatedTransitioning.types';

const CROSS_DISSOLVE_DURATION = 0.3;

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export class UICrossDissolveAnimatedTransitioning implements UIViewControllerAnimatedTransitioningProtocol {
  private readonly duration: number;
  private readonly propertyAnimators = new WeakMap<
    UIViewControllerContextTransitioning,
    UIViewPropertyAnimator
  >();

  constructor(duration = CROSS_DISSOLVE_DURATION) {
    this.duration = duration;
  }

  transitionDuration(transitionContext: UIViewControllerContextTransitioning | null): number {
    return transitionContext?.isAnimated === false ? 0 : this.duration;
  }

  interruptibleAnimator(
    transitionContext: UIViewControllerContextTransitioning
  ): UIViewPropertyAnimator {
    const existing = this.propertyAnimators.get(transitionContext);

    if (existing) {
      return existing;
    }

    const isPresenting = transitionContext.isPresenting;
    const presentedView = transitionContext.viewForKey(isPresenting ? 'to' : 'from');
    const propertyAnimator = new UIViewPropertyAnimator(
      this.transitionDuration(transitionContext),
      new UICubicTimingParameters('easeInOut')
    );

    if (presentedView) {
      propertyAnimator.addAnimations((animations) => {
        animations.fromTo(
          presentedView,
          { autoAlpha: isPresenting ? 0 : 1 },
          { autoAlpha: isPresenting ? 1 : 0 }
        );
      });
    }

    propertyAnimator.addCompletion((finalPosition) => {
      transitionContext.completeTransition(
        finalPosition === 'end' && !transitionContext.transitionWasCancelled
      );
    });

    this.propertyAnimators.set(transitionContext, propertyAnimator);

    return propertyAnimator;
  }

  animateTransition(transitionContext: UIViewControllerContextTransitioning): void {
    this.interruptibleAnimator(transitionContext).startAnimation();
  }
}

export function performViewControllerTransition({
  animator,
  interactionController,
  transitionContext,
  coordinatorController,
}: UIViewControllerTransitionRequest): UIViewPropertyAnimator | null {
  const propertyAnimator = animator.interruptibleAnimator?.(transitionContext) ?? null;

  if (propertyAnimator) {
    coordinatorController.attachPropertyAnimator(propertyAnimator);
  } else {
    coordinatorController.runStandalone();
  }

  if (interactionController && transitionContext.isInteractive) {
    interactionController.startInteractiveTransition(transitionContext, animator);
  } else {
    animator.animateTransition(transitionContext);
  }

  return propertyAnimator;
}

const UIViewControllerAnimatedTransitioningRoot = forwardRef<
  HTMLDivElement,
  UIViewControllerAnimatedTransitioningProps
>(function UIViewControllerAnimatedTransitioning(
  {
    animator = null,
    transitionContext = null,
    propertyAnimator = null,
    className,
    children,
    ...rest
  },
  ref
) {
  const contextValue = useMemo<UIViewControllerAnimatedTransitioningContextValue>(
    () => ({ animator, transitionContext }),
    [animator, transitionContext]
  );

  return (
    <UIViewControllerAnimatedTransitioningContext.Provider value={contextValue}>
      <UIViewControllerContextTransitioningContext.Provider value={transitionContext}>
        <UIViewPropertyAnimatorContext.Provider value={propertyAnimator}>
          <div
            {...rest}
            ref={ref}
            data-transitioning={transitionContext !== null}
            className={joinClassNames(styles.transitionView, className)}>
            {children}
          </div>
        </UIViewPropertyAnimatorContext.Provider>
      </UIViewControllerContextTransitioningContext.Provider>
    </UIViewControllerAnimatedTransitioningContext.Provider>
  );
});

UIViewControllerAnimatedTransitioningRoot.displayName = 'UIViewControllerAnimatedTransitioning';

export const UIViewControllerAnimatedTransitioning = UIViewControllerAnimatedTransitioningRoot;
