import { forwardRef, useMemo, type UIEvent } from 'react';
import styles from './UICollectionViewDelegate.module.css';
import { UICollectionViewDelegateContext } from './UICollectionViewDelegate.context';
import type {
  UICollectionViewDelegateContextValue,
  UICollectionViewDelegateProps,
} from './UICollectionViewDelegate.types';

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const UICollectionViewDelegateRoot = forwardRef<HTMLDivElement, UICollectionViewDelegateProps>(
  function UICollectionViewDelegate(
    { delegate, className, children, onScrollCapture, ...rest },
    ref
  ) {
    const contextValue = useMemo<UICollectionViewDelegateContextValue>(
      () => ({
        shouldHighlightItemAt: (indexPath) => delegate?.shouldHighlightItemAt?.(indexPath) ?? true,
        didHighlightItemAt: (indexPath) => delegate?.didHighlightItemAt?.(indexPath),
        didUnhighlightItemAt: (indexPath) => delegate?.didUnhighlightItemAt?.(indexPath),
        shouldSelectItemAt: (indexPath) => delegate?.shouldSelectItemAt?.(indexPath) ?? true,
        shouldDeselectItemAt: (indexPath) => delegate?.shouldDeselectItemAt?.(indexPath) ?? true,
        didSelectItemAt: (indexPath) => delegate?.didSelectItemAt?.(indexPath),
        didDeselectItemAt: (indexPath) => delegate?.didDeselectItemAt?.(indexPath),
        willDisplayItemAt: (indexPath) => delegate?.willDisplayItemAt?.(indexPath),
        didEndDisplayingItemAt: (indexPath) => delegate?.didEndDisplayingItemAt?.(indexPath),
      }),
      [delegate]
    );

    const handleScrollCapture = (event: UIEvent<HTMLDivElement>) => {
      onScrollCapture?.(event);

      const target = event.target;

      if (!(target instanceof HTMLElement) || target.parentElement !== event.currentTarget) {
        return;
      }

      delegate?.scrollViewDidScroll?.({ x: target.scrollLeft, y: target.scrollTop });
    };

    return (
      <UICollectionViewDelegateContext.Provider value={contextValue}>
        <div
          {...rest}
          ref={ref}
          className={joinClassNames(styles.delegate, className)}
          onScrollCapture={handleScrollCapture}>
          {children}
        </div>
      </UICollectionViewDelegateContext.Provider>
    );
  }
);

UICollectionViewDelegateRoot.displayName = 'UICollectionViewDelegate';

export const UICollectionViewDelegate = UICollectionViewDelegateRoot;
