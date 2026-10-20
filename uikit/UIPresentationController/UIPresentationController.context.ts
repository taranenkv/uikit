import { createContext, useContext } from 'react';
import type { UIPresentationControllerContextValue } from './UIPresentationController.types';

export const UIPresentationControllerContext =
  createContext<UIPresentationControllerContextValue | null>(null);

export function useOptionalUIPresentationControllerContext(): UIPresentationControllerContextValue | null {
  return useContext(UIPresentationControllerContext);
}

export function useUIPresentationControllerContext(): UIPresentationControllerContextValue {
  const value = useContext(UIPresentationControllerContext);

  if (value === null) {
    throw new Error(
      'useUIPresentationControllerContext must be used within UIPresentationController'
    );
  }

  return value;
}
