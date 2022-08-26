import React from 'dom-chef';
import * as wordMetadataService from './services/wordMetadataService';
import { loadDictionary } from './dictionary';
import { getAllTextNodes } from './services/domService';
import { Translation } from './services/translationService';
import { WORD_LEVELS } from './components/WordRecognitionLevelButton';
import browser from 'webextension-polyfill';
import * as Papa from 'papaparse';
import optionsStorage from './options-storage.js';
import { WordMetadata } from './services/wordMetadataService';

// @ts-ignore
const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

interface WordToElementRefs {
  [key: string]: HTMLElement[]
}

export const wordToElementRefs: WordToElementRefs = {};

const punctuation = new Set(["，", ".", "!", "?", "。", " ", "(", ")", "[", "]", "*", "@", "#", "$", "%", "^", "&", "_", "+", "=", "-", "\\", "/", ":", ";"]);

export enum TtsLanguages {
  Mandarin = "zh-CN",
  English = "en-US"
}

export const synthesizeWordSound = (word, language: TtsLanguages, shouldCancelPrevious: boolean = true) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = language;
  if (shouldCancelPrevious) {
    speechSynthesis.cancel();
  }
  speechSynthesis.speak(utterance);
};

let startX = 0;
let startY = 0;
const dragStartHandler = (event) => {
  // Prevent some sites hijacking dragstart event so that my draggable rect is draggable :)
  event.stopPropagation(); 
  event.stopImmediatePropagation();

  startX = event.clientX - parseInt(window.getComputedStyle(draggableRect).left);
  startY = event.clientY - parseInt(window.getComputedStyle(draggableRect).top);
}

const dragOverHandler = (event) => {
  event.preventDefault();
  return false;
}

const dropHandler = (event) => {
  draggableRect.style.left = event.clientX - startX + 'px';
  draggableRect.style.top = event.clientY - startY + 'px';
}

const draggableRect = <div 
  style={{ 
    position: "fixed", 
    left: window!.top!.outerWidth / 2 + window!.top!.screenX - ( 300 / 2), 
    top: window!.top!.outerHeight / 2 + window!.top!.screenY - ( 300 / 2),
    minWidth: 300,
    maxWidth: 300,     
    overflowY: "auto",
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "rgba(0, 8, 16, 0.08) 0px 4px 14px -2px",
    border: "1px rgba(0, 8, 16, 0.15) solid",
    color: "black",
    fontSize: 12,
    padding: 5,
    zIndex: 9999999
  }}
  onDragStart={dragStartHandler} 
  draggable="true"
>
</div>;

document.addEventListener('dragover', dragOverHandler);
document.addEventListener('drop', dropHandler);

let currentlyFocusedWord: HTMLElement;

export const autoPlayState = {
  isAutoPlayOn: false,
  toggleAutoPlay() {
    this.isAutoPlayOn = !this.isAutoPlayOn;
  }
};
let timeoutId;

const tooltipMouseLeaveHandler = (wordRef) => {
  if (autoPlayState.isAutoPlayOn) {
    const word = wordRef.textContent;
    const wordMetadata = wordMetadataService.getWordMetadata(word);
    if (wordMetadata.level === 0) {
      wordMetadata.level = 1;
      wordMetadataService.setWordMetadata(word, wordMetadata);
      
      const wordLevel = WORD_LEVELS[wordMetadata.level];
      const sameWordElementRefs = wordToElementRefs[word];
      sameWordElementRefs.forEach(el => {
        el.style.backgroundColor = wordLevel.backgroundColor;
      });

    }
    timeoutId = setTimeout(() => startAutoPlay(wordRef), 500);
  }
};

const tooltipMouseEnterHandler = () => {
  clearTimeout(timeoutId);
};

const activateNextWord = (nextWordRef) => {
  if (nextWordRef) {
    nextWordRef.style.border = "1px solid black";
    draggableRect.replaceChildren(
      <div onMouseEnter={tooltipMouseEnterHandler} onMouseLeave={() => tooltipMouseLeaveHandler(nextWordRef)} style={{minHeight: "40vh", maxHeight: "40vh", minWidth: 200}}>
        { Translation(nextWordRef) } 
      </div>
    );
  }
  if (currentlyFocusedWord) {
    currentlyFocusedWord.style.border = "1px solid transparent";
  }
  currentlyFocusedWord = nextWordRef;
};

