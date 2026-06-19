'use client';

import {useEffect, useRef, type ReactNode} from 'react';
import {gsap, registerGsap, ScrollTrigger} from '@/src/fsd/shared/lib';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
  as?: 'div' | 'section';
};

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 48,
  duration = 0.8,
  stagger = 0,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const targets = stagger > 0 ? el.children : el;

    gsap.fromTo(
      targets,
      {opacity: 0, y},
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      },
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [delay, y, duration, stagger]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
