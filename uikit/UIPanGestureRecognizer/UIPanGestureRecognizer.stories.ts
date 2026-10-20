import { createElement, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import gsap from 'gsap';
import { UIPanGestureRecognizer } from './UIPanGestureRecognizer';
import type {
  UIPanGestureRecognizer as UIPanGestureRecognizerProtocol,
  UIPanGestureRecognizerProps,
} from './UIPanGestureRecognizer.types';

const areaStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: 320,
  borderRadius: 16,
  background: '#f2f2f7',
  touchAction: 'none',
};

const knobStyle: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: 24,
  background: 'linear-gradient(135deg, #0061ff, #60efff)',
  cursor: 'grab',
};

const logStyle: CSSProperties = {
  margin: '12px 0 0',
  font: '12px/1.5 ui-monospace, monospace',
};

function UIPanGestureRecognizerStory(props: UIPanGestureRecognizerProps) {
  const [knob, setKnob] = useState<HTMLDivElement | null>(null);
  const [log, setLog] = useState('possible');

  const handlePan = (gestureRecognizer: UIPanGestureRecognizerProtocol) => {
    const translation = gestureRecognizer.translation();
    const velocity = gestureRecognizer.velocity();

    setLog(
      `${gestureRecognizer.state} translation(${Math.round(translation.x)}, ${Math.round(translation.y)}) velocity(${Math.round(velocity.x)}, ${Math.round(velocity.y)})`
    );

    if (gestureRecognizer.state === 'ended' || gestureRecognizer.state === 'cancelled') {
      gsap.to(knob, { x: 0, y: 0, duration: 0.5, ease: 'back.out(2)' });
      return;
    }

    gsap.set(knob, { x: translation.x, y: translation.y });
  };

  return createElement(
    'div',
    null,
    createElement(
      UIPanGestureRecognizer,
      { ...props, style: areaStyle, action: handlePan },
      createElement('div', { ref: setKnob, style: knobStyle })
    ),
    createElement('pre', { style: logStyle }, log)
  );
}

const meta: Meta<UIPanGestureRecognizerProps> = {
  title: 'UIKit/UIPanGestureRecognizer',
  component: UIPanGestureRecognizer,
  parameters: { layout: 'padded' },
  args: { isEnabled: true },
  argTypes: {
    isEnabled: { control: 'boolean' },
    action: { table: { disable: true } },
    delegate: { table: { disable: true } },
  },
  render: (args) => createElement(UIPanGestureRecognizerStory, args),
};

export default meta;

type Story = StoryObj<UIPanGestureRecognizerProps>;

export const Default: Story = {};

export const VerticalOnly: Story = {
  args: {
    delegate: {
      gestureRecognizerShouldBegin: (gestureRecognizer) => {
        const translation = gestureRecognizer.translation();

        return Math.abs(translation.y) > Math.abs(translation.x);
      },
    },
  },
};

export const Disabled: Story = {
  args: { isEnabled: false },
};
