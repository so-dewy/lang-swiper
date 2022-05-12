import React from 'dom-chef';
import { wordToElementRefs } from '../content';
import * as wordMetadataService from '../services/wordMetadataService';

interface WordLevelData {
  title: string,
  color: string,
  backgroundColor: string,
  index: number
}
const DESELECTED_BUTTON_COLOR = "#e7e7e7";
const SELECTED_BUTTON_COLOR = "yellow";

export const WORD_LEVELS: WordLevelData[] = [
  { title: "", backgroundColor: "rgb(242 192 255)", color: "black", index: 0 },
  { title: "Seen before", backgroundColor: "rgb(23 255 73 / 100%)", color: "black", index: 1 },
  { title: "Can remember meaning and pronunciation sometimes", backgroundColor: "rgb(23 255 73 / 60%)", color: "black", index: 2},
  { title: "Almost always can remember meaning and pronunciation", backgroundColor: "rgb(23 255 73 / 30%)", color: "black", index: 3},
  { title: "Known word", backgroundColor: "rgb(23 255 73 / 0%)", color: "black", index: 4},
];

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
    style={{ border: "0.5px solid", backgroundColor: isCurrentSavedLevel ? SELECTED_BUTTON_COLOR : DESELECTED_BUTTON_COLOR }} 
    title={ levelData.title }
    onClick={(event) => handleClick(event, word, levelData, wordElementRef)}
  >
    { level }
  </button>;
}