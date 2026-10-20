import { createContext, useContext } from 'react';
import type { UIViewControllerContextTransitioning } from './UIViewControllerContextTransitioning.types';

export const UIViewControllerContextTransitioningContext =
  createContext<UIViewControllerContextTransitioning | null>(null);

export function useOptionalUIViewControllerContextTransitioning(): UIViewControllerContextTransitioning | null {
  return useContext(UIViewControllerContextTransitioningContext);
}

export function useUIViewControllerContextTransitioning(): UIViewControllerContextTransitioning {
  const value = useContext(UIViewControllerContextTransitioningContext);

  if (value === null) {
    throw new Error(
      'useUIViewControllerContextTransitioning must be used during a view controller transition'
    );
  }

  return value;
}
