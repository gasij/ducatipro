'use client';

import {useEffect, useRef} from 'react';
import Link from 'next/link';
import {Check} from 'lucide-react';
import {gsap, pickSiteText, registerGsap, type SiteTextsMap} from '@/src/fsd/shared/lib';
import styles from './FeedbackForm.module.css';

type Props = {
  siteTexts?: SiteTextsMap;
  className?: string;
};

export default function FeedbackForm({siteTexts = {}, className}: Props) {
  const feedbackTitle = pickSiteText(siteTexts, 'home.feedback_title', 'Обратная связь');
  const agreementText = pickSiteText(
    siteTexts,
    'home.agreement_text',
    'Настоящим подтверждаю, что я ознакомлен и согласен с условиями',
  );
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !sectionRef.current) {
      return;
    }

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.contactForm} > *`, {
        y: 18,
        opacity: 0,
        duration: 0.48,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {trigger: sectionRef.current, start: 'top 85%', once: true},
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.feedback} ${className || ''}`}>
      <h2 className={styles.feedbackTitle}>{feedbackTitle}</h2>
      <form className={styles.contactForm}>
        <div className={styles.formRow}>
          <input type="text" placeholder="Имя*" className={styles.field} />
          <input type="email" placeholder="Ваша почта*" className={styles.field} />
        </div>
        <textarea placeholder="Ваш вопрос, отзыв или пожелание*" rows={4} className={styles.message} />
        <label className={styles.agreement}>
          <div className={styles.checkboxBox}>
            <input type="checkbox" className={styles.checkbox} />
            <Check className={styles.checkboxIcon} />
          </div>
          <span className={styles.agreementText}>
            {agreementText}{' '}
            <Link href="/offer" className={styles.agreementLink}>
              оферты и политики конфиденциальности
            </Link>{' '}
            *
          </span>
        </label>
        <button type="button" className={styles.submitButton}>
          Отправить
        </button>
      </form>
    </section>
  );
}
