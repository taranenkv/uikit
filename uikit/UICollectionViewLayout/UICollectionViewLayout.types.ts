import type { HTMLAttributes, ReactNode } from 'react';

export interface IndexPath {
  section: number;
  item: number;
}

export interface CGPoint {
  x: number;
  y: number;
}

export interface CGSize {
  width: number;
  height: number;
}

export interface CGRect {
  origin: CGPoint;
  size: CGSize;
}

export interface UIEdgeInsets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface CGAffineTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export type UICollectionViewScrollDirection = 'vertical' | 'horizontal';

export type UICollectionViewScrollPosition =
  'top' | 'centeredVertically' | 'bottom' | 'left' | 'centeredHorizontally' | 'right';

export interface UICollectionViewFlowLayout {
  scrollDirection: UICollectionViewScrollDirection;
  itemSize: CGSize;
  minimumLineSpacing: number;
  minimumInteritemSpacing: number;
  sectionInset: UIEdgeInsets;
}

export type UICollectionViewFlowLayoutConfiguration = Partial<
  Omit<UICollectionViewFlowLayout, 'sectionInset'>
> & {
  sectionInset?: Partial<UIEdgeInsets>;
};

export type UICollectionViewLayoutElementCategory = 'cell';

export interface UICollectionViewLayoutAttributes {
  indexPath: IndexPath;
  representedElementCategory: UICollectionViewLayoutElementCategory;
  frame: CGRect;
  size: CGSize;
  alpha: number;
  transform: CGAffineTransform;
  zIndex: number;
  isHidden: boolean;
}

export type UICollectionViewLayoutAttributesOverrides = Partial<
  Omit<UICollectionViewLayoutAttributes, 'indexPath' | 'representedElementCategory' | 'frame'>
>;

export interface UICollectionViewLayoutItemState {
  isSelected: boolean;
  isHighlighted: boolean;
}

export type UICollectionViewLayoutAttributesForItemAt = (
  indexPath: IndexPath,
  state: UICollectionViewLayoutItemState,
  proposedAttributes: UICollectionViewLayoutAttributes
) => UICollectionViewLayoutAttributesOverrides;

export type UICollectionViewInitialLayoutAttributesForAppearingItemAt = (
  indexPath: IndexPath,
  proposedAttributes: UICollectionViewLayoutAttributes
) => UICollectionViewLayoutAttributesOverrides;

export interface UICollectionViewLayoutContextValue {
  collectionViewLayout: UICollectionViewFlowLayout;
  layoutAttributesForItemAt: (
    indexPath: IndexPath,
    state: UICollectionViewLayoutItemState
  ) => UICollectionViewLayoutAttributes;
  initialLayoutAttributesForAppearingItemAt: (
    indexPath: IndexPath
  ) => UICollectionViewLayoutAttributes;
  registerCellForItemAt: (indexPath: IndexPath, element: HTMLElement) => () => void;
}

export interface UICollectionViewLayoutRef {
  readonly view: HTMLDivElement | null;
  cellForItemAt: (indexPath: IndexPath) => HTMLElement | null;
  layoutAttributesForItemAt: (indexPath: IndexPath) => UICollectionViewLayoutAttributes | null;
  scrollToItemAt: (
    indexPath: IndexPath,
    scrollPosition: UICollectionViewScrollPosition,
    animated: boolean
  ) => void;
}

export interface UICollectionViewLayoutProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  collectionViewLayout?: UICollectionViewFlowLayoutConfiguration;
  layoutAttributesForItemAt?: UICollectionViewLayoutAttributesForItemAt;
  initialLayoutAttributesForAppearingItemAt?: UICollectionViewInitialLayoutAttributesForAppearingItemAt;
}

export interface UICollectionViewLayoutItemSlotProps {
  section: number;
  item: number;
  children?: ReactNode;
}

export interface UICollectionViewLayoutAnimatedWrapperProps {
  indexPath?: IndexPath | null;
  isSelected: boolean;
  isHighlighted: boolean;
  children?: ReactNode;
}
