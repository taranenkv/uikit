import type { HTMLAttributes, ReactNode } from 'react';
import type { UIViewControllerTransitionCoordinator } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';

export type UIViewControllerAppearanceState =
  'disappeared' | 'appearing' | 'appeared' | 'disappearing';

export type UIModalPresentationStyle = 'fullScreen' | 'overFullScreen' | 'custom';

export type UIViewControllerAppearanceTransitionMode = 'animated' | 'immediate' | 'external';

export interface UIViewControllerLifecycle {
  viewDidLoad?: () => void;
  viewWillAppear?: (animated: boolean) => void;
  viewDidAppear?: (animated: boolean) => void;
  viewWillDisappear?: (animated: boolean) => void;
  viewDidDisappear?: (animated: boolean) => void;
  viewWillLayoutSubviews?: () => void;
  viewDidLayoutSubviews?: () => void;
}

export interface UIViewControllerLifecycleSnapshot extends UIViewControllerLifecycle {
  animated: boolean;
}

export interface UIViewControllerContextValue {
  title: string | undefined;
  parent: UIViewControllerContextValue | null;
  readonly view: HTMLDivElement | null;
  isViewLoaded: boolean;
  appearanceState: UIViewControllerAppearanceState;
  isBeingPresented: boolean;
  isBeingDismissed: boolean;
  modalPresentationStyle: UIModalPresentationStyle;
  isModalInPresentation: boolean;
  presentingViewController: UIViewControllerContextValue | null;
  presentedViewController: ReactNode | null;
  transitionCoordinator: UIViewControllerTransitionCoordinator | null;
  present: (
    viewControllerToPresent: ReactNode,
    animated?: boolean,
    completion?: () => void
  ) => void;
  dismiss: (animated?: boolean, completion?: () => void) => void;
}

export interface UIViewControllerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, UIViewControllerLifecycle {
  title?: string;
  isViewVisible?: boolean;
  animated?: boolean;
  modalPresentationStyle?: UIModalPresentationStyle;
  transitioningDelegate?: UIViewControllerTransitioningDelegate | null;
  isModalInPresentation?: boolean;
}

export interface UIViewControllerPresentation {
  key: number;
  viewControllerToPresent: ReactNode;
  animated: boolean;
  completion?: () => void;
}

export interface UIViewControllerAnimatedWrapperProps {
  appearanceState: UIViewControllerAppearanceState;
  transitionMode: UIViewControllerAppearanceTransitionMode;
  onAppearanceTransitionCompleted: () => void;
  children?: ReactNode;
}
