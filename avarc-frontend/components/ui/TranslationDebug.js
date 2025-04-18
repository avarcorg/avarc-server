import { useState, useEffect } from 'react';
import { useSafeTranslation } from '../../utils/translation';

const TranslationDebug = () => {
    const { getMissingTranslations, clearMissingTranslations } = useSafeTranslation();
    const [items, setItems] = useState([]);

    useEffect(() => {
        // Update items every second
        const interval = setInterval(() => {
            const missing = getMissingTranslations();
            setItems(missing);
        }, 1000);

        return () => clearInterval(interval);
    }, [getMissingTranslations]);

    const handleClear = () => {
        clearMissingTranslations();
        setItems([]);
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Missing Translations</h3>
                <button
                    onClick={handleClear}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                    Clear
                </button>
            </div>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="text-sm font-mono">
                            <span className="font-bold">{item.namespace}:</span>
                            <span className="ml-2">{item.key}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TranslationDebug;
