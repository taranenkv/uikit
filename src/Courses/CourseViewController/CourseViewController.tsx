import { useRef } from 'react';
import { UIPanGestureRecognizer } from '../../../uikit/UIPanGestureRecognizer/UIPanGestureRecognizer';
import { UIViewController } from '../../../uikit/UIViewController/UIViewController';
import { useUIViewControllerContext } from '../../../uikit/UIViewController/UIViewController.context';
import { UIViewControllerTransitioningDelegate } from '../../../uikit/UIViewControllerTransitioningDelegate/UIViewControllerTransitioningDelegate';
import type {
  UIGestureRecognizerDelegate,
  UIPanGestureRecognizer as UIPanGestureRecognizerProtocol,
} from '../../../uikit/UIPanGestureRecognizer/UIPanGestureRecognizer.types';
import {
  COURSE_TRANSITION_CONTENT_ATTRIBUTE,
  COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE,
  courseTransitionIdentifier,
  type CourseZoomTransition,
} from '../CourseZoomTransition/CourseZoomTransition';
import { courseColorStyle, type Course } from '../Courses.data';
import styles from './CourseViewController.module.css';

const DISMISSAL_DISTANCE_FACTOR = 0.6;
const DISMISSAL_PERCENT_THRESHOLD = 0.3;
const DISMISSAL_VELOCITY_THRESHOLD = 600;

const MatchedTransitionSource = UIViewControllerTransitioningDelegate.MatchedTransitionSource;

interface CourseViewControllerProps {
  course: Course;
  transition: CourseZoomTransition;
}

interface CourseArtworkProps {
  course: Course;
}

export function CourseArtwork({ course }: CourseArtworkProps) {
  return (
    <div className={styles.artwork} style={courseColorStyle(course)} aria-hidden='true'>
      <span className={styles.artworkOrb} />
      <span className={styles.artworkOrb} />
      <span className={styles.artworkOrb} />
      <span className={styles.artworkRing} />
    </div>
  );
}

function CourseContent({ course, transition }: CourseViewControllerProps) {
  const { appearanceState, dismiss } = useUIViewControllerContext();
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const interactionController = transition.interactionController;

  const gestureDelegate: UIGestureRecognizerDelegate = {
    gestureRecognizerShouldBegin: (gestureRecognizer) => {
      const translation = gestureRecognizer.translation();
      const scrollTop = scrollViewRef.current?.scrollTop ?? 0;

      return (
        appearanceState === 'appeared' &&
        scrollTop <= 0 &&
        translation.y > 0 &&
        translation.y > Math.abs(translation.x)
      );
    },
  };

  const handlePan = (gestureRecognizer: UIPanGestureRecognizerProtocol) => {
    const height = gestureRecognizer.view?.clientHeight || window.innerHeight;
    const percentComplete =
      gestureRecognizer.translation().y / (height * DISMISSAL_DISTANCE_FACTOR);

    switch (gestureRecognizer.state) {
      case 'began':
        transition.beginInteractiveDismissal();
        dismiss(true);
        break;
      case 'changed':
        interactionController.update(percentComplete);
        break;
      case 'ended':
        if (
          percentComplete > DISMISSAL_PERCENT_THRESHOLD ||
          gestureRecognizer.velocity().y > DISMISSAL_VELOCITY_THRESHOLD
        ) {
          interactionController.finish();
        } else {
          interactionController.cancel();
        }

        transition.endInteractiveDismissal();
        break;
      case 'cancelled':
        interactionController.cancel();
        transition.endInteractiveDismissal();
        break;
      default:
        break;
    }
  };

  const contentProps = { [COURSE_TRANSITION_CONTENT_ATTRIBUTE]: '' };
  const scrollViewProps = { [COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE]: '' };

  return (
    <>
      <UIPanGestureRecognizer
        className={styles.panGestureRecognizer}
        action={handlePan}
        delegate={gestureDelegate}>
        <div ref={scrollViewRef} className={styles.scrollView} {...scrollViewProps}>
          <MatchedTransitionSource
            identifier={courseTransitionIdentifier(course.id, 'card')}
            className={styles.header}
            style={courseColorStyle(course)}>
            <MatchedTransitionSource
              identifier={courseTransitionIdentifier(course.id, 'artwork')}
              className={styles.headerArtwork}>
              <CourseArtwork course={course} />
            </MatchedTransitionSource>
            <div className={styles.headerText}>
              <MatchedTransitionSource identifier={courseTransitionIdentifier(course.id, 'title')}>
                <h1 className={styles.headerTitle}>{course.title}</h1>
              </MatchedTransitionSource>
              <MatchedTransitionSource
                identifier={courseTransitionIdentifier(course.id, 'caption')}
                className={styles.headerCaption}>
                {course.caption}
              </MatchedTransitionSource>
            </div>
          </MatchedTransitionSource>
          <div className={styles.content} style={courseColorStyle(course)} {...contentProps}>
            <p className={styles.description}>{course.description}</p>
            <span className={styles.author}>{course.author}</span>
            <ul className={styles.sections}>
              {course.sections.map((section) => (
                <li key={section.id} className={styles.section}>
                  <span className={styles.sectionCaption}>{section.caption}</span>
                  <span className={styles.sectionTitle}>{section.title}</span>
                  <div
                    className={styles.progress}
                    role='progressbar'
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(section.progress * 100)}>
                    <div
                      className={styles.progressValue}
                      style={{ width: `${section.progress * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </UIPanGestureRecognizer>
      <button
        type='button'
        className={styles.closeButton}
        aria-label='Close'
        onClick={() => dismiss(true)}
        {...contentProps}>
        ×
      </button>
    </>
  );
}

export function CourseViewController({ course, transition }: CourseViewControllerProps) {
  return (
    <UIViewController
      title={course.title}
      modalPresentationStyle='custom'
      className={styles.courseViewController}>
      <CourseContent course={course} transition={transition} />
    </UIViewController>
  );
}
