import React from 'dom-chef';
import { GoogleTranslateSvg } from '../logos/google-translate';
import { BaiduTranslateSvg } from '../logos/baidu';
import { GlosbeTranslateSvg } from '../logos/glosbe';
import { WordRecognitionLevelButton } from '../components/WordRecognitionLevelButton';
import { dictionary } from '../dictionary';
import { getWordMetadata, setWordMetadata } from '../services/wordMetadataService';
import browser from 'webextension-polyfill';

const openTranslationPopup = (url) => {
  const currentWindow = window;
  const width = 1000;
  const height = 500;
  const left = currentWindow.screenX + (window.outerWidth - width) / 2;
  const top = currentWindow.screenY + (window.outerHeight - height) / 2.5;
  currentWindow.open(url, "", `width=${width},height=${height},left=${left},top=${top}`);
};

export const translateWord = (word) => {  
  const dictionaryEntry = dictionary[word];
  if (!dictionaryEntry) {
    if (word.length == 1) {
      return (
        <>
          <b>{ word }</b> <br/>No availible translation
        </>
      );
    }
    if (word.length > 1) {
      const wordSet = new Set();
      const wordParts = word.split('').filter(x => {
        const isADuplicate = wordSet.has(x);
        if (!isADuplicate) wordSet.add(x);
        return !isADuplicate;
      });
      const wordPartsTranslations = wordParts.map(wordPart => (
        <>
          { translateWord(wordPart) }
          <br/>
        </>
      ));
      return wordPartsTranslations;
    }
  } else {
    let translationItems;
    if (dictionaryEntry.length) {
      const translationItemsSet = new Set();
      translationItems = dictionaryEntry.flatMap(el => 
        el.translations
          .filter(el => {
            const isADuplicate = translationItemsSet.has(el);
            if (!isADuplicate) translationItemsSet.add(el);
            return !isADuplicate;
          })
          .map(el => <li style={{ listStyleType: "circle" }}>{ el }</li>)
      )
    } else {
      translationItems = dictionaryEntry.translations.map(el => <li style={{ listStyleType: "circle" }}>{ el }</li>)
    }

    let wordMetadata = getWordMetadata(word);
    wordMetadata = wordMetadata ? wordMetadata : { word: word, level: 1 };
    
    const wordRecognitionButtons = [];
    for (let i = 0; i < 5; i++) {
      wordRecognitionButtons.push(WordRecognitionLevelButton({ level: i + 1, isCurrentSavedLevel: i + 1 == wordMetadata.level, word: word }))
    }

    const encodedWord = encodeURIComponent(word);

    return (
      <>
        <div style={{ height: 30 }}>
          <button 
            onClick={() => openTranslationPopup(`https://translate.google.com/?sl=zh-CN&tl=en&text=${encodedWord}%0A&op=translate`)} 
            style={{ border: "none", background: "none" }}
            title="Open Google Translate popup"
          >
            <GoogleTranslateSvg/>
          </button>
          
          <button 
            onClick={() => openTranslationPopup(`https://fanyi.baidu.com/#zh/en/${encodedWord}`)} 
            style={{ border: "none", background: "none" }}
            title="Open Baidu Translate popup"
          >
            <BaiduTranslateSvg/>
          </button>
          <button 
            onClick={() => openTranslationPopup(`https://glosbe.com/zh/en/${encodedWord}`)} 
            style={{ border: "none", background: "none" }}
            title="Open Glosbe Translate popup"
          >
            <GlosbeTranslateSvg/>
          </button>
          <div style={{ display: "inline-block", float: "right" }}>
            { wordRecognitionButtons }
          </div>
        </div>
        <div>
          <b>
            { word } { dictionaryEntry.length ? dictionaryEntry[0].pinyin : dictionaryEntry.pinyin }
          </b> 
        </div>
        <ul style={{ paddingLeft: 20, listStyleType: "circle" }}>
          { translationItems }
        </ul>
      </>
    );
  }
}