import type { ReactNode } from 'react';
import type { CGRect } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UIModalPresentationStyle,
  UIViewControllerAppearanceState,
  UIViewControllerContextValue,
} from '../UIViewController/UIViewController.types';
import type { UIViewControllerTransitionCoordinator } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';

export type UIPresentationTransitionKind = 'presentation' | 'dismissal';

export interface UIPresentationControllerDimmingView {
  backgroundColor?: string;
  backdropFilter?: string;
}

export interface UIPresentationControllerConfiguration {
  shouldRemovePresentersView?: boolean;
  dimmingView?: UIPresentationControllerDimmingView | null;
  frameOfPresentedViewInContainerView?: (containerViewFrame: CGRect) => CGRect;
  presentationTransitionWillBegin?: (coordinator: UIViewControllerTransitionCoordinator) => void;
  presentationTransitionDidEnd?: (completed: boolean) => void;
  dismissalTransitionWillBegin?: (coordinator: UIViewControllerTransitionCoordinator) => void;
  dismissalTransitionDidEnd?: (completed: boolean) => void;
}

export interface UIPresentedViewControllerRegistration {
  viewController: () => UIViewControllerContextValue;
  modalPresentationStyle: UIModalPresentationStyle;
  transitioningDelegate: UIViewControllerTransitioningDelegate | null;
  isModalInPresentation: boolean;
}

export interface UIPresentationControllerContextValue {
  presentingViewController: UIViewControllerContextValue;
  appearanceState: UIViewControllerAppearanceState;
  transitionCoordinator: UIViewControllerTransitionCoordinator | null;
  isAnimated: boolean;
  registerPresentedViewController: (
    registration: UIPresentedViewControllerRegistration
  ) => () => void;
  dismiss: (animated?: boolean, completion?: () => void) => void;
}

export interface UIPresentationControllerRef {
  dismiss: (animated?: boolean, completion?: () => void) => void;
}

export interface UIPresentationControllerProps {
  presentedViewController: ReactNode;
  presentingViewController: UIViewControllerContextValue;
  animated: boolean;
  completion?: () => void;
  onTransitionCoordinatorChange: (
    coordinator: UIViewControllerTransitionCoordinator | null
  ) => void;
  onPresentingViewControllerAppearanceStateChange: (
    appearanceState: UIViewControllerAppearanceState | null
  ) => void;
  onDismissalCompleted: () => void;
}

export interface UIPresentationControllerCallbacks {
  completion: (() => void) | undefined;
  onTransitionCoordinatorChange: UIPresentationControllerProps['onTransitionCoordinatorChange'];
  onPresentingViewControllerAppearanceStateChange: UIPresentationControllerProps['onPresentingViewControllerAppearanceStateChange'];
  onDismissalCompleted: () => void;
}