const startAutoPlay = (wordRef) => {
  if (!wordRef || !autoPlayState.isAutoPlayOn) {
    clearTimeout(timeoutId);
  } else {
    const isMultiCharacterWord = wordRef.textContent.length > 1;

    synthesizeWordSound(wordRef.nextWordRef.textContent, TtsLanguages.Mandarin);
    activateNextWord(wordRef.nextWordRef);   
    wordRef = wordRef.nextWordRef;
    
    const wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    const levelData = WORD_LEVELS[wordMetadata.level];
    if (wordMetadata.level !== 0) {
      const autoPlayTimeout = isMultiCharacterWord ? levelData.autoPlayTimeout * 1.5 : levelData.autoPlayTimeout;
      timeoutId = setTimeout(() => startAutoPlay(wordRef), autoPlayTimeout);
    }
  }
};

const setWordRefEventListeners = (wordRef) => {
  wordRef.addEventListener("click", event => {
    clearTimeout(timeoutId);
    const target = event.target;      
    synthesizeWordSound(target.textContent, TtsLanguages.Mandarin);

    if (currentlyFocusedWord) {
      currentlyFocusedWord.style.border = "1px solid transparent";
    } else {
      document.body.appendChild(draggableRect);
    }
    currentlyFocusedWord = wordRef;
    wordRef.style.border = "1px solid black";
    draggableRect.replaceChildren(
      <div onMouseLeave={() => tooltipMouseLeaveHandler(wordRef)} onMouseEnter={tooltipMouseEnterHandler} style={{minHeight: "40vh", maxHeight: "40vh", minWidth: 200}}>
        { Translation(target) } 
      </div>
    );

    const isMultiCharacterWord = wordRef.textContent.length > 1;
    const wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    const levelData = WORD_LEVELS[wordMetadata.level];
    if (autoPlayState.isAutoPlayOn && wordMetadata.level !== 0) {
      const autoPlayTimeout = isMultiCharacterWord ? levelData.autoPlayTimeout * 1.5 : levelData.autoPlayTimeout;
      timeoutId = setTimeout(() => startAutoPlay(wordRef), autoPlayTimeout);
    }
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
    let wordMetadataBatch: { [key: string]: WordMetadata } = {};
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => { 
      if (!input || !input.files) return;

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
            const metadata: WordMetadata = { level: Number(row.data.level) };
            if (row.data.preferredTranslation) {
              metadata.preferredTranslation = row.data.preferredTranslation;
            }
            wordMetadataBatch[row.data.word] = metadata;
          }
        },
        complete: () => {
          console.log("Import of words is done!");
        }
      });
    }
    input.click();
  }
});

const init = async () => {
  const wordRefs: HTMLElement[] = [];

  getAllTextNodes().forEach(node => {
    if (!node.textContent) return;

    const mandarin = node.textContent.trim();
    const span = <span style={{ display: "inline-block", textAlign: "start", textIndent: 0 }}></span>;
    const words: any = Array.from(segmenter.segment(mandarin));
  
    for (let word of words) {
      word = word.segment;
      const wordRef = <span>{word}</span>;
      wordRef.after(span);
      span.appendChild(wordRef);
  
      if (punctuation.has(word) || !(/\p{Script=Han}/u.test(word))) continue;
  
      wordRefs.push(wordRef);
      wordRef.className = "word-tooltip";
      setWordRefEventListeners(wordRef);
    }
    (node as ChildNode).after(span);
    (node as ChildNode).remove();
  });

  await wordMetadataService.loadMetadataFromStorage(wordRefs.map(wordRef => wordRef.textContent ? wordRef.textContent : ""));
  const unsetWords = {};
  wordRefs.forEach(wordRef => {
    let wordMetadata = wordMetadataService.getWordMetadata(wordRef.textContent);
    if (!wordMetadata && wordRef.textContent) {
      unsetWords[wordRef.textContent] = { level: 0 };
    }
  });
  
  await wordMetadataService.setWordMetadataBulk(unsetWords, false);

  const options = await optionsStorage.getAll();

  let previousRef;
  wordRefs.forEach(wordRef => {
    if (!wordRef.textContent) return;
    
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