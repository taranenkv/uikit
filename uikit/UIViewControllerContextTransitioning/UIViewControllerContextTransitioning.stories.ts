import { createElement, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createViewControllerContextTransitioning } from './UIViewControllerContextTransitioning';
import type { CGRect } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import { UICrossDissolveAnimatedTransitioning } from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning';
import styles from './UIViewControllerContextTransitioning.module.css';

interface UIViewControllerContextTransitioningStoryArgs {
  isAnimated: boolean;
  isPresenting: boolean;
}

function formatRect({ origin, size }: CGRect): string {
  return `{ x: ${Math.round(origin.x)}, y: ${Math.round(origin.y)}, width: ${Math.round(size.width)}, height: ${Math.round(size.height)} }`;
}

function UIViewControllerContextTransitioningStory({
  isAnimated,
  isPresenting,
}: UIViewControllerContextTransitioningStoryArgs) {
  const [containerView, setContainerView] = useState<HTMLDivElement | null>(null);
  const [source, setSource] = useState<HTMLDivElement | null>(null);
  const [destination, setDestination] = useState<HTMLDivElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const performTransition = () => {
    if (!containerView || !source || !destination) {
      return;
    }

    const transitionContext = createViewControllerContextTransitioning({
      containerView,
      isAnimated,
      isInteractive: false,
      isPresenting,
      presentationStyle: 'custom',
      viewControllers: { from: null, to: null },
      views: { from: source, to: destination },
      matchedViewFor: (identifier, root) =>
        root?.querySelector<HTMLElement>(`[data-identifier="${identifier}"]`) ?? null,
      onComplete: (didComplete) =>
        setLog((current) => [...current, `completeTransition(${didComplete})`]),
    });

    setLog([
      `isPresenting: ${transitionContext.isPresenting}`,
      `frameInContainerView(from): ${formatRect(transitionContext.frameInContainerView(source))}`,
      `frameInContainerView(to): ${formatRect(transitionContext.frameInContainerView(destination))}`,
    ]);

    new UICrossDissolveAnimatedTransitioning(0.6).animateTransition(transitionContext);
  };

  return createElement(
    'div',
    null,
    createElement(
      'div',
      { ref: setContainerView, className: styles.stage },
      createElement('div', { ref: setSource, className: styles.source }),
      createElement('div', { ref: setDestination, className: styles.destination })
    ),
    createElement('button', { type: 'button', onClick: performTransition }, 'animateTransition'),
    createElement('pre', { className: styles.log }, log.join('\n'))
  );
}

const meta: Meta<UIViewControllerContextTransitioningStoryArgs> = {
  title: 'UIKit/UIViewControllerContextTransitioning',
  parameters: { layout: 'padded' },
  args: { isAnimated: true, isPresenting: true },
  argTypes: {
    isAnimated: { control: 'boolean' },
    isPresenting: { control: 'boolean' },
  },
  render: (args) => createElement(UIViewControllerContextTransitioningStory, args),
};

export default meta;

type Story = StoryObj<UIViewControllerContextTransitioningStoryArgs>;

export const Presentation: Story = {};

export const Dismissal: Story = {
  args: { isPresenting: false },
};

export const WithoutAnimation: Story = {
  args: { isAnimated: false },
};
