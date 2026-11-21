# Ilustracje kart Centrum Jawności

Każda sprawa otrzymuje własny plik ilustracji w tym katalogu. Preferowany jest lokalny SVG (gdy grafika jest ilustracyjna) albo zoptymalizowany WebP (gdy powstaje obraz rastrowy). Nie hotlinkujemy grafik z obcych serwerów.

## Podłączenie do karty

1. Dodaj nowy plik, np. `assets/cases/nazwa-sprawy.svg`.
2. Dodaj klucz do mapy `visuals` w `assets/case-visuals.js`: ścieżkę i opis alternatywny.
3. Na kafelku biblioteki dodaj `data-case-visual="nazwa-sprawy"`.
4. Na stronie sprawy ustaw ten sam atrybut na `.case-hero`. Wspólny szablon `sprawa.html` przenosi atrybut z kafelka automatycznie.
5. Sprawdź lokalny adres pliku, tekst alternatywny, kontrast, responsywność i czy ilustracja nie sugeruje faktów, których nie potwierdzają źródła.

Grafiki są poglądowe, nie zastępują dokumentów źródłowych ani fotografii dowodowych. Każda nowa karta powinna otrzymać grafikę dobraną do konkretnego tematu; nie używaj jednej przypadkowej ilustracji do wielu różnych spraw.
