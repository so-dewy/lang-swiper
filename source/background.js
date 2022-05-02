// eslint-disable-next-line import/no-unassigned-import
import './options-storage.js';
import browser from 'webextension-polyfill';
import { Segment, useDefault } from 'segmentit';
 
const segmentit = useDefault(new Segment());

browser.contextMenus.create({
  id: `cpy-as-md:selection`,
  title: `Grab new vocabulary`,
  contexts: ['selection']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info.selectionText);

  const result = segmentit.doSegment(info.selectionText, {
    simple: true
  });
  console.log(result);
});