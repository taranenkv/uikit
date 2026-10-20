import { createElement, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UIViewControllerTransitioningDelegate } from './UIViewControllerTransitioningDelegate';
import type { UIViewControllerTransitioningDelegate as UIViewControllerTransitioningDelegateProtocol } from './UIViewControllerTransitioningDelegate.types';
import { UIViewController } from '../UIViewController/UIViewController';
import { useUIViewControllerContext } from '../UIViewController/UIViewController.context';
import type { UIViewControllerAnimatedTransitioning } from '../UIViewControllerAnimatedTransitioning/UIViewControllerAnimatedTransitioning.types';
import type { UIViewControllerContextTransitioning } from '../UIViewControllerContextTransitioning/UIViewControllerContextTransitioning.types';
import {
  UISpringTimingParameters,
  UIViewPropertyAnimator,
} from '../UIViewPropertyAnimator/UIViewPropertyAnimator';

interface UIViewControllerTransitioningDelegateStoryArgs {
  dampingRatio: number;
  duration: number;
}

interface Swatch {
  id: string;
  name: string;
  background: string;
}

const SWATCHES: Swatch[] = [
  { id: 'sunset', name: 'Sunset', background: 'linear-gradient(135deg, #ff6a00, #ee0979)' },
  { id: 'ocean', name: 'Ocean', background: 'linear-gradient(135deg, #0061ff, #60efff)' },
  { id: 'aurora', name: 'Aurora', background: 'linear-gradient(135deg, #00c9a7, #845ec2)' },
];

const MatchedTransitionSource = UIViewControllerTransitioningDelegate.MatchedTransitionSource;

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
  maxWidth: 420,
};

const thumbnailStyle: CSSProperties = {
  aspectRatio: '1',
  borderRadius: 20,
  border: 0,
  padding: 0,
  cursor: 'pointer',
};

const detailStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#ffffff',
};

const heroStyle: CSSProperties = {
  height: '55%',
};

const detailContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
  padding: 24,
};

function matchedIdentifier(swatch: Swatch): string {
  return `swatch-${swatch.id}`;
}

function makeMatchedAnimator(
  identifier: string,
  isPresenting: boolean,
  duration: number,
  dampingRatio: number
): UIViewControllerAnimatedTransitioning {
  const propertyAnimators = new WeakMap<
    UIViewControllerContextTransitioning,
    UIViewPropertyAnimator
  >();
  const transitionDuration = (transitionContext: UIViewControllerContextTransitioning | null) =>
    transitionContext?.isAnimated === false ? 0 : duration;

  const interruptibleAnimator = (transitionContext: UIViewControllerContextTransitioning) => {
    const existing = propertyAnimators.get(transitionContext);

    if (existing) {
      return existing;
    }

    const presentedView = transitionContext.viewForKey(isPresenting ? 'to' : 'from');
    const source = transitionContext.matchedViewFor(identifier, isPresenting ? 'from' : 'to');
    const destination = transitionContext.matchedViewFor(identifier, isPresenting ? 'to' : 'from');
    const propertyAnimator = new UIViewPropertyAnimator(
      transitionDuration(transitionContext),
      new UISpringTimingParameters(dampingRatio)
    );

    if (presentedView && source && destination) {
      const sourceFrame = transitionContext.frameInContainerView(source);
      const destinationFrame = transitionContext.frameInContainerView(destination);
      const collapsed = {
        x: sourceFrame.origin.x - destinationFrame.origin.x,
        y: sourceFrame.origin.y - destinationFrame.origin.y,
        scaleX: sourceFrame.size.width / destinationFrame.size.width,
        scaleY: sourceFrame.size.height / destinationFrame.size.height,
        borderRadius: 20,
        transformOrigin: '0px 0px',
      };
      const expanded = {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        borderRadius: 0,
        transformOrigin: '0px 0px',
      };

      source.style.visibility = 'hidden';
      propertyAnimator.addAnimations((animations) => {
        animations.fromTo(
          presentedView,
          { backgroundColor: 'rgba(255, 255, 255, 0)' },
          { backgroundColor: 'rgba(255, 255, 255, 1)' }
        );
        animations.fromTo(
          destination,
          isPresenting ? collapsed : expanded,
          isPresenting ? expanded : collapsed
        );
      });
      propertyAnimator.addCompletion(() => {
        source.style.visibility = '';
      });
    }

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

function SwatchViewController({ swatch }: { swatch: Swatch }) {
  const { dismiss } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: detailStyle },
    createElement(MatchedTransitionSource, {
      identifier: matchedIdentifier(swatch),
      style: { ...heroStyle, background: swatch.background },
    }),
    createElement(
      'div',
      { style: detailContentStyle },
      createElement('strong', null, swatch.name),
      createElement('button', { type: 'button', onClick: () => dismiss(true) }, 'dismiss')
    )
  );
}

