import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import styles from './UICollectionView.module.css';
import { UICollectionViewContext } from './UICollectionView.context';
import { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource';
import { UICollectionViewDelegate } from '../UICollectionViewDelegate/UICollectionViewDelegate';
import { useUICollectionViewDelegateContext } from '../UICollectionViewDelegate/UICollectionViewDelegate.context';
import { UICollectionViewLayout } from '../UICollectionViewLayout/UICollectionViewLayout';
import type {
  IndexPath,
  UICollectionViewLayoutRef,
} from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UICollectionViewContextValue,
  UICollectionViewProps,
  UICollectionViewRef,
  UICollectionViewSelectionProps,
  UICollectionViewSelectionRef,
} from './UICollectionView.types';

function isEqualIndexPath(lhs: IndexPath, rhs: IndexPath): boolean {
  return lhs.section === rhs.section && lhs.item === rhs.item;
}

function containsIndexPath(indexPaths: IndexPath[], indexPath: IndexPath): boolean {
  return indexPaths.some((selected) => isEqualIndexPath(selected, indexPath));
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const UICollectionViewSelection = forwardRef<
  UICollectionViewSelectionRef,
  UICollectionViewSelectionProps
>(function UICollectionViewSelection({ allowsSelection, allowsMultipleSelection, children }, ref) {
  const delegate = useUICollectionViewDelegateContext();
  const [indexPathsForSelectedItems, setIndexPathsForSelectedItems] = useState<IndexPath[]>([]);
  const selectedIndexPathsRef = useRef<IndexPath[]>([]);

  const commitSelection = useCallback((next: IndexPath[]) => {
    selectedIndexPathsRef.current = next;
    setIndexPathsForSelectedItems(next);
  }, []);

  const isItemSelected = useCallback(
    (indexPath: IndexPath) => containsIndexPath(indexPathsForSelectedItems, indexPath),
    [indexPathsForSelectedItems]
  );

  const selectItem = useCallback(
    (indexPath: IndexPath) => {
      const selected = selectedIndexPathsRef.current;

      if (!allowsSelection || containsIndexPath(selected, indexPath)) {
        return;
      }

      if (!delegate.shouldSelectItemAt(indexPath)) {
        return;
      }

      if (allowsMultipleSelection) {
        commitSelection([...selected, indexPath]);
      } else {
        commitSelection([indexPath]);
        selected.forEach((deselected) => delegate.didDeselectItemAt(deselected));
      }

      delegate.didSelectItemAt(indexPath);
    },
    [allowsSelection, allowsMultipleSelection, commitSelection, delegate]
  );

  const deselectItem = useCallback(
    (indexPath: IndexPath) => {
      const selected = selectedIndexPathsRef.current;

      if (!containsIndexPath(selected, indexPath)) {
        return;
      }

      if (!delegate.shouldDeselectItemAt(indexPath)) {
        return;
      }

      commitSelection(selected.filter((current) => !isEqualIndexPath(current, indexPath)));
      delegate.didDeselectItemAt(indexPath);
    },
    [commitSelection, delegate]
  );

  useImperativeHandle(
    ref,
    () => ({
      get indexPathsForSelectedItems() {
        return selectedIndexPathsRef.current;
      },
      selectItemAt: selectItem,
      deselectItemAt: deselectItem,
    }),
    [selectItem, deselectItem]
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
});

const UICollectionViewRoot = forwardRef<UICollectionViewRef, UICollectionViewProps>(
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
    const layoutRef = useRef<UICollectionViewLayoutRef>(null);
    const selectionRef = useRef<UICollectionViewSelectionRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        get view() {
          return layoutRef.current?.view ?? null;
        },
        get indexPathsForSelectedItems() {
          return selectionRef.current?.indexPathsForSelectedItems ?? [];
        },
        cellForItemAt: (indexPath) => layoutRef.current?.cellForItemAt(indexPath) ?? null,
        layoutAttributesForItemAt: (indexPath) =>
          layoutRef.current?.layoutAttributesForItemAt(indexPath) ?? null,
        scrollToItemAt: (indexPath, scrollPosition, animated) =>
          layoutRef.current?.scrollToItemAt(indexPath, scrollPosition, animated),
        selectItemAt: (indexPath) => selectionRef.current?.selectItemAt(indexPath),
        deselectItemAt: (indexPath) => selectionRef.current?.deselectItemAt(indexPath),
      }),
      []
    );

    return (
      <UICollectionViewDataSource dataSource={dataSource}>
        <UICollectionViewDelegate delegate={delegate}>
          <UICollectionViewSelection
            ref={selectionRef}
            allowsSelection={allowsSelection}
            allowsMultipleSelection={allowsMultipleSelection}>
            <UICollectionViewLayout
              {...rest}
              ref={layoutRef}
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
