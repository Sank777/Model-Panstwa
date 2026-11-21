# Dane spraw Centrum Jawności — kontrakt danych v1

## Cel
Każda sprawa ma jeden trwały identyfikator i jeden rekord w `assets/cases/index.json`. Biblioteka, karta szczegółowa, wyszukiwarka i moduły graficzne mają korzystać z tego samego rekordu. Nie tworzymy oddzielnych, rozjeżdżających się kopii tytułów i statusów.

## Co jest już w rejestrze
- 8 rzeczywistych kart SWS-PL-001–008;
- 1 scenariusz edukacyjny, jawnie oddzielony od spraw rzeczywistych;
- 11 tematów rozważanych w ścieżce obywatelskiej NIK oraz temat PSP/OSP jako dwunasty;
- odnośniki źródłowe przepisane z obecnej biblioteki.

**Ważne:** status `zebrano_linki` oznacza wyłącznie, że biblioteka zawiera odnośniki. Nie oznacza, że raport został ponownie pobrany, przeczytany i zweryfikowany w ramach obecnego audytu. Tematy NIK mają status `do_weryfikacji`, dopóki nie zostaną zebrane dokumenty źródłowe.

## Struktura rekordu sprawy
- `id`: stały identyfikator, np. SWS-PL-001;
- `slug`: identyfikator istniejącej karty;
- `title`, `category`, `institution`;
- `status`: status merytoryczny sprawy, nie ocena winy;
- `evidenceStatus`: postęp pracy z materiałem dowodowym;
- `summary`, `scope`;
- `sources[]`: etykieta, URL i typ dokumentu;
- `sections[]`: uporządkowane sekcje opracowania, wypełniane dopiero po analizie źródeł;
- `visual`: klucz lokalnej ilustracji.

## Statusy materiału
1. `do_weryfikacji` — temat wskazany, źródła nieustalone.
2. `zebrano_linki` — zapisano tropy/odnośniki, bez deklaracji ponownej weryfikacji.
3. `dokumenty_pobrane` — pozyskano dokumenty źródłowe i zapisano ich metadane.
4. `dane_zweryfikowane` — sprawdzono liczby, daty, zakres, strony i kontekst w dokumentach.
5. `karta_opracowana` — gotowe opracowanie przeszło kontrolę merytoryczną i prawną.
6. `wymaga_aktualizacji` — pojawił się nowy dokument, odpowiedź, odwołanie lub zmiana statusu.

## Sekcja danych
Docelowo każda sekcja ma postać:
```json
{
  "id": "findings",
  "title": "Ustalenia organu",
  "items": [
    {
      "text": "Treść ściśle oparta na źródle",
      "kind": "finding",
      "sourceIds": ["src-01"],
      "date": null,
      "scope": "Zakres próby lub okres, którego dotyczy informacja"
    }
  ]
}
```
Dozwolone rodzaje wpisów: `fact`, `finding`, `party_position`, `hypothesis`, `open_question`, `system_lesson`. Hipotezy i pytania nie mogą być renderowane jako ustalenia organu.

## Rejestr źródeł i cytowanie
Każdy dokument w `sources[]` powinien otrzymać stabilny `sourceId`, nazwę, instytucję, typ, datę dokumentu, datę publikacji, URL, zakres stron/rozdziałów oraz datę ostatniego sprawdzenia. Liczby muszą mieć jednostkę, okres, zakres próby i źródło. Gdy PDF lub strona nie jest dostępna, wpisujemy brak i nie uzupełniamy treści domysłem.

## Obieg opracowania
1. Wybierz temat i sprawdź, czy nie istnieje już karta.
2. Otwórz źródło pierwotne; nie opieraj opracowania wyłącznie na komunikacie prasowym.
3. Zapisz dokument i metadane, zakres, daty oraz właściwe instytucje.
4. Wypisz ustalenia organu osobno od stanowisk stron i komentarzy.
5. Przepisz liczby z jednostkami, okresem i zakresem próby; przelicz je niezależnie.
6. Zbierz odpowiedzi jednostek, zalecenia, zastrzeżenia, odwołania i wykonanie zaleceń.
7. Zapisz luki oraz pytania otwarte.
8. Przeprowadź kontrolę merytoryczną, prawną i prywatności.
9. Zaktualizuj rekord JSON i wygeneruj kartę z tego rekordu.
10. Dopiero po zatwierdzeniu opublikuj wersję.

## Grafiki — szybkie dostarczanie
- Oryginał wygenerowany przez ImageGen jest plikiem źródłowym, nie plikiem do bezpośredniego wyświetlania na każdej karcie.
- Do repozytorium trafiają zoptymalizowane warianty WebP: 640 px dla kafelków i 1280 px dla dużego widoku.
- Domyślna jakość kodowania: 78; orientacyjne limity: 90 KB (640 px) i 220 KB (1280 px). Jeśli obraz przekracza limit, ponawiamy kompresję lub upraszczamy grafikę.
- Usuwamy metadane EXIF i zbędne profile; nie zmniejszamy czytelności ważnych szczegółów.
- Kafelki: `loading="lazy"`, `decoding="async"`, `srcset` i `sizes`.
- Główna ilustracja pierwszego ekranu: wariant 1280 px, `fetchpriority="high"`; preload tylko gdy obraz jest rzeczywiście głównym elementem widoku.
- Wszystkie pliki lokalnie, bez CDN, trackerów i zewnętrznych żądań.
- Zachowujemy alt text i podpis „Ilustracja poglądowa”, gdy grafika nie jest zdjęciem dokumentacyjnym.
- Nie używamy sprite atlasów do indywidualnych kart spraw.

## Migracja istniejących kart
Rejestr v1 porządkuje metadane i źródła, ale nie udaje, że cała zawartość została już przeniesiona. Obecne sekcje HTML są warstwą zgodności. Każdą sprawę przenosimy do struktury `sections[]` po ponownej analizie źródeł, zachowując treść i identyfikator. Nie kasujemy starej zawartości, dopóki nowa karta nie przejdzie testu porównawczego.
