import { forwardRef, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import styles from './UICollectionViewLayout.module.css';
import {
  UICollectionViewIndexPathContext,
  UICollectionViewLayoutContext,
  useOptionalUICollectionViewLayoutContext,
  useUICollectionViewIndexPath,
} from './UICollectionViewLayout.context';
import { useUICollectionViewDataSourceContext } from '../UICollectionViewDataSource/UICollectionViewDataSource.context';
import { useOptionalUICollectionViewDelegateContext } from '../UICollectionViewDelegate/UICollectionViewDelegate.context';
import type {
  CGAffineTransform,
  IndexPath,
  UICollectionViewFlowLayout,
  UICollectionViewFlowLayoutConfiguration,
  UICollectionViewInitialLayoutAttributesForAppearingItemAt,
  UICollectionViewLayoutAnimatedWrapperProps,
  UICollectionViewLayoutAttributes,
  UICollectionViewLayoutAttributesForItemAt,
  UICollectionViewLayoutContextValue,
  UICollectionViewLayoutItemSlotProps,
  UICollectionViewLayoutItemState,
  UICollectionViewLayoutProps,
} from './UICollectionViewLayout.types';

const DEFAULT_FLOW_LAYOUT: UICollectionViewFlowLayout = {
  scrollDirection: 'vertical',
  itemSize: { width: 120, height: 120 },
  minimumLineSpacing: 12,
  minimumInteritemSpacing: 12,
  sectionInset: { top: 0, left: 0, bottom: 0, right: 0 },
};

const IDENTITY_TRANSFORM: CGAffineTransform = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  tx: 0,
  ty: 0,
};

const DETACHED_INDEX_PATH: IndexPath = { section: -1, item: -1 };

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function resolveFlowLayout(
  configuration?: UICollectionViewFlowLayoutConfiguration
): UICollectionViewFlowLayout {
  return {
    ...DEFAULT_FLOW_LAYOUT,
    ...configuration,
    itemSize: {
      ...DEFAULT_FLOW_LAYOUT.itemSize,
      ...configuration?.itemSize,
    },
    sectionInset: {
      ...DEFAULT_FLOW_LAYOUT.sectionInset,
      ...configuration?.sectionInset,
    },
  };
}

function createLayoutAttributes(
  indexPath: IndexPath,
  collectionViewLayout: UICollectionViewFlowLayout,
  state: UICollectionViewLayoutItemState
): UICollectionViewLayoutAttributes {
  const scale = state.isHighlighted ? 0.96 : state.isSelected ? 1.04 : 1;

  return {
    indexPath,
    representedElementCategory: 'cell',
    size: collectionViewLayout.itemSize,
    alpha: 1,
    transform: { ...IDENTITY_TRANSFORM, a: scale, d: scale },
    zIndex: state.isSelected ? 1 : 0,
    isHidden: false,
  };
}

function createLayoutContextValue(
  collectionViewLayout: UICollectionViewFlowLayout,
  layoutAttributesForItemAt?: UICollectionViewLayoutAttributesForItemAt,
  initialLayoutAttributesForAppearingItemAt?: UICollectionViewInitialLayoutAttributesForAppearingItemAt
): UICollectionViewLayoutContextValue {
  const resolveLayoutAttributesForItemAt = (
    indexPath: IndexPath,
    state: UICollectionViewLayoutItemState
  ): UICollectionViewLayoutAttributes => {
    const proposedAttributes = createLayoutAttributes(indexPath, collectionViewLayout, state);

    return {
      ...proposedAttributes,
      ...layoutAttributesForItemAt?.(indexPath, state, proposedAttributes),
    };
  };

  return {
    collectionViewLayout,
    layoutAttributesForItemAt: resolveLayoutAttributesForItemAt,
    initialLayoutAttributesForAppearingItemAt: (indexPath) => {
      const proposedAttributes = resolveLayoutAttributesForItemAt(indexPath, {
        isSelected: false,
        isHighlighted: false,
      });

      return {
        ...proposedAttributes,
        ...initialLayoutAttributesForAppearingItemAt?.(indexPath, proposedAttributes),
      };
    },
  };
}

const DEFAULT_LAYOUT_CONTEXT_VALUE = createLayoutContextValue(DEFAULT_FLOW_LAYOUT);

function createTweenVars(attributes: UICollectionViewLayoutAttributes) {
  return {
    autoAlpha: attributes.isHidden ? 0 : attributes.alpha,
    scaleX: attributes.transform.a,
    scaleY: attributes.transform.d,
    x: attributes.transform.tx,
    y: attributes.transform.ty,
    zIndex: attributes.zIndex,
  };
}

