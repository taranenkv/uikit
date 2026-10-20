import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './UIPresentationController.module.css';
import { UIPresentationControllerContext } from './UIPresentationController.context';
import {
  UICrossDissolveAnimatedTransitioning,
  UIViewControllerAnimatedTransitioning,
  performViewControllerTransition,
} from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning';
import {
  convertRectToView,
  createViewControllerContextTransitioning,
} from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning';
import { createViewControllerTransitionCoordinator } from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator';
import { useOptionalUIViewControllerTransitioningDelegateContext } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.context';
import type {
  UIModalPresentationStyle,
  UIViewControllerAppearanceState,
} from '../UIViewController/UIViewController.types';
import type { UIViewControllerAnimatedTransitioning as UIViewControllerAnimatedTransitioningProtocol } from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type {
  UIViewControllerTransitionCoordinator,
  UIViewControllerTransitionCoordinatorController,
} from '../UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';
import type { UIViewPropertyAnimator } from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import type {
  UIPresentationControllerCallbacks,
  UIPresentationControllerConfiguration,
  UIPresentationControllerContextValue,
  UIPresentationControllerProps,
  UIPresentationControllerRef,
  UIPresentationTransitionKind,
  UIPresentedViewControllerRegistration,
} from './UIPresentationController.types';

const DEFAULT_CONFIGURATIONS: Record<
  UIModalPresentationStyle,
  UIPresentationControllerConfiguration
> = {
  fullScreen: { shouldRemovePresentersView: true, dimmingView: null },
  overFullScreen: { shouldRemovePresentersView: false, dimmingView: null },
  custom: { shouldRemovePresentersView: false, dimmingView: {} },
};

interface UIPresentationControllerResolution {
  modalPresentationStyle: UIModalPresentationStyle;
  transitioningDelegate: UIViewControllerTransitioningDelegate | null;
  configuration: UIPresentationControllerConfiguration;
}

interface UIPresentationControllerActiveTransition {
  kind: UIPresentationTransitionKind;
  transitionContext: UIViewControllerContextTransitioning;
  propertyAnimator: UIViewPropertyAnimator | null;
  completion: (() => void) | undefined;
}

interface UIPresentationControllerTransitionState {
  animator: UIViewControllerAnimatedTransitioningProtocol;
  transitionContext: UIViewControllerContextTransitioning;
  propertyAnimator: UIViewPropertyAnimator | null;
}

function applyDimmingView(
  dimmingView: HTMLDivElement,
  configuration: UIPresentationControllerConfiguration
): void {
  const appearance = configuration.dimmingView;

  dimmingView.hidden = !appearance;

  if (!appearance) {
    return;
  }

  if (appearance.backgroundColor !== undefined) {
    dimmingView.style.background = appearance.backgroundColor;
  }

  if (appearance.backdropFilter !== undefined) {
    dimmingView.style.setProperty('backdrop-filter', appearance.backdropFilter);
    dimmingView.style.setProperty('-webkit-backdrop-filter', appearance.backdropFilter);
  }
}

function applyFrameOfPresentedView(
  containerView: HTMLDivElement,
  presentedView: HTMLDivElement,
  configuration: UIPresentationControllerConfiguration
): void {
  if (!configuration.frameOfPresentedViewInContainerView) {
    return;
  }

  const containerFrame = convertRectToView(containerView, containerView);
  const frame = configuration.frameOfPresentedViewInContainerView(containerFrame);

  presentedView.style.inset = 'auto';
  presentedView.style.left = `${frame.origin.x}px`;
  presentedView.style.top = `${frame.origin.y}px`;
  presentedView.style.width = `${frame.size.width}px`;
  presentedView.style.height = `${frame.size.height}px`;
}

const UIPresentationControllerRoot = forwardRef<
  UIPresentationControllerRef,
  UIPresentationControllerProps
