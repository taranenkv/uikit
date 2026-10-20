import { createElement, useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  UICubicTimingParameters,
  UISpringTimingParameters,
  UIViewPropertyAnimator,
} from './UIViewPropertyAnimator';
import type { UIViewAnimationCurve } from './UIViewPropertyAnimator.types';
import styles from './UIViewPropertyAnimator.module.css';

interface UIViewPropertyAnimatorStoryArgs {
  duration: number;
  timingCurve: 'spring' | 'springDurationBounce' | UIViewAnimationCurve;
  dampingRatio: number;
  bounce: number;
}

const DISTANCE = 260;

function UIViewPropertyAnimatorStory({
  duration,
  timingCurve,
  dampingRatio,
  bounce,
}: UIViewPropertyAnimatorStoryArgs) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('inactive');

  const propertyAnimator = useMemo(() => {
    if (!box) {
      return null;
    }

    const timingParameters =
      timingCurve === 'springDurationBounce'
        ? new UISpringTimingParameters({ duration, bounce })
        : timingCurve === 'spring'
          ? new UISpringTimingParameters(dampingRatio)
          : new UICubicTimingParameters(timingCurve);
    const animator = new UIViewPropertyAnimator(duration, timingParameters, (animations) => {
      animations.fromTo(box, { x: 0, rotate: 0 }, { x: DISTANCE, rotate: 180 });
    });

    animator.addCompletion((finalPosition) => setStatus(`completed at ${finalPosition}`));

    return animator;
  }, [box, duration, timingCurve, dampingRatio, bounce]);

  useEffect(
    () => () => {
      propertyAnimator?.stopAnimation(true);
    },
    [propertyAnimator]
  );

  const run = (action: (animator: UIViewPropertyAnimator) => void) => () => {
    if (!propertyAnimator) {
      return;
    }

    action(propertyAnimator);
    setStatus(
      `state: ${propertyAnimator.state}, isReversed: ${propertyAnimator.isReversed}, fractionComplete: ${propertyAnimator.fractionComplete.toFixed(2)}`
    );
  };

  return createElement(
    'div',
    { className: styles.stage },
    createElement(
      'div',
      { className: styles.track },
      createElement('div', { ref: setBox, className: styles.box })
    ),
    createElement(
      'div',
      { className: styles.controls },
      createElement(
        'button',
        { type: 'button', onClick: run((animator) => animator.startAnimation()) },
        'startAnimation'
      ),
      createElement(
        'button',
        { type: 'button', onClick: run((animator) => animator.pauseAnimation()) },
        'pauseAnimation'
      ),
      createElement(
        'button',
        {
          type: 'button',
          onClick: run((animator) => {
            animator.isReversed = !animator.isReversed;
            animator.continueAnimation();
          }),
        },
        'isReversed.toggle'
      )
    ),
    createElement('input', {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
      'aria-label': 'fractionComplete',
      onChange: (event: { currentTarget: HTMLInputElement }) => {
        const value = Number(event.currentTarget.value);

        run((animator) => {
          animator.fractionComplete = value;
        })();
      },
    }),
    createElement('span', { className: styles.state }, status)
  );
}

const meta: Meta<UIViewPropertyAnimatorStoryArgs> = {
  title: 'UIKit/UIViewPropertyAnimator',
  parameters: { layout: 'padded' },
  args: { duration: 0.8, timingCurve: 'spring', dampingRatio: 0.6, bounce: 0 },
  argTypes: {
    duration: { control: { type: 'range', min: 0.1, max: 3, step: 0.1 } },
    timingCurve: {
      control: 'select',
      options: ['spring', 'springDurationBounce', 'easeInOut', 'easeIn', 'easeOut', 'linear'],
    },
    bounce: { control: { type: 'range', min: -0.5, max: 0.5, step: 0.05 } },
    dampingRatio: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 } },
  },
  render: (args) => createElement(UIViewPropertyAnimatorStory, args),
};

export default meta;

type Story = StoryObj<UIViewPropertyAnimatorStoryArgs>;

export const Spring: Story = {};

export const EaseInOut: Story = {
  args: { timingCurve: 'easeInOut' },
};

export const CriticallyDamped: Story = {
  args: { dampingRatio: 1 },
};

export const DurationAndBounce: Story = {
  args: { timingCurve: 'springDurationBounce', duration: 0.55, bounce: 0 },
};
