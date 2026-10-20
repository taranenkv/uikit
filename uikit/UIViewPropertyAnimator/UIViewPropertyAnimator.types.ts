import type { CGPoint } from '../UICollectionViewLayout/UICollectionViewLayout.types';

export interface CGVector {
  dx: number;
  dy: number;
}

export type UIViewAnimatingState = 'inactive' | 'active' | 'stopped';

export type UIViewAnimatingPosition = 'end' | 'start' | 'current';

export type UIViewAnimationCurve = 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';

export type UITimingCurveType = 'builtin' | 'cubic' | 'spring';

export type UITimingFunction = (progress: number) => number;

export interface UITimingCurveProvider {
  readonly timingCurveType: UITimingCurveType;
  readonly settlingDuration?: number;
  makeTimingFunction: (duration: number) => UITimingFunction;
}

export interface UISpringTimingParametersPerceptualConfiguration {
  duration: number;
  bounce?: number;
  initialVelocity?: CGVector;
}

export interface UISpringTimingParametersPhysicalConfiguration {
  mass: number;
  stiffness: number;
  damping: number;
  initialVelocity?: CGVector;
}

export type UISpringTimingParametersConfiguration =
  UISpringTimingParametersPerceptualConfiguration | UISpringTimingParametersPhysicalConfiguration;

export type UISpringPosition = (time: number) => number;

export interface UICubicControlPoints {
  controlPoint1: CGPoint;
  controlPoint2: CGPoint;
}

export interface UIViewPropertyAnimatorAnimations {
  to: (targets: gsap.TweenTarget, vars: gsap.TweenVars) => void;
  fromTo: (targets: gsap.TweenTarget, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => void;
  set: (targets: gsap.TweenTarget, vars: gsap.TweenVars) => void;
}

export type UIViewPropertyAnimatorAnimationsBlock = (
  animations: UIViewPropertyAnimatorAnimations
) => void;

export type UIViewPropertyAnimatorCompletion = (finalPosition: UIViewAnimatingPosition) => void;
