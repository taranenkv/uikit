import { createContext, useContext } from 'react';
import type { UICollectionViewCellContextValue } from './UICollectionViewCell.types';

export const UICollectionViewCellContext = createContext<UICollectionViewCellContextValue | null>(
  null
);

export function useUICollectionViewCellContext(): UICollectionViewCellContextValue {
  const value = useContext(UICollectionViewCellContext);

  if (value === null) {
    throw new Error('useUICollectionViewCellContext must be used within UICollectionViewCell');
  }

  return value;
}
