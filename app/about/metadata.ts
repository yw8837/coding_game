import type { Metadata } from 'next';
import { aboutCopy, type AboutLanguage } from './content';

export const SITE_ORIGIN = 'https://codeshift-lab.bsfire1237.chatgpt.site';
export const aboutPaths: Record<AboutLanguage, string> = { ko: '/about', en: '/about/en', ja: '/about/ja' };

export function aboutMetadata(language: AboutLanguage): Metadata {
  const copy = aboutCopy[language];
  const url = SITE_ORIGIN + aboutPaths[language];
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
      alternateLocale: Object.entries(locales).filter(([key]) => key !== language).map(([, value]) => value),
    },
    twitter: { card: 'summary', title: copy.title, description: copy.description },
    other: { 'content-language': language, 'game-version': '0.13.2 RC' },
  };
}
