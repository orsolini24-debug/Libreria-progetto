# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal library management web app ("Libreria") with a 3D visual bookshelf UI. Two files only:
- `index.html` — full frontend (vanilla JS, CSS3 3D transforms, localStorage)
- `server.py` — Flask backend that scrapes Mondadori Store for book search

## Running the App

Install Python dependencies (no requirements.txt; install manually):
```bash
pip install requests beautifulsoup4 flask flask-cors urllib3
```

Start the backend:
```bash
python server.py
# Runs on http://localhost:5000
```

Open `index.html` directly in a browser. No build step needed.

## Architecture

### Frontend (index.html)
Single-file app with no frameworks. All state lives in `localStorage` as a JSON array of book objects.

**Key JS objects:**
- `app` — core data management: `init()`, `save()`, `delete()`, `reset()`, `render()`
- `ui` — UI state: `openPanel()`, `closePanel()`, `fillForm()`, `openModal()`
- `searchEngine` — debounced async search (1000 ms), calls the Flask backend

**Book data model:**
```js
{ id, title, author, status, note, cover, link }
// status: "reading" | "read" | "toread" | "wishlist"
```

**Rendering zones:** `#zone-reading` (3D book covers), `#zone-read` / `#zone-toread` (spine view on shelf), `#zone-wishlist` (cards).

### Backend (server.py)
Single Flask endpoint: `GET /cerca?q=<query>`

Scrapes `https://www.mondadoristore.it/search/?g={query}&bi=1` using BeautifulSoup, returns up to 10 books as JSON: `[{ title, author, publisher, cover, link }]`.

SSL verification is disabled (`verify=False`) to handle certificate issues on the target site. User-agent is spoofed to a Chrome browser string.

**Scraper fragility:** CSS selectors (`.link-data-product`, `.link-data-author`) are tightly coupled to Mondadori's current HTML. A site redesign will break search.

## Language

UI labels and code comments are in Italian. The target bookstore is Italian (Mondadori Store).
