import { createContext, useContext } from 'react';
import type { UIPanGestureRecognizerContextValue } from './UIPanGestureRecognizer.types';

export const UIPanGestureRecognizerContext =
  createContext<UIPanGestureRecognizerContextValue | null>(null);

export function useOptionalUIPanGestureRecognizerContext(): UIPanGestureRecognizerContextValue | null {
  return useContext(UIPanGestureRecognizerContext);
}

export function useUIPanGestureRecognizerContext(): UIPanGestureRecognizerContextValue {
  const value = useContext(UIPanGestureRecognizerContext);

  if (value === null) {
    throw new Error('useUIPanGestureRecognizerContext must be used within UIPanGestureRecognizer');
  }

  return value;
}
