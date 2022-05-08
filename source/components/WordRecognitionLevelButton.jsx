import React from 'dom-chef';
import * as wordMetadataService from '../services/wordMetadataService';

const levels = [
  "First time seeing",
  "Seen before",
  "Can remember meaning and pronunciation sometimes",
  "Almost always can remember meaning and pronunciation",
  "Known word"
];

const handleClick = (event, word, level) => {
  const wordMetadata = wordMetadataService.getWordMetadata(word);
  wordMetadata.level = level;
  wordMetadataService.setWordMetadata(wordMetadata);
  event.target.parentElement.childNodes.forEach(el => {
    el.style.backgroundColor = "#e7e7e7";
  });
  event.target.style.backgroundColor = "yellow";
};


export const WordRecognitionLevelButton = ({ level, isCurrentSavedLevel, word }) => {
  return <button 
    style={{ border: "0.5px solid", backgroundColor: isCurrentSavedLevel ? "yellow" : "#e7e7e7" }} 
    title={ levels[level - 1] }
    onClick={(event) => handleClick(event, word, level)}
  >
    { level }
  </button>;
}