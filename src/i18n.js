import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from 'i18next';
import en_US from './language/en_US.json';
import zh_CN from './language/zh_CN.json';
import ko_KR from './language/ko_KR.json';
import ja_JP from './language/ja_JP.json';
import be_BY from './language/be_BY.json';

import {initReactI18next} from 'react-i18next';

let lang = localStorage.getItem("language");
console.log(lang,"lang");
if (!lang) {
    lang = 'en_US';
    localStorage.setItem("language", 'en_US');
}
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en_US: {
                translation: en_US,
            },
            zh_CN: {
                translation: zh_CN,
            },
            ko_KR: {
                translation: ko_KR,
            },
            ja_JP: {
                translation: ja_JP,
            },
            be_BY: {
                translation: be_BY,
            },
        },
        fallbackLng: lang,
        debug: false,
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;