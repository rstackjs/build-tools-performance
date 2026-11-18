import { clsx, type ClassValue } from 'clsx';
import { cva } from 'class-variance-authority';
import styles from './ui.module.css';

export const cn = (...values: ClassValue[]) => clsx(values);
export const button = cva(styles.button, {
  variants: {
    intent: {
      primary: styles.primary,
      secondary: styles.secondary,
    },
  },
  defaultVariants: { intent: 'secondary' },
});
