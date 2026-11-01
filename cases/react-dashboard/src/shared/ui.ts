import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva } from 'class-variance-authority';

export const cn = (...values: ClassValue[]) => twMerge(clsx(values));
export const button = cva('rounded-md px-3 py-2 text-sm font-medium', {
  variants: {
    intent: {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
      secondary: 'border border-slate-300 bg-white hover:bg-slate-50',
    },
  },
  defaultVariants: { intent: 'secondary' },
});
