import { createContext, useContext } from 'react';
import type { UIViewControllerContextValue } from './UIViewController.types';

export const UIViewControllerContext = createContext<UIViewControllerContextValue | null>(null);

export function useOptionalUIViewControllerContext(): UIViewControllerContextValue | null {
  return useContext(UIViewControllerContext);
}

export function useUIViewControllerContext(): UIViewControllerContextValue {
  const value = useContext(UIViewControllerContext);

  if (value === null) {
    throw new Error('useUIViewControllerContext must be used within UIViewController');
  }

  return value;
}
