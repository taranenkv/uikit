import type { HTMLAttributes, ReactNode } from 'react';
import type { UIViewControllerContextValue } from '../UIViewController/UIViewController.types';
import type {
  UIViewControllerAnimatedTransitioning,
  UIViewControllerInteractiveTransitioning,
} from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIPresentationControllerConfiguration } from '../UIPresentationController/UIPresentationController.types';

export interface UIViewControllerTransitioningDelegate {
  animationControllerForPresented?: (
    presented: UIViewControllerContextValue | null,
    presenting: UIViewControllerContextValue,
    source: UIViewControllerContextValue
  ) => UIViewControllerAnimatedTransitioning | null;
  animationControllerForDismissed?: (
    dismissed: UIViewControllerContextValue | null
  ) => UIViewControllerAnimatedTransitioning | null;
  interactionControllerForPresentation?: (
    animator: UIViewControllerAnimatedTransitioning
  ) => UIViewControllerInteractiveTransitioning | null;
  interactionControllerForDismissal?: (
    animator: UIViewControllerAnimatedTransitioning
  ) => UIViewControllerInteractiveTransitioning | null;
  presentationControllerForPresented?: (
    presented: UIViewControllerContextValue | null,
    presenting: UIViewControllerContextValue,
    source: UIViewControllerContextValue
  ) => UIPresentationControllerConfiguration | null;
}

export interface UIViewControllerMatchedTransitionRegistry {
  register: (identifier: string, element: HTMLElement) => () => void;
  matchedViewFor: (identifier: string, root: Element | null) => HTMLElement | null;
}

export interface UIViewControllerTransitioningDelegateContextValue {
  transitioningDelegate: UIViewControllerTransitioningDelegate | null;
  registry: UIViewControllerMatchedTransitionRegistry;
}

export interface UIViewControllerTransitioningDelegateProps {
  transitioningDelegate?: UIViewControllerTransitioningDelegate | null;
  children?: ReactNode;
}

export interface UIViewControllerMatchedTransitionSourceProps extends HTMLAttributes<HTMLDivElement> {
  identifier: string;
  children?: ReactNode;
}
