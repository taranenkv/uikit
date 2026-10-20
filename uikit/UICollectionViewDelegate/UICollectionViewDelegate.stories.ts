import { createElement, useCallback, useMemo, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UICollectionViewDelegate } from './UICollectionViewDelegate';
import type {
  UICollectionViewDelegate as UICollectionViewDelegateProtocol,
  UICollectionViewDelegateProps,
} from './UICollectionViewDelegate.types';
import { UICollectionViewCell } from '../UICollectionViewCell/UICollectionViewCell';
import { useUICollectionViewCellContext } from '../UICollectionViewCell/UICollectionViewCell.context';
import { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource';
import type { UICollectionViewDataSource as UICollectionViewDataSourceProtocol } from '../UICollectionViewDataSource/UICollectionViewDataSource.types';
import { UICollectionViewLayout } from '../UICollectionViewLayout/UICollectionViewLayout';
import type {
  IndexPath,
  UICollectionViewFlowLayoutConfiguration,
} from '../UICollectionViewLayout/UICollectionViewLayout.types';

const NUMBER_OF_ITEMS = 12;
const MAXIMUM_LOG_ENTRIES = 8;

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const panelsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const panelStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  height: 200,
  overflow: 'auto',
  boxSizing: 'border-box',
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

function formatIndexPath({ section, item }: IndexPath): string {
  return `{ section: ${section}, item: ${item} }`;
}

function resolveShouldHighlight(
  delegate: UICollectionViewDelegateProtocol | undefined,
  indexPath: IndexPath
): boolean {
  return delegate?.shouldHighlightItemAt?.(indexPath) ?? true;
}

function DelegateCellContent({
  title,
  shouldHighlight,
}: {
  title: string;
  shouldHighlight: boolean;
}) {
  const { isHighlighted } = useUICollectionViewCellContext();

  return createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        textAlign: 'center',
      },
    },
    createElement('span', { style: { fontWeight: 600 } }, title),
    createElement('small', null, shouldHighlight ? 'can highlight' : 'no highlight'),
    createElement('small', null, isHighlighted ? 'highlighted' : '\u00a0')
  );
}

function createDataSource(
  delegate: UICollectionViewDelegateProtocol | undefined
): UICollectionViewDataSourceProtocol {
  return {
    numberOfItemsInSection: () => NUMBER_OF_ITEMS,
    cellForItemAt: ({ section, item }) => {
      const shouldHighlight = resolveShouldHighlight(delegate, { section, item });

      return createElement(
        UICollectionViewCell,
        {
          backgroundView: shouldHighlight
            ? undefined
            : createElement('div', {
                style: { width: '100%', height: '100%', background: '#ffd6d6' },
              }),
        },
        createElement(DelegateCellContent, {
          title: `Item ${item + 1}`,
          shouldHighlight,
        })
      );
    },
  };
}

function describeDelegate(delegate: UICollectionViewDelegateProtocol | undefined): string {
  const implemented = Object.keys(delegate ?? {});

  return [
    `delegate methods: ${implemented.length > 0 ? implemented.join(', ') : 'none'}`,
    ...Array.from({ length: NUMBER_OF_ITEMS }, (_, item) => {
      const indexPath: IndexPath = { section: 0, item };

      return `shouldHighlightItemAt(${formatIndexPath(indexPath)}) -> ${resolveShouldHighlight(delegate, indexPath)}`;
    }),
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

function UICollectionViewDelegateStory({ delegate, ...props }: UICollectionViewDelegateProps) {
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((entry: string) => {
    setLog((current) => [entry, ...current].slice(0, MAXIMUM_LOG_ENTRIES));
  }, []);

  const dataSource = useMemo(() => createDataSource(delegate), [delegate]);

  const loggedDelegate = useMemo<UICollectionViewDelegateProtocol>(
    () => ({
      ...delegate,
      shouldHighlightItemAt: (indexPath) => {
        const result = resolveShouldHighlight(delegate, indexPath);
        appendLog(`shouldHighlightItemAt(${formatIndexPath(indexPath)}) -> ${result}`);
        return result;
      },
      didHighlightItemAt: (indexPath) => {
        appendLog(`didHighlightItemAt(${formatIndexPath(indexPath)})`);
        delegate?.didHighlightItemAt?.(indexPath);
      },
      didUnhighlightItemAt: (indexPath) => {
        appendLog(`didUnhighlightItemAt(${formatIndexPath(indexPath)})`);
        delegate?.didUnhighlightItemAt?.(indexPath);
      },
    }),
    [delegate, appendLog]
  );

  return createElement(
    'div',
    { style: containerStyle },
    createElement(
      UICollectionViewDataSource,
      { dataSource },
      createElement(
        UICollectionViewDelegate,
        { ...props, delegate: loggedDelegate },
        createElement(UICollectionViewLayout, { collectionViewLayout })
      )
    ),
    createElement(
      'div',
      { style: panelsStyle },
      createElement(DataPanel, { title: 'delegate', text: describeDelegate(delegate) }),
      createElement(DataPanel, {
        title: 'delegate calls (press a cell)',
        text: log.length > 0 ? log.join('\n') : 'no calls yet',
      })
    )
  );
}

const meta: Meta<UICollectionViewDelegateProps> = {
  title: 'UIKit/UICollectionViewDelegate',
  component: UICollectionViewDelegate,
  parameters: { layout: 'padded' },
  args: {
    delegate: { shouldHighlightItemAt: () => true },
  },
  argTypes: {
    delegate: { table: { disable: true } },
  },
  render: (args) => createElement(UICollectionViewDelegateStory, args),
};

export default meta;

type Story = StoryObj<UICollectionViewDelegateProps>;

export const Default: Story = {};

export const ShouldHighlightItemAt: Story = {
  args: {
    delegate: {
      shouldHighlightItemAt: ({ item }) => item % 2 === 0,
    },
  },
};

export const WithoutDelegate: Story = {
  args: { delegate: undefined },
};
