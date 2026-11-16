# Leon Visual Runtime — architektura modułowa

## Zasada
Jeden wspólny runtime, wiele niezależnych konfiguracji stron. Dotychczasowy Visual Engine (hero i kafelki strony głównej) pozostaje bez zmian. Nowy runtime obsługuje wyłącznie jawnie oznaczone elementy `data-leon-visual-src`, więc nie przejmuje cudzych selektorów ani nie zmienia starych grafik.

## Slot HTML
Pojedyncza grafika:
```html
<section class="case-visual" data-leon-visual-src="menu/example.webp" data-leon-visual-mode="single">
  <h2>Opis pozostaje tekstem HTML</h2>
</section>
```

Atlas 5×2, segment nr 3:
```html
<div class="case-visual" data-leon-visual-src="menu/atlas.webp"
     data-leon-visual-mode="grid" data-leon-visual-columns="5"
     data-leon-visual-rows="2" data-leon-visual-index="3"></div>
```

Wycinki nieregularne używają `data-leon-visual-mode="regions"` i `data-leon-visual-regions` jako tablicy JSON prostokątów `x,y,width,height`.

## Bezpieczeństwo i wydajność
- tylko lokalne pliki graficzne w katalogu runtime; blokada obcych originów i ścieżek traversal;
- brak `innerHTML`, wykonywania kodu z danych, zewnętrznych skryptów i event-handlerów inline;
- limit 100 segmentów zgodny z segmenterem;
- leniwe ładowanie przez IntersectionObserver (margines 160 px), fallback bez niego;
- współdzielony cache obrazów i segmentów; zwalnianie object URL przy pagehide;
- semantyczna treść pozostaje w HTML, grafika jest warstwą dekoracyjną;
- brak wymuszonej animacji; respektowanie prefers-reduced-motion.

## API
`window.LeonVisualRuntime.getStatus()` zwraca wersję, liczbę slotów, renderowanych, błędów i oczekujących. `scan(root)` skanuje nowo dodany fragment DOM.

## Etap wdrożenia
Runtime jest dostarczony jako osobny moduł. Nie jest jeszcze dołączony do stron produkcyjnych ani nie zmienia zachowania istniejącego silnika. Najpierw testy kontraktowe, potem włączenie na jednej podstronie i dopiero stopniowe rozszerzanie.
