import { useApp } from '../app-context';
import { href } from '../router';
import { Icon } from '../components/Icons';

const N = 9;

export default function Help() {
  const { t } = useApp();
  return (
    <section className="page help">
      <h1 className="page-title">{t('help_title')}</h1>
      <p className="page-lead">{t('help_lead')}</p>
      <div className="faq">
        {Array.from({ length: N }, (_, i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>{t(`help_q${i + 1}`)}</summary>
            <p>{t(`help_a${i + 1}`)}</p>
          </details>
        ))}
      </div>
      <a className="btn" href={href('me')}>
        {t('open_my_cabinet')} <Icon name="arrow" size={18} />
      </a>
    </section>
  );
}
