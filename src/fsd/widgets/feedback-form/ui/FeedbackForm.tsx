'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {Check, Loader2} from 'lucide-react';
import {gsap, pickSiteText, registerGsap, type SiteTextsMap} from '@/src/fsd/shared/lib';
import styles from './FeedbackForm.module.css';

type Props = {
  siteTexts?: SiteTextsMap;
  className?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FeedbackForm({siteTexts = {}, className}: Props) {
  const feedbackTitle = pickSiteText(siteTexts, 'home.feedback_title', 'Обратная связь');
  const agreementText = pickSiteText(
    siteTexts,
    'home.agreement_text',
    'Настоящим подтверждаю, что я ознакомлен и согласен с условиями',
  );
  const sectionRef = useRef<HTMLElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Введите корректный email');
      return;
    }

    if (!agreed) {
      setError('Подтвердите согласие с офертой и политикой конфиденциальности');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, message}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить сообщение');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      setAgreed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section ref={sectionRef} className={`${styles.feedback} ${className || ''}`}>
      <h2 className={styles.feedbackTitle}>{feedbackTitle}</h2>
      {success ? (
        <p className={styles.successMessage}>
          Спасибо! Ваше сообщение отправлено, мы ответим вам на почту в ближайшее время.
        </p>
      ) : (
        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Имя*"
              className={styles.field}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              type="email"
              placeholder="Ваша почта*"
              className={styles.field}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <textarea
            placeholder="Ваш вопрос, отзыв или пожелание*"
            rows={4}
            className={styles.message}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <label className={styles.agreement}>
            <div className={styles.checkboxBox}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
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
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? (
              <>
                <Loader2 className={styles.spinner} />
                Отправляем...
              </>
            ) : (
              'Отправить'
            )}
          </button>
        </form>
      )}
    </section>
  );
}
