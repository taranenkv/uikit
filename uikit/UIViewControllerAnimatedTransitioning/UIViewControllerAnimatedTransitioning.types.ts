import type { HTMLAttributes, ReactNode } from 'react';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type { UIViewControllerTransitionCoordinatorController } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.types';
import type { UIViewPropertyAnimator } from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { UITimingCurveProvider } from '../UIViewPropertyAnimator/UIViewPropertyAnimator.types';

export interface UIViewControllerAnimatedTransitioning {
  transitionDuration: (transitionContext: UIViewControllerContextTransitioning | null) => number;
  animateTransition: (transitionContext: UIViewControllerContextTransitioning) => void;
  interruptibleAnimator?: (
    transitionContext: UIViewControllerContextTransitioning
  ) => UIViewPropertyAnimator;
  animationEnded?: (transitionCompleted: boolean) => void;
}

export interface UIViewControllerInteractiveTransitioning {
  readonly wantsInteractiveStart?: boolean;
  readonly completionSpeed?: number;
  readonly completionCurve?: UITimingCurveProvider | null;
  startInteractiveTransition: (
    transitionContext: UIViewControllerContextTransitioning,
    animator: UIViewControllerAnimatedTransitioning
  ) => void;
}

export interface UIViewControllerTransitionRequest {
  animator: UIViewControllerAnimatedTransitioning;
  interactionController: UIViewControllerInteractiveTransitioning | null;
  transitionContext: UIViewControllerContextTransitioning;
  coordinatorController: UIViewControllerTransitionCoordinatorController;
}

export interface UIViewControllerAnimatedTransitioningContextValue {
  animator: UIViewControllerAnimatedTransitioning | null;
  transitionContext: UIViewControllerContextTransitioning | null;
}

export interface UIViewControllerAnimatedTransitioningProps extends HTMLAttributes<HTMLDivElement> {
  animator?: UIViewControllerAnimatedTransitioning | null;
  transitionContext?: UIViewControllerContextTransitioning | null;
  propertyAnimator?: UIViewPropertyAnimator | null;
  children?: ReactNode;
}
