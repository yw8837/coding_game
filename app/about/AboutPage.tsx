import { type AboutLanguage } from './content';
import { demoCopy as aboutCopy, trailerScope } from './demo-content';
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
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Return to the game with a full document navigation; this page also runs through the Vinext shim. */}
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Return to the game with a full document navigation; this page also runs through the Vinext shim. */}
          <a className={styles.play} href="/">{copy.play}<span aria-hidden="true">↗</span></a>
        </section>

        <section className={styles.trailer} aria-label={language==='ko'?'실제 플레이 영상':language==='en'?'Gameplay trailer':'ゲームプレイ映像'}>
          <p>{trailerScope[language]}</p>
          <video controls playsInline preload="none" poster={'/media/first-release-poster'+(language==='en'?'-en':'')+'.jpg?v=desktop-20261010'} aria-label={language==='ko'?'30초 내 첫 출시 게임 영상':language==='en'?'30-second My First Release gameplay trailer':'30秒のはじめてのリリース紹介映像'}>
            <source src={'/media/codeshift-'+language+'.mp4?v=polish-20261010'} type="video/mp4"/>
          </video>
          <p>{language==='ko'?'빵집 계산을 고치고, 보상으로 도구를 사고, 내 포트폴리오 1.0을 배포하기까지.':language==='en'?'Fix a bakery till, buy tools with your rewards, and release version 1.0 of your own portfolio.':'パン屋の計算を直し、報酬で道具を買い、自分のポートフォリオ1.0を公開するまで。'}</p>
          <p>{language==='ko'?'한국어판 실제 게임 화면 · 자동 조작·속도 편집 · 편집 효과음 포함':language==='en'?'Actual Korean gameplay · automated input and speed edits · editorial sound effects':'実際の韓国語版プレイ · 自動操作・速度編集 · 編集効果音を含む'}</p>
          <p>Music: “Voxel Revolution” — Kevin MacLeod (<a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN2000025">incompetech.com</a>), <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Trimmed, tempo adjusted and mixed.</p>
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
