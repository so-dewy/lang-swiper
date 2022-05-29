import React from 'dom-chef';
import { autoPlayState } from '../content';
import { AutoPlaySvg } from '../logos/auto-play';

const handleClick = (event) => {
  autoPlayState.toggleAutoPlay();
  (event.currentTarget as HTMLButtonElement).style.border = "1px solid black";
};

export const AutoPlayButton = () => {
  return <button 
    onClick={(event) => handleClick(event)}
    style={{ background: "none", border: autoPlayState.isAutoPlayOn ? "1px solid black" : "1px solid transparent" }}
  >
    <AutoPlaySvg></AutoPlaySvg>
  </button>;
}