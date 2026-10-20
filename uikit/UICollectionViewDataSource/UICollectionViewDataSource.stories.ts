import { createElement, useMemo, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UICollectionViewDataSource } from './UICollectionViewDataSource';
import type {
  UICollectionViewDataSource as UICollectionViewDataSourceProtocol,
  UICollectionViewDataSourceProps,
} from './UICollectionViewDataSource.types';
import { UICollectionViewCell } from '../UICollectionViewCell/UICollectionViewCell';
import { UICollectionViewLayout } from '../UICollectionViewLayout/UICollectionViewLayout';
import type { UICollectionViewFlowLayoutConfiguration } from '../UICollectionViewLayout/UICollectionViewLayout.types';

interface UICollectionViewDataSourceStoryArgs extends UICollectionViewDataSourceProps {
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

const collectionViewLayout: UICollectionViewFlowLayoutConfiguration = {
  scrollDirection: 'vertical',
  itemSize: { width: 120, height: 120 },
  minimumLineSpacing: 12,
  minimumInteritemSpacing: 12,
  sectionInset: { top: 16, left: 16, bottom: 16, right: 16 },
};

function createTitles(count: number, prefix = 'Item'): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`);
}

function createDataSource(sections: string[][]): UICollectionViewDataSourceProtocol {
  return {
    numberOfSections: () => sections.length,
    numberOfItemsInSection: (section) => sections[section]?.length ?? 0,
    cellForItemAt: ({ section, item }) =>
      createElement(
        UICollectionViewCell,
        null,
        createElement('span', { style: { fontWeight: 600 } }, sections[section]?.[item])
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

function UICollectionViewDataSourceStory({
  sections,
  ...props
}: UICollectionViewDataSourceStoryArgs) {
  const dataSource = useMemo(() => createDataSource(sections), [sections]);

  return createElement(
    'div',
    { style: containerStyle },
    createElement(
      UICollectionViewDataSource,
      { ...props, dataSource },
      createElement(UICollectionViewLayout, { collectionViewLayout })
    ),
    createElement(DataPanel, {
      title: 'dataSource',
      text: describeDataSource(sections),
    })
  );
}

const meta: Meta<UICollectionViewDataSourceStoryArgs> = {
  title: 'UIKit/UICollectionViewDataSource',
  component: UICollectionViewDataSource,
  parameters: { layout: 'padded' },
  args: { sections: [createTitles(12)] },
  argTypes: {
    dataSource: { table: { disable: true } },
    sections: { control: 'object' },
  },
  render: (args) => createElement(UICollectionViewDataSourceStory, args),
};

export default meta;

type Story = StoryObj<UICollectionViewDataSourceStoryArgs>;

export const Default: Story = {};

export const MultipleSections: Story = {
  args: {
    sections: [createTitles(2, 'A'), createTitles(3, 'B'), createTitles(4, 'C')],
  },
};

export const Empty: Story = {
  args: { sections: [] },
};
