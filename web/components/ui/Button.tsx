'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  asChild?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[color:var(--accent)] !text-[color:var(--accent-contrast)] hover:opacity-90 focus-visible:ring-[color:var(--accent)] disabled:opacity-50',
  secondary:
    'border border-[color:var(--border)] bg-[color:var(--surface)] !text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]',
  ghost: '!text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]',
  danger:
    'bg-[color:var(--danger)] !text-white hover:opacity-90 focus-visible:ring-[color:var(--danger)] disabled:opacity-50',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', type = 'button', asChild = false, children, ...props },
  ref
) {
  const shouldReduceMotion = useReducedMotion();
  const isDisabled = Boolean(props.disabled);
  const buttonClasses = cn(
    'inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] disabled:cursor-not-allowed active:scale-[0.98]',
    variantClasses[variant],
    className
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(buttonClasses, child.props.className),
    });
  }

  return (
    <motion.span
      className="inline-block"
      whileHover={shouldReduceMotion || isDisabled ? undefined : { y: -1 }}
      whileTap={shouldReduceMotion || isDisabled ? undefined : { scale: 0.98 }}
    >
      <button ref={ref} type={type} className={buttonClasses} {...props}>
        {children}
      </button>
    </motion.span>
  );
});
