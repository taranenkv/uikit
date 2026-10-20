import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './UIViewControllerTransitioningDelegate.module.css';
import {
  UIViewControllerTransitioningDelegateContext,
  useOptionalUIViewControllerTransitioningDelegateContext,
} from './UIViewControllerTransitioningDelegate.context';
import type {
  UIViewControllerMatchedTransitionRegistry,
  UIViewControllerMatchedTransitionSourceProps,
  UIViewControllerTransitioningDelegateContextValue,
  UIViewControllerTransitioningDelegateProps,
} from './UIViewControllerTransitioningDelegate.types';

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function createMatchedTransitionRegistry(): UIViewControllerMatchedTransitionRegistry {
  const elementsByIdentifier = new Map<string, Set<HTMLElement>>();

  return {
    register: (identifier, element) => {
      const elements = elementsByIdentifier.get(identifier) ?? new Set<HTMLElement>();

      elements.add(element);
      elementsByIdentifier.set(identifier, elements);

      return () => {
        elements.delete(element);

        if (elements.size === 0 && elementsByIdentifier.get(identifier) === elements) {
          elementsByIdentifier.delete(identifier);
        }
      };
    },
    matchedViewFor: (identifier, root) => {
      const elements = elementsByIdentifier.get(identifier);

      if (!elements) {
        return null;
      }

      for (const element of elements) {
        if (element.isConnected && (root === null || root.contains(element))) {
          return element;
        }
      }

      return null;
    },
  };
}

const UIViewControllerMatchedTransitionSource = forwardRef<
  HTMLDivElement,
  UIViewControllerMatchedTransitionSourceProps
>(function UIViewControllerMatchedTransitionSource(
  { identifier, className, children, ...rest },
  ref
) {
  const transitioningDelegate = useOptionalUIViewControllerTransitioningDelegateContext();
  const registry = transitioningDelegate?.registry;
  const elementRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => elementRef.current as HTMLDivElement, []);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || !registry) {
      return undefined;
    }

    return registry.register(identifier, element);
  }, [registry, identifier]);

  return (
    <div
      {...rest}
      ref={elementRef}
      data-matched-transition-identifier={identifier}
      className={joinClassNames(styles.matchedTransitionSource, className)}>
      {children}
    </div>
  );
});

UIViewControllerMatchedTransitionSource.displayName = 'UIViewControllerMatchedTransitionSource';

function UIViewControllerTransitioningDelegateRoot({
  transitioningDelegate = null,
  children,
}: UIViewControllerTransitioningDelegateProps) {
  const [registry] = useState(createMatchedTransitionRegistry);

  const contextValue = useMemo<UIViewControllerTransitioningDelegateContextValue>(
    () => ({ transitioningDelegate, registry }),
    [transitioningDelegate, registry]
  );

  return (
    <UIViewControllerTransitioningDelegateContext.Provider value={contextValue}>
      {children}
    </UIViewControllerTransitioningDelegateContext.Provider>
  );
}

UIViewControllerTransitioningDelegateRoot.displayName = 'UIViewControllerTransitioningDelegate';

export const UIViewControllerTransitioningDelegate = Object.assign(
  UIViewControllerTransitioningDelegateRoot,
  {
    MatchedTransitionSource: UIViewControllerMatchedTransitionSource,
  }
);
