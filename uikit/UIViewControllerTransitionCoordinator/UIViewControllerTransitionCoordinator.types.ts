import type { UIModalPresentationStyle } from '../UIViewController/UIViewController.types';
import type {
  UITransitionContextViewControllerKey,
  UITransitionContextViewKey,
} from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type { UIViewControllerContextValue } from '../UIViewController/UIViewController.types';
import type { UIViewPropertyAnimator } from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { UIViewPropertyAnimatorAnimations } from '../UIViewPropertyAnimator/UIViewPropertyAnimator.types';

export interface UIViewControllerTransitionCoordinatorContext {
  readonly containerView: HTMLElement;
  readonly isAnimated: boolean;
  readonly isInteractive: boolean;
  readonly initiallyInteractive: boolean;
  readonly isCancelled: boolean;
  readonly isPresenting: boolean;
  readonly presentationStyle: UIModalPresentationStyle;
  readonly transitionDuration: number;
  readonly percentComplete: number;
  viewControllerForKey: (
    key: UITransitionContextViewControllerKey
  ) => UIViewControllerContextValue | null;
  viewForKey: (key: UITransitionContextViewKey) => HTMLElement | null;
}

export type UIViewControllerTransitionCoordinatorAnimation = (
  animations: UIViewPropertyAnimatorAnimations,
  context: UIViewControllerTransitionCoordinatorContext
) => void;

export type UIViewControllerTransitionCoordinatorCompletion = (
  context: UIViewControllerTransitionCoordinatorContext
) => void;

export interface UIViewControllerTransitionCoordinator extends UIViewControllerTransitionCoordinatorContext {
  animateAlongsideTransition: (
    animation: UIViewControllerTransitionCoordinatorAnimation | null,
    completion?: UIViewControllerTransitionCoordinatorCompletion | null
  ) => boolean;
  notifyWhenInteractionChanges: (
    handler: UIViewControllerTransitionCoordinatorCompletion
  ) => () => void;
}

export interface UIViewControllerTransitionCoordinatorController {
  coordinator: UIViewControllerTransitionCoordinator;
  attachPropertyAnimator: (propertyAnimator: UIViewPropertyAnimator) => void;
  runStandalone: () => void;
  notifyInteractionChange: () => void;
  completeTransition: () => void;
}
