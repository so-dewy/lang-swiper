import browser from 'webextension-polyfill';

export const dictionary = {};

export async function loadDictionary() {
  const startTime = Date.now();
  console.log("Loading zh-en dictionary into memory")
  const dictionaryRaw = await fetch(browser.runtime.getURL('dictionaries/cedict_1_0_ts_utf-8_mdbg.txt'));
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