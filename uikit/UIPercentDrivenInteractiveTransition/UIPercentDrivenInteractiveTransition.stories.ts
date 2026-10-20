import { createElement, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UIPercentDrivenInteractiveTransition } from './UIPercentDrivenInteractiveTransition';
import {
  UIPercentDrivenInteractiveTransitionContext,
  useUIPercentDrivenInteractiveTransitionContext,
} from './UIPercentDrivenInteractiveTransition.context';
import { UIPanGestureRecognizer } from '../UIPanGestureRecognizer/UIPanGestureRecognizer';
import type { UIPanGestureRecognizer as UIPanGestureRecognizerProtocol } from '../UIPanGestureRecognizer/UIPanGestureRecognizer.types';
import { UIViewController } from '../UIViewController/UIViewController';
import { useUIViewControllerContext } from '../UIViewController/UIViewController.context';
import type { UIViewControllerAnimatedTransitioning } from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';
import {
  UISpringTimingParameters,
  UIViewPropertyAnimator,
} from '../UIViewPropertyAnimator/UIViewPropertyAnimator';
import styles from './UIPercentDrivenInteractiveTransition.module.css';

interface UIPercentDrivenInteractiveTransitionStoryArgs {
  completionSpeed: number;
  completionThreshold: number;
}

class InteractionState {
  private interacting = false;

  get isInteracting(): boolean {
    return this.interacting;
  }

  begin(): void {
    this.interacting = true;
  }

  end(): void {
    this.interacting = false;
  }
}

function makeSheetAnimator(isPresenting: boolean): UIViewControllerAnimatedTransitioning {
  const propertyAnimators = new WeakMap<
    UIViewControllerContextTransitioning,
    UIViewPropertyAnimator
  >();
  const transitionDuration = (transitionContext: UIViewControllerContextTransitioning | null) =>
    transitionContext?.isAnimated === false ? 0 : 0.5;

  const interruptibleAnimator = (transitionContext: UIViewControllerContextTransitioning) => {
    const existing = propertyAnimators.get(transitionContext);

    if (existing) {
      return existing;
    }

    const presentedView = transitionContext.viewForKey(isPresenting ? 'to' : 'from');
    const propertyAnimator = new UIViewPropertyAnimator(
      transitionDuration(transitionContext),
      new UISpringTimingParameters(0.9)
    );

    propertyAnimator.addAnimations((animations) => {
      animations.fromTo(
        presentedView,
        { yPercent: isPresenting ? 100 : 0 },
        { yPercent: isPresenting ? 0 : 100 }
      );
    });
    propertyAnimator.addCompletion((finalPosition) => {
      transitionContext.completeTransition(
        finalPosition === 'end' && !transitionContext.transitionWasCancelled
      );
    });
    propertyAnimators.set(transitionContext, propertyAnimator);

    return propertyAnimator;
  };

  return {
    transitionDuration,
    interruptibleAnimator,
    animateTransition: (transitionContext) =>
      interruptibleAnimator(transitionContext).startAnimation(),
  };
}

function SheetViewController({
  interactionState,
  completionThreshold,
}: {
  interactionState: InteractionState;
  completionThreshold: number;
}) {
  const { dismiss } = useUIViewControllerContext();
  const interactiveTransition = useUIPercentDrivenInteractiveTransitionContext();

  const handlePan = (gestureRecognizer: UIPanGestureRecognizerProtocol) => {
    const height = gestureRecognizer.view?.clientHeight || 1;
    const percentComplete = Math.max(gestureRecognizer.translation().y / height, 0);

    if (gestureRecognizer.state === 'began') {
      interactionState.begin();
      dismiss(true);
      return;
    }

    if (gestureRecognizer.state === 'changed') {
      interactiveTransition.update(percentComplete);
      return;
    }

    if (gestureRecognizer.state === 'ended' && percentComplete > completionThreshold) {
      interactiveTransition.finish();
    } else {
      interactiveTransition.cancel();
    }

    interactionState.end();
  };

  return createElement(
    UIPanGestureRecognizer,
    {
      className: styles.sheet,
      action: handlePan,
      delegate: {
        gestureRecognizerShouldBegin: (gestureRecognizer) => gestureRecognizer.translation().y > 0,
      },
    },
    createElement('span', { className: styles.handle }),
    createElement('strong', null, 'Drag down to dismiss'),
    createElement(
      'span',
      { className: styles.hint },
      `Release past ${Math.round(completionThreshold * 100)}% to finish`
    )
  );
}

function Presenter({
  interactiveTransition,
  completionThreshold,
}: {
  interactiveTransition: UIPercentDrivenInteractiveTransition;
  completionThreshold: number;
}) {
  const { present } = useUIViewControllerContext();

  const { transitioningDelegate, interactionState } = useMemo(() => {
    const state = new InteractionState();
    const delegate: UIViewControllerTransitioningDelegate = {
      animationControllerForPresented: () => makeSheetAnimator(true),
      animationControllerForDismissed: () => makeSheetAnimator(false),
      interactionControllerForDismissal: () => (state.isInteracting ? interactiveTransition : null),
      presentationControllerForPresented: () => ({
        dimmingView: { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
        frameOfPresentedViewInContainerView: ({ size }) => ({
          origin: { x: 0, y: size.height * 0.35 },
          size: { width: size.width, height: size.height * 0.65 },
        }),
      }),
    };

    return { transitioningDelegate: delegate, interactionState: state };
  }, [interactiveTransition]);

  return createElement(
    'div',
    { className: styles.screen },
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          present(
            createElement(
              UIPercentDrivenInteractiveTransitionContext.Provider,
              { value: interactiveTransition },
              createElement(
                UIViewController,
                {
                  title: 'Sheet',
                  modalPresentationStyle: 'custom',
                  transitioningDelegate,
                  style: { height: '100%' },
                },
                createElement(SheetViewController, { interactionState, completionThreshold })
              )
            )
          ),
      },
      'present sheet'
    )
  );
}

function UIPercentDrivenInteractiveTransitionStory({
  completionSpeed,
  completionThreshold,
}: UIPercentDrivenInteractiveTransitionStoryArgs) {
  const interactiveTransition = useMemo(() => {
    const transition = new UIPercentDrivenInteractiveTransition();

    transition.completionSpeed = completionSpeed;

    return transition;
  }, [completionSpeed]);

  return createElement(
    UIViewController,
    { title: 'Presenting' },
    createElement(Presenter, { interactiveTransition, completionThreshold })
  );
}

const meta: Meta<UIPercentDrivenInteractiveTransitionStoryArgs> = {
  title: 'UIKit/UIPercentDrivenInteractiveTransition',
  parameters: { layout: 'padded' },
  args: { completionSpeed: 1, completionThreshold: 0.35 },
  argTypes: {
    completionSpeed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    completionThreshold: { control: { type: 'range', min: 0.1, max: 0.9, step: 0.05 } },
  },
  render: (args) => createElement(UIPercentDrivenInteractiveTransitionStory, args),
};

export default meta;

type Story = StoryObj<UIPercentDrivenInteractiveTransitionStoryArgs>;

export const InteractiveDismissal: Story = {};

export const SlowCompletion: Story = {
  args: { completionSpeed: 0.5 },
};
