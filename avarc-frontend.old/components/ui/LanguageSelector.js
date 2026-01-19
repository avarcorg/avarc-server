import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Button } from './button';
import { useSafeTranslation } from '../../utils/translation';

export default function LanguageSelector() {
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');
  const { safeTranslate } = useSafeTranslation(['common']);

  const changeLanguage = (lng) => {
    console.log(safeTranslate('language.changingTo', 'common', { language: lng }));
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: lng });
    localStorage.setItem('language', lng);
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 bg-red-500 p-4 rounded-lg shadow-lg z-50" data-filename="LanguageSelector.js">
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        {safeTranslate('language.english', 'common')}
      </Button>
      <Button
        variant={locale === 'de' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('de')}
      >
        {safeTranslate('language.german', 'common')}
      </Button>
      <Button
        variant={locale === 'tr' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('tr')}
      >
        {safeTranslate('language.turkish', 'common')}
      </Button>
    </div>
  );
}
