import React from 'dom-chef';
import { wordToElementRefs } from '../content';
import * as wordMetadataService from '../services/wordMetadataService';
import optionsStorage from '../options-storage.js';

interface WordLevelData {
  title: string,
  color: string,
  backgroundColor: string,
  index: number,
  autoPlayTimeout: number
}
const DESELECTED_BUTTON_COLOR = "#e7e7e7";
const SELECTED_BUTTON_COLOR = "yellow";

export const WORD_LEVELS: WordLevelData[] = [
  { title: "", backgroundColor: "rgb(242 192 255)", color: "black", index: 0, autoPlayTimeout: 9999999 },
  { title: "Seen before", backgroundColor: "rgb(23 255 73 / 100%)", color: "black", index: 1, autoPlayTimeout: 8000 },
  { title: "Can remember meaning and pronunciation sometimes", backgroundColor: "rgb(23 255 73 / 60%)", color: "black", index: 2, autoPlayTimeout: 8000 },
  { title: "Almost always can remember meaning and pronunciation", backgroundColor: "rgb(23 255 73 / 30%)", color: "black", index: 3, autoPlayTimeout: 4000 },
  { title: "Known word", backgroundColor: "rgb(23 255 73 / 0%)", color: "black", index: 4, autoPlayTimeout: 2000 },
];

const init = async () => {
  const options = await optionsStorage.getAll();
  WORD_LEVELS[1].autoPlayTimeout = Number(options.level1AutoPlayTimeout);
  WORD_LEVELS[2].autoPlayTimeout = Number(options.level2AutoPlayTimeout);
  WORD_LEVELS[3].autoPlayTimeout = Number(options.level3AutoPlayTimeout);
  WORD_LEVELS[4].autoPlayTimeout = Number(options.level4AutoPlayTimeout);
};

init();

const handleClick = (event, word: string, level: WordLevelData, wordElementRef: HTMLElement) => {
  const wordMetadata = wordMetadataService.getWordMetadata(word);
  wordMetadata.level = level.index;
  wordMetadataService.setWordMetadata(word, wordMetadata);

  const sameWordElementRefs = wordToElementRefs[word];

  sameWordElementRefs.forEach(el => {
    el.style.backgroundColor = level.backgroundColor;
  });

  event.target.parentElement.childNodes.forEach(el => {
    el.style.backgroundColor = DESELECTED_BUTTON_COLOR;
  });
  event.target.style.backgroundColor = SELECTED_BUTTON_COLOR;
  wordElementRef.style.backgroundColor = level.backgroundColor;
};

interface WordRecognitionLevelProps {
  level: number, 
  isCurrentSavedLevel: boolean, 
  word: string, 
  wordElementRef: HTMLElement
}

export const WordRecognitionLevelButton = ({ level, isCurrentSavedLevel, word, wordElementRef }: WordRecognitionLevelProps) => {
  const levelData = WORD_LEVELS[level];
  return <button 
    onMouseEnter={(event) => { (event.target as HTMLButtonElement).style.border = `1px solid black` }}
    onMouseLeave={(event) => { (event.target as HTMLButtonElement).style.border = `1px solid ${DESELECTED_BUTTON_COLOR}` }}
    style={{ border: `1px solid ${DESELECTED_BUTTON_COLOR}`, backgroundColor: isCurrentSavedLevel ? SELECTED_BUTTON_COLOR : DESELECTED_BUTTON_COLOR, width: 20 }} 
    title={ levelData.title }
    onClick={(event) => handleClick(event, word, levelData, wordElementRef)}
  >
    { level }
  </button>;
}