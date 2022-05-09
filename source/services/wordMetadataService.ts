import browser from 'webextension-polyfill';

interface WordMetadata {
  word: string,
  level: number
}

interface WordsMetadata { [key: string]: WordMetadata }

export let wordsMetadata: WordsMetadata = {
};

export const setWordMetadata = (wordMetadata: WordMetadata) => {
  browser.storage.local.set({[wordMetadata.word]: wordMetadata});
  wordsMetadata[wordMetadata.word] = wordMetadata;
};

export const setWordMetadataBulk = (bulkMetadata: WordsMetadata) => {
  const words = Object.keys(bulkMetadata);
  for (const word of words) {
    wordsMetadata[word] = bulkMetadata[word];
  }
  browser.storage.local.set(bulkMetadata);
};

export const getWordMetadata = (word): WordMetadata => {
  return wordsMetadata[word];
};

export const loadMetadataFromStorage = async (words) => {
  wordsMetadata = await browser.storage.local.get(words);
};