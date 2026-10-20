import type { CGRect } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UIModalPresentationStyle,
  UIViewControllerContextValue,
} from '../UIViewController/UIViewController.types';

export type UITransitionContextViewControllerKey = 'from' | 'to';

export type UITransitionContextViewKey = 'from' | 'to';

export interface UIViewControllerContextTransitioning {
  readonly containerView: HTMLElement;
  readonly isAnimated: boolean;
  readonly isInteractive: boolean;
  readonly isPresenting: boolean;
  readonly transitionWasCancelled: boolean;
  readonly presentationStyle: UIModalPresentationStyle;
  readonly percentComplete: number;
  viewControllerForKey: (
    key: UITransitionContextViewControllerKey
  ) => UIViewControllerContextValue | null;
  viewForKey: (key: UITransitionContextViewKey) => HTMLElement | null;
  initialFrameFor: (key: UITransitionContextViewControllerKey) => CGRect;
  finalFrameFor: (key: UITransitionContextViewControllerKey) => CGRect;
  frameInContainerView: (element: Element) => CGRect;
  matchedViewFor: (
    identifier: string,
    key: UITransitionContextViewControllerKey
  ) => HTMLElement | null;
  updateInteractiveTransition: (percentComplete: number) => void;
  finishInteractiveTransition: () => void;
  cancelInteractiveTransition: () => void;
  pauseInteractiveTransition: () => void;
  completeTransition: (didComplete: boolean) => void;
}

export interface UIViewControllerContextTransitioningConfiguration {
  containerView: HTMLElement;
  isAnimated: boolean;
  isInteractive: boolean;
  isPresenting: boolean;
  presentationStyle: UIModalPresentationStyle;
  viewControllers: Record<
    UITransitionContextViewControllerKey,
    UIViewControllerContextValue | null
  >;
  views: Record<UITransitionContextViewKey, HTMLElement | null>;
  matchedViewFor: (identifier: string, root: Element | null) => HTMLElement | null;
  onInteractionChange?: () => void;
  onComplete: (didComplete: boolean) => void;
}
