import { forwardRef, useMemo } from 'react';
import styles from './UICollectionViewDataSource.module.css';
import { UICollectionViewDataSourceContext } from './UICollectionViewDataSource.context';
import type {
  UICollectionViewDataSourceContextValue,
  UICollectionViewDataSourceProps,
} from './UICollectionViewDataSource.types';

const DEFAULT_NUMBER_OF_SECTIONS = 1;

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const UICollectionViewDataSourceRoot = forwardRef<HTMLDivElement, UICollectionViewDataSourceProps>(
  function UICollectionViewDataSource({ dataSource, className, children, ...rest }, ref) {
    const contextValue = useMemo<UICollectionViewDataSourceContextValue>(
      () => ({
        numberOfSections: () => dataSource.numberOfSections?.() ?? DEFAULT_NUMBER_OF_SECTIONS,
        numberOfItemsInSection: (section) => dataSource.numberOfItemsInSection(section),
        cellForItemAt: (indexPath) => dataSource.cellForItemAt(indexPath),
      }),
      [dataSource]
    );

    return (
      <UICollectionViewDataSourceContext.Provider value={contextValue}>
        <div {...rest} ref={ref} className={joinClassNames(styles.dataSource, className)}>
          {children}
        </div>
      </UICollectionViewDataSourceContext.Provider>
    );
  }
);

UICollectionViewDataSourceRoot.displayName = 'UICollectionViewDataSource';

export const UICollectionViewDataSource = UICollectionViewDataSourceRoot;
