# LangSwiper - Language learner's helper (Mandarin to English only currently)
This tool's purpose it to help aquire vocabulary by going head first into reading foreign language texts, books on the websites. 
## Video preview
TODO
## Screenshots
TODO
## Features
- Word translation in a popup (works without internet)
- Autoplay mode will read out loud the pronunciation and translation to you, then after a some time (configurable in options) move to the next word
- 4 levels of word recognition, higher levels are skipped faster
- Import\export of the words you studied with their levels
## Motivation for this extension
When I was a teenager I was reading a lot of foreign novels but often the translations were dropped midway. After this happening again I thought: "Screw it, I'm just going to read the rest in English". 

So I went and did just that, using only Google Translate extension to translate individual words I didn't know. It was hard at the start because I barely knew any English but because I really wanted to finish the book I went on. Surprisingly to me my vocabulary improved by leaps and bounds, I could feel the progress and I was addicted to this feeling. Lo and behold about a year and a half in I was easily reading books in English rarely looking up unknown words. As often I started to guess the meaning of new words by context.

Right now I really miss that feeling of rapid language acquisition. Wrist pain (RSI) prevents me from using the old method. Because to translate the word you have to double click it to highlight and click on translation popup button (ouch).

Thus this extension was born, I developed a way to make browser automatically show the word translation, read it out loud and then move to the next word after some time. Reducing hand input to the minimum. That feeling of fast progrees unlocked again.

## Getting started
### 🛠 Build and install prod extension file (.crx) locally

1. Checkout the copied repository to your local machine eg. with `git clone https://github.com/so-dewy/lang-swiper/`
1. Run `npm install` to install all required dependencies
1. Run `npm run build` to create the `distribution` folder, this folder will contain the generated extension code
1. In Chrome navigate to `chrome://extensions/`
1. Click `Pack extension` button and set path to `distribution` folder and generate .crx file
1. Navigate to the generated .crx file on your computer
1. Drag the .crx file onto browser window. The extension should be up and running

### 🏃 Run the extension in developer mode

Using [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) is recommened for automatic reloading and running in a dedicated browser instance. Alternatively you can load the extension manually (see below).

1. Run `npm run watch` to watch for file changes and build continuously
1. Run `npm install --global web-ext` (only only for the first time)
1. In another terminal, run `web-ext run -t chromium --arg="--window-size=1920,1080" --arg="--auto-open-devtools-for-tabs"`
1. Check that the extension is loaded by opening the extension options ([in Firefox](media/extension_options_firefox.png) or [in Chrome](media/extension_options_chrome.png)).

## TODO
- [ ] Button to close translation popup
- [ ] Word colors config
- [ ] TTS voices config (which voice, rate)
- [ ] Extension on/off mode (maybe by a hotkey) for user convenience
- [ ] Convert CEDICT dictionary to JSON (for faster load time?) instead of parsing this txt file line by line. Research background page capabilites for this, maybe it can be cached there instead of loading it on every refresh of the page
- [ ] Style translation popup and stats popup more professionally
- [ ] Investigate funky styling on this page https://reject.tokyo/uncaught-error-extension-context-invalidated/
- [ ] Fix baidu popup
