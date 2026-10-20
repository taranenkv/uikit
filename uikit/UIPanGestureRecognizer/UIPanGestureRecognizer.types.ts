import type { HTMLAttributes, ReactNode } from 'react';
import type { CGPoint } from '../UICollectionViewLayout/UICollectionViewLayout.types';

export type UIGestureRecognizerState =
  'possible' | 'began' | 'changed' | 'ended' | 'cancelled' | 'failed';

export interface UIPanGestureRecognizer {
  readonly state: UIGestureRecognizerState;
  readonly view: HTMLElement | null;
  readonly isEnabled: boolean;
  readonly numberOfTouches: number;
  translation: () => CGPoint;
  setTranslation: (translation: CGPoint) => void;
  velocity: () => CGPoint;
  location: () => CGPoint;
}

export interface UIGestureRecognizerDelegate {
  gestureRecognizerShouldBegin?: (gestureRecognizer: UIPanGestureRecognizer) => boolean;
}

export type UIPanGestureRecognizerAction = (gestureRecognizer: UIPanGestureRecognizer) => void;

export interface UIPanGestureRecognizerContextValue {
  state: UIGestureRecognizerState;
  gestureRecognizer: UIPanGestureRecognizer;
}

export interface UIPanGestureRecognizerProps extends HTMLAttributes<HTMLDivElement> {
  action?: UIPanGestureRecognizerAction;
  delegate?: UIGestureRecognizerDelegate;
  isEnabled?: boolean;
  cancelsTouchesInView?: boolean;
  children?: ReactNode;
}

export interface UIPanGestureRecognizerSample {
  point: CGPoint;
  timestamp: number;
}

export interface UIPanGestureRecognizerTracking {
  pointerId: number;
  origin: CGPoint;
  translationOffset: CGPoint;
  samples: UIPanGestureRecognizerSample[];
}
