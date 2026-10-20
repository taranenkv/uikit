import { forwardRef, useCallback, useMemo, useState } from 'react';
import styles from './UICollectionView.module.css';
import { UICollectionViewContext } from './UICollectionView.context';
import { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource';
import { UICollectionViewDelegate } from '../UICollectionViewDelegate/UICollectionViewDelegate';
import { useUICollectionViewDelegateContext } from '../UICollectionViewDelegate/UICollectionViewDelegate.context';
import { UICollectionViewLayout } from '../UICollectionViewLayout/UICollectionViewLayout';
import type { IndexPath } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UICollectionViewContextValue,
  UICollectionViewProps,
  UICollectionViewSelectionProps,
} from './UICollectionView.types';

function isEqualIndexPath(lhs: IndexPath, rhs: IndexPath): boolean {
  return lhs.section === rhs.section && lhs.item === rhs.item;
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function UICollectionViewSelection({
  allowsSelection,
  allowsMultipleSelection,
  children,
}: UICollectionViewSelectionProps) {
  const delegate = useUICollectionViewDelegateContext();
  const [indexPathsForSelectedItems, setIndexPathsForSelectedItems] = useState<IndexPath[]>([]);

  const isItemSelected = useCallback(
    (indexPath: IndexPath) =>
      indexPathsForSelectedItems.some((selected) => isEqualIndexPath(selected, indexPath)),
    [indexPathsForSelectedItems]
  );

  const selectItem = useCallback(
    (indexPath: IndexPath) => {
      if (!allowsSelection || isItemSelected(indexPath)) {
        return;
      }

      if (!delegate.shouldSelectItemAt(indexPath)) {
        return;
      }

      if (allowsMultipleSelection) {
        setIndexPathsForSelectedItems([...indexPathsForSelectedItems, indexPath]);
      } else {
        indexPathsForSelectedItems.forEach((selected) => delegate.didDeselectItemAt(selected));
        setIndexPathsForSelectedItems([indexPath]);
      }

      delegate.didSelectItemAt(indexPath);
    },
    [allowsSelection, allowsMultipleSelection, delegate, indexPathsForSelectedItems, isItemSelected]
  );

  const deselectItem = useCallback(
    (indexPath: IndexPath) => {
      if (!isItemSelected(indexPath)) {
        return;
      }

      if (!delegate.shouldDeselectItemAt(indexPath)) {
        return;
      }

      setIndexPathsForSelectedItems(
        indexPathsForSelectedItems.filter((selected) => !isEqualIndexPath(selected, indexPath))
      );
      delegate.didDeselectItemAt(indexPath);
    },
    [delegate, indexPathsForSelectedItems, isItemSelected]
  );

  const contextValue = useMemo<UICollectionViewContextValue>(
    () => ({
      indexPathsForSelectedItems,
      allowsSelection,
      allowsMultipleSelection,
      isItemSelected,
      selectItem,
      deselectItem,
    }),
    [
      indexPathsForSelectedItems,
      allowsSelection,
      allowsMultipleSelection,
      isItemSelected,
      selectItem,
      deselectItem,
    ]
  );

  return (
    <UICollectionViewContext.Provider value={contextValue}>
      {children}
    </UICollectionViewContext.Provider>
  );
}

const UICollectionViewRoot = forwardRef<HTMLDivElement, UICollectionViewProps>(
  function UICollectionView(
    {
      dataSource,
      delegate,
      collectionViewLayout,
      layoutAttributesForItemAt,
      initialLayoutAttributesForAppearingItemAt,
      allowsSelection = true,
      allowsMultipleSelection = false,
      className,
      ...rest
    },
    ref
  ) {
    return (
      <UICollectionViewDataSource dataSource={dataSource}>
        <UICollectionViewDelegate delegate={delegate}>
          <UICollectionViewSelection
            allowsSelection={allowsSelection}
            allowsMultipleSelection={allowsMultipleSelection}>
            <UICollectionViewLayout
              {...rest}
              ref={ref}
              role='listbox'
              aria-multiselectable={allowsMultipleSelection}
              className={joinClassNames(styles.collectionView, className)}
              collectionViewLayout={collectionViewLayout}
              layoutAttributesForItemAt={layoutAttributesForItemAt}
              initialLayoutAttributesForAppearingItemAt={initialLayoutAttributesForAppearingItemAt}
            />
          </UICollectionViewSelection>
        </UICollectionViewDelegate>
      </UICollectionViewDataSource>
    );
  }
);

UICollectionViewRoot.displayName = 'UICollectionView';

export const UICollectionView = UICollectionViewRoot;
