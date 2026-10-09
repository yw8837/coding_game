import { aboutCopy, type AboutLanguage } from './content';
import { aboutPaths, SITE_ORIGIN } from './metadata';
import styles from './about.module.css';

const languageNames: Record<AboutLanguage, string> = { ko: '한국어', en: 'English', ja: '日本語' };

export default function AboutPage({ language }: { language: AboutLanguage }) {
  const copy = aboutCopy[language];
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'VideoGame',
    '@id': SITE_ORIGIN + '/#game', name: 'CODE:SHIFT',
    description: copy.overview, url: SITE_ORIGIN + '/',
    genre: 'Coding puzzle', gamePlatform: 'Web browser',
    inLanguage: ['ko', 'en', 'ja'], isAccessibleForFree: true,
  };

  return (
    <div className={styles.page} lang={language}>
      <a className={styles.skip} href="#about-main">{copy.skip}</a>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="CODE:SHIFT">CODE<span>:</span>SHIFT</a>
        <nav className={styles.navigation} aria-label={copy.navLabel}>
          <a href="#requests">{copy.nav[0]}</a>
          <a href="#how-to-play">{copy.nav[1]}</a>
          <a href="#questions">{copy.nav[2]}</a>
        </nav>
        <nav className={styles.languages} aria-label={copy.languageLabel}>
          {(Object.keys(languageNames) as AboutLanguage[]).map((key) => (
            <a key={key} href={aboutPaths[key]} hrefLang={key} lang={key} aria-current={key === language ? 'page' : undefined}>{languageNames[key]}</a>
          ))}
        </nav>
      </header>

      <main id="about-main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="game-heading">
          <p className={styles.workingTitle}>{copy.workingTitle}</p>
          <h1 id="game-heading">{copy.hero}</h1>
          <p className={styles.lead}>{copy.lead}</p>
          <a className={styles.play} href="/">{copy.play}<span aria-hidden="true">↗</span></a>
        </section>

        <section className={styles.trailer} aria-label={language==='ko'?'실제 플레이 영상':language==='en'?'Gameplay trailer':'ゲームプレイ映像'}>
          <video controls playsInline preload="none" poster="/screenshots/desktop.png" aria-label={language==='ko'?'42초 게임 소개 영상':language==='en'?'42-second gameplay trailer':'42秒のゲームプレイ紹介'}>
            <source src={'/media/codeshift-'+language+'.mp4'} type="video/mp4"/>
          </video>
          <p>{language==='ko'?'실제 플레이 화면 · 일부 구간 배속':language==='en'?'Actual gameplay · some sections sped up':'実際のゲーム画面 · 一部を早送り'}</p>
        </section>

        <dl className={styles.facts}>
          {copy.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>

        <section className={styles.overview} aria-labelledby="overview-heading">
          <h2 id="overview-heading">{copy.overviewTitle}</h2>
          <p>{copy.overview}</p>
        </section>

        <section id="requests" className={styles.requests} aria-labelledby="requests-heading">
          <h2 id="requests-heading">{copy.chaptersTitle}</h2>
          <ol className={styles.chapterList}>
            {copy.chapters.map((chapter, index) => (
              <li key={chapter.code}>
                <span className={styles.chapterNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div className={styles.chapterText}>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.problem}</p>
                  <p>{chapter.action}</p>
                </div>
                <code className={styles.excerpt}>{chapter.code}</code>
              </li>
            ))}
          </ol>
        </section>

        <section id="how-to-play" className={styles.how} aria-labelledby="how-heading">
          <div className={styles.instructions}>
            <h2 id="how-heading">{copy.howTitle}</h2>
            <p>{copy.how}</p>
            <h3>{copy.helpTitle}</h3>
            <p>{copy.help}</p>
          </div>
          <div className={styles.controls}>
            <h3>{copy.controlsTitle}</h3>
            <dl>{copy.controls.map((control) => <div key={control.key}><dt><kbd>{control.key}</kbd></dt><dd>{control.action}</dd></div>)}</dl>
          </div>
        </section>

        <section className={styles.requirements} aria-labelledby="requirements-heading">
          <h2 id="requirements-heading">{copy.requirementsTitle}</h2>
          <ul>{copy.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
        </section>

        <section id="questions" className={styles.questions} aria-labelledby="questions-heading">
          <h2 id="questions-heading">{copy.faqTitle}</h2>
          <dl>{copy.faq.map((item) => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
        </section>
      </main>

      <footer className={styles.footer}><p>{copy.footer}</p></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    </div>
  );
}
