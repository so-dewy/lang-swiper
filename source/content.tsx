import React from 'dom-chef';
import tippy, {createSingleton} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import * as wordMetadataService from './services/wordMetadataService';
import { loadDictionary } from './dictionary';
import { getAllTextNodes } from './services/domService';
import { Translation } from './services/translationService';
import { WORD_LEVELS } from './components/WordRecognitionLevelButton';
import browser from 'webextension-polyfill';
import * as Papa from 'papaparse';
import optionsStorage from './options-storage.js';

// @ts-ignore
const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

interface WordToElementRefs {
  [key: string]: HTMLElement[]
}

export const wordToElementRefs: WordToElementRefs = {};

const punctuation = new Set(["，", ".", "!", "?", "。", " ", "(", ")", "[", "]", "*", "@", "#", "$", "%", "^", "&", "_", "+", "=", "-", "\\", "/", ":", ";"]);

const synthesizeWordSound = (word) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "zh-CN";
  speechSynthesis.speak(utterance);
};

export const autoPlayState = {
  isAutoPlayOn: false,
  toggleAutoPlay() {
    this.isAutoPlayOn = !this.isAutoPlayOn;
  }
};
let intervalId;

const tooltipMouseLeaveHandler = (wordRef) => {
  if (autoPlayState.isAutoPlayOn) {
    setTimeout(() => startAutoPlay(wordRef), 1000);
  }
};

const tooltipMouseEnterHandler = () => {
  clearInterval(intervalId);
};

const activateNextWord = (currentWordRef, nextWordRef) => {
  if (nextWordRef) {
    nextWordRef._tippy.setContent(
      <div onMouseEnter={tooltipMouseEnterHandler} onMouseLeave={() => tooltipMouseLeaveHandler(nextWordRef)} style={{maxHeight: "40vh", minWidth: 200, overflowY: "auto" }}>
        { Translation(nextWordRef) } 
      </div>
    );
    nextWordRef._tippy.show();
  }
  currentWordRef._tippy.hide();
};

const startAutoPlay = (wordRef) => {
  clearInterval(intervalId);
  activateNextWord(wordRef, wordRef.nextWordRef);   
  synthesizeWordSound(wordRef.nextWordRef.textContent);
  wordRef = wordRef.nextWordRef;
  intervalId = setInterval(() => {
    if (!wordRef || !autoPlayState.isAutoPlayOn) {
      clearInterval(intervalId);
    } else {
      activateNextWord(wordRef, wordRef.nextWordRef);   
      synthesizeWordSound(wordRef.nextWordRef.textContent);
      wordRef = wordRef.nextWordRef;
    }
  }, 5000);
};

const setWordRefEventListeners = (wordRef) => {
  wordRef.addEventListener("click", event => {
    clearInterval(intervalId);
    const target = event.target;      
    synthesizeWordSound(target.textContent);

    target._tippy.setContent(
      <div onMouseLeave={() => tooltipMouseLeaveHandler(wordRef)} onMouseEnter={tooltipMouseEnterHandler} style={{maxHeight: "40vh", minWidth: 200, overflowY: "auto" }}>
        { Translation(target) } 
      </div>
    );
    target._tippy.show();
  }, false);
}

const updateWordElementState = (word, level) => {
  const levelData = WORD_LEVELS[level];
  const sameWordElementRefs = wordToElementRefs[word];

  if (sameWordElementRefs) {
    sameWordElementRefs.forEach(el => {
      el.style.backgroundColor = levelData.backgroundColor;
    });
  }
};

browser.runtime.onMessage.addListener((message) => {
  if (message.type == "importWords") {
    let rowCounter = 0;
    let wordMetadataBatch = {};
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => { 
      const file = (e.target as HTMLInputElement).files[0]; 
      Papa.parse(input.files[0], {
        worker: true,
        header: true,
        step: (row) => {
          rowCounter++;
          if (rowCounter == 500) {
            wordMetadataService.setWordMetadataBulk(wordMetadataBatch, true);

            const words = Object.keys(wordMetadataBatch);
            for (const word of words) {
              updateWordElementState(word, wordMetadataBatch[word].level);
            }
            rowCounter = 0;
            wordMetadataBatch = {};
          } else {
            wordMetadataBatch[row.data.word] = { level: row.data.level };
          }
        },
        complete: () => {
          console.log("All done!");
        }
      });
    }
    input.click();
  }
});

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

  tippy(".word-tooltip", {
    theme: "light-border",
    allowHTML: true,
    interactive: true,
    trigger: 'manual',
    onShow(instance) {
      (instance.reference as any).style.border = "1px solid black";
    },
    onHide(instance) {
      (instance.reference as any).style.border = "1px solid transparent";
    },
    appendTo: () => document.body
  });

  await wordMetadataService.loadMetadataFromStorage(wordRefs.map(wordRef => wordRef.textContent));
  const unsetWords = {};
  wordRefs.forEach(wordRef => {
    let wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    if (!wordMetadata) {
      unsetWords[wordRef.textContent] = { level: 0 };
    }
  });
  
  await wordMetadataService.setWordMetadataBulk(unsetWords, false);

  const options = await optionsStorage.getAll();

  let previousRef;
  wordRefs.forEach(wordRef => {
    let elementRefs = wordToElementRefs[wordRef.textContent];
    if (!elementRefs) {
      elementRefs = [];
    }
    elementRefs.push(wordRef);
    wordToElementRefs[wordRef.textContent] = elementRefs;

    const wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    const wordLevel = WORD_LEVELS[wordMetadata.level];
    wordRef.style.backgroundColor = wordLevel.backgroundColor;
    wordRef.style.color = wordLevel.color;
    wordRef.style.border = `1px solid transparent`;
    wordRef.style.marginRight = "5px";
    wordRef.style.fontSize = `${options.fontSize}px`;
    wordRef.style.wordBreak = "keep-all";

    if (previousRef) {
      previousRef.nextWordRef = wordRef;
    }
    previousRef = wordRef;
  });

  await loadDictionary();
}

init();