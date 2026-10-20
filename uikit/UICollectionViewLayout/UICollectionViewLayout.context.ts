import { createContext, useContext } from 'react';
import type { IndexPath, UICollectionViewLayoutContextValue } from './UICollectionViewLayout.types';

export const UICollectionViewLayoutContext =
  createContext<UICollectionViewLayoutContextValue | null>(null);

export const UICollectionViewIndexPathContext = createContext<IndexPath | null>(null);

export function useOptionalUICollectionViewLayoutContext(): UICollectionViewLayoutContextValue | null {
  return useContext(UICollectionViewLayoutContext);
}

export function useUICollectionViewLayoutContext(): UICollectionViewLayoutContextValue {
  const value = useContext(UICollectionViewLayoutContext);

  if (value === null) {
    throw new Error('useUICollectionViewLayoutContext must be used within UICollectionViewLayout');
  }

  return value;
}

export function useUICollectionViewIndexPath(): IndexPath | null {
  return useContext(UICollectionViewIndexPathContext);
}