function UICollectionViewLayoutItemSlot({
  section,
  item,
  children,
}: UICollectionViewLayoutItemSlotProps) {
  const indexPath = useMemo<IndexPath>(() => ({ section, item }), [section, item]);
  const delegate = useOptionalUICollectionViewDelegateContext();
  const delegateRef = useRef(delegate);

  useEffect(() => {
    delegateRef.current = delegate;
  }, [delegate]);

  useEffect(() => {
    const currentIndexPath: IndexPath = { section, item };

    delegateRef.current?.willDisplayItemAt(currentIndexPath);

    return () => {
      delegateRef.current?.didEndDisplayingItemAt(currentIndexPath);
    };
  }, [section, item]);

  return (
    <UICollectionViewIndexPathContext.Provider value={indexPath}>
      <div className={styles.item}>{children}</div>
    </UICollectionViewIndexPathContext.Provider>
  );
}

function UICollectionViewLayoutAnimatedWrapper({
  indexPath: indexPathProp,
  isSelected,
  isHighlighted,
  children,
}: UICollectionViewLayoutAnimatedWrapperProps) {
  const layoutContext = useOptionalUICollectionViewLayoutContext() ?? DEFAULT_LAYOUT_CONTEXT_VALUE;
  const contextIndexPath = useUICollectionViewIndexPath();
  const indexPath = indexPathProp ?? contextIndexPath ?? DETACHED_INDEX_PATH;
  const elementRef = useRef<HTMLDivElement>(null);
  const isAppearedRef = useRef(false);

  const { layoutAttributesForItemAt, initialLayoutAttributesForAppearingItemAt } = layoutContext;
  const { section, item } = indexPath;

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const currentIndexPath: IndexPath = { section, item };

    if (!isAppearedRef.current) {
      isAppearedRef.current = true;
      gsap.set(
        element,
        createTweenVars(initialLayoutAttributesForAppearingItemAt(currentIndexPath))
      );
    }

    const tween = gsap.to(element, {
      ...createTweenVars(
        layoutAttributesForItemAt(currentIndexPath, { isSelected, isHighlighted })
      ),
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    return () => {
      tween.kill();
    };
  }, [
    layoutAttributesForItemAt,
    initialLayoutAttributesForAppearingItemAt,
    section,
    item,
    isSelected,
    isHighlighted,
  ]);

  return (
    <div ref={elementRef} className={styles.animatedWrapper}>
      {children}
    </div>
  );
}

const UICollectionViewLayoutRoot = forwardRef<HTMLDivElement, UICollectionViewLayoutProps>(
  function UICollectionViewLayout(
    {
      collectionViewLayout,
      layoutAttributesForItemAt,
      initialLayoutAttributesForAppearingItemAt,
      className,
      ...rest
    },
    ref
  ) {
    const { numberOfSections, numberOfItemsInSection, cellForItemAt } =
      useUICollectionViewDataSourceContext();

    const layout = useMemo(() => resolveFlowLayout(collectionViewLayout), [collectionViewLayout]);

    const contextValue = useMemo(
      () =>
        createLayoutContextValue(
          layout,
          layoutAttributesForItemAt,
          initialLayoutAttributesForAppearingItemAt
        ),
      [layout, layoutAttributesForItemAt, initialLayoutAttributesForAppearingItemAt]
    );

    const sectionStyle = useMemo(
      () =>
        ({
          '--ui-collection-view-item-width': `${layout.itemSize.width}px`,
          '--ui-collection-view-item-height': `${layout.itemSize.height}px`,
          '--ui-collection-view-line-spacing': `${layout.minimumLineSpacing}px`,
          '--ui-collection-view-interitem-spacing': `${layout.minimumInteritemSpacing}px`,
          '--ui-collection-view-inset-top': `${layout.sectionInset.top}px`,
          '--ui-collection-view-inset-right': `${layout.sectionInset.right}px`,
          '--ui-collection-view-inset-bottom': `${layout.sectionInset.bottom}px`,
          '--ui-collection-view-inset-left': `${layout.sectionInset.left}px`,
        }) as CSSProperties,
      [layout]
    );

    return (
      <UICollectionViewLayoutContext.Provider value={contextValue}>
        <div
          {...rest}
          ref={ref}
          data-scroll-direction={layout.scrollDirection}
          className={joinClassNames(styles.collectionViewLayout, className)}>
          {Array.from({ length: numberOfSections() }, (_, section) => (
            <div key={section} role='group' className={styles.section} style={sectionStyle}>
              {Array.from({ length: numberOfItemsInSection(section) }, (__, item) => (
                <UICollectionViewLayoutItemSlot key={item} section={section} item={item}>
                  {cellForItemAt({ section, item })}
                </UICollectionViewLayoutItemSlot>
              ))}
            </div>
          ))}
        </div>
      </UICollectionViewLayoutContext.Provider>
    );
  }
);

UICollectionViewLayoutRoot.displayName = 'UICollectionViewLayout';

export const UICollectionViewLayout = Object.assign(UICollectionViewLayoutRoot, {
  AnimatedWrapper: UICollectionViewLayoutAnimatedWrapper,
});
