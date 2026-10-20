import { createContext, useContext } from 'react';
import type { UICollectionViewDataSourceContextValue } from './UICollectionViewDataSource.types';

export const UICollectionViewDataSourceContext =
  createContext<UICollectionViewDataSourceContextValue | null>(null);

export function useOptionalUICollectionViewDataSourceContext(): UICollectionViewDataSourceContextValue | null {
  return useContext(UICollectionViewDataSourceContext);
}

export function useUICollectionViewDataSourceContext(): UICollectionViewDataSourceContextValue {
  const value = useContext(UICollectionViewDataSourceContext);

  if (value === null) {
    throw new Error(
      'useUICollectionViewDataSourceContext must be used within UICollectionViewDataSource'
    );
  }

  return value;
}
