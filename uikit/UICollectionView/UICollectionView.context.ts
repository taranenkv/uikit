import { createContext, useContext } from 'react';
import type { UICollectionViewContextValue } from './UICollectionView.types';

export const UICollectionViewContext = createContext<UICollectionViewContextValue | null>(null);

export function useOptionalUICollectionViewContext(): UICollectionViewContextValue | null {
  return useContext(UICollectionViewContext);
}

export function useUICollectionViewContext(): UICollectionViewContextValue {
  const value = useContext(UICollectionViewContext);

  if (value === null) {
    throw new Error('useUICollectionViewContext must be used within UICollectionView');
  }

  return value;
}
