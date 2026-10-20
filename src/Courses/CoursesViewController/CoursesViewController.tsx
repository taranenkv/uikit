import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UICollectionView } from '../../../uikit/UICollectionView/UICollectionView';
import { UICollectionViewCell } from '../../../uikit/UICollectionViewCell/UICollectionViewCell';
import { UIViewController } from '../../../uikit/UIViewController/UIViewController';
import { useUIViewControllerContext } from '../../../uikit/UIViewController/UIViewController.context';
import { useUIViewControllerTransitionCoordinator } from '../../../uikit/UIViewControllerTransitionCoordinator/UIViewControllerTransitionCoordinator.context';
import { UIViewControllerTransitioningDelegate } from '../../../uikit/UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate';
import type { UICollectionViewRef } from '../../../uikit/UICollectionView/UICollectionView.types';
import type { UICollectionViewDataSource } from '../../../uikit/UICollectionViewDataSource/UICollectionViewDataSource.types';
import type { UICollectionViewDelegate } from '../../../uikit/UICollectionViewDelegate/UICollectionViewDelegate.types';
import type { UICollectionViewFlowLayoutConfiguration } from '../../../uikit/UICollectionViewLayout/UICollectionViewLayout.types';
import { CourseArtwork, CourseViewController } from '../CourseViewController/CourseViewController';
import {
  CourseZoomTransition,
  courseTransitionIdentifier,
} from '../CourseZoomTransition/CourseZoomTransition';
import { courseColorStyle, courses, type Course } from '../Courses.data';
import styles from './CoursesViewController.module.css';

const HORIZONTAL_INSET = 20;
const MAXIMUM_CARD_WIDTH = 440;
const CARD_HEIGHT = 400;
const TAB_BAR_CLEARANCE = 112;
const TAB_BAR_ITEMS = ['Learn Now', 'Explore', 'Notifications', 'Library'];

const MatchedTransitionSource = UIViewControllerTransitioningDelegate.MatchedTransitionSource;

interface CourseCellProps {
  course: Course;
}

interface CoursesContentProps {
  transition: CourseZoomTransition;
}

function CourseCell({ course }: CourseCellProps) {
  return (
    <UICollectionViewCell
      className={styles.cell}
      reuseIdentifier='CourseCell'
      aria-label={course.title}>
      <MatchedTransitionSource
        identifier={courseTransitionIdentifier(course.id, 'card')}
        className={styles.card}
        style={courseColorStyle(course)}>
        <MatchedTransitionSource
          identifier={courseTransitionIdentifier(course.id, 'artwork')}
          className={styles.cardArtwork}>
          <CourseArtwork course={course} />
        </MatchedTransitionSource>
        <div className={styles.cardText}>
          <MatchedTransitionSource identifier={courseTransitionIdentifier(course.id, 'title')}>
            <h2 className={styles.cardTitle}>{course.title}</h2>
          </MatchedTransitionSource>
          <MatchedTransitionSource
            identifier={courseTransitionIdentifier(course.id, 'caption')}
            className={styles.cardCaption}>
            {course.caption}
          </MatchedTransitionSource>
        </div>
      </MatchedTransitionSource>
    </UICollectionViewCell>
  );
}

function TabBar() {
  const tabBarRef = useRef<HTMLElement>(null);
  const transitionCoordinator = useUIViewControllerTransitionCoordinator();

  useEffect(() => {
    const tabBar = tabBarRef.current;

    if (!tabBar || !transitionCoordinator) {
      return;
    }

    transitionCoordinator.animateAlongsideTransition((animations, context) => {
      animations.to(tabBar, { yPercent: context.isPresenting ? 160 : 0 });
    });
  }, [transitionCoordinator]);

  return (
    <nav ref={tabBarRef} className={styles.tabBar} aria-label='Tab bar'>
      {TAB_BAR_ITEMS.map((item, index) => (
        <span
          key={item}
          className={styles.tabBarItem}
          aria-current={index === 0 ? 'page' : undefined}>
          <span className={styles.tabBarIcon} />
          {item}
        </span>
      ))}
    </nav>
  );
}

function CoursesContent({ transition }: CoursesContentProps) {
  const { present } = useUIViewControllerContext();
  const screenRef = useRef<HTMLDivElement>(null);
  const collectionViewRef = useRef<UICollectionViewRef>(null);
  const [screenWidth, setScreenWidth] = useState(390);

  useLayoutEffect(() => {
    const screen = screenRef.current;

    if (!screen) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      setScreenWidth(entry.contentRect.width);
    });

    observer.observe(screen);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    transition.attachCollectionView(() => collectionViewRef.current);
  }, [transition]);

  const collectionViewLayout = useMemo<UICollectionViewFlowLayoutConfiguration>(
    () => ({
      scrollDirection: 'vertical',
      itemSize: {
        width: Math.min(screenWidth - HORIZONTAL_INSET * 2, MAXIMUM_CARD_WIDTH),
        height: CARD_HEIGHT,
      },
      minimumLineSpacing: 20,
      minimumInteritemSpacing: 20,
      sectionInset: {
        top: 8,
        left: HORIZONTAL_INSET,
        bottom: TAB_BAR_CLEARANCE,
        right: HORIZONTAL_INSET,
      },
    }),
    [screenWidth]
  );

  const dataSource = useMemo<UICollectionViewDataSource>(
    () => ({
      numberOfItemsInSection: () => courses.length,
      cellForItemAt: ({ item }) => <CourseCell course={courses[item]} />,
    }),
    []
  );

  const delegate = useMemo<UICollectionViewDelegate>(
    () => ({
      didSelectItemAt: (indexPath) => {
        const course = courses[indexPath.item];

        collectionViewRef.current?.deselectItemAt(indexPath);
        transition.prepare({ course, indexPath });
        present(<CourseViewController course={course} transition={transition} />, true);
      },
    }),
    [present, transition]
  );

  return (
    <div ref={screenRef} className={styles.screen}>
      <header className={styles.navigationBar}>
        <h1 className={styles.largeTitle}>Featured</h1>
        <span className={styles.avatar} aria-hidden='true' />
      </header>
      <UICollectionView
        ref={collectionViewRef}
        className={styles.collectionView}
        dataSource={dataSource}
        delegate={delegate}
        collectionViewLayout={collectionViewLayout}
      />
      <TabBar />
    </div>
  );
}

export function CoursesViewController() {
  const [transition] = useState(() => new CourseZoomTransition());

  return (
    <UIViewControllerTransitioningDelegate transitioningDelegate={transition}>
      <UIViewController title='Courses' className={styles.coursesViewController}>
        <CoursesContent transition={transition} />
      </UIViewController>
    </UIViewControllerTransitioningDelegate>
  );
}