>(function UIPresentationController(
  {
    presentedViewController,
    presentingViewController,
    animated,
    completion,
    onTransitionCoordinatorChange,
    onPresentingViewControllerAppearanceStateChange,
    onDismissalCompleted,
  },
  ref
) {
  const transitioningDelegateContext = useOptionalUIViewControllerTransitioningDelegateContext();
  const containerViewRef = useRef<HTMLDivElement>(null);
  const dimmingViewRef = useRef<HTMLDivElement>(null);
  const presentedViewRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef<UIPresentedViewControllerRegistration | null>(null);
  const resolutionRef = useRef<UIPresentationControllerResolution | null>(null);
  const activeTransitionRef = useRef<UIPresentationControllerActiveTransition | null>(null);
  const isDismissedRef = useRef(false);
  const previouslyFocusedElementRef = useRef<Element | null>(null);
  const initialAnimatedRef = useRef(animated);
  const presentingViewControllerRef = useRef(presentingViewController);
  const transitioningDelegateContextRef = useRef(transitioningDelegateContext);
  const callbacksRef = useRef<UIPresentationControllerCallbacks>({
    completion,
    onTransitionCoordinatorChange,
    onPresentingViewControllerAppearanceStateChange,
    onDismissalCompleted,
  });
  const [appearanceState, setAppearanceState] =
    useState<UIViewControllerAppearanceState>('appearing');
  const [transitionCoordinator, setTransitionCoordinator] =
    useState<UIViewControllerTransitionCoordinator | null>(null);
  const [transitionState, setTransitionState] =
    useState<UIPresentationControllerTransitionState | null>(null);

  useLayoutEffect(() => {
    presentingViewControllerRef.current = presentingViewController;
    transitioningDelegateContextRef.current = transitioningDelegateContext;
    callbacksRef.current = {
      completion,
      onTransitionCoordinatorChange,
      onPresentingViewControllerAppearanceStateChange,
      onDismissalCompleted,
    };
  });

  const registerPresentedViewController = useCallback(
    (registration: UIPresentedViewControllerRegistration) => {
      registrationRef.current = registration;

      return () => {
        if (registrationRef.current === registration) {
          registrationRef.current = null;
        }
      };
    },
    []
  );

  const resolvePresentation = useCallback((): UIPresentationControllerResolution => {
    const registration = registrationRef.current;
    const modalPresentationStyle = registration?.modalPresentationStyle ?? 'fullScreen';
    const transitioningDelegate =
      modalPresentationStyle === 'custom'
        ? (registration?.transitioningDelegate ??
          transitioningDelegateContextRef.current?.transitioningDelegate ??
          null)
        : null;
    const presenting = presentingViewControllerRef.current;
    const presented = registration ? registration.viewController() : null;
    const customConfiguration =
      transitioningDelegate?.presentationControllerForPresented?.(
        presented,
        presenting,
        presenting
      ) ?? null;

    return {
      modalPresentationStyle,
      transitioningDelegate,
      configuration: { ...DEFAULT_CONFIGURATIONS[modalPresentationStyle], ...customConfiguration },
    };
  }, []);

  const finishTransition = useCallback(
    (
      active: UIPresentationControllerActiveTransition,
      didComplete: boolean,
      animator: UIViewControllerAnimatedTransitioningProtocol,
      coordinatorController: UIViewControllerTransitionCoordinatorController,
      resolution: UIPresentationControllerResolution
    ) => {
      if (activeTransitionRef.current !== active) {
        return;
      }

      const callbacks = callbacksRef.current;
      const { configuration } = resolution;
      const isPresentation = active.kind === 'presentation';
      const isPresented = isPresentation === didComplete;
      const shouldRemovePresentersView = configuration.shouldRemovePresentersView ?? false;

      activeTransitionRef.current = null;
      animator.animationEnded?.(didComplete);
      coordinatorController.completeTransition();
      setTransitionCoordinator(null);
      setTransitionState(null);
      callbacks.onTransitionCoordinatorChange(null);

      if (isPresentation) {
        configuration.presentationTransitionDidEnd?.(didComplete);
      } else {
        configuration.dismissalTransitionDidEnd?.(didComplete);
      }

      if (isPresented) {
        setAppearanceState('appeared');
        callbacks.onPresentingViewControllerAppearanceStateChange(
          shouldRemovePresentersView ? 'disappeared' : null
        );

        if (isPresentation) {
          containerViewRef.current?.focus({ preventScroll: true });
          callbacks.completion?.();
        }

        return;
      }

      isDismissedRef.current = true;
      setAppearanceState('disappeared');
      callbacks.onPresentingViewControllerAppearanceStateChange(null);

      const previouslyFocusedElement = previouslyFocusedElementRef.current;

      if (previouslyFocusedElement instanceof HTMLElement && previouslyFocusedElement.isConnected) {
        previouslyFocusedElement.focus({ preventScroll: true });
      }

      active.completion?.();
      callbacks.onDismissalCompleted();
    },
    []
  );

  const runTransition = useCallback(
    (
      kind: UIPresentationTransitionKind,
      isAnimated: boolean,
      transitionCompletion?: () => void
    ) => {
      const containerView = containerViewRef.current;
      const presentedView = presentedViewRef.current;
      const resolution = resolutionRef.current;

      if (!containerView || !presentedView || !resolution) {
        return;
      }

      const callbacks = callbacksRef.current;
      const presenting = presentingViewControllerRef.current;
      const presented = registrationRef.current?.viewController() ?? null;
      const { configuration, modalPresentationStyle, transitioningDelegate } = resolution;
      const shouldRemovePresentersView = configuration.shouldRemovePresentersView ?? false;
      const isPresenting = kind === 'presentation';

      const animator =
        (isPresenting
          ? transitioningDelegate?.animationControllerForPresented?.(
              presented,
              presenting,
              presenting
            )
          : transitioningDelegate?.animationControllerForDismissed?.(presented)) ??
        new UICrossDissolveAnimatedTransitioning();

      const interactionController = isAnimated
        ? ((isPresenting
            ? transitioningDelegate?.interactionControllerForPresentation?.(animator)
            : transitioningDelegate?.interactionControllerForDismissal?.(animator)) ?? null)
        : null;

      const isInteractive =
        interactionController !== null && (interactionController.wantsInteractiveStart ?? true);

      let active: UIPresentationControllerActiveTransition | null = null;
      let coordinatorController: UIViewControllerTransitionCoordinatorController | null = null;

      const transitionContext = createViewControllerContextTransitioning({
        containerView,
        isAnimated,
        isInteractive,
        isPresenting,
        presentationStyle: modalPresentationStyle,
        viewControllers: isPresenting
          ? { from: presenting, to: presented }
          : { from: presented, to: presenting },
        views: isPresenting
          ? { from: shouldRemovePresentersView ? presenting.view : null, to: presentedView }
          : { from: presentedView, to: shouldRemovePresentersView ? presenting.view : null },
        matchedViewFor: (identifier, root) =>
          transitioningDelegateContextRef.current?.registry.matchedViewFor(identifier, root) ??
          null,
        onInteractionChange: () => coordinatorController?.notifyInteractionChange(),
        onComplete: (didComplete) => {
          if (active && coordinatorController) {
            finishTransition(active, didComplete, animator, coordinatorController, resolution);
          }
        },
      });

      active = {
        kind,
        transitionContext,
        propertyAnimator: null,
        completion: transitionCompletion,
      };
      coordinatorController = createViewControllerTransitionCoordinator(
        transitionContext,
        isAnimated ? animator.transitionDuration(transitionContext) : 0
      );

      const { coordinator } = coordinatorController;

      activeTransitionRef.current = active;

      if (isPresenting) {
        configuration.presentationTransitionWillBegin?.(coordinator);
      } else {
        configuration.dismissalTransitionWillBegin?.(coordinator);
      }

      const dimmingView = dimmingViewRef.current;

      if (dimmingView && configuration.dimmingView) {
        coordinator.animateAlongsideTransition((animations) => {
          animations.fromTo(
            dimmingView,
            { autoAlpha: isPresenting ? 0 : 1 },
            { autoAlpha: isPresenting ? 1 : 0 }
          );
        });
      }

      setAppearanceState(isPresenting ? 'appearing' : 'disappearing');

      if (shouldRemovePresentersView) {
        callbacks.onPresentingViewControllerAppearanceStateChange(
          isPresenting ? 'disappearing' : 'appearing'
        );
      }

      setTransitionCoordinator(coordinator);
      callbacks.onTransitionCoordinatorChange(coordinator);

      const propertyAnimator = performViewControllerTransition({
        animator,
        interactionController,
        transitionContext,
        coordinatorController,
      });

      if (activeTransitionRef.current === active) {
        active.propertyAnimator = propertyAnimator;
        setTransitionState({ animator, transitionContext, propertyAnimator });
      }
    },
    [finishTransition]
  );

  useLayoutEffect(() => {
    const containerView = containerViewRef.current;
    const dimmingView = dimmingViewRef.current;
    const presentedView = presentedViewRef.current;
    const documentElement = document.documentElement;
    const previousOverflow = documentElement.style.overflow;

    previouslyFocusedElementRef.current = document.activeElement;
    documentElement.style.overflow = 'hidden';
    isDismissedRef.current = false;

    const resolution = resolvePresentation();

    resolutionRef.current = resolution;

    if (containerView && dimmingView && presentedView) {
      containerView.dataset.presentationStyle = resolution.modalPresentationStyle;
      applyDimmingView(dimmingView, resolution.configuration);
      applyFrameOfPresentedView(containerView, presentedView, resolution.configuration);
    }

    runTransition('presentation', initialAnimatedRef.current);

    return () => {
      documentElement.style.overflow = previousOverflow;

      const active = activeTransitionRef.current;

      activeTransitionRef.current = null;

      const propertyAnimator = active?.propertyAnimator;

      if (propertyAnimator && propertyAnimator.state !== 'inactive') {
        propertyAnimator.stopAnimation(false);
        propertyAnimator.finishAnimation('start');
      }
    };
  }, [resolvePresentation, runTransition]);

  const dismiss = useCallback(
    (isAnimated = true, dismissalCompletion?: () => void) => {
      const active = activeTransitionRef.current;

      if (active) {
        const propertyAnimator = active.propertyAnimator;

        if (
          active.kind === 'presentation' &&
          propertyAnimator &&
          !active.transitionContext.isInteractive
        ) {
          active.completion = dismissalCompletion;
          propertyAnimator.isReversed = true;

          if (!propertyAnimator.isRunning) {
            propertyAnimator.continueAnimation();
          }
        }

        return;
      }

      if (isDismissedRef.current || !resolutionRef.current) {
        return;
      }

      runTransition('dismissal', isAnimated, dismissalCompletion);
    },
    [runTransition]
  );

  useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || registrationRef.current?.isModalInPresentation) {
      return;
    }

    event.stopPropagation();
    dismiss(true);
  };

  const contextValue = useMemo<UIPresentationControllerContextValue>(
    () => ({
      presentingViewController,
      appearanceState,
      transitionCoordinator,
      isAnimated: transitionState?.transitionContext.isAnimated ?? animated,
      registerPresentedViewController,
      dismiss,
    }),
    [
      presentingViewController,
      appearanceState,
      transitionCoordinator,
      transitionState,
      animated,
      registerPresentedViewController,
      dismiss,
    ]
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <UIPresentationControllerContext.Provider value={contextValue}>
      <div
        ref={containerViewRef}
        role='dialog'
        aria-modal='true'
        tabIndex={-1}
        data-appearance-state={appearanceState}
        className={styles.containerView}
        onKeyDown={handleKeyDown}>
        <div ref={dimmingViewRef} aria-hidden='true' className={styles.dimmingView} />
        <UIViewControllerAnimatedTransitioning
          ref={presentedViewRef}
          animator={transitionState?.animator ?? null}
          transitionContext={transitionState?.transitionContext ?? null}
          propertyAnimator={transitionState?.propertyAnimator ?? null}
          className={styles.presentedView}>
          {presentedViewController}
        </UIViewControllerAnimatedTransitioning>
      </div>
    </UIPresentationControllerContext.Provider>,
    document.body
  );
});

UIPresentationControllerRoot.displayName = 'UIPresentationController';

export const UIPresentationController = UIPresentationControllerRoot;
