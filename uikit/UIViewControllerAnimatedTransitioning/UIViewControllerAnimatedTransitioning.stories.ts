import { createElement, useMemo, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UICrossDissolveAnimatedTransitioning } from './UIViewControllerAnimatedTransitioning';
import type { UIViewControllerAnimatedTransitioning } from './UIViewControllerAnimatedTransitioning.types';
import { UIViewController } from '../UIViewController/UIViewController';
import { useUIViewControllerContext } from '../UIViewController/UIViewController.context';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';
import {
  UISpringTimingParameters,
  UIViewPropertyAnimator,
} from '../UIViewPropertyAnimator/UIViewPropertyAnimator';

type AnimatorKind = 'crossDissolve' | 'slideUp';

interface UIViewControllerAnimatedTransitioningStoryArgs {
  animator: AnimatorKind;
  duration: number;
}

const screenStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: 360,
  borderRadius: 16,
  background: '#f2f2f7',
};

const presentedStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: '100%',
  background: 'linear-gradient(160deg, #7b2ff7, #f107a3)',
  color: '#ffffff',
};

class SlideUpAnimatedTransitioning implements UIViewControllerAnimatedTransitioning {
  private readonly duration: number;
  private readonly propertyAnimators = new WeakMap<
    UIViewControllerContextTransitioning,
    UIViewPropertyAnimator
  >();

  constructor(duration: number) {
    this.duration = duration;
  }

  transitionDuration(transitionContext: UIViewControllerContextTransitioning | null): number {
    return transitionContext?.isAnimated === false ? 0 : this.duration;
  }

  interruptibleAnimator(
    transitionContext: UIViewControllerContextTransitioning
  ): UIViewPropertyAnimator {
    const existing = this.propertyAnimators.get(transitionContext);

    if (existing) {
      return existing;
    }

    const isPresenting = transitionContext.isPresenting;
    const presentedView = transitionContext.viewForKey(isPresenting ? 'to' : 'from');
    const propertyAnimator = new UIViewPropertyAnimator(
      this.transitionDuration(transitionContext),
      new UISpringTimingParameters(0.8)
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
    this.propertyAnimators.set(transitionContext, propertyAnimator);

    return propertyAnimator;
  }

  animateTransition(transitionContext: UIViewControllerContextTransitioning): void {
    this.interruptibleAnimator(transitionContext).startAnimation();
  }
}

function PresentedViewController() {
  const { dismiss } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: presentedStyle },
    createElement('button', { type: 'button', onClick: () => dismiss(true) }, 'dismiss')
  );
}

function Presenter({
  transitioningDelegate,
}: {
  transitioningDelegate: UIViewControllerTransitioningDelegate;
}) {
  const { present } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: screenStyle },
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          present(
            createElement(
              UIViewController,
              {
                title: 'Presented',
                modalPresentationStyle: 'custom',
                transitioningDelegate,
                style: { height: '100%' },
              },
              createElement(PresentedViewController)
            )
          ),
      },
      'present'
    )
  );
}

function UIViewControllerAnimatedTransitioningStory({
  animator,
  duration,
}: UIViewControllerAnimatedTransitioningStoryArgs) {
  const transitioningDelegate = useMemo<UIViewControllerTransitioningDelegate>(() => {
    const makeAnimator = () =>
      animator === 'slideUp'
        ? new SlideUpAnimatedTransitioning(duration)
        : new UICrossDissolveAnimatedTransitioning(duration);

    return {
      animationControllerForPresented: makeAnimator,
      animationControllerForDismissed: makeAnimator,
    };
  }, [animator, duration]);

  return createElement(
    UIViewController,
    { title: 'Presenting' },
    createElement(Presenter, { transitioningDelegate })
  );
}

const meta: Meta<UIViewControllerAnimatedTransitioningStoryArgs> = {
  title: 'UIKit/UIViewControllerAnimatedTransitioning',
  parameters: { layout: 'padded' },
  args: { animator: 'crossDissolve', duration: 0.4 },
  argTypes: {
    animator: { control: 'radio', options: ['crossDissolve', 'slideUp'] },
    duration: { control: { type: 'range', min: 0.1, max: 2, step: 0.1 } },
  },
  render: (args) => createElement(UIViewControllerAnimatedTransitioningStory, args),
};

export default meta;

type Story = StoryObj<UIViewControllerAnimatedTransitioningStoryArgs>;

export const CrossDissolve: Story = {};

export const SlideUp: Story = {
  args: { animator: 'slideUp', duration: 0.6 },
};
