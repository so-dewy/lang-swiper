import browser from 'webextension-polyfill';
import * as Papa from 'papaparse';

const level1Count = document.getElementById("level1");
const level2Count = document.getElementById("level2");
const level3Count = document.getElementById("level3");
const level4Count = document.getElementById("level4");

browser.storage.local.get(null).then(data => {
  console.log(data);
  const words = Object.keys(data);
  console.log(words);
  const counter = [0, 0, 0, 0];
  for (const word of words) {
    const metadata = data[word];
    if (metadata && metadata.level && !isNaN(metadata.level)) {
      const level = +metadata.level;
      counter[level - 1]++;
    }
  }
  if (level1Count) level1Count.textContent = counter[0].toString();
  if (level2Count) level2Count.textContent = counter[1].toString();
  if (level3Count) level3Count.textContent = counter[2].toString();
  if (level4Count) level4Count.textContent = counter[3].toString();
});


const csvDownload = (data) => {
  const date = new Date();
  const filename = `words-metadata-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}.csv`;
  const csv = Papa.unparse(data);

  const blob = new Blob([csv], {
    type: 'text/plain;charset=utf-8',
  })

  //@ts-ignore
  if (navigator.msSaveBlob) {
    //@ts-ignore
    navigator.msSaveBlob(blob, filename)
    return
  }

	const url = window.URL.createObjectURL(blob);
	let a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	window.URL.revokeObjectURL(url);
};

const sendMessage = (message) => {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    const activeTab = tabs[0];
    if (activeTab.id) {
      browser.tabs.sendMessage(activeTab.id, message);
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const exportWordsButton = document.getElementById("exportWords");
  if (!exportWordsButton) return;

  exportWordsButton.addEventListener("click", _event => {
    browser.storage.local.get(null).then(data => {
      const words = Object.keys(data);
      const rows: any[] = [];
      for (const word of words) {
        const wordData = data[word];
        if (wordData) {
          rows.push({
            word,
            level: wordData.level,
            preferredTranslation: wordData.preferredTranslation
          })
        }
      }

      csvDownload(rows);
    });
  });

  const importWordsButton = document.getElementById("importWords");
  if (!importWordsButton) return;

  importWordsButton.addEventListener("click", _event => {
    sendMessage({ type: "importWords" });
  });
});