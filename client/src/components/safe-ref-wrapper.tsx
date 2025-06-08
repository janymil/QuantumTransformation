import { useRef, useEffect, forwardRef } from 'react';

interface SafeRefWrapperProps {
  children: React.ReactNode;
  className?: string;
  onMount?: (element: HTMLDivElement) => void;
}

export const SafeRefWrapper = forwardRef<HTMLDivElement, SafeRefWrapperProps>(
  ({ children, className, onMount }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (internalRef.current && onMount) {
        onMount(internalRef.current);
      }
    }, [onMount]);

    return (
      <div 
        ref={(el) => {
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref && 'current' in ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
          if (internalRef.current !== el) {
            internalRef.current = el;
          }
        }}
        className={className}
      >
        {children}
      </div>
    );
  }
);

SafeRefWrapper.displayName = 'SafeRefWrapper';