function SwatchGrid({ onSelect }: { onSelect: (swatch: Swatch) => void }) {
  const { present } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: gridStyle },
    SWATCHES.map((swatch) =>
      createElement(
        MatchedTransitionSource,
        { key: swatch.id, identifier: matchedIdentifier(swatch) },
        createElement('button', {
          type: 'button',
          'aria-label': swatch.name,
          style: { ...thumbnailStyle, width: '100%', background: swatch.background },
          onClick: () => {
            onSelect(swatch);
            present(
              createElement(
                UIViewController,
                { title: swatch.name, modalPresentationStyle: 'custom', style: { height: '100%' } },
                createElement(SwatchViewController, { swatch })
              )
            );
          },
        })
      )
    )
  );
}

class SwatchTransitioningDelegate implements UIViewControllerTransitioningDelegateProtocol {
  private selected: Swatch = SWATCHES[0];
  private readonly duration: number;
  private readonly dampingRatio: number;

  constructor(duration: number, dampingRatio: number) {
    this.duration = duration;
    this.dampingRatio = dampingRatio;
  }

  select(swatch: Swatch): void {
    this.selected = swatch;
  }

  animationControllerForPresented(): UIViewControllerAnimatedTransitioning {
    return makeMatchedAnimator(
      matchedIdentifier(this.selected),
      true,
      this.duration,
      this.dampingRatio
    );
  }

  animationControllerForDismissed(): UIViewControllerAnimatedTransitioning {
    return makeMatchedAnimator(
      matchedIdentifier(this.selected),
      false,
      this.duration,
      this.dampingRatio
    );
  }
}

function UIViewControllerTransitioningDelegateStory({
  duration,
  dampingRatio,
}: UIViewControllerTransitioningDelegateStoryArgs) {
  const [transitioningDelegate] = useState(
    () => new SwatchTransitioningDelegate(duration, dampingRatio)
  );

  return createElement(
    UIViewControllerTransitioningDelegate,
    { transitioningDelegate },
    createElement(
      UIViewController,
      { title: 'Swatches' },
      createElement(SwatchGrid, {
        onSelect: (swatch: Swatch) => transitioningDelegate.select(swatch),
      })
    )
  );
}

const meta: Meta<UIViewControllerTransitioningDelegateStoryArgs> = {
  title: 'UIKit/UIViewControllerTransitioningDelegate',
  parameters: { layout: 'padded' },
  args: { duration: 0.6, dampingRatio: 0.85 },
  argTypes: {
    duration: { control: { type: 'range', min: 0.2, max: 2, step: 0.1 } },
    dampingRatio: { control: { type: 'range', min: 0.3, max: 1, step: 0.05 } },
  },
  render: (args) =>
    createElement(UIViewControllerTransitioningDelegateStory, {
      ...args,
      key: `${args.duration}-${args.dampingRatio}`,
    }),
};

export default meta;

type Story = StoryObj<UIViewControllerTransitioningDelegateStoryArgs>;

export const ZoomFromThumbnail: Story = {};

export const Bouncy: Story = {
  args: { dampingRatio: 0.5 },
};
