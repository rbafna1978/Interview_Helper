'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PageContainerProps = {
  className?: string;
  children?: React.ReactNode;
};

export function PageContainer({ className, children }: PageContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn('mx-auto w-full max-w-6xl px-4 py-8', className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? undefined : { duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
