# Standard wizualny grafik Centrum Jawności — wzorzec stały 1.0

**Status:** zatwierdzony przez użytkownika na podstawie pięciu zrzutów ekranu.
**Zakres:** wszystkie grafiki i ilustracje Centrum Jawności, w szczególności 11 analiz opartych na materiałach NIK, karty spraw, kafelki katalogu i ilustracje objaśniające.
**Reguła:** domyślny i obowiązujący standard dla kolejnych prac nad stroną. Nie zmieniamy go samodzielnie ani nie zastępujemy przypadkowymi grafikami stockowymi.

## 1. Charakter obrazu

Docelowy styl to **nowoczesna, realistyczna, szczegółowa ilustracja o jakości fotografii prasowej / wizualizacji infrastruktury**, z wyraźnym światłem, głębią i kontrolowanymi akcentami kolorystycznymi.

Obraz ma wyglądać jak starannie przygotowany kadr z profesjonalnej sesji lub realistycznej rekonstrukcji sytuacji, a nie płaski piktogram, prosty clipart, abstrakcyjna tapeta technologiczna czy gęsty schemat sieci.

Cechy obowiązkowe:
- wysoki poziom szczegółów w głównym obiekcie i otoczeniu;
- realistyczne materiały, proporcje, urządzenia, architektura i oświetlenie;
- czytelny główny temat, mocna kompozycja i wyraźny punkt skupienia;
- światło kierunkowe, refleksy, rozjaśnienia krawędzi i subtelna poświata;
- głębia przestrzeni, kontrast pierwszego i dalszego planu;
- dodatkowe kolory użyte celowo, aby rozróżniać ważne elementy i statusy;
- profesjonalny, nowoczesny, techniczny, ale wiarygodny charakter;
- obraz ma pozostać czytelny także po zmniejszeniu do miniatury.

## 2. Kolor i światło

Kolorystyka obrazu powinna współgrać z ciemnym, granatowo-niebieskim interfejsem strony:
- granat, stalowy błękit i chłodne odcienie niebieskiego jako baza;
- turkus i cyjan jako światło ekranów, sygnały systemowe i akcenty technologiczne;
- biel i jasny błękit jako refleksy, światła robocze i podkreślenia detali;
- czerwony/pomarańczowy wyłącznie dla zagrożeń, alarmu, awarii lub punktu krytycznego;
- zieleń dla poprawnego działania, bezpieczeństwa, zakończonych działań i pozytywnych rezultatów;
- naturalne barwy środowiska zachowują realizm sceny.

Światło ma wydobywać szczegóły, a nie zalewać całego kadru neonem. Dopuszczalne są mocniejsze świetlne akcenty i subtelny glow, ale bez przesadnego HDR, przesycenia i sztucznego cyberpunkowego wyglądu.

## 3. Realizm i gęstość kompozycji

- Pokazujemy konkretną scenę i konkretny obiekt: np. realistyczną rozdzielnię energetyczną, szafę sterowania, centrum monitoringu, wał przeciwpowodziowy, szpital, plac budowy, dokumenty lub obiekt schronienia.
- Scena ma mieć wystarczająco dużo kontekstu, aby widz rozumiał, czego dotyczy sprawa.
- Nie zagęszczamy obrazu nadmiarem kabli, przewodów, linii, połączeń, ikon, paneli i przypadkowych elementów.
- Sieć energetyczna ma wyglądać jak prawdziwa infrastruktura, a nie fantazyjna pajęczyna przewodów.
- Jeśli pokazujemy cyberatak, przedstawiamy wiarygodny kontekst zagrożenia (np. pojedynczą szafę sterowania z sygnałem nieautoryzowanego dostępu), bez instruktażowych detali umożliwiających atak.
- Każdy obraz ma jedną główną historię. Dodatkowe szczegóły wspierają temat, nie konkurują z nim.
- Nie tworzymy przypadkowych kolaży wielu niezwiązanych scen.

## 4. Trzy rodzaje grafiki na karcie

1. **Ilustracja główna / hero** — szeroki, realistyczny kadr 16:9; mocny temat, kontekst miejsca, szczegóły i światło.
2. **Ilustracja analityczna** — realistyczna scena lub czytelny, profesjonalny schemat objaśniający zależności. Schemat może być wektorowy, ale ma być precyzyjny i uporządkowany.
3. **Ilustracje pomocnicze / miniatury** — osobne, tematyczne obrazy dla galerii i katalogu 11 przykładów. Nie używamy jednej grafiki do wszystkich kart ani atlasów sprite'ów.

Każda karta dobiera własne obrazy do własnej treści. Nie kopiujemy sceny cyberbezpieczeństwa do powodzi, budżetu, zdrowia czy mieszkalnictwa.

## 5. Spójność z interfejsem strony

