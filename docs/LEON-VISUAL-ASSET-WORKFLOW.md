# Leon — stały system dodawania grafik

## Zasada nadrzędna

**ChatGPT tworzy propozycję grafiki → właściciel projektu ją akceptuje → dopiero wtedy zapisujemy ją jako plik → rejestrujemy plik w manifeście → silnik wyświetla zatwierdzony plik → sprawdzamy stronę po wdrożeniu.**

Silnik nie projektuje ilustracji, nie rysuje jej z CSS/SVG i nie zastępuje zatwierdzonego obrazu własnym pomysłem. Jego zadaniem jest wyłącznie wczytać wskazany plik, ewentualnie wyciąć wskazany fragment atlasu, i wyświetlić go.

## Stały przebieg

1. **Projekt graficzny** — Leon przygotowuje grafikę w ChatGPT zgodnie z opisem miejsca, proporcjami, stylem i treścią.
2. **Akceptacja** — użytkownik zatwierdza konkretną wersję. Bez akceptacji nie trafia ona do strony ani do głównego rejestru.
3. **Przygotowanie pliku** — zachowujemy zaakceptowany oryginał w archiwum źródeł, a do strony przygotowujemy plik produkcyjny PNG/WebP/JPG. Nie odtwarzamy ilustracji kodem. Jeśli to atlas, zapisujemy też wymiary, liczbę kolumn/wierszy, odstępy i kolejność pól.
4. **Rejestracja** — dodajemy jeden wpis do `assets/visual-registry.json`: identyfikator miejsca, ścieżkę pliku, tryb `single` albo `grid`, a dla atlasu indeks pola oraz opis tekstowy.
5. **Walidacja i budowanie** — `node scripts/build-visual-assets.mjs` sprawdza istnienie pliku, bezpieczną ścieżkę, kompletność wpisu, indeks atlasu i generuje `assets/visual-rom.js`.
6. **Test** — `node scripts/build-visual-assets.mjs --check` oraz `node --test tests/*.test.cjs`. CI wykonuje te kontrole przy każdej zmianie rejestru, silnika lub testów.
7. **Publikacja i odbiór** — po wdrożeniu otwieramy stronę i sprawdzamy docelowy kafelek/hero na telefonie i komputerze. Dopiero pozytywny odbiór zamyka zadanie.

## Jak dodać nową grafikę

### Jedna grafika do jednego miejsca
- Zapisz zaakceptowany plik w `assets/menu/` lub w odpowiednim katalogu tematycznym.
- W odpowiednim rekordzie manifestu ustaw `"mode": "single"` i `"asset": "menu/nazwa-pliku.webp"`.
- Nie podawaj `spriteIndex`. Silnik wyświetli dokładnie cały wskazany plik.

### Grafika z atlasu
- Ustaw `"mode": "grid"`, wspólny plik atlasu, `spriteIndex` i parametry `spriteGrid`.
- Indeks zaczyna się od zera, od lewego górnego pola, następnie czytany jest wierszami.
- Nie zmieniaj paddingu, odstępów ani kolejności bez sprawdzenia wymiarów rzeczywistego atlasu.

## Jedno źródło prawdy

- `assets/visual-registry.json` — edytowalny rejestr zatwierdzonych grafik.
- `assets/visual-rom.js` — plik generowany automatycznie; nie edytować ręcznie.
- `assets/visual-engine.js` — wyświetla zasoby, nie tworzy ilustracji.
- `assets/visual-segmenter.js` — wycina fragmenty atlasów tylko wtedy, gdy manifest określa tryb `grid`.
- `scripts/build-visual-assets.mjs` — sprawdza rejestr i generuje ROM.

## Reguły bezpieczeństwa i jakości

- Brak pliku, błędny indeks lub niezgodny manifest blokuje walidację i publikację.
- Nie wolno automatycznie zastępować brakującej grafiki nowym SVG, gradientem ani inną ilustracją.
- Każdy zasób ma stabilną nazwę i jawne przypisanie do miejsca.
- Po podmianie pliku zmieniamy wersję rejestru/parametr cache, żeby przeglądarka nie pokazywała starej kopii.
- Grafika nie zastępuje semantycznego tekstu HTML tam, gdzie tekst strony jest osobną treścią; w atlasach, które już zawierają napisy, silnik nie dokłada drugich etykiet.

## Warunek zakończenia

Zadanie jest zakończone dopiero, gdy: manifest przechodzi walidację, plik istnieje, ROM jest zgodny z manifestem, testy CI przechodzą, Pages wdroży stronę, a rzeczywisty widok został sprawdzony. Sam zielony test nie oznacza jeszcze odbioru wizualnego.
