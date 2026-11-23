import { useApp } from '../app-context';
import { href } from '../router';
import { Star } from '../components/Doodles';

export default function NotFound() {
  const { t } = useApp();
  return (
    <section className="page not-found">
      <Star size={72} />
      <h1 className="page-title">{t('nf_title')}</h1>
      <p className="page-lead">{t('nf_text')}</p>
      <a className="btn" href={href()}>{t('nf_home')}</a>
    </section>
  );
}
