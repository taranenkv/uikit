import { createContext, useContext } from 'react';
import type { UIViewControllerTransitioningDelegateContextValue } from './UIViewControllerTransitioningDelegate.types';

export const UIViewControllerTransitioningDelegateContext =
  createContext<UIViewControllerTransitioningDelegateContextValue | null>(null);

export function useOptionalUIViewControllerTransitioningDelegateContext(): UIViewControllerTransitioningDelegateContextValue | null {
  return useContext(UIViewControllerTransitioningDelegateContext);
}

export function useUIViewControllerTransitioningDelegateContext(): UIViewControllerTransitioningDelegateContextValue {
  const value = useContext(UIViewControllerTransitioningDelegateContext);

  if (value === null) {
    throw new Error(
      'useUIViewControllerTransitioningDelegateContext must be used within UIViewControllerTransitioningDelegate'
    );
  }

  return value;
}
