import type { HTMLAttributes, ReactNode } from 'react';
import type {
  IndexPath,
  UICollectionViewFlowLayoutConfiguration,
  UICollectionViewInitialLayoutAttributesForAppearingItemAt,
  UICollectionViewLayoutAttributesForItemAt,
} from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource.types';
import type { UICollectionViewDelegate } from '../UICollectionViewDelegate/UICollectionViewDelegate.types';

export interface UICollectionViewContextValue {
  indexPathsForSelectedItems: IndexPath[];
  allowsSelection: boolean;
  allowsMultipleSelection: boolean;
  isItemSelected: (indexPath: IndexPath) => boolean;
  selectItem: (indexPath: IndexPath) => void;
  deselectItem: (indexPath: IndexPath) => void;
}

export interface UICollectionViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  dataSource: UICollectionViewDataSource;
  delegate?: UICollectionViewDelegate;
  collectionViewLayout?: UICollectionViewFlowLayoutConfiguration;
  layoutAttributesForItemAt?: UICollectionViewLayoutAttributesForItemAt;
  initialLayoutAttributesForAppearingItemAt?: UICollectionViewInitialLayoutAttributesForAppearingItemAt;
  allowsSelection?: boolean;
  allowsMultipleSelection?: boolean;
}

export interface UICollectionViewSelectionProps {
  allowsSelection: boolean;
  allowsMultipleSelection: boolean;
  children?: ReactNode;
}
