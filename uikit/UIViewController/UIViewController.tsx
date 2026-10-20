import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import gsap from 'gsap';
import styles from './UIViewController.module.css';
import {
  UIViewControllerContext,
  useOptionalUIViewControllerContext,
} from './UIViewController.context';
import type {
  UIViewControllerAnimatedWrapperProps,
  UIViewControllerAppearanceState,
  UIViewControllerContextValue,
  UIViewControllerLifecycleSnapshot,
  UIViewControllerProps,
} from './UIViewController.types';

const APPEARANCE_DURATION = 0.3;
const APPEARANCE_OFFSET = 12;

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function UIViewControllerAnimatedWrapper({
  appearanceState,
  animated,
  onAppearanceTransitionCompleted,
  children,
}: UIViewControllerAnimatedWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    if (appearanceState === 'appearing') {
      if (!animated) {
        gsap.set(element, { autoAlpha: 1, y: 0 });
        onAppearanceTransitionCompleted();
        return undefined;
      }

      const tween = gsap.fromTo(
        element,
        { autoAlpha: 0, y: APPEARANCE_OFFSET },
        {
          autoAlpha: 1,
          y: 0,
          duration: APPEARANCE_DURATION,
          ease: 'power2.out',
          onComplete: onAppearanceTransitionCompleted,
        }
      );

      return () => {
        tween.kill();
      };
    }

    if (appearanceState === 'disappearing') {
      if (!animated) {
        gsap.set(element, { autoAlpha: 0, y: APPEARANCE_OFFSET });
        onAppearanceTransitionCompleted();
        return undefined;
      }

      const tween = gsap.to(element, {
        autoAlpha: 0,
        y: APPEARANCE_OFFSET,
        duration: APPEARANCE_DURATION,
        ease: 'power2.in',
        onComplete: onAppearanceTransitionCompleted,
      });

      return () => {
        tween.kill();
      };
    }

    return undefined;
  }, [appearanceState, animated, onAppearanceTransitionCompleted]);

  return (
    <div
      ref={elementRef}
      className={styles.animatedWrapper}
      data-appearance-state={appearanceState}>
      {children}
    </div>
  );
}

const UIViewControllerRoot = forwardRef<HTMLDivElement, UIViewControllerProps>(
  function UIViewController(
    {
      title,
      isViewVisible = true,
      animated = true,
      viewDidLoad,
      viewWillAppear,
      viewDidAppear,
      viewWillDisappear,
      viewDidDisappear,
      viewWillLayoutSubviews,
      viewDidLayoutSubviews,
      className,
      children,
      ...rest
    },
    ref
  ) {
    const parent = useOptionalUIViewControllerContext();
    const viewRef = useRef<HTMLDivElement>(null);
    const [isViewLoaded, setIsViewLoaded] = useState(false);
    const [appearanceState, setAppearanceState] =
      useState<UIViewControllerAppearanceState>('disappeared');
    const isViewLoadedRef = useRef(false);
    const appearanceStateRef = useRef<UIViewControllerAppearanceState>('disappeared');
    const lifecycleRef = useRef<UIViewControllerLifecycleSnapshot>({
      animated,
      viewDidLoad,
      viewWillAppear,
      viewDidAppear,
      viewWillDisappear,
      viewDidDisappear,
      viewWillLayoutSubviews,
      viewDidLayoutSubviews,
    });

    useImperativeHandle(ref, () => viewRef.current as HTMLDivElement, []);

    useLayoutEffect(() => {
      lifecycleRef.current = {
        animated,
        viewDidLoad,
        viewWillAppear,
        viewDidAppear,
        viewWillDisappear,
        viewDidDisappear,
        viewWillLayoutSubviews,
        viewDidLayoutSubviews,
      };
    });

    useEffect(() => {
      if (isViewLoadedRef.current) {
        return;
      }

      isViewLoadedRef.current = true;
      setIsViewLoaded(true);
      lifecycleRef.current.viewDidLoad?.();
    }, []);

    useEffect(() => {
      const current = appearanceStateRef.current;
      const lifecycle = lifecycleRef.current;

      if (isViewVisible) {
        if (current === 'appearing' || current === 'appeared') {
          return;
        }

        appearanceStateRef.current = 'appearing';
        setAppearanceState('appearing');
        lifecycle.viewWillAppear?.(lifecycle.animated);
        return;
      }

      if (current === 'disappearing' || current === 'disappeared') {
        return;
      }

      appearanceStateRef.current = 'disappearing';
      setAppearanceState('disappearing');
      lifecycle.viewWillDisappear?.(lifecycle.animated);
    }, [isViewVisible]);

    useEffect(() => {
      const element = viewRef.current;

      if (!element || typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(() => {
        lifecycleRef.current.viewWillLayoutSubviews?.();
        lifecycleRef.current.viewDidLayoutSubviews?.();
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, []);

    const handleAppearanceTransitionCompleted = useCallback(() => {
      const lifecycle = lifecycleRef.current;

      if (appearanceStateRef.current === 'appearing') {
        appearanceStateRef.current = 'appeared';
        setAppearanceState('appeared');
        lifecycle.viewDidAppear?.(lifecycle.animated);
        return;
      }

      if (appearanceStateRef.current === 'disappearing') {
        appearanceStateRef.current = 'disappeared';
        setAppearanceState('disappeared');
        lifecycle.viewDidDisappear?.(lifecycle.animated);
      }
    }, []);

    const contextValue = useMemo<UIViewControllerContextValue>(
      () => ({
        title,
        parent,
        isViewLoaded,
        appearanceState,
        isBeingPresented: appearanceState === 'appearing',
        isBeingDismissed: appearanceState === 'disappearing',
      }),
      [title, parent, isViewLoaded, appearanceState]
    );

    return (
      <UIViewControllerContext.Provider value={contextValue}>
        <div
          {...rest}
          ref={viewRef}
          role={title === undefined ? undefined : 'region'}
          aria-label={title}
          data-appearance-state={appearanceState}
          className={joinClassNames(styles.viewController, className)}>
          <UIViewControllerAnimatedWrapper
            appearanceState={appearanceState}
            animated={animated}
            onAppearanceTransitionCompleted={handleAppearanceTransitionCompleted}>
            {children as ReactNode}
          </UIViewControllerAnimatedWrapper>
        </div>
      </UIViewControllerContext.Provider>
    );
  }
);

UIViewControllerRoot.displayName = 'UIViewController';

export const UIViewController = Object.assign(UIViewControllerRoot, {
  AnimatedWrapper: UIViewControllerAnimatedWrapper,
});
