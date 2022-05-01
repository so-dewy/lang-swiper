// eslint-disable-next-line import/no-unassigned-import
import './options-storage.js';
import browser from 'webextension-polyfill';

browser.contextMenus.create({
  id: `cpy-as-md:selection`,
  title: `Grab new vocabulary`,
  contexts: ['selection']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info.selectionText);
});