import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import styles from './UICollectionViewCell.module.css';
import {
  UICollectionViewCellContext,
  useUICollectionViewCellContext,
} from './UICollectionViewCell.context';
import { useOptionalUICollectionViewContext } from '../UICollectionView/UICollectionView.context';
import { useOptionalUICollectionViewDelegateContext } from '../UICollectionViewDelegate/UICollectionViewDelegate.context';
import { UICollectionViewLayout } from '../UICollectionViewLayout/UICollectionViewLayout';
import { useUICollectionViewIndexPath } from '../UICollectionViewLayout/UICollectionViewLayout.context';
import type {
  UICollectionViewCellContextValue,
  UICollectionViewCellProps,
  UICollectionViewCellSelectedContentProps,
} from './UICollectionViewCell.types';

const TOUCH_HIGHLIGHT_DELAY_MS = 100;

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function UICollectionViewCellSelectedContent({
  children,
}: UICollectionViewCellSelectedContentProps) {
  const { isSelected } = useUICollectionViewCellContext();

  return isSelected ? <>{children}</> : null;
}

const UICollectionViewCellRoot = forwardRef<HTMLDivElement, UICollectionViewCellProps>(
  function UICollectionViewCell(
    {
      indexPath: indexPathProp,
      reuseIdentifier,
      backgroundView,
      selectedBackgroundView,
      isSelected: isSelectedProp,
      isHighlighted: isHighlightedProp,
      isUserInteractionEnabled = true,
      className,
      children,
      onClick,
      onKeyDown,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      ...rest
    },
    ref
  ) {
    const collectionView = useOptionalUICollectionViewContext();
    const delegate = useOptionalUICollectionViewDelegateContext();
    const contextIndexPath = useUICollectionViewIndexPath();
    const indexPath = indexPathProp ?? contextIndexPath;
    const [isHighlightedState, setIsHighlightedState] = useState(false);
    const isHighlightedStateRef = useRef(false);
    const highlightTimerRef = useRef<number | null>(null);

    useEffect(
      () => () => {
        if (highlightTimerRef.current !== null) {
          window.clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = null;
        }
      },
      []
    );

    const isSelected =
      isSelectedProp ??
      (collectionView !== null && indexPath !== null
        ? collectionView.isItemSelected(indexPath)
        : false);

    const isHighlighted = isHighlightedProp ?? isHighlightedState;

    const clearHighlightTimer = () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };

    const updateHighlight = (next: boolean) => {
      if (isHighlightedStateRef.current === next) {
        return;
      }

      isHighlightedStateRef.current = next;
      setIsHighlightedState(next);

      if (delegate === null || indexPath === null) {
        return;
      }

      if (next) {
        delegate.didHighlightItemAt(indexPath);
      } else {
        delegate.didUnhighlightItemAt(indexPath);
      }
    };

    const canHighlight = () =>
      isUserInteractionEnabled &&
      (delegate === null || indexPath === null || delegate.shouldHighlightItemAt(indexPath));

    const activate = () => {
      if (!isUserInteractionEnabled || collectionView === null || indexPath === null) {
        return;
      }

      if (collectionView.isItemSelected(indexPath)) {
        if (collectionView.allowsMultipleSelection) {
          collectionView.deselectItem(indexPath);
        }
        return;
      }

      collectionView.selectItem(indexPath);
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      activate();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);

      if (!canHighlight()) {
        return;
      }

      if (event.pointerType === 'touch') {
        clearHighlightTimer();
        highlightTimerRef.current = window.setTimeout(() => {
          highlightTimerRef.current = null;
          updateHighlight(true);
        }, TOUCH_HIGHLIGHT_DELAY_MS);
        return;
      }

      updateHighlight(true);
    };

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
      onPointerUp?.(event);

      if (highlightTimerRef.current !== null) {
        clearHighlightTimer();
        updateHighlight(true);
      }

      updateHighlight(false);
    };

    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      clearHighlightTimer();
      updateHighlight(false);
    };

    const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
      onPointerCancel?.(event);
      clearHighlightTimer();
      updateHighlight(false);
    };

    const contextValue = useMemo<UICollectionViewCellContextValue>(
      () => ({ indexPath, reuseIdentifier, isSelected, isHighlighted }),
      [indexPath, reuseIdentifier, isSelected, isHighlighted]
    );

    return (
      <UICollectionViewCellContext.Provider value={contextValue}>
        <div
          {...rest}
          ref={ref}
          role='option'
          aria-selected={isSelected}
          aria-disabled={!isUserInteractionEnabled}
          tabIndex={isUserInteractionEnabled ? 0 : -1}
          data-reuse-identifier={reuseIdentifier}
          data-selected={isSelected}
          data-highlighted={isHighlighted}
          data-user-interaction-enabled={isUserInteractionEnabled}
          className={joinClassNames(styles.cell, className)}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}>
          <UICollectionViewLayout.AnimatedWrapper
            indexPath={indexPath}
            isSelected={isSelected}
            isHighlighted={isHighlighted}>
            <div className={styles.backgroundView}>
              {isSelected && selectedBackgroundView ? selectedBackgroundView : backgroundView}
            </div>
            <div className={styles.contentView}>{children}</div>
          </UICollectionViewLayout.AnimatedWrapper>
        </div>
      </UICollectionViewCellContext.Provider>
    );
  }
);

UICollectionViewCellRoot.displayName = 'UICollectionViewCell';

export const UICollectionViewCell = Object.assign(UICollectionViewCellRoot, {
  SelectedContent: UICollectionViewCellSelectedContent,
});
