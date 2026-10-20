import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UIViewController } from './UIViewController';
import { useUIViewControllerContext } from './UIViewController.context';
import type { UIViewControllerProps } from './UIViewController.types';
import { UICollectionView } from '../UICollectionView/UICollectionView';
import { UICollectionViewCell } from '../UICollectionViewCell/UICollectionViewCell';
import type { UICollectionViewDataSource } from '../UICollectionViewDataSource/UICollectionViewDataSource.types';
import type { UICollectionViewDelegate } from '../UICollectionViewDelegate/UICollectionViewDelegate.types';
import type {
  IndexPath,
  UICollectionViewFlowLayoutConfiguration,
} from '../UICollectionViewLayout/UICollectionViewLayout.types';

const NUMBER_OF_ITEMS = 12;
const MAXIMUM_LOG_ENTRIES = 10;

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const panelStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  height: 220,
  overflow: 'auto',
  boxSizing: 'border-box',
  borderRadius: 8,
  background: '#f2f2f7',
  color: '#1c1c1e',
  fontSize: 12,
  lineHeight: 1.5,
};

const stateStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  padding: '0 16px 8px',
  fontSize: 12,
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

function ViewControllerState() {
  const { title, isViewLoaded, appearanceState, isBeingPresented, isBeingDismissed } =
    useUIViewControllerContext();

  return createElement(
    'div',
    { style: stateStyle },
    createElement('strong', null, title ?? 'untitled'),
    createElement('span', null, `isViewLoaded: ${isViewLoaded}`),
    createElement('span', null, `appearanceState: ${appearanceState}`),
    createElement('span', null, `isBeingPresented: ${isBeingPresented}`),
    createElement('span', null, `isBeingDismissed: ${isBeingDismissed}`)
  );
}

function UIViewControllerStory({
  isViewVisible: isViewVisibleArg = true,
  animated = true,
  ...props
}: UIViewControllerProps) {
  const [isViewVisible, setIsViewVisible] = useState(isViewVisibleArg);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setIsViewVisible(isViewVisibleArg);
  }, [isViewVisibleArg]);

  const appendLog = useCallback((entry: string) => {
    setLog((current) => [entry, ...current].slice(0, MAXIMUM_LOG_ENTRIES));
  }, []);

  const dataSource = useMemo<UICollectionViewDataSource>(
    () => ({
      numberOfItemsInSection: () => NUMBER_OF_ITEMS,
      cellForItemAt: ({ item }) =>
        createElement(
          UICollectionViewCell,
          null,
          createElement('span', { style: { fontWeight: 600 } }, `Item ${item + 1}`)
        ),
    }),
    []
  );

  const delegate = useMemo<UICollectionViewDelegate>(
    () => ({
      didSelectItemAt: (indexPath) => appendLog(`didSelectItemAt(${formatIndexPath(indexPath)})`),
    }),
    [appendLog]
  );

  return createElement(
    'div',
    { style: containerStyle },
    createElement(
      'button',
      {
        type: 'button',
        style: { alignSelf: 'flex-start' },
        onClick: () => setIsViewVisible((current) => !current),
      },
      isViewVisible ? 'Hide view' : 'Show view'
    ),
    createElement(
      UIViewController,
      {
        ...props,
        isViewVisible,
        animated,
        viewDidLoad: () => appendLog('viewDidLoad()'),
        viewWillAppear: (isAnimated: boolean) => appendLog(`viewWillAppear(${isAnimated})`),
        viewDidAppear: (isAnimated: boolean) => appendLog(`viewDidAppear(${isAnimated})`),
        viewWillDisappear: (isAnimated: boolean) => appendLog(`viewWillDisappear(${isAnimated})`),
        viewDidDisappear: (isAnimated: boolean) => appendLog(`viewDidDisappear(${isAnimated})`),
        viewWillLayoutSubviews: () => appendLog('viewWillLayoutSubviews()'),
        viewDidLayoutSubviews: () => appendLog('viewDidLayoutSubviews()'),
      },
      createElement(ViewControllerState),
      createElement(UICollectionView, {
        dataSource,
        delegate,
        collectionViewLayout,
        style: { height: 240 },
      })
    ),
    createElement(
      'div',
      null,
      createElement('strong', null, 'lifecycle calls'),
      createElement('pre', { style: panelStyle }, log.length > 0 ? log.join('\n') : 'no calls yet')
    )
  );
}

const meta: Meta<UIViewControllerProps> = {
  title: 'UIKit/UIViewController',
  component: UIViewController,
  parameters: { layout: 'padded' },
  args: {
    title: 'Collection',
    isViewVisible: true,
    animated: true,
  },
  argTypes: {
    title: { control: 'text' },
    isViewVisible: { control: 'boolean' },
    animated: { control: 'boolean' },
    viewDidLoad: { table: { disable: true } },
    viewWillAppear: { table: { disable: true } },
    viewDidAppear: { table: { disable: true } },
    viewWillDisappear: { table: { disable: true } },
    viewDidDisappear: { table: { disable: true } },
    viewWillLayoutSubviews: { table: { disable: true } },
    viewDidLayoutSubviews: { table: { disable: true } },
  },
  render: (args) => createElement(UIViewControllerStory, args),
};

export default meta;

type Story = StoryObj<UIViewControllerProps>;

export const Default: Story = {};

export const WithoutAnimation: Story = {
  args: { animated: false },
};

export const Hidden: Story = {
  args: { isViewVisible: false },
};
