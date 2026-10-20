import type { HTMLAttributes } from 'react';

export type UIViewControllerAppearanceState =
  'disappeared' | 'appearing' | 'appeared' | 'disappearing';

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
  isViewLoaded: boolean;
  appearanceState: UIViewControllerAppearanceState;
  isBeingPresented: boolean;
  isBeingDismissed: boolean;
}

export interface UIViewControllerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, UIViewControllerLifecycle {
  title?: string;
  isViewVisible?: boolean;
  animated?: boolean;
}

export interface UIViewControllerAnimatedWrapperProps {
  appearanceState: UIViewControllerAppearanceState;
  animated: boolean;
  onAppearanceTransitionCompleted: () => void;
  children?: React.ReactNode;
}