Grafika ma współpracować z zatwierdzonym interfejsem: ciemny granat i głęboki błękit; karty z delikatnym niebieskim obramowaniem i zaokrągleniami; białe nagłówki; turkusowe i cyjanowe akcenty; zielone oznaczenia pozytywnych wniosków; czerwone oznaczenia realnych zagrożeń; jasne, czytelne podpisy i kontrast.

Nie wolno zastępować wzorca strony przypadkowym układem ani tworzyć galerii, która wygląda jak osobny, niespójny serwis. Obowiązuje wspólna nawigacja i szablon strony głównej.

## 6. Wiarygodność i uczciwe oznaczenia

- Ilustracja wygenerowana lub rekonstrukcyjna jest podpisywana jako „Ilustracja poglądowa” / „Rekonstrukcja poglądowa”.
- Nie przedstawiamy wygenerowanej sceny jako zdjęcia dokumentującego prawdziwe zdarzenie.
- Nie umieszczamy fikcyjnych logotypów organów, nieprawdziwych pieczęci, czytelnych zmyślonych dokumentów ani nazwisk.
- Nie sugerujemy winy konkretnej osoby ani nieudokumentowanego zdarzenia.
- Liczby i fakty na stronie pochodzą z materiałów źródłowych; generator obrazu nie jest źródłem faktów.
- Jeśli scena jest hipotetyczna (np. atak na rozdzielnię), podpis wyjaśnia, że jest to przykład ryzyka, a nie rekonstrukcja potwierdzonego incydentu.

## 7. Reguły przygotowania plików

- Obrazy generujemy indywidualnie dla konkretnej karty i roli obrazu.
- Zachowujemy oryginał źródłowy poza stroną; do repozytorium trafiają zoptymalizowane warianty WebP.
- Docelowo: wariant 1280 px dla hero i 640 px dla miniatur; srcset, sizes, width, height, alt, decoding=async i loading=lazy dla obrazów poza pierwszym ekranem.
- fetchpriority=high i preload wyłącznie dla głównego obrazu widocznego od razu.
- Usuwamy zbędne metadane, kontrolujemy wagę pliku i czytelność detali po kompresji.
- Zasoby przechowujemy lokalnie; bez trackerów, zewnętrznych CDN i zbędnych bibliotek.
- Nie używamy atlasów sprite'ów. Każda scena jest osobnym plikiem.
- Po optymalizacji sprawdzamy obraz w rozmiarze pełnym, na karcie i jako miniaturę.

## 8. Stały szablon promptu do generowania

> Stwórz szeroką, nowoczesną, fotorealistyczną ilustrację redakcyjną do profesjonalnego portalu analizy spraw publicznych. Pokaż [KONKRETNY OBIEKT I SCENĘ] w wiarygodnym, rzeczywistym otoczeniu. Wysoka szczegółowość głównego obiektu, realistyczne materiały, poprawna konstrukcja i proporcje, wyraźny punkt skupienia, naturalna głębia przestrzeni. Oświetlenie kierunkowe z jasnymi refleksami, delikatnymi rozjaśnieniami i subtelną poświatą. Kolorystyka: głęboki granat i stalowy błękit, akcenty cyjanowe/turkusowe; czerwony lub pomarańczowy tylko dla zagrożenia, zielony dla bezpiecznego rezultatu. Profesjonalna jakość fotografii prasowej / realistycznej wizualizacji, czytelna kompozycja 16:9. Nie przesadzaj z liczbą przewodów, linii, ikon ani ekranów. Bez przypadkowych kolaży, bez abstrakcyjnej pajęczyny sieci, bez nadmiernego neonowego HDR, bez fikcyjnych logotypów i bez czytelnych zmyślonych napisów. Obraz ma przedstawiać temat, a nie udawać dokumentację prawdziwego zdarzenia.

## 9. Kontrola jakości przed dodaniem grafiki

Każdy obraz przechodzi krótką kontrolę:
1. Czy temat jest od razu rozpoznawalny?
2. Czy obiekt i otoczenie są realistyczne technicznie?
3. Czy szczegóły są bogate, ale nieprzeładowane?
4. Czy światło, refleksy i dodatkowe kolory poprawiają czytelność?
5. Czy kadr pasuje do granatowo-niebieskiej strony?
6. Czy po zmniejszeniu nadal widać główny temat?
7. Czy podpis uczciwie określa obraz jako poglądowy lub dokumentacyjny?
8. Czy plik jest zoptymalizowany i lokalny?

Jeżeli obraz nie przechodzi kontroli, poprawiamy lub generujemy go ponownie. Nie publikujemy go tylko dlatego, że został wygenerowany.

## 10. Zasada stosowania w kolejnych rozmowach i pracach

Przy każdej przyszłej pracy nad stroną Model Państwa / Centrum Jawności należy traktować ten dokument i zatwierdzone zrzuty ekranu jako nadrzędny wzorzec wizualny. Nie trzeba ponownie pytać użytkownika o styl. Nowe grafiki mają domyślnie spełniać te wymagania. Odstępstwo jest dopuszczalne wyłącznie na wyraźne życzenie użytkownika.