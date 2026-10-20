import type {
  CGPoint,
  IndexPath,
  UIEdgeInsets,
} from '../../../uikit/UICollectionViewLayout/UICollectionViewLayout.types';
import type { UICollectionViewRef } from '../../../uikit/UICollectionView/UICollectionView.types';
import type { Course } from '../Courses.data';

export type CourseTransitionElement = 'card' | 'artwork' | 'title' | 'caption';

export type CourseZoomScaleReference = 'width' | 'fontSize';

export interface CourseZoomMatchedElement {
  element: Exclude<CourseTransitionElement, 'card'>;
  scaleReference: CourseZoomScaleReference;
}

export interface CourseZoomGeometry {
  scale: number;
  translation: CGPoint;
  clipInsets: UIEdgeInsets;
  cornerRadius: number;
}

export interface CourseZoomTransitionSource {
  course: Course;
  indexPath: IndexPath;
}

export type CourseZoomCollectionViewProvider = () => UICollectionViewRef | null;
