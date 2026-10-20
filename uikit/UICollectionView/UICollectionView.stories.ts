import { createElement, useMemo, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UICollectionView } from './UICollectionView';
import type { UICollectionViewProps } from './UICollectionView.types';
import { UICollectionViewCell } from '../UICollectionViewCell/UICollectionViewCell';
import type { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource.types';
import type { UICollectionViewFlowLayoutConfiguration } from '../UICollectionViewLayout/UICollectionViewLayout.types';

interface UICollectionViewStoryArgs extends UICollectionViewProps {
  sections: string[][];
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const panelStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  maxHeight: 200,
  overflow: 'auto',
  borderRadius: 8,
  background: '#f2f2f7',
  color: '#1c1c1e',
  fontSize: 12,
  lineHeight: 1.5,
};

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

function createTitles(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Item ${index + 1}`);
}

function createDataSource(sections: string[][]): UICollectionViewDataSource {
  return {
    numberOfSections: () => sections.length,
    numberOfItemsInSection: (section) => sections[section]?.length ?? 0,
    cellForItemAt: ({ section, item }) =>
      createElement(
        UICollectionViewCell,
        null,
        createElement('span', { style: { fontWeight: 600 } }, sections[section]?.[item]),
        createElement(
          UICollectionViewCell.SelectedContent,
          null,
          createElement('span', { style: { position: 'absolute', top: 8, right: 10 } }, '✓')
        )
      ),
  };
}

function describeDataSource(sections: string[][]): string {
  return [
    `numberOfSections() -> ${sections.length}`,
    ...sections.map((items, section) => `numberOfItemsInSection(${section}) -> ${items.length}`),
    ...sections.flatMap((items, section) =>
      items.map(
        (title, item) => `cellForItemAt({ section: ${section}, item: ${item} }) -> "${title}"`
      )
    ),
  ].join('\n');
}

function DataPanel({ title, text }: { title: string; text: string }) {
  return createElement(
    'div',
    null,
    createElement('strong', null, title),
    createElement('pre', { style: panelStyle }, text)
  );
}

function UICollectionViewStory({ sections, ...props }: UICollectionViewStoryArgs) {
  const dataSource = useMemo(() => createDataSource(sections), [sections]);

  return createElement(
    'div',
    { style: containerStyle },
    createElement(UICollectionView, { ...props, dataSource }),
    createElement(DataPanel, {
      title: 'dataSource',
      text: describeDataSource(sections),
    })
  );
}

const meta: Meta<UICollectionViewStoryArgs> = {
  title: 'UIKit/UICollectionView',
  component: UICollectionView,
  parameters: { layout: 'padded' },
  args: {
    sections: [createTitles(12)],
    allowsSelection: true,
    allowsMultipleSelection: false,
    collectionViewLayout: verticalLayout,
  },
  argTypes: {
    dataSource: { table: { disable: true } },
    sections: { control: 'object' },
    allowsSelection: { control: 'boolean' },
    allowsMultipleSelection: { control: 'boolean' },
  },
  render: (args) => createElement(UICollectionViewStory, args),
};

export default meta;

type Story = StoryObj<UICollectionViewStoryArgs>;

export const Default: Story = {};

export const MultipleSelection: Story = {
  args: { allowsMultipleSelection: true },
};

export const Horizontal: Story = {
  args: {
    collectionViewLayout: horizontalLayout,
    style: { height: 300 },
  },
};

export const Vertical: Story = {
  args: {
    sections: [createTitles(30)],
    collectionViewLayout: verticalLayout,
    style: { height: 320 },
  },
};
