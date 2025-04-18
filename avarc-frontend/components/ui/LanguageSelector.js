import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Button } from './button';

export default function LanguageSelector() {
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');

  const changeLanguage = (lng) => {
    console.log(t('language.changingTo', { language: lng }));
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: lng });
    localStorage.setItem('language', lng);
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 bg-red-500 p-4 rounded-lg shadow-lg z-50">
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        {t('language.english')}
      </Button>
      <Button
        variant={locale === 'de' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('de')}
      >
        {t('language.german')}
      </Button>
    </div>
  );
}
