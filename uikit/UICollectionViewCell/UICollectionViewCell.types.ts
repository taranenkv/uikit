import type { HTMLAttributes, ReactNode } from 'react';
import type { IndexPath } from '../UICollectionViewLayout/UICollectionViewLayout.types';

export interface UICollectionViewCellProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  children?: ReactNode;
  indexPath?: IndexPath;
  reuseIdentifier?: string;
  backgroundView?: ReactNode;
  selectedBackgroundView?: ReactNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isUserInteractionEnabled?: boolean;
}

export interface UICollectionViewCellContextValue {
  indexPath: IndexPath | null;
  reuseIdentifier: string | undefined;
  isSelected: boolean;
  isHighlighted: boolean;
}

export interface UICollectionViewCellSelectedContentProps {
  children?: ReactNode;
}
