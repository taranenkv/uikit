import { createContext, useContext } from 'react';
import type { UIViewControllerTransitionCoordinator } from './UIViewControllerTransitionCoordinator.types';

export const UIViewControllerTransitionCoordinatorReactContext =
  createContext<UIViewControllerTransitionCoordinator | null>(null);

export function useUIViewControllerTransitionCoordinator(): UIViewControllerTransitionCoordinator | null {
  return useContext(UIViewControllerTransitionCoordinatorReactContext);
}
