import { useRouter } from 'next/router';
import { Button } from './button';

export default function LanguageSelector() {
  const router = useRouter();
  const { locale } = router;

  const changeLanguage = (lng) => {
    console.log('Changing language to:', lng);
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
        EN
      </Button>
      <Button
        variant={locale === 'de' ? 'default' : 'outline'}
        size="sm"
        onClick={() => changeLanguage('de')}
      >
        DE
      </Button>
    </div>
  );
}
