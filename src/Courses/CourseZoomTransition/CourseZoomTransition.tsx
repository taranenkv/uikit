import gsap from 'gsap';
import { UICrossDissolveAnimatedTransitioning } from '../../../uikit/UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning';
import { UIPercentDrivenInteractiveTransition } from '../../../uikit/UIPercentDrivenInteractiveTransition/UIPercentDrivenInteractiveTransition';
import {
  UISpringTimingParameters,
  UIViewPropertyAnimator,
} from '../../../uikit/UIViewPropertyAnimator/UIViewPropertyAnimator';
import type { CGRect } from '../../../uikit/UICollectionViewLayout/UICollectionViewLayout.types';
import type { UIPresentationControllerConfiguration } from '../../../uikit/UIPresentationController/UIPresentationController.types';
import type { UIViewControllerAnimatedTransitioning } from '../../../uikit/UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIViewControllerContextTransitioning } from '../../../uikit/UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type { UIViewControllerTransitioningDelegate } from '../../../uikit/UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';
import type {
  CourseTransitionElement,
  CourseZoomCollectionViewProvider,
  CourseZoomGeometry,
  CourseZoomMatchedElement,
  CourseZoomTransitionSource,
} from './CourseZoomTransition.types';

const ZOOM_DURATION = 0.7;
const ZOOM_DAMPING_RATIO = 0.86;
const CONTENT_APPEARANCE_DELAY_FACTOR = 0.35;
const CONTENT_DISAPPEARANCE_DURATION_FACTOR = 0.3;
const CONTENT_OFFSET = 24;

export const COURSE_TRANSITION_CONTENT_ATTRIBUTE = 'data-course-transition-content';
export const COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE = 'data-course-transition-scroll-view';

const MATCHED_ELEMENTS: CourseZoomMatchedElement[] = [
  { element: 'artwork', scaleReference: 'width' },
  { element: 'title', scaleReference: 'fontSize' },
  { element: 'caption', scaleReference: 'fontSize' },
];

const EXPANDED_CLIP_PATH = 'inset(0px 0px 0px 0px round 0px)';

export function courseTransitionIdentifier(
  courseId: string,
  element: CourseTransitionElement
): string {
  return `course-${courseId}-${element}`;
}

function makeClipPath({ clipInsets, cornerRadius }: CourseZoomGeometry): string {
  return `inset(${clipInsets.top}px ${clipInsets.right}px ${clipInsets.bottom}px ${clipInsets.left}px round ${cornerRadius}px)`;
}

function makeZoomGeometry(
  presentedFrame: CGRect,
  sourceFrame: CGRect,
  destinationFrame: CGRect,
  sourceCornerRadius: number
): CourseZoomGeometry {
  const scale = sourceFrame.size.width / destinationFrame.size.width;
  const localX = destinationFrame.origin.x - presentedFrame.origin.x;
  const localY = destinationFrame.origin.y - presentedFrame.origin.y;

  return {
    scale,
    translation: {
      x: sourceFrame.origin.x - presentedFrame.origin.x - scale * localX,
      y: sourceFrame.origin.y - presentedFrame.origin.y - scale * localY,
    },
    clipInsets: {
      top: localY,
      left: localX,
      right: presentedFrame.size.width - localX - destinationFrame.size.width,
      bottom: presentedFrame.size.height - localY - sourceFrame.size.height / scale,
    },
    cornerRadius: sourceCornerRadius / scale,
  };
}

function fontSizeOf(element: Element): number {
  return parseFloat(getComputedStyle(element).fontSize) || 1;
}

export class CourseZoomAnimatedTransitioning implements UIViewControllerAnimatedTransitioning {
  private readonly isPresenting: boolean;
  private readonly courseId: string;
  private readonly fallback = new UICrossDissolveAnimatedTransitioning();
  private readonly propertyAnimators = new WeakMap<
    UIViewControllerContextTransitioning,
    UIViewPropertyAnimator
  >();

  constructor(isPresenting: boolean, courseId: string) {
    this.isPresenting = isPresenting;
    this.courseId = courseId;
  }

  transitionDuration(transitionContext: UIViewControllerContextTransitioning | null): number {
    return transitionContext?.isAnimated === false ? 0 : ZOOM_DURATION;
  }

