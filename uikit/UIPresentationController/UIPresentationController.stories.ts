import { createElement, useMemo, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UIPresentationControllerConfiguration } from './UIPresentationController.types';
import { UIViewController } from '../UIViewController/UIViewController';
import { useUIViewControllerContext } from '../UIViewController/UIViewController.context';
import type { UIModalPresentationStyle } from '../UIViewController/UIViewController.types';
import type { UIViewControllerTransitioningDelegate } from '../UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate.types';

interface UIPresentationControllerStoryArgs {
  modalPresentationStyle: UIModalPresentationStyle;
  shouldRemovePresentersView: boolean;
  dimmingBackgroundColor: string;
  dimmingBlur: number;
  sheetHeightFraction: number;
}

const screenStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
  padding: 24,
  minHeight: 360,
  borderRadius: 16,
  background: 'linear-gradient(135deg, #4cc9f0, #4361ee)',
  color: '#ffffff',
};

const sheetStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
  height: '100%',
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: '24px 24px 0 0',
  background: '#ffffff',
  color: '#1c1c1e',
};

function PresentedViewController() {
  const { dismiss, appearanceState } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: sheetStyle },
    createElement('strong', null, 'Presented view controller'),
    createElement('span', null, `appearanceState: ${appearanceState}`),
    createElement('button', { type: 'button', onClick: () => dismiss(true) }, 'dismiss')
  );
}

function Presenter({
  modalPresentationStyle,
  transitioningDelegate,
}: {
  modalPresentationStyle: UIModalPresentationStyle;
  transitioningDelegate: UIViewControllerTransitioningDelegate;
}) {
  const { present, appearanceState } = useUIViewControllerContext();

  return createElement(
    'div',
    { style: screenStyle },
    createElement('strong', null, 'Presenting view controller'),
    createElement('span', null, `appearanceState: ${appearanceState}`),
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          present(
            createElement(
              UIViewController,
              {
                title: 'Sheet',
                modalPresentationStyle,
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

function UIPresentationControllerStory({
  modalPresentationStyle,
  shouldRemovePresentersView,
  dimmingBackgroundColor,
  dimmingBlur,
  sheetHeightFraction,
}: UIPresentationControllerStoryArgs) {
  const transitioningDelegate = useMemo<UIViewControllerTransitioningDelegate>(
    () => ({
      presentationControllerForPresented: (): UIPresentationControllerConfiguration => ({
        shouldRemovePresentersView,
        dimmingView: {
          backgroundColor: dimmingBackgroundColor,
          backdropFilter: `blur(${dimmingBlur}px)`,
        },
        frameOfPresentedViewInContainerView: ({ size }) => ({
          origin: { x: 0, y: size.height * (1 - sheetHeightFraction) },
          size: { width: size.width, height: size.height * sheetHeightFraction },
        }),
      }),
    }),
    [shouldRemovePresentersView, dimmingBackgroundColor, dimmingBlur, sheetHeightFraction]
  );

  return createElement(
    UIViewController,
    { title: 'Presenting' },
    createElement(Presenter, { modalPresentationStyle, transitioningDelegate })
  );
}

const meta: Meta<UIPresentationControllerStoryArgs> = {
  title: 'UIKit/UIPresentationController',
  parameters: { layout: 'padded' },
  args: {
    modalPresentationStyle: 'custom',
    shouldRemovePresentersView: false,
    dimmingBackgroundColor: 'rgba(0, 0, 0, 0.4)',
    dimmingBlur: 8,
    sheetHeightFraction: 0.6,
  },
  argTypes: {
    modalPresentationStyle: {
      control: 'radio',
      options: ['fullScreen', 'overFullScreen', 'custom'],
    },
    shouldRemovePresentersView: { control: 'boolean' },
    dimmingBackgroundColor: { control: 'color' },
    dimmingBlur: { control: { type: 'range', min: 0, max: 40, step: 1 } },
    sheetHeightFraction: { control: { type: 'range', min: 0.2, max: 1, step: 0.05 } },
  },
  render: (args) => createElement(UIPresentationControllerStory, args),
};

export default meta;

type Story = StoryObj<UIPresentationControllerStoryArgs>;

export const CustomSheet: Story = {};

export const FullScreen: Story = {
  args: { modalPresentationStyle: 'fullScreen' },
};

export const OverFullScreen: Story = {
  args: { modalPresentationStyle: 'overFullScreen' },
};
