import { createContext, useContext } from 'react';
import type { UIViewControllerAnimatedTransitioningContextValue } from './UIViewControllerAnimatedTransitioning.types';

export const UIViewControllerAnimatedTransitioningContext =
  createContext<UIViewControllerAnimatedTransitioningContextValue | null>(null);

export function useOptionalUIViewControllerAnimatedTransitioningContext(): UIViewControllerAnimatedTransitioningContextValue | null {
  return useContext(UIViewControllerAnimatedTransitioningContext);
}

export function useUIViewControllerAnimatedTransitioningContext(): UIViewControllerAnimatedTransitioningContextValue {
  const value = useContext(UIViewControllerAnimatedTransitioningContext);

  if (value === null) {
    throw new Error(
      'useUIViewControllerAnimatedTransitioningContext must be used within UIViewControllerAnimatedTransitioning'
    );
  }

  return value;
}
