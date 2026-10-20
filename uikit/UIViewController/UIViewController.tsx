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
import { UIPresentationController } from '../UIPresentationController/UIPresentationController';
import {
  UIPresentationControllerContext,
  useOptionalUIPresentationControllerContext,
} from '../UIPresentationController/UIPresentationController.context';
import { UIViewControllerTransitionCoordinatorReactContext } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.context';
import type { UIPresentationControllerRef } from '../UIPresentationController/UIPresentationController.types';
import type { UIViewControllerTransitionCoordinator } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.types';
import type {
  UIViewControllerAnimatedWrapperProps,
  UIViewControllerAppearanceState,
  UIViewControllerContextValue,
  UIViewControllerLifecycleSnapshot,
  UIViewControllerPresentation,
  UIViewControllerProps,
} from './UIViewController.types';

const APPEARANCE_DURATION = 0.3;
const APPEARANCE_OFFSET = 12;

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function UIViewControllerAnimatedWrapper({
  appearanceState,
  transitionMode,
  onAppearanceTransitionCompleted,
  children,
}: UIViewControllerAnimatedWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || transitionMode === 'external') {
      return undefined;
    }

    if (appearanceState === 'appearing') {
      if (transitionMode === 'immediate') {
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
      if (transitionMode === 'immediate') {
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
  }, [appearanceState, transitionMode, onAppearanceTransitionCompleted]);

  return (
    <div
      ref={elementRef}
      className={styles.animatedWrapper}
      data-appearance-state={appearanceState}
      data-transition-mode={transitionMode}>
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
      modalPresentationStyle = 'fullScreen',
      transitioningDelegate = null,
      isModalInPresentation = false,
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
    const presentation = useOptionalUIPresentationControllerContext();
    const viewRef = useRef<HTMLDivElement>(null);
    const presentationControllerRef = useRef<UIPresentationControllerRef>(null);
    const presentationRef = useRef<UIViewControllerPresentation | null>(null);
    const presentationKeyRef = useRef(0);
    const [isViewLoaded, setIsViewLoaded] = useState(false);
    const [ownAppearanceState, setOwnAppearanceState] =
      useState<UIViewControllerAppearanceState>('disappeared');
    const [presentedViewControllerState, setPresentedViewControllerState] =
      useState<UIViewControllerPresentation | null>(null);
    const [presenterAppearanceState, setPresenterAppearanceState] =
      useState<UIViewControllerAppearanceState | null>(null);
    const [presentationCoordinator, setPresentationCoordinator] =
      useState<UIViewControllerTransitionCoordinator | null>(null);
    const isViewLoadedRef = useRef(false);
    const ownAppearanceStateRef = useRef<UIViewControllerAppearanceState>('disappeared');
    const previousAppearanceStateRef = useRef<UIViewControllerAppearanceState>('disappeared');
    const contextValueRef = useRef<UIViewControllerContextValue | null>(null);
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

    const appearanceState =
      presenterAppearanceState ?? presentation?.appearanceState ?? ownAppearanceState;
    const isAppearanceExternallyDriven = presentation !== null || presenterAppearanceState !== null;
    const transitionCoordinator =
      presentationCoordinator ?? presentation?.transitionCoordinator ?? null;
    const isAppearanceAnimated = presentation?.isAnimated ?? animated;

    useImperativeHandle(ref, () => viewRef.current as HTMLDivElement, []);

    useLayoutEffect(() => {
      lifecycleRef.current = {
        animated: isAppearanceAnimated,
        viewDidLoad,
        viewWillAppear,
        viewDidAppear,
        viewWillDisappear,
        viewDidDisappear,
        viewWillLayoutSubviews,
        viewDidLayoutSubviews,
      };
    });

    useLayoutEffect(() => {
      if (isViewLoadedRef.current) {
        return;
      }

      isViewLoadedRef.current = true;
      setIsViewLoaded(true);
      lifecycleRef.current.viewDidLoad?.();
    }, []);

    useLayoutEffect(() => {
      const previous = previousAppearanceStateRef.current;

      if (previous === appearanceState) {
        return;
      }

      previousAppearanceStateRef.current = appearanceState;

      const lifecycle = lifecycleRef.current;
      const isAnimated = lifecycle.animated;

      if (appearanceState === 'appearing') {
        lifecycle.viewWillAppear?.(isAnimated);
        return;
      }

      if (appearanceState === 'appeared') {
        if (previous === 'disappearing' || previous === 'disappeared') {
          lifecycle.viewWillAppear?.(isAnimated);
        }

        lifecycle.viewDidAppear?.(isAnimated);
        return;
      }

      if (appearanceState === 'disappearing') {
        lifecycle.viewWillDisappear?.(isAnimated);
        return;
      }

      if (previous === 'appearing' || previous === 'appeared') {
        lifecycle.viewWillDisappear?.(isAnimated);
      }

      lifecycle.viewDidDisappear?.(isAnimated);
    }, [appearanceState]);

    useEffect(() => {
      if (presentation !== null) {
        return;
      }

      const current = ownAppearanceStateRef.current;

      if (isViewVisible) {
        if (current === 'appearing' || current === 'appeared') {
          return;
        }

        ownAppearanceStateRef.current = 'appearing';
        setOwnAppearanceState('appearing');
        return;
      }

      if (current === 'disappearing' || current === 'disappeared') {
        return;
      }

      ownAppearanceStateRef.current = 'disappearing';
      setOwnAppearanceState('disappearing');
    }, [isViewVisible, presentation]);

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
      if (ownAppearanceStateRef.current === 'appearing') {
        ownAppearanceStateRef.current = 'appeared';
        setOwnAppearanceState('appeared');
        return;
      }

      if (ownAppearanceStateRef.current === 'disappearing') {
        ownAppearanceStateRef.current = 'disappeared';
        setOwnAppearanceState('disappeared');
      }
    }, []);

    const present = useCallback(
      (viewControllerToPresent: ReactNode, isAnimated = true, completion?: () => void) => {
        if (presentationRef.current !== null) {
          return;
        }

        presentationKeyRef.current += 1;

        const nextPresentation: UIViewControllerPresentation = {
          key: presentationKeyRef.current,
          viewControllerToPresent,
          animated: isAnimated,
          completion,
        };

        presentationRef.current = nextPresentation;
        setPresentedViewControllerState(nextPresentation);
      },
      []
    );

    const presentationDismiss = presentation?.dismiss;

    const dismiss = useCallback(
      (isAnimated = true, completion?: () => void) => {
        if (presentationRef.current !== null) {
          presentationControllerRef.current?.dismiss(isAnimated, completion);
          return;
        }

        presentationDismiss?.(isAnimated, completion);
      },
      [presentationDismiss]
    );

    const handleDismissalCompleted = useCallback(() => {
      presentationRef.current = null;
      setPresentedViewControllerState(null);
      setPresenterAppearanceState(null);
      setPresentationCoordinator(null);
    }, []);

    const contextValue = useMemo<UIViewControllerContextValue>(
      () => ({
        title,
        parent,
        get view() {
          return viewRef.current;
        },
        isViewLoaded,
        appearanceState,
        isBeingPresented: appearanceState === 'appearing',
        isBeingDismissed: appearanceState === 'disappearing',
        modalPresentationStyle,
        isModalInPresentation,
        presentingViewController: presentation?.presentingViewController ?? null,
        presentedViewController: presentedViewControllerState?.viewControllerToPresent ?? null,
        transitionCoordinator,
        present,
        dismiss,
      }),
      [
        title,
        parent,
        isViewLoaded,
        appearanceState,
        modalPresentationStyle,
        isModalInPresentation,
        presentation?.presentingViewController,
        presentedViewControllerState,
        transitionCoordinator,
        present,
        dismiss,
      ]
    );

    useLayoutEffect(() => {
      contextValueRef.current = contextValue;
    }, [contextValue]);

    const registerPresentedViewController = presentation?.registerPresentedViewController;

    useLayoutEffect(() => {
      if (!registerPresentedViewController) {
        return undefined;
      }

      return registerPresentedViewController({
        viewController: () => contextValueRef.current ?? contextValue,
        modalPresentationStyle,
        transitioningDelegate,
        isModalInPresentation,
      });
    }, [
      registerPresentedViewController,
      contextValue,
      modalPresentationStyle,
      transitioningDelegate,
      isModalInPresentation,
    ]);

    return (
      <>
        <UIViewControllerContext.Provider value={contextValue}>
          <UIViewControllerTransitionCoordinatorReactContext.Provider value={transitionCoordinator}>
            <UIPresentationControllerContext.Provider value={null}>
              <div
                {...rest}
                ref={viewRef}
                role={title === undefined ? undefined : 'region'}
                aria-label={title}
                inert={presentedViewControllerState !== null}
                data-appearance-state={appearanceState}
                data-modal-presentation-style={presentation ? modalPresentationStyle : undefined}
                className={joinClassNames(styles.viewController, className)}>
                <UIViewControllerAnimatedWrapper
                  appearanceState={appearanceState}
                  transitionMode={
                    isAppearanceExternallyDriven ? 'external' : animated ? 'animated' : 'immediate'
                  }
                  onAppearanceTransitionCompleted={handleAppearanceTransitionCompleted}>
                  {children}
                </UIViewControllerAnimatedWrapper>
              </div>
            </UIPresentationControllerContext.Provider>
          </UIViewControllerTransitionCoordinatorReactContext.Provider>
        </UIViewControllerContext.Provider>
        {presentedViewControllerState !== null && (
          <UIViewControllerContext.Provider value={null}>
            <UIPresentationController
              key={presentedViewControllerState.key}
              ref={presentationControllerRef}
              presentedViewController={presentedViewControllerState.viewControllerToPresent}
              presentingViewController={contextValue}
              animated={presentedViewControllerState.animated}
              completion={presentedViewControllerState.completion}
              onTransitionCoordinatorChange={setPresentationCoordinator}
              onPresentingViewControllerAppearanceStateChange={setPresenterAppearanceState}
              onDismissalCompleted={handleDismissalCompleted}
            />
          </UIViewControllerContext.Provider>
        )}
      </>
    );
  }
);

UIViewControllerRoot.displayName = 'UIViewController';

export const UIViewController = Object.assign(UIViewControllerRoot, {
  AnimatedWrapper: UIViewControllerAnimatedWrapper,
});
