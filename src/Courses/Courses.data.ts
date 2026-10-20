import type { CSSProperties } from 'react';

export interface CourseSection {
  id: string;
  title: string;
  caption: string;
  progress: number;
}

export interface Course {
  id: string;
  title: string;
  caption: string;
  description: string;
  author: string;
  colors: readonly [string, string, string];
  sections: CourseSection[];
}

export const courses: Course[] = [
  {
    id: 'swiftui-ios-15',
    title: 'SwiftUI for iOS 15',
    caption: '20 sections · 3 hours',
    description:
      'Build an iOS app for iOS 15 with custom layouts, animations and a rich set of interactions.',
    author: 'Taught by Meng To',
    colors: ['#7b2ff7', '#f107a3', '#2b1055'],
    sections: [
      {
        id: 'layout',
        title: 'Advanced Custom Layout',
        caption: 'Section 1 · 14 min',
        progress: 0.8,
      },
      { id: 'home', title: 'Coding the Home View', caption: 'Section 2 · 22 min', progress: 0.45 },
      { id: 'styles', title: 'Styled Components', caption: 'Section 3 · 18 min', progress: 0.2 },
      {
        id: 'interactions',
        title: 'Flutter Interactions',
        caption: 'Section 4 · 25 min',
        progress: 0,
      },
    ],
  },
  {
    id: 'react-hooks-advanced',
    title: 'React Hooks Advanced',
    caption: '12 sections · 2 hours',
    description:
      'Learn how to compose state, effects and context into reusable hooks for production React apps.',
    author: 'Taught by Stephanie Diep',
    colors: ['#0061ff', '#60efff', '#14213d'],
    sections: [
      { id: 'state', title: 'State and Reducers', caption: 'Section 1 · 16 min', progress: 1 },
      { id: 'effects', title: 'Effects in Depth', caption: 'Section 2 · 20 min', progress: 0.6 },
      { id: 'context', title: 'Context Patterns', caption: 'Section 3 · 19 min', progress: 0.1 },
    ],
  },
  {
    id: 'flutter-designers',
    title: 'Flutter for Designers',
    caption: '18 sections · 4 hours',
    description:
      'Turn your designs into native-feeling apps with Flutter widgets, layouts and motion.',
    author: 'Taught by Sai Kambampati',
    colors: ['#ff6a00', '#ee0979', '#3a0ca3'],
    sections: [
      { id: 'widgets', title: 'Widgets Basics', caption: 'Section 1 · 12 min', progress: 0.3 },
      { id: 'layouts', title: 'Responsive Layouts', caption: 'Section 2 · 24 min', progress: 0 },
      { id: 'motion', title: 'Motion and Gestures', caption: 'Section 3 · 21 min', progress: 0 },
    ],
  },
  {
    id: 'ui-design-ios',
    title: 'UI Design for iOS',
    caption: '16 sections · 3 hours',
    description:
      'Design beautiful interfaces that follow the Human Interface Guidelines from wireframe to handoff.',
    author: 'Taught by Meng To',
    colors: ['#00c9a7', '#845ec2', '#0b132b'],
    sections: [
      { id: 'grid', title: 'Grids and Spacing', caption: 'Section 1 · 10 min', progress: 0.9 },
      { id: 'type', title: 'Typography', caption: 'Section 2 · 15 min', progress: 0.5 },
      { id: 'color', title: 'Color and Materials', caption: 'Section 3 · 17 min', progress: 0 },
    ],
  },
  {
    id: 'animated-app',
    title: 'Build an Animated App',
    caption: '10 sections · 2 hours',
    description: 'Combine springs, matched geometry and gestures into a fluid app experience.',
    author: 'Taught by Willie Yam',
    colors: ['#f72585', '#7209b7', '#10002b'],
    sections: [
      { id: 'springs', title: 'Spring Animations', caption: 'Section 1 · 13 min', progress: 0.7 },
      { id: 'matched', title: 'Matched Geometry', caption: 'Section 2 · 18 min', progress: 0.25 },
      { id: 'gestures', title: 'Gestures', caption: 'Section 3 · 20 min', progress: 0 },
    ],
  },
  {
    id: 'advanced-custom-layout',
    title: 'Advanced Custom Layout',
    caption: '8 sections · 1 hour',
    description:
      'Create adaptive grids and custom layout containers that respond to any screen size.',
    author: 'Taught by Meng To',
    colors: ['#4cc9f0', '#4361ee', '#0b1026'],
    sections: [
      { id: 'protocol', title: 'Layout Protocol', caption: 'Section 1 · 11 min', progress: 0.4 },
      { id: 'adaptive', title: 'Adaptive Grids', caption: 'Section 2 · 16 min', progress: 0 },
    ],
  },
];

export function courseColorStyle(course: Course): CSSProperties {
  return {
    '--course-color-1': course.colors[0],
    '--course-color-2': course.colors[1],
    '--course-color-3': course.colors[2],
  } as CSSProperties;
}