  interruptibleAnimator(
    transitionContext: UIViewControllerContextTransitioning
  ): UIViewPropertyAnimator {
    const existing = this.propertyAnimators.get(transitionContext);

    if (existing) {
      return existing;
    }

    const propertyAnimator = this.makePropertyAnimator(transitionContext);

    this.propertyAnimators.set(transitionContext, propertyAnimator);

    return propertyAnimator;
  }

  animateTransition(transitionContext: UIViewControllerContextTransitioning): void {
    this.interruptibleAnimator(transitionContext).startAnimation();
  }

  private makePropertyAnimator(
    transitionContext: UIViewControllerContextTransitioning
  ): UIViewPropertyAnimator {
    const isPresenting = this.isPresenting;
    const sourceKey = isPresenting ? 'from' : 'to';
    const destinationKey = isPresenting ? 'to' : 'from';
    const presentedView = transitionContext.viewForKey(isPresenting ? 'to' : 'from');

    presentedView
      ?.querySelector(`[${COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE}]`)
      ?.scrollTo({ top: 0 });

    const cardIdentifier = courseTransitionIdentifier(this.courseId, 'card');
    const sourceCard = transitionContext.matchedViewFor(cardIdentifier, sourceKey);
    const destinationCard = transitionContext.matchedViewFor(cardIdentifier, destinationKey);

    if (!presentedView || !sourceCard || !destinationCard) {
      return this.fallback.interruptibleAnimator(transitionContext);
    }

    gsap.set(
      [
        presentedView,
        ...MATCHED_ELEMENTS.map(({ element }) =>
          transitionContext.matchedViewFor(
            courseTransitionIdentifier(this.courseId, element),
            destinationKey
          )
        ).filter((view): view is HTMLElement => view !== null),
      ],
      { clearProps: 'transform,clipPath' }
    );

    const presentedFrame = transitionContext.frameInContainerView(presentedView);
    const sourceFrame = transitionContext.frameInContainerView(sourceCard);
    const destinationFrame = transitionContext.frameInContainerView(destinationCard);
    const geometry = makeZoomGeometry(
      presentedFrame,
      sourceFrame,
      destinationFrame,
      parseFloat(getComputedStyle(sourceCard).borderTopLeftRadius) || 0
    );

    const collapsed: gsap.TweenVars = {
      x: geometry.translation.x,
      y: geometry.translation.y,
      scale: geometry.scale,
      clipPath: makeClipPath(geometry),
      transformOrigin: '0px 0px',
    };
    const expanded: gsap.TweenVars = {
      x: 0,
      y: 0,
      scale: 1,
      clipPath: EXPANDED_CLIP_PATH,
      transformOrigin: '0px 0px',
    };

    const matchedViews = MATCHED_ELEMENTS.flatMap(({ element, scaleReference }) => {
      const identifier = courseTransitionIdentifier(this.courseId, element);
      const source = transitionContext.matchedViewFor(identifier, sourceKey);
      const destination = transitionContext.matchedViewFor(identifier, destinationKey);

      if (!source || !destination) {
        return [];
      }

      const sourceElementFrame = transitionContext.frameInContainerView(source);
      const destinationElementFrame = transitionContext.frameInContainerView(destination);
      const startX =
        (sourceElementFrame.origin.x - sourceFrame.origin.x) / geometry.scale +
        destinationFrame.origin.x -
        presentedFrame.origin.x;
      const startY =
        (sourceElementFrame.origin.y - sourceFrame.origin.y) / geometry.scale +
        destinationFrame.origin.y -
        presentedFrame.origin.y;
      const elementScale =
        scaleReference === 'width'
          ? sourceElementFrame.size.width / geometry.scale / destinationElementFrame.size.width
          : fontSizeOf(source) / geometry.scale / fontSizeOf(destination);

      return [
        {
          view: destination,
          collapsed: {
            x: startX - (destinationElementFrame.origin.x - presentedFrame.origin.x),
            y: startY - (destinationElementFrame.origin.y - presentedFrame.origin.y),
            scale: elementScale,
            transformOrigin: '0px 0px',
          } satisfies gsap.TweenVars,
        },
      ];
    });

    const contentViews = Array.from(
      presentedView.querySelectorAll<HTMLElement>(`[${COURSE_TRANSITION_CONTENT_ATTRIBUTE}]`)
    );
    const animatedViews = [presentedView, ...matchedViews.map(({ view }) => view), ...contentViews];
    const identity: gsap.TweenVars = { x: 0, y: 0, scale: 1, transformOrigin: '0px 0px' };
    const previousSourceVisibility = sourceCard.style.visibility;

    const propertyAnimator = new UIViewPropertyAnimator(
      this.transitionDuration(transitionContext),
      new UISpringTimingParameters(ZOOM_DAMPING_RATIO)
    );

    sourceCard.style.visibility = 'hidden';

    propertyAnimator.addAnimations((animations) => {
      animations.fromTo(
        presentedView,
        isPresenting ? collapsed : expanded,
        isPresenting ? expanded : collapsed
      );

      matchedViews.forEach(({ view, collapsed: collapsedView }) => {
        animations.fromTo(
          view,
          isPresenting ? collapsedView : identity,
          isPresenting ? identity : collapsedView
        );
      });

      if (!isPresenting && contentViews.length > 0) {
        animations.fromTo(
          contentViews,
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: CONTENT_OFFSET, duration: CONTENT_DISAPPEARANCE_DURATION_FACTOR }
        );
      }
    });

