import { useApp } from '../app-context';
import { sampleFor } from '../samples';
import { asset } from '../people';
import { Avatar } from './Avatar';
import { Flag } from './Flag';
import { Icon } from './Icons';
import { FUN_FIELDS } from '../config';

const SECTIONS = ['dream', 'memory', 'quote', 'jpWord', 'message', 'wish', 'contact'];

/**
 * One yearbook page. `data` is what the person wrote (or their draft).
 * With `examples`, empty fields show a clearly marked example instead of nothing.
 */
export function Sheet({ p, data, examples = false, onPhoto, bare = false }) {
  const { t, lang, country } = useApp();
  const sample = sampleFor(p.id, lang);

  const read = (key) => {
    const v = (data[key] || '').trim();
    if (v) return { text: v, ex: false };
    return examples ? { text: sample[key], ex: true } : null;
  };
  const nickname = read('nickname');
  const role = read('role');
  const photos = data.photos || [];
  const hasBody = SECTIONS.some((k) => read(k));
  const facts = FUN_FIELDS.map((f) => ({ ...f, v: read(f.key) })).filter((f) => f.v);
  const factText = (f) => {
    if (f.key !== 'birthday') return f.v.text;
    const d = new Date(`${f.v.text}T12:00:00`);
    return Number.isNaN(d.getTime()) ? f.v.text : new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(d);
  };

  return (
    <article className={`sheet ${bare ? 'bare' : ''}`}>
      {!bare && (
      <header className="sheet-head">
        <div className="portrait">
          <span className="tape" aria-hidden="true" />
          <Avatar p={{ ...p, avatar: data.avatar || null }} full />
          {p.filled && <span className="hanko" title={t('filled_stamp')}>済</span>}
        </div>
        <div className="sheet-id">
          <p className="sheet-class">
            <Flag code={p.country} /> {country(p.country)}
          </p>
          <h1 className="sheet-name">{p.name}</h1>
          {nickname && (
            <p className={`sheet-nick ${nickname.ex ? 'ex' : ''}`}>
              “{nickname.text}”{nickname.ex && <span className="ex-tag">{t('example')}</span>}
            </p>
          )}
          {role && (
            <p className={`nametag ${role.ex ? 'ex' : ''}`}>
              {role.text}
              {role.ex && <span className="ex-tag">{t('example')}</span>}
            </p>
          )}
        </div>
      </header>
      )}

      {facts.length > 0 && (
        <ul className="facts" aria-label={t('sec_fun')}>
          {facts.map((f, i) => (
            <li key={f.key} className={`fact ${f.v.ex ? 'ex' : ''}`} style={{ '--n': i }} title={t(`f_${f.key}`)}>
              <span className="fact-emoji" aria-hidden="true">{f.emoji}</span>
              <span className="fact-body">
                <small>{t(`f_${f.key}`)}</small>
                {factText(f)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!hasBody && !examples && facts.length === 0 && <p className="sheet-empty">{t('sheet_empty', { name: p.name.split(' ')[0] })}</p>}

      <div className="sheet-body">
        {SECTIONS.map((key) => {
          const f = read(key);
          if (!f) return null;
          return (
            <section key={key} className={`field-block fb-${key} ${f.ex ? 'ex' : ''}`}>
              <h2>
                {t(`f_${key}`)}
                {f.ex && <span className="ex-tag">{t('example')}</span>}
              </h2>
              {key === 'jpWord' ? (
                <>
                  <p className="jp-word" lang="ja">{f.text}</p>
                  {read('jpMeaning') && <p>{read('jpMeaning').text}</p>}
                </>
              ) : (
                <p>{f.text}</p>
              )}
            </section>
          );
        })}
      </div>

      {!bare && (photos.length > 0 || examples) && (
        <section className="sheet-photos">
          <h2>{t('photos')}</h2>
          <div className="photo-strip">
            {photos.map((ph, i) => (
              <button key={ph.full + i} type="button" className="polaroid" style={{ '--r': `${((i * 37) % 5) - 2}deg` }} onClick={() => onPhoto && onPhoto(i)} aria-label={t('open_photo')}>
                <img src={asset(ph.thumb)} alt={ph.cap || ''} loading="lazy" decoding="async" />
                {ph.cap && <span>{ph.cap}</span>}
              </button>
            ))}
            {examples && photos.length === 0 &&
              [0, 1, 2].map((i) => (
                <div key={i} className="polaroid ghost" style={{ '--r': `${i - 1}deg` }}>
                  <div className="ghost-ph">
                    <Icon name="camera" size={26} />
                  </div>
                  <span>{t('example')}</span>
                </div>
              ))}
          </div>
        </section>
      )}
    </article>
  );
}
