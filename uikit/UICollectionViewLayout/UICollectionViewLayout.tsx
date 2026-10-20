import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
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
  CGRect,
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
  UICollectionViewLayoutRef,
  UICollectionViewScrollPosition,
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

function keyForIndexPath({ section, item }: IndexPath): string {
  return `${section}:${item}`;
}

function createDefaultFrame(collectionViewLayout: UICollectionViewFlowLayout): CGRect {
  return { origin: { x: 0, y: 0 }, size: collectionViewLayout.itemSize };
}

function measureFrame(element: HTMLElement, container: HTMLElement): CGRect {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    origin: {
      x: elementRect.left - containerRect.left - container.clientLeft + container.scrollLeft,
      y: elementRect.top - containerRect.top - container.clientTop + container.scrollTop,
    },
    size: { width: elementRect.width, height: elementRect.height },
  };
}

function resolveContentOffset(
  frame: CGRect,
  container: HTMLElement,
  scrollPosition: UICollectionViewScrollPosition
): ScrollToOptions {
  switch (scrollPosition) {
    case 'top':
      return { top: frame.origin.y };
    case 'centeredVertically':
      return { top: frame.origin.y - (container.clientHeight - frame.size.height) / 2 };
    case 'bottom':
      return { top: frame.origin.y + frame.size.height - container.clientHeight };
    case 'left':
      return { left: frame.origin.x };
    case 'centeredHorizontally':
      return { left: frame.origin.x - (container.clientWidth - frame.size.width) / 2 };
    case 'right':
      return { left: frame.origin.x + frame.size.width - container.clientWidth };
  }
}

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
  state: UICollectionViewLayoutItemState,
  frame: CGRect
): UICollectionViewLayoutAttributes {
  const scale = state.isHighlighted ? 0.96 : state.isSelected ? 1.04 : 1;

  return {
    indexPath,
    representedElementCategory: 'cell',
    frame,
    size: collectionViewLayout.itemSize,
    alpha: 1,
    transform: { ...IDENTITY_TRANSFORM, a: scale, d: scale },
    zIndex: state.isSelected ? 1 : 0,
    isHidden: false,
  };
}

function createLayoutContextValue(
  collectionViewLayout: UICollectionViewFlowLayout,
  frameForItemAt: (indexPath: IndexPath) => CGRect,
  registerCellForItemAt: (indexPath: IndexPath, element: HTMLElement) => () => void,
  layoutAttributesForItemAt?: UICollectionViewLayoutAttributesForItemAt,
  initialLayoutAttributesForAppearingItemAt?: UICollectionViewInitialLayoutAttributesForAppearingItemAt
): UICollectionViewLayoutContextValue {
  const resolveLayoutAttributesForItemAt = (
    indexPath: IndexPath,
    state: UICollectionViewLayoutItemState
  ): UICollectionViewLayoutAttributes => {
    const proposedAttributes = createLayoutAttributes(
      indexPath,
      collectionViewLayout,
      state,
      frameForItemAt(indexPath)
    );

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
    registerCellForItemAt,
  };
}

const DEFAULT_LAYOUT_CONTEXT_VALUE = createLayoutContextValue(
  DEFAULT_FLOW_LAYOUT,
  () => createDefaultFrame(DEFAULT_FLOW_LAYOUT),
  () => () => undefined
);

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
  const layoutContext = useOptionalUICollectionViewLayoutContext();
  const registerCellForItemAt = layoutContext?.registerCellForItemAt;
  const delegateRef = useRef(delegate);
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || !registerCellForItemAt) {
      return undefined;
    }

    return registerCellForItemAt({ section, item }, element);
  }, [registerCellForItemAt, section, item]);

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
      <div ref={elementRef} className={styles.item}>
        {children}
      </div>
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

const UICollectionViewLayoutRoot = forwardRef<
  UICollectionViewLayoutRef,
  UICollectionViewLayoutProps
>(function UICollectionViewLayout(
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

  const [view, setView] = useState<HTMLDivElement | null>(null);
  const [cells] = useState(() => new Map<string, HTMLElement>());

  const layout = useMemo(() => resolveFlowLayout(collectionViewLayout), [collectionViewLayout]);

  const registerCellForItemAt = useCallback(
    (indexPath: IndexPath, element: HTMLElement) => {
      const key = keyForIndexPath(indexPath);

      cells.set(key, element);

      return () => {
        if (cells.get(key) === element) {
          cells.delete(key);
        }
      };
    },
    [cells]
  );

  const frameForItemAt = useCallback(
    (indexPath: IndexPath) => {
      const element = cells.get(keyForIndexPath(indexPath));
      const container = view;

      if (!element || !container) {
        return createDefaultFrame(layout);
      }

      return measureFrame(element, container);
    },
    [cells, view, layout]
  );

  const contextValue = useMemo(
    () =>
      createLayoutContextValue(
        layout,
        frameForItemAt,
        registerCellForItemAt,
        layoutAttributesForItemAt,
        initialLayoutAttributesForAppearingItemAt
      ),
    [
      layout,
      frameForItemAt,
      registerCellForItemAt,
      layoutAttributesForItemAt,
      initialLayoutAttributesForAppearingItemAt,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      view,
      cellForItemAt: (indexPath) => {
        const element = cells.get(keyForIndexPath(indexPath));

        if (!element) {
          return null;
        }

        return element.firstElementChild instanceof HTMLElement
          ? element.firstElementChild
          : element;
      },
      layoutAttributesForItemAt: (indexPath) => {
        if (!cells.has(keyForIndexPath(indexPath))) {
          return null;
        }

        return contextValue.layoutAttributesForItemAt(indexPath, {
          isSelected: false,
          isHighlighted: false,
        });
      },
      scrollToItemAt: (indexPath, scrollPosition, animated) => {
        const container = view;

        if (!container || !cells.has(keyForIndexPath(indexPath))) {
          return;
        }

        container.scrollTo({
          ...resolveContentOffset(frameForItemAt(indexPath), container, scrollPosition),
          behavior: animated ? 'smooth' : 'auto',
        });
      },
    }),
    [view, cells, contextValue, frameForItemAt]
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
        ref={setView}
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
});

UICollectionViewLayoutRoot.displayName = 'UICollectionViewLayout';

export const UICollectionViewLayout = Object.assign(UICollectionViewLayoutRoot, {
  AnimatedWrapper: UICollectionViewLayoutAnimatedWrapper,
});
