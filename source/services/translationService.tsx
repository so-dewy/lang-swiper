import React from 'dom-chef';
import { GoogleTranslateSvg } from '../logos/google-translate';
import { BaiduTranslateSvg } from '../logos/baidu';
import { GlosbeTranslateSvg } from '../logos/glosbe';
import { WordRecognitionLevelButton, WORD_LEVELS } from '../components/WordRecognitionLevelButton';
import { dictionary } from '../dictionary';
import { getWordMetadata, setWordMetadata, WordMetadata } from '../services/wordMetadataService';
import { AutoPlayButton } from '../components/AutoPlayButton';
import { synthesizeWordSound, TtsLanguages } from '../content';

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
  if (!word) return;
  const wordTranslation = translateWord(word);

  let wordMetadata = getWordMetadata(word);
  wordMetadata = wordMetadata ? wordMetadata : { level: 1 };

  let voiceInput: string;
  if (wordMetadata.preferredTranslation) {
    voiceInput = wordMetadata.preferredTranslation;
  } else if (wordTranslation.wordPartTranslations) {
    voiceInput = wordTranslation.wordPartTranslations.map(el => el.translation[0]).join(" ");
  } else {
    voiceInput = wordTranslation.translation[0];
  }

  const isNotKnownWord = wordMetadata.level != WORD_LEVELS.length - 1;
  if (isNotKnownWord) {
    synthesizeWordSound(voiceInput, TtsLanguages.English, false);
  }
  
  const wordRecognitionButtons: JSX.Element[] = [];
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

  const preferredTranslation = wordMetadata.preferredTranslation ? wordMetadata.preferredTranslation : "";
  return (
    <>
      <div style={{ height: 30, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        { 
          wordRecognitionButtons.length && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
              { wordRecognitionButtons }
            </div>
          )
        }
        { AutoPlayButton() }
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="preferredTranslation">Custom translation: </label>
        <br/>
        <input type="text" id="preferredTranslation" value={preferredTranslation} style={{ marginRight: 5 }}></input>
        <button onClick={(event) => savePreferredTranslation(event, word, wordMetadata) } >Save</button>
      </div>
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
        { wordTranslation.translation.map(el => <li style={{ listStyleType: "circle", marginBottom: 5 }}>{ el }</li>) }
      </ul>
    </>
  )
}

const onMouseEnterHandler = (event) => { (event.target as HTMLButtonElement).style.border = `1px solid #dddddd` }
const onMouseLeaveHandler = (event) => { (event.target as HTMLButtonElement).style.border = `1px solid transparent` }

const ThirdPartyTranslationButtons = (word: string) => { 
  const encodedWord = encodeURIComponent(word);
  return (
    <>
      <div style={{ justifySelf: "right", display: "flex", gap: 5 }}>
        <button 
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
          onClick={() => openTranslationPopup(`https://translate.google.com/?sl=zh-CN&tl=en&text=${encodedWord}%0A&op=translate`)} 
          style={{ border: "1px solid transparent", background: "none" }}
          title="Open Google Translate popup"
        >
          <GoogleTranslateSvg/>
        </button>
        
        <button 
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
          onClick={() => openTranslationPopup(`https://fanyi.baidu.com/#zh/en/${encodedWord}`)} 
          style={{ border: "1px solid transparent", background: "none" }}
          title="Open Baidu Translate popup"
        >
          <BaiduTranslateSvg/>
        </button>
        <button 
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
          onClick={() => openTranslationPopup(`https://glosbe.com/zh/en/${encodedWord}`)} 
          style={{ border: "1px solid transparent", background: "none" }}
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
    return { word: word, translation: ["No availible translation"] };
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

const savePreferredTranslation = (event, word: string, wordMetadata: WordMetadata) => {
  const preferredTranslationInput = document.getElementById("preferredTranslation");
  if (!preferredTranslationInput) return;
  const preferredTranslation = (preferredTranslationInput as HTMLButtonElement).value;
  if (!preferredTranslation) return;

  wordMetadata.preferredTranslation = preferredTranslation;

  setWordMetadata(word, wordMetadata);  
}