    if (isPresenting && contentViews.length > 0) {
      propertyAnimator.addAnimations((animations) => {
        animations.fromTo(
          contentViews,
          { autoAlpha: 0, y: CONTENT_OFFSET },
          { autoAlpha: 1, y: 0 }
        );
      }, CONTENT_APPEARANCE_DELAY_FACTOR);
    }

    propertyAnimator.addCompletion((finalPosition) => {
      const isPresentedViewVisible = isPresenting
        ? finalPosition === 'end'
        : finalPosition === 'start';

      sourceCard.style.visibility = previousSourceVisibility;

      if (isPresentedViewVisible) {
        gsap.set(animatedViews, { clearProps: 'transform,clipPath,opacity,visibility' });
      }

      transitionContext.completeTransition(
        finalPosition === 'end' && !transitionContext.transitionWasCancelled
      );
    });

    return propertyAnimator;
  }
}

export class CourseZoomTransition implements UIViewControllerTransitioningDelegate {
  readonly interactionController = new UIPercentDrivenInteractiveTransition();

  private source: CourseZoomTransitionSource | null = null;
  private interacting = false;
  private collectionViewProvider: CourseZoomCollectionViewProvider = () => null;

  get isInteracting(): boolean {
    return this.interacting;
  }

  attachCollectionView(collectionViewProvider: CourseZoomCollectionViewProvider): void {
    this.collectionViewProvider = collectionViewProvider;
  }

  prepare(source: CourseZoomTransitionSource): void {
    this.source = source;
  }

  beginInteractiveDismissal(): void {
    this.interacting = true;
  }

  endInteractiveDismissal(): void {
    this.interacting = false;
  }

  animationControllerForPresented(): UIViewControllerAnimatedTransitioning | null {
    return this.source ? new CourseZoomAnimatedTransitioning(true, this.source.course.id) : null;
  }

  animationControllerForDismissed(): UIViewControllerAnimatedTransitioning | null {
    if (!this.source) {
      return null;
    }

    this.revealSourceItem();

    return new CourseZoomAnimatedTransitioning(false, this.source.course.id);
  }

  interactionControllerForDismissal(): UIPercentDrivenInteractiveTransition | null {
    return this.interacting ? this.interactionController : null;
  }

  presentationControllerForPresented(): UIPresentationControllerConfiguration {
    return {
      shouldRemovePresentersView: false,
      dimmingView: {
        backgroundColor: 'rgba(6, 4, 18, 0.55)',
        backdropFilter: 'blur(16px)',
      },
    };
  }

  private revealSourceItem(): void {
    const source = this.source;
    const collectionView = this.collectionViewProvider();

    if (!source || !collectionView) {
      return;
    }

    const view = collectionView.view;
    const cell = collectionView.cellForItemAt(source.indexPath);

    if (!view || !cell) {
      return;
    }

    const viewRect = view.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    if (cellRect.top < viewRect.top || cellRect.bottom > viewRect.bottom) {
      collectionView.scrollToItemAt(source.indexPath, 'centeredVertically', false);
    }
  }
}
