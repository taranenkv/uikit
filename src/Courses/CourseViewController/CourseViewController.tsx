import { useState } from 'react';
import gsap from 'gsap';
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
  COURSE_TRANSITION_INTERACTIVE_VIEW_ATTRIBUTE,
  COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE,
  courseTransitionIdentifier,
} from '../CourseZoomTransition/CourseZoomTransition';
import { COURSE_CARD_ASPECT_RATIO, courseColorStyle, type Course } from '../Courses.data';
import styles from './CourseViewController.module.css';

const INTERACTIVE_DISMISSAL_DISTANCE = 320;
const MAXIMUM_SCALE_REDUCTION = 0.2;
const INTERACTIVE_CORNER_RADIUS = 30;
const DISMISSAL_PROGRESS_THRESHOLD = 0.35;
const DISMISSAL_VELOCITY_THRESHOLD = 700;
const RESTORATION_DURATION = 0.45;

const MatchedTransitionSource = UIViewControllerTransitioningDelegate.MatchedTransitionSource;

interface CourseViewControllerProps {
  course: Course;
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

function CourseContent({ course }: CourseViewControllerProps) {
  const { appearanceState, dismiss } = useUIViewControllerContext();
  const [interactiveView, setInteractiveView] = useState<HTMLDivElement | null>(null);
  const [scrollView, setScrollView] = useState<HTMLDivElement | null>(null);

  const gestureDelegate: UIGestureRecognizerDelegate = {
    gestureRecognizerShouldBegin: (gestureRecognizer) => {
      const translation = gestureRecognizer.translation();
      const scrollTop = scrollView?.scrollTop ?? 0;

      return (
        appearanceState === 'appeared' &&
        scrollTop <= 0 &&
        translation.y > 0 &&
        translation.y >= Math.abs(translation.x)
      );
    },
  };

  const restoreInteractiveView = () => {
    gsap.to(interactiveView, {
      scale: 1,
      borderRadius: 0,
      duration: RESTORATION_DURATION,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const handlePan = (gestureRecognizer: UIPanGestureRecognizerProtocol) => {
    const progress = Math.min(
      Math.max(gestureRecognizer.translation().y / INTERACTIVE_DISMISSAL_DISTANCE, 0),
      1
    );

    switch (gestureRecognizer.state) {
      case 'began':
      case 'changed':
        gsap.set(interactiveView, {
          scale: 1 - MAXIMUM_SCALE_REDUCTION * progress,
          borderRadius: INTERACTIVE_CORNER_RADIUS * Math.min(progress * 4, 1),
          overwrite: 'auto',
        });
        break;
      case 'ended':
        if (
          progress > DISMISSAL_PROGRESS_THRESHOLD ||
          gestureRecognizer.velocity().y > DISMISSAL_VELOCITY_THRESHOLD
        ) {
          dismiss(true);
        } else {
          restoreInteractiveView();
        }
        break;
      case 'cancelled':
        restoreInteractiveView();
        break;
      default:
        break;
    }
  };

  const contentProps = { [COURSE_TRANSITION_CONTENT_ATTRIBUTE]: '' };
  const scrollViewProps = { [COURSE_TRANSITION_SCROLL_VIEW_ATTRIBUTE]: '' };
  const interactiveViewProps = { [COURSE_TRANSITION_INTERACTIVE_VIEW_ATTRIBUTE]: '' };

  return (
    <div ref={setInteractiveView} className={styles.interactiveView} {...interactiveViewProps}>
      <UIPanGestureRecognizer
        className={styles.panGestureRecognizer}
        action={handlePan}
        delegate={gestureDelegate}>
        <div ref={setScrollView} className={styles.scrollView} {...scrollViewProps}>
          <MatchedTransitionSource
            identifier={courseTransitionIdentifier(course.id, 'card')}
            className={styles.header}
            style={{
              ...courseColorStyle(course),
              aspectRatio: `1 / ${COURSE_CARD_ASPECT_RATIO}`,
            }}>
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
    </div>
  );
}

export function CourseViewController({ course }: CourseViewControllerProps) {
  return (
    <UIViewController
      title={course.title}
      modalPresentationStyle='custom'
      className={styles.courseViewController}>
      <CourseContent course={course} />
    </UIViewController>
  );
}
