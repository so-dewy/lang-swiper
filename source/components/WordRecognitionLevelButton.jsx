import React from 'dom-chef';

const levels = [
  "First time seeing",
  "Seen before",
  "Can remember meaning and pronunciation sometimes",
  "Almost always can remember meaning and pronunciation",
  "Known word"
];

const handleClick = (event) => {
  event.target.parentElement.childNodes.forEach(el => {
    el.style.backgroundColor = "#e7e7e7";
  });
  event.target.style.backgroundColor = "yellow";
};


export const WordRecognitionLevelButton = ({ level, isCurrentSavedLevel }) => {
  return <button 
    style={{ border: "0.5px solid", backgroundColor: isCurrentSavedLevel ? "yellow" : "#e7e7e7" }} 
    title={ levels[level - 1] }
    onClick={handleClick}
  >
    { level }
  </button>;
}