import React from 'dom-chef';
import tippy, {createSingleton} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import * as wordMetadataService from './services/wordMetadataService';
import { loadDictionary } from './dictionary';
import { getAllTextNodes } from './services/domService';
import { Translation } from './services/translationService';
import { WORD_LEVELS } from './components/WordRecognitionLevelButton';

// @ts-ignore
const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

const punctuation = new Set(["，", ".", "!", "?", "。", " ", "(", ")", "[", "]", "*", "@", "#", "$", "%", "^", "&", "_", "+", "=", "-", "\\", "/", ":", ";"]);

const synthesizeWordSound = (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "zh-CN";
  speechSynthesis.speak(utterance);
};

const setWordRefEventListeners = (wordRef) => {
  wordRef.addEventListener("mouseenter", event => {
    const target = event.target;      
    synthesizeWordSound(target.textContent);

    target._tippy.setContent(
      <div style={{maxHeight: "40vh", minWidth: 200, overflowY: "auto" }}>
        { Translation(target) } 
      </div>
    );
    target._tippy.show();
    
    target.style.color = "orange";
  }, false);
  wordRef.addEventListener("mouseleave", event => {
    event.target.style.color = "";
  }, false);
}

const init = async () => {
  const wordRefs: HTMLElement[] = [];

  getAllTextNodes().forEach(node => {
    const mandarin = node.textContent.trim();
    const span = document.createElement('span');
    const words: any = Array.from(segmenter.segment(mandarin));
  
    for (let word of words) {
      word = word.segment;
      const wordRef = document.createElement('span');
      wordRef.textContent = word;
      wordRef.after(span);
      span.appendChild(wordRef);
  
      if (punctuation.has(word) || !(/\p{Script=Han}/u.test(word))) continue;
  
      wordRefs.push(wordRef);
      wordRef.className = "word-tooltip";
      setWordRefEventListeners(wordRef);
    }
    node.after(span);
    node.remove();
  });

  createSingleton(tippy(".word-tooltip"), {
    theme: "light-border",
    allowHTML: true,
    interactive: true,
    // interactiveDebounce: 999999,
    appendTo: () => document.body
  });

  await wordMetadataService.loadMetadataFromStorage(wordRefs.map(wordRef => wordRef.textContent));
  const unsetWords = {};
  wordRefs.forEach(wordRef => {
    let wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    if (!wordMetadata) {
      unsetWords[wordRef.textContent] = { word: wordRef.textContent, level: 0 };
    }
  });
  
  await wordMetadataService.setWordMetadataBulk(unsetWords);

  wordRefs.forEach(wordRef => {
    const wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    const wordLevel = WORD_LEVELS[wordMetadata.level];
    wordRef.style.backgroundColor = wordLevel.backgroundColor;
    wordRef.style.color = wordLevel.color;
    wordRef.style.marginRight = "5px";
  });

  await loadDictionary();
}

init();