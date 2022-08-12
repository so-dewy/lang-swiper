import browser from 'webextension-polyfill';

export interface WordMetadata {
  level: number,
  preferredTranslation?: string
}

export interface WordMetadataDictionary { [key: string]: WordMetadata }

export let wordsMetadata: WordMetadataDictionary = {
};

export const setWordMetadata = (word: string, wordMetadata: WordMetadata) => {
  browser.storage.local.set({[word]: wordMetadata});
  wordsMetadata[word] = wordMetadata;
};

export const setWordMetadataBulk = (bulkMetadata: WordMetadataDictionary, persist: boolean) => {
  const words = Object.keys(bulkMetadata);
  for (const word of words) {
    wordsMetadata[word] = bulkMetadata[word];
  }
  if (persist) {
    browser.storage.local.set(bulkMetadata);
  }
};

export const getWordMetadata = (word): WordMetadata => {
  return wordsMetadata[word];
};

export const loadMetadataFromStorage = async (words: string[]) => {
  wordsMetadata = await browser.storage.local.get(words);
};