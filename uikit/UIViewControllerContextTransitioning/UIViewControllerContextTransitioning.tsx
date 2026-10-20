import type { CGRect } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UITransitionContextViewControllerKey,
  UIViewControllerContextTransitioning,
  UIViewControllerContextTransitioningConfiguration,
} from './UIViewControllerContextTransitioning.types';

export const CGRectZero: CGRect = Object.freeze({
  origin: Object.freeze({ x: 0, y: 0 }),
  size: Object.freeze({ width: 0, height: 0 }),
});

export function convertRectToView(element: Element, container: Element): CGRect {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    origin: { x: elementRect.left - containerRect.left, y: elementRect.top - containerRect.top },
    size: { width: elementRect.width, height: elementRect.height },
  };
}

export function createViewControllerContextTransitioning(
  configuration: UIViewControllerContextTransitioningConfiguration
): UIViewControllerContextTransitioning {
  const {
    containerView,
    isAnimated,
    isPresenting,
    presentationStyle,
    viewControllers,
    views,
    matchedViewFor,
    onInteractionChange,
    onComplete,
  } = configuration;

  const rootViewFor = (key: UITransitionContextViewControllerKey): HTMLElement | null =>
    viewControllers[key]?.view ?? views[key];

  const fromView = rootViewFor('from');
  const toView = rootViewFor('to');
  const initialFrameOfFromView = fromView ? convertRectToView(fromView, containerView) : CGRectZero;
  const finalFrameOfToView = toView ? convertRectToView(toView, containerView) : CGRectZero;

  let isInteractive = configuration.isInteractive;
  let transitionWasCancelled = false;
  let percentComplete = 0;
  let isCompleted = false;

  return {
    containerView,
    isAnimated,
    isPresenting,
    presentationStyle,
    get isInteractive() {
      return isInteractive;
    },
    get transitionWasCancelled() {
      return transitionWasCancelled;
    },
    get percentComplete() {
      return percentComplete;
    },
    viewControllerForKey: (key) => viewControllers[key],
    viewForKey: (key) => views[key],
    initialFrameFor: (key) => (key === 'from' ? initialFrameOfFromView : CGRectZero),
    finalFrameFor: (key) => (key === 'to' ? finalFrameOfToView : CGRectZero),
    frameInContainerView: (element) => convertRectToView(element, containerView),
    matchedViewFor: (identifier, key) => matchedViewFor(identifier, rootViewFor(key)),
    updateInteractiveTransition: (nextPercentComplete) => {
      percentComplete = Math.min(Math.max(nextPercentComplete, 0), 1);
    },
    finishInteractiveTransition: () => {
      isInteractive = false;
      transitionWasCancelled = false;
      onInteractionChange?.();
    },
    cancelInteractiveTransition: () => {
      isInteractive = false;
      transitionWasCancelled = true;
      onInteractionChange?.();
    },
    pauseInteractiveTransition: () => {
      isInteractive = true;
      onInteractionChange?.();
    },
    completeTransition: (didComplete) => {
      if (isCompleted) {
        return;
      }

      isCompleted = true;
      onComplete(didComplete);
    },
  };
}
