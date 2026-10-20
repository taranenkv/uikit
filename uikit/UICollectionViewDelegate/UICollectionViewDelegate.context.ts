import { createContext, useContext } from 'react';
import type { UICollectionViewDelegateContextValue } from './UICollectionViewDelegate.types';

export const UICollectionViewDelegateContext =
  createContext<UICollectionViewDelegateContextValue | null>(null);

export function useOptionalUICollectionViewDelegateContext(): UICollectionViewDelegateContextValue | null {
  return useContext(UICollectionViewDelegateContext);
}

export function useUICollectionViewDelegateContext(): UICollectionViewDelegateContextValue {
  const value = useContext(UICollectionViewDelegateContext);

  if (value === null) {
    throw new Error(
      'useUICollectionViewDelegateContext must be used within UICollectionViewDelegate'
    );
  }

  return value;
}
