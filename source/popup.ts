import browser from 'webextension-polyfill';
import * as Papa from 'papaparse';

const csvDownload = (data) => {
  const filename = "export.csv";
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
    browser.tabs.sendMessage(activeTab.id, { wordMetadata: message, type: "wordMetadata" });
  });
};

const exportWordsButton = document.getElementById("exportWords");
exportWordsButton.addEventListener("click", _event => {
  browser.storage.local.get(null).then(data => {
    const words = Object.keys(data);
    const rows = [];
    for (const word of words) {
      const wordData = data[word];
      if (wordData) {
        rows.push({
          word,
          level: wordData.level
        })
      }
    }

    csvDownload(rows);
  });
});

let rowCounter = 0;
let wordMetadataBatch = {};

const importWordsButton = document.getElementById("importWords");
importWordsButton.addEventListener("click", _event => {
  console.log("click");
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => { 
    const file = (e.target as HTMLInputElement).files[0]; 
    Papa.parse(input.files[0], {
      worker: true,
      header: true,
      step: (row) => {
        rowCounter++;
        if (rowCounter == 500) {
          sendMessage(wordMetadataBatch);
          rowCounter = 0;
          wordMetadataBatch = {};
        } else {
          wordMetadataBatch[row.data.word] = { level: row.data.level };
        }
      },
      complete: () => {
        console.log("All done!");
      }
    });
  }
  input.click();
});