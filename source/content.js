import tippy, {createSingleton} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

const dictionary = {};

const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

function textNodesUnder(el){
  let textNode;
  const textNodes = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while (textNode = walk.nextNode()) textNodes.push(textNode);
  return textNodes;
}

textNodesUnder(document).forEach(node => {
  const mandarin = node.textContent;
  // const mandarin = node.textContent.split("").filter(char => /\p{Script=Han}/u.test(char)).join("");
  const span = document.createElement('span');
  // const words = segmentit.doSegment(mandarin, { simple: true, stripPunctuation: true });
  const words = Array.from(segmenter.segment(mandarin));
  for (word of words) {
    const wordSpan = document.createElement('span');
    wordSpan.textContent = word.segment;
    wordSpan.className = "word-tooltip";
    wordSpan.after(span);
    span.appendChild(wordSpan);
    node.after(span);
    node.remove();

    wordSpan.addEventListener("mouseenter", event => {
      const word = event.target;
      synthesyseWordSound(word.textContent);

      word._tippy.setContent(`<div style="max-height: 40vh; overflow-y: auto;">${translateWord(word.textContent)}</div>`);
      word._tippy.show();
      
      event.target.style.color = "orange";
    }, false);
    wordSpan.addEventListener("mouseleave", function( event ) {
      event.target.style.color = "";
    }, false);
  }
});

function synthesyseWordSound(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "zh-CN";
  speechSynthesis.speak(utterance);
}

createSingleton(tippy('.word-tooltip'), {
  theme: 'light-border',
  allowHTML: true,
  interactive: true,
  // interactiveDebounce: 999999,
  appendTo: () => document.body
});

function translateWord(word) {
  const dictionaryEntry = dictionary[word];
  if (!dictionaryEntry) {
    if (word.length == 1) {
      return`<b>${word}</b> <br>No availible translation`;
    }
    if (word.length > 1) {
      const wordParts = word.split('');
      const wordPartsTranslations = wordParts.map(wordPart => translateWord(wordPart)).join("<br>");
      return wordPartsTranslations;
    }
  } else {
    const translation = dictionaryEntry.length ? 
      dictionaryEntry.map(el => el.translations.map(el => `<li style="list-style-type:circle;" >${el}</li>`).join("")).join("") 
      : dictionaryEntry.translations.map(el => `<li style="list-style-type:circle;" >${el}</li>`).join("");
    return `<b>${word} ${dictionaryEntry.length ? dictionaryEntry[0].pinyin : dictionaryEntry.pinyin}</b> <br><ul style="padding-left: 20px;list-style-type:circle;">${translation}</ul>`;
  }
}

export async function loadDictionary() {
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
  console.log("Finished loading zh-en dictionary")
  return dictionary;
}

async function init() {
  await loadDictionary();
}

init();