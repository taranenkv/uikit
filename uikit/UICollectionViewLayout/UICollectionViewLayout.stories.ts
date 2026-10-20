import { createElement, useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UICollectionViewLayout } from './UICollectionViewLayout';
import type {
  UICollectionViewFlowLayoutConfiguration,
  UICollectionViewLayoutProps,
} from './UICollectionViewLayout.types';
import { UICollectionViewCell } from '../UICollectionViewCell/UICollectionViewCell';
import { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource';
import type { UICollectionViewDataSource as UICollectionViewDataSourceProtocol } from '../UICollectionViewDataSource/UICollectionViewDataSource.types';

const verticalLayout: UICollectionViewFlowLayoutConfiguration = {
  scrollDirection: 'vertical',
  itemSize: { width: 120, height: 120 },
  minimumLineSpacing: 12,
  minimumInteritemSpacing: 12,
  sectionInset: { top: 16, left: 16, bottom: 16, right: 16 },
};

const horizontalLayout: UICollectionViewFlowLayoutConfiguration = {
  ...verticalLayout,
  scrollDirection: 'horizontal',
};

function createDataSource(
  numberOfItems: number,
  selectedItems: number[] = [],
  toggleItem?: (item: number) => void
): UICollectionViewDataSourceProtocol {
  return {
    numberOfItemsInSection: () => numberOfItems,
    cellForItemAt: ({ item }) =>
      createElement(
        UICollectionViewCell,
        {
          isSelected: selectedItems.includes(item),
          onClick: toggleItem ? () => toggleItem(item) : undefined,
        },
        createElement('span', { style: { fontWeight: 600 } }, `Item ${item + 1}`)
      ),
  };
}

function StaticStory({
  numberOfItems,
  layoutProps,
}: {
  numberOfItems: number;
  layoutProps: UICollectionViewLayoutProps;
}) {
  const dataSource = useMemo(() => createDataSource(numberOfItems), [numberOfItems]);

  return createElement(
    UICollectionViewDataSource,
    { dataSource },
    createElement(UICollectionViewLayout, layoutProps)
  );
}

function MultipleSelectionStory({ layoutProps }: { layoutProps: UICollectionViewLayoutProps }) {
  const [selectedItems, setSelectedItems] = useState<number[]>([1, 2]);

  const toggleItem = useCallback((item: number) => {
    setSelectedItems((current) =>
      current.includes(item) ? current.filter((selected) => selected !== item) : [...current, item]
    );
  }, []);

  const dataSource = useMemo(
    () => createDataSource(12, selectedItems, toggleItem),
    [selectedItems, toggleItem]
  );

  return createElement(
    UICollectionViewDataSource,
    { dataSource },
    createElement(UICollectionViewLayout, layoutProps)
  );
}

function renderStatic(numberOfItems: number) {
  return (args: UICollectionViewLayoutProps) =>
    createElement(StaticStory, { numberOfItems, layoutProps: args });
}

const meta: Meta<typeof UICollectionViewLayout> = {
  title: 'UIKit/UICollectionViewLayout',
  component: UICollectionViewLayout,
  parameters: { layout: 'padded' },
  args: { collectionViewLayout: verticalLayout },
  render: renderStatic(12),
};

export default meta;

type Story = StoryObj<typeof UICollectionViewLayout>;

export const Default: Story = {};

export const MultipleSelection: Story = {
  render: (args) => createElement(MultipleSelectionStory, { layoutProps: args }),
};

export const Horizontal: Story = {
  args: {
    collectionViewLayout: horizontalLayout,
    style: { height: 300 },
  },
};

export const Vertical: Story = {
  args: {
    collectionViewLayout: verticalLayout,
    style: { height: 320 },
  },
  render: renderStatic(30),
};
