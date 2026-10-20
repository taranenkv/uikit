import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UICollectionViewCell } from './UICollectionViewCell';

const meta: Meta<typeof UICollectionViewCell> = {
  title: 'UIKit/UICollectionViewCell',
  component: UICollectionViewCell,
  parameters: { layout: 'centered' },
  args: {
    isSelected: false,
    isHighlighted: false,
    isUserInteractionEnabled: true,
    reuseIdentifier: 'DefaultCell',
  },
  argTypes: {
    isSelected: { control: 'boolean' },
    isHighlighted: { control: 'boolean' },
    isUserInteractionEnabled: { control: 'boolean' },
  },
  render: (args) =>
    createElement(
      'div',
      { style: { width: 120, height: 120 } },
      createElement(
        UICollectionViewCell,
        args,
        createElement('span', { style: { fontWeight: 600 } }, 'Cell')
      )
    ),
};

export default meta;

type Story = StoryObj<typeof UICollectionViewCell>;

export const Default: Story = {};

export const Selected: Story = {
  args: { isSelected: true },
};

export const WithSelectedContent: Story = {
  args: { isSelected: true },
  render: (args) =>
    createElement(
      'div',
      { style: { width: 120, height: 120 } },
      createElement(
        UICollectionViewCell,
        args,
        createElement('span', { style: { fontWeight: 600 } }, 'Cell'),
        createElement(
          UICollectionViewCell.SelectedContent,
          null,
          createElement('span', { style: { position: 'absolute', top: 8, right: 10 } }, '✓')
        )
      )
    ),
};
