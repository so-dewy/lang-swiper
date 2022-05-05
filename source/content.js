import optionsStorage from './options-storage.js';
import { createRoot } from 'react-dom/client';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css'

const dictionary = {};
const notice = document.createElement('div');

const segmenter = new Intl.Segmenter(['zh'], {
  granularity: 'word',
});

function textNodesUnder(el){
  var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while (n = walk.nextNode()) a.push(n);
  return a;
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
    wordSpan.after(span);
    span.appendChild(wordSpan);
    node.after(span);
    node.remove();

    wordSpan.addEventListener("mouseenter", event => {
      const word = event.target.textContent;
      synthesyseWordSound(word);
      notice.innerHTML = translateWord(word);
      
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

function translateWord(word) {
  const dictionaryEntry = dictionary[word];
  console.log(dictionaryEntry);
  if (!dictionaryEntry) {
    if (word.length == 1) {
      return`${word}: No availible translation`;
    }
    if (word.length > 1) {
      const wordParts = word.split('');
      const wordPartsTranslations = wordParts.map(wordPart => translateWord(wordPart)).join("<br>");
      return wordPartsTranslations;
    }
  } else if (dictionaryEntry.length) {
    const translation = dictionaryEntry.map(el => el.translations.join("<br>")).join("<br>");
    return `${word}: ${translation}`;
  } else {
    const translation = dictionaryEntry.translations.join("<br>");
    return `${word}: ${translation}`;
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
	const options = await optionsStorage.getAll();
	const color = 'rgb(' + options.colorRed + ', ' + options.colorGreen + ',' + options.colorBlue + ')';
	document.body.append(notice);
	notice.id = 'text-notice';
	notice.style.border = '2px solid ' + color;
	notice.style.color = color;

  await loadDictionary();
}

init();

function App() {
  console.log("hello");
  return <div>
    Hello World

    <Tooltip trigger={['click']} overlay={<span>tooltip</span>}>
      <a href="#">hover</a>
    </Tooltip>
  </div>;
}
const root = createRoot(notice);

root.render(<App />);