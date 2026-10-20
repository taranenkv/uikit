import type { HTMLAttributes, ReactNode } from 'react';
import type { IndexPath } from '../UICollectionViewLayout/UICollectionViewLayout.types';

export interface CGPoint {
  x: number;
  y: number;
}

export interface UICollectionViewDelegate {
  shouldHighlightItemAt?: (indexPath: IndexPath) => boolean;
  didHighlightItemAt?: (indexPath: IndexPath) => void;
  didUnhighlightItemAt?: (indexPath: IndexPath) => void;
  shouldSelectItemAt?: (indexPath: IndexPath) => boolean;
  shouldDeselectItemAt?: (indexPath: IndexPath) => boolean;
  didSelectItemAt?: (indexPath: IndexPath) => void;
  didDeselectItemAt?: (indexPath: IndexPath) => void;
  willDisplayItemAt?: (indexPath: IndexPath) => void;
  didEndDisplayingItemAt?: (indexPath: IndexPath) => void;
  scrollViewDidScroll?: (contentOffset: CGPoint) => void;
}

export interface UICollectionViewDelegateContextValue {
  shouldHighlightItemAt: (indexPath: IndexPath) => boolean;
  didHighlightItemAt: (indexPath: IndexPath) => void;
  didUnhighlightItemAt: (indexPath: IndexPath) => void;
  shouldSelectItemAt: (indexPath: IndexPath) => boolean;
  shouldDeselectItemAt: (indexPath: IndexPath) => boolean;
  didSelectItemAt: (indexPath: IndexPath) => void;
  didDeselectItemAt: (indexPath: IndexPath) => void;
  willDisplayItemAt: (indexPath: IndexPath) => void;
  didEndDisplayingItemAt: (indexPath: IndexPath) => void;
}

export interface UICollectionViewDelegateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  delegate?: UICollectionViewDelegate;
  children?: ReactNode;
}
