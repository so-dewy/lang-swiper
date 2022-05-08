export const getAllTextNodes = () => {
  let textNode;
  const textNodes = [];
  const walk = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
  while (textNode = walk.nextNode()) {
    // Filter out empty space nodes and nodes without mandarin
    if (/^\s+$/.test(textNode.textContent) || !(/\p{Script=Han}/u.test(textNode.textContent))) continue;

    textNodes.push(textNode);
  }
  return textNodes;
};