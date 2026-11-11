# Muni

A Chrome extension that turns any topic into flashcards and shows them to you while you browse, using spaced repetition so they stick.

## Features

- **Generate cards:** type a topic or paste your notes, then choose the question types (flashcard, true or false, identification, multiple choice) and how many units and cards you want. Muni asks ChatGPT in a small popup window and reads the answer, so you don't need an API key.
- **Library:** organize your cards into modules and units. The library replaces your new tab page.
- **Reviews while you browse:** cards pop up on the pages you visit. Each answer updates when the card comes back, so the gap grows as you learn it.

> Cards are written by AI and can contain mistakes. Check them before you study.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `client` folder.

## Built with

JavaScript and the Chrome Extensions API (Manifest V3).
