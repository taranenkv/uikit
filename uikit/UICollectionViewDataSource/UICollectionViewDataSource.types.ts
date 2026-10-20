import type { HTMLAttributes, ReactNode } from 'react';
import type { IndexPath } from '../UICollectionViewLayout/UICollectionViewLayout.types';

export interface UICollectionViewDataSource {
  numberOfSections?: () => number;
  numberOfItemsInSection: (section: number) => number;
  cellForItemAt: (indexPath: IndexPath) => ReactNode;
}

export interface UICollectionViewDataSourceContextValue {
  numberOfSections: () => number;
  numberOfItemsInSection: (section: number) => number;
  cellForItemAt: (indexPath: IndexPath) => ReactNode;
}

export interface UICollectionViewDataSourceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  dataSource: UICollectionViewDataSource;
  children?: ReactNode;
}
