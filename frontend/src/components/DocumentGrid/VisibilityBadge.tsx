import clsx from 'clsx';

import { visibilityLabel } from './hooks';
import type { Visibility } from './types';
import styles from './DocumentGrid.module.css';

export interface VisibilityBadgeProps {
  visibility: Visibility;
}

const VisibilityBadge = ({ visibility }: VisibilityBadgeProps) => (
  <span className={clsx(styles.badge, styles[`visibility_${visibility}`])}>
    {visibilityLabel[visibility]}
  </span>
);

export default VisibilityBadge;
