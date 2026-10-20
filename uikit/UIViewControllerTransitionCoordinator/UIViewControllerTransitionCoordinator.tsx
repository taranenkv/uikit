import {
  UICubicTimingParameters,
  UIViewPropertyAnimator,
} from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type {
  UIViewControllerTransitionCoordinator,
  UIViewControllerTransitionCoordinatorAnimation,
  UIViewControllerTransitionCoordinatorCompletion,
  UIViewControllerTransitionCoordinatorController,
} from './UIViewControllerTransitionCoordinator.types';

export function createViewControllerTransitionCoordinator(
  transitionContext: UIViewControllerContextTransitioning,
  transitionDuration: number
): UIViewControllerTransitionCoordinatorController {
  const pendingAnimations: UIViewControllerTransitionCoordinatorAnimation[] = [];
  const completions: UIViewControllerTransitionCoordinatorCompletion[] = [];
  const interactionHandlers = new Set<UIViewControllerTransitionCoordinatorCompletion>();
  const initiallyInteractive = transitionContext.isInteractive;
  let propertyAnimator: UIViewPropertyAnimator | null = null;
  let isCompleted = false;

  const coordinator: UIViewControllerTransitionCoordinator = {
    containerView: transitionContext.containerView,
    isAnimated: transitionContext.isAnimated,
    initiallyInteractive,
    isPresenting: transitionContext.isPresenting,
    presentationStyle: transitionContext.presentationStyle,
    transitionDuration,
    get isInteractive() {
      return transitionContext.isInteractive;
    },
    get isCancelled() {
      return transitionContext.transitionWasCancelled;
    },
    get percentComplete() {
      return propertyAnimator?.fractionComplete ?? transitionContext.percentComplete;
    },
    viewControllerForKey: (key) => transitionContext.viewControllerForKey(key),
    viewForKey: (key) => transitionContext.viewForKey(key),
    animateAlongsideTransition: (animation, completion) => {
      if (isCompleted) {
        return false;
      }

      if (completion) {
        completions.push(completion);
      }

      if (!animation) {
        return true;
      }

      if (propertyAnimator) {
        propertyAnimator.addAnimations((animations) => animation(animations, coordinator));
      } else {
        pendingAnimations.push(animation);
      }

      return true;
    },
    notifyWhenInteractionChanges: (handler) => {
      interactionHandlers.add(handler);

      return () => {
        interactionHandlers.delete(handler);
      };
    },
  };

  const attachPropertyAnimator = (animator: UIViewPropertyAnimator) => {
    propertyAnimator = animator;
    pendingAnimations
      .splice(0)
      .forEach((animation) =>
        animator.addAnimations((animations) => animation(animations, coordinator))
      );
  };

  return {
    coordinator,
    attachPropertyAnimator,
    runStandalone: () => {
      const animator = new UIViewPropertyAnimator(
        transitionContext.isAnimated ? transitionDuration : 0,
        new UICubicTimingParameters('easeInOut')
      );

      attachPropertyAnimator(animator);
      animator.startAnimation();
    },
    notifyInteractionChange: () => {
      interactionHandlers.forEach((handler) => handler(coordinator));
    },
    completeTransition: () => {
      if (isCompleted) {
        return;
      }

      isCompleted = true;
      completions.splice(0).forEach((completion) => completion(coordinator));
      interactionHandlers.clear();
    },
  };
}
