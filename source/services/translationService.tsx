import React from 'dom-chef';
import { GoogleTranslateSvg } from '../logos/google-translate';
import { BaiduTranslateSvg } from '../logos/baidu';
import { GlosbeTranslateSvg } from '../logos/glosbe';
import { WordRecognitionLevelButton, WORD_LEVELS } from '../components/WordRecognitionLevelButton';
import { dictionary } from '../dictionary';
import { getWordMetadata } from '../services/wordMetadataService';

interface WordTranslation {
  word: string,
  pinyin?: string,
  translation: string[],
  wordPartTranslations?: WordTranslation[]
}

const openTranslationPopup = (url) => {
  const currentWindow = window;
  const width = 1000;
  const height = 500;
  const left = currentWindow.screenX + (window.outerWidth - width) / 2;
  const top = currentWindow.screenY + (window.outerHeight - height) / 2.5;
  currentWindow.open(url, "", `width=${width},height=${height},left=${left},top=${top}`);
};

export const Translation = (wordElementRef: HTMLElement) => {  
  const word = wordElementRef.textContent;
  const wordTranslation = translateWord(word);

  let wordMetadata = getWordMetadata(word);
  wordMetadata = wordMetadata ? wordMetadata : { word: word, level: 1 };
  
  const wordRecognitionButtons = [];
  for (let i = 1; i < WORD_LEVELS.length; i++) {
    wordRecognitionButtons.push(WordRecognitionLevelButton({ level: i , isCurrentSavedLevel: i == wordMetadata.level, word: word, wordElementRef: wordElementRef }))
  }
  
  let wordPartTranslations;
  if (wordTranslation.wordPartTranslations) {
    wordPartTranslations = wordTranslation.wordPartTranslations.map(el => (
      <>
        { WordTranslationList(el) }
        <br/>
      </>
    ));
  }

  return (
    <>
      { 
        wordRecognitionButtons.length && (
          <div style={{ height: 30, display: "flex", alignItems: "flex-start", gap: 5 }}>
            { wordRecognitionButtons }
          </div>
        )
      }
      { WordTranslationList(wordTranslation) }
      <br/>
      { wordPartTranslations }
    </>
  );
};


const WordTranslationList = (wordTranslation: WordTranslation) => {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 30 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 25 }}>{ wordTranslation.word }</span> 
          <b>{ wordTranslation.pinyin ? wordTranslation.pinyin : "" }</b> 
        </div>
        { ThirdPartyTranslationButtons(wordTranslation.word) }
      </div>
      <ul style={{ paddingLeft: 20, listStyleType: "circle" }}>
        { wordTranslation.translation.map(el => <li style={{ listStyleType: "circle" }}>{ el }</li>) }
      </ul>
    </>
  )
}

const ThirdPartyTranslationButtons = (word: string) => { 
  const encodedWord = encodeURIComponent(word);
  return (
    <>
      <div style={{ justifySelf: "right" }}>
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
      </div>
    </>
  );
}

const translateWord = (word: string): WordTranslation => {  
  const dictionaryEntry = dictionary[word];
  if (!dictionaryEntry) {
    if (word.length == 1) {
      return { word: word, translation: ["No availible translation"] };
    }
    if (word.length > 1) {
      const wordSet = new Set();
      const wordParts = word.split('').filter(x => {
        const isADuplicate = wordSet.has(x);
        if (!isADuplicate) wordSet.add(x);
        return !isADuplicate;
      });
      const wordPartTranslations = wordParts.map(wordPart => translateWord(wordPart));
      return { 
        word, 
        translation: ["No availible translation for this composite word, see individual word translations below or use 3rd party translators"],
        wordPartTranslations
      };
    }
  } else {
    const translationItemsSet = new Set();
    const translationItems = dictionaryEntry.flatMap(el => 
      el.translations.filter(el => {
        const isADuplicate = translationItemsSet.has(el);
        if (!isADuplicate) translationItemsSet.add(el);
        return !isADuplicate;
      })
    )

    return { word: word, pinyin: dictionaryEntry[0].pinyin, translation: translationItems };
  }
}