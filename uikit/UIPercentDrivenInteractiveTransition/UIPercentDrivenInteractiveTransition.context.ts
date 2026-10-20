import { createContext, useContext } from 'react';
import type { UIPercentDrivenInteractiveTransition } from './UIPercentDrivenInteractiveTransition';
import type { UIPercentDrivenInteractiveTransitionContextValue } from './UIPercentDrivenInteractiveTransition.types';

export const UIPercentDrivenInteractiveTransitionContext =
  createContext<UIPercentDrivenInteractiveTransitionContextValue>(null);

export function useOptionalUIPercentDrivenInteractiveTransition(): UIPercentDrivenInteractiveTransition | null {
  return useContext(UIPercentDrivenInteractiveTransitionContext);
}

export function useUIPercentDrivenInteractiveTransitionContext(): UIPercentDrivenInteractiveTransition {
  const value = useContext(UIPercentDrivenInteractiveTransitionContext);

  if (value === null) {
    throw new Error(
      'useUIPercentDrivenInteractiveTransitionContext must be used within UIPercentDrivenInteractiveTransitionContext'
    );
  }

  return value;
}
