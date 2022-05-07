import React from 'dom-chef';
import tippy, {createSingleton} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import { GoogleTranslateSvg } from './logos/google-translate';
import { BaiduTranslateSvg } from './logos/baidu';
import { GlosbeTranslateSvg } from './logos/glosbe';

const dictionary = {};

const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

function getAllTextNodes() {
  let textNode;
  const textNodes = [];
  const walk = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
  while (textNode = walk.nextNode()) {
    // Filter out empty space nodes and nodes without mandarin
    if (/^\s+$/.test(textNode.textContent) || !(/\p{Script=Han}/u.test(textNode.textContent))) continue;

    textNodes.push(textNode);
  }
  return textNodes;
}

const punctuation = ["，", ".", "!", "?", "。", " ", "(", ")", "[", "]", "*", "@", "#", "$", "%", "^", "&", "_", "+", "=", "-", "\\", "/", ":", ";"];

getAllTextNodes().forEach(node => {
  const mandarin = node.textContent.trim();
  const span = document.createElement('span');
  // const words = segmentit.doSegment(mandarin, { simple: true, stripPunctuation: true });
  const words = Array.from(segmenter.segment(mandarin));
  for (word of words) {
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word.segment;
    wordSpan.after(span);
    span.appendChild(wordSpan);

    if (punctuation.indexOf(word.segment) != -1 || !(/\p{Script=Han}/u.test(word.segment))) continue;

    wordSpan.className = "word-tooltip";
    wordSpan.addEventListener("mouseenter", event => {
      const word = event.target;      
      synthesyseWordSound(word.textContent);

      word._tippy.setContent(
        <div style={{maxHeight: "40vh", minWidth: 200, overflowY: "auto" }}>
          { translateWord(word.textContent) } 
        </div>
      );
      word._tippy.show();
      
      event.target.style.color = "orange";
    }, false);
    wordSpan.addEventListener("mouseleave", function( event ) {
      event.target.style.color = "";
    }, false);
  }
  node.after(span);
  node.remove();
});

function synthesyseWordSound(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "zh-CN";
  speechSynthesis.speak(utterance);
}

createSingleton(tippy(".word-tooltip"), {
  theme: "light-border",
  allowHTML: true,
  interactive: true,
  // interactiveDebounce: 999999,
  appendTo: () => document.body
});

const openTranslationPopup = (url) => {
  const currentWindow = window;
  const width = 1000;
  const height = 500;
  const left = currentWindow.screenX + (window.outerWidth - width) / 2;
  const top = currentWindow.screenY + (window.outerHeight - height) / 2.5;
  currentWindow.open(url, "", `width=${width},height=${height},left=${left},top=${top}`);
};

function translateWord(word) {
  const dictionaryEntry = dictionary[word];
  if (!dictionaryEntry) {
    if (word.length == 1) {
      return (
        <>
          <b>{ word }</b> <br/>No availible translation
        </>
      );
    }
    if (word.length > 1) {
      const wordSet = new Set();
      const wordParts = word.split('').filter(x => {
        const isADuplicate = wordSet.has(x);
        if (!isADuplicate) wordSet.add(x);
        return !isADuplicate;
      });
      const wordPartsTranslations = wordParts.map(wordPart => (
        <>
          { translateWord(wordPart) }
          <br/>
        </>
      ));
      return wordPartsTranslations;
    }
  } else {
    const translation = dictionaryEntry.length ? 
      dictionaryEntry.flatMap(el => el.translations.map(el => <li style={{ listStyleType: "circle" }}>{ el }</li>))
    : dictionaryEntry.translations.map(el => <li style={{ listStyleType: "circle" }}>{ el }</li>);

    const encodedWord = encodeURIComponent(word);

    return (
      <>
        <b>
          { word } { dictionaryEntry.length ? dictionaryEntry[0].pinyin : dictionaryEntry.pinyin }
        </b> 
        <div style={{ display: "inline-block", float: "right" }}>
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
        <br/>
        <ul style={{ paddingLeft: 20, listStyleType: "circle" }}>
          { translation }
        </ul>
      </>
    );
  }
}

export async function loadDictionary() {
  const startTime = Date.now();
  console.log("Loading zh-en dictionary into memory")
  const dictionaryRaw = await fetch(chrome.runtime.getURL('dictionaries/cedict_1_0_ts_utf-8_mdbg.txt'));
  const lines = (await dictionaryRaw.text()).split('\n');
  for (const line of lines) {
    const [hieroglyphsAndPinyin, ...englishTranslations] = line.split('/');
    const [hieroglyphs, pinyin] = hieroglyphsAndPinyin.split('[');
    const [traditional, simplified] = hieroglyphs.split(' ');
    const newEntry = {
      traditional: traditional,
      pinyin: pinyin.split(']')[0],
      translations: englishTranslations.filter(el => el != "\r")
    };
    if (!dictionary[simplified]) {
      dictionary[simplified] = newEntry;
    } else {
      const entry = dictionary[simplified];
      const entryList = entry.length ? entry : [entry];
      entryList.push(newEntry);
      dictionary[simplified] = entryList;
    }
  }
  const loadTime = (Date.now() - startTime) / 1000; 
  console.log(`Finished loading zh-en dictionary in ${loadTime}s`)

  return dictionary;
}

async function init() {
  await loadDictionary();
}

init();