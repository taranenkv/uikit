import { createContext, useContext } from 'react';
import type { UIViewPropertyAnimator } from './UIViewPropertyAnimator';

export const UIViewPropertyAnimatorContext = createContext<UIViewPropertyAnimator | null>(null);

export function useOptionalUIViewPropertyAnimator(): UIViewPropertyAnimator | null {
  return useContext(UIViewPropertyAnimatorContext);
}

export function useUIViewPropertyAnimatorContext(): UIViewPropertyAnimator {
  const value = useContext(UIViewPropertyAnimatorContext);

  if (value === null) {
    throw new Error('useUIViewPropertyAnimatorContext must be used within UIViewPropertyAnimator');
  }

  return value;
}
