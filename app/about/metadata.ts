import type { Metadata } from 'next';
import { type AboutLanguage } from './content';
import { demoCopy as aboutCopy } from './demo-content';

export const SITE_ORIGIN = 'https://code.yeolmaeapps.kr';
export const aboutPaths: Record<AboutLanguage, string> = { ko: '/about', en: '/about/en', ja: '/about/ja' };

export function aboutMetadata(language: AboutLanguage): Metadata {
  const copy = aboutCopy[language];
  const url = SITE_ORIGIN + aboutPaths[language];
  const poster = SITE_ORIGIN + '/media/first-release-poster' + (language === 'en' ? '-en' : '') + '.jpg';
  const locales = { ko: 'ko_KR', en: 'en_US', ja: 'ja_JP' };
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: url,
      languages: {
        ko: SITE_ORIGIN + aboutPaths.ko,
        en: SITE_ORIGIN + aboutPaths.en,
        ja: SITE_ORIGIN + aboutPaths.ja,
        'x-default': SITE_ORIGIN + aboutPaths.ko,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website', title: copy.title, description: copy.description,
      url, siteName: 'CODE:SHIFT', locale: locales[language],
      images: [{ url: poster, width: 1280, height: 720, alt: copy.title }],
      alternateLocale: Object.entries(locales).filter(([key]) => key !== language).map(([, value]) => value),
    },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: [poster] },
    other: { 'content-language': language, 'game-version': '0.13.2 RC' },
  };
}
