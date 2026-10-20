import { createElement, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useUIViewControllerTransitionCoordinator } from './UIViewControllerTransitionCoordinator.context';
import { UIViewController } from '../UIViewController/UIViewController';
import { useUIViewControllerContext } from '../UIViewController/UIViewController.context';
import styles from './UIViewControllerTransitionCoordinator.module.css';

interface UIViewControllerTransitionCoordinatorStoryArgs {
  animated: boolean;
}

function Toolbar({ onLog }: { onLog: (entry: string) => void }) {
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  const transitionCoordinator = useUIViewControllerTransitionCoordinator();

  useEffect(() => {
    if (!toolbar || !transitionCoordinator) {
      return;
    }

    onLog(
      `transition began: isPresenting ${transitionCoordinator.isPresenting}, isAnimated ${transitionCoordinator.isAnimated}, duration ${transitionCoordinator.transitionDuration}`
    );

    transitionCoordinator.animateAlongsideTransition(
      (animations, context) => {
        animations.to(toolbar, { yPercent: context.isPresenting ? 180 : 0 });
      },
      (context) => onLog(`transition completed: isCancelled ${context.isCancelled}`)
    );
  }, [toolbar, transitionCoordinator, onLog]);

  return createElement('div', { ref: setToolbar, className: styles.toolbar });
}

function PresentedViewController() {
  const { dismiss } = useUIViewControllerContext();

  return createElement(
    'div',
    { className: styles.presented },
    createElement('button', { type: 'button', onClick: () => dismiss(true) }, 'dismiss')
  );
}

function Presenter({ animated }: UIViewControllerTransitionCoordinatorStoryArgs) {
  const { present } = useUIViewControllerContext();
  const [log, setLog] = useState<string[]>([]);
  const [appendLog] = useState(() => (entry: string) => setLog((current) => [...current, entry]));

  return createElement(
    'div',
    null,
    createElement(
      'div',
      { className: styles.screen },
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
                  modalPresentationStyle: 'overFullScreen',
                  style: { height: '100%' },
                },
                createElement(PresentedViewController)
              ),
              animated
            ),
        },
        'present'
      ),
      createElement(Toolbar, { onLog: appendLog })
    ),
    createElement('pre', { className: styles.log }, log.join('\n'))
  );
}

const meta: Meta<UIViewControllerTransitionCoordinatorStoryArgs> = {
  title: 'UIKit/UIViewControllerTransitionCoordinator',
  parameters: { layout: 'padded' },
  args: { animated: true },
  argTypes: { animated: { control: 'boolean' } },
  render: (args) =>
    createElement(UIViewController, { title: 'Presenting' }, createElement(Presenter, args)),
};

export default meta;

type Story = StoryObj<UIViewControllerTransitionCoordinatorStoryArgs>;

export const AnimateAlongsideTransition: Story = {};

export const WithoutAnimation: Story = {
  args: { animated: false },
};
