# Leon Visual Engine — V2 foundation

## Cel i reguła nadrzędna
Silnik ma odtwarzać stały język wizualny strony, a nie losować nowy styl przy każdym wywołaniu. Obraz jest wyłącznie warstwą fotograficzną. Tytuły, ikony, obramowania, gradienty, siatka i interakcje pozostają HTML/CSS.

## Stałe cechy każdej grafiki
- Fotografia dokumentalna/editorial, realistyczne materiały i proporcje.
- Wspólna baza granatowo-łupkowa, miękkie kierunkowe światło, podobny kontrast i charakter obiektywu.
- Kadr poziomy 3:2, 1536×1024; jeden czytelny temat, średnio-szeroki plan.
- Dolne 22% spokojniejsze i ciemniejsze pod tekst HTML; ważny temat poza krawędziami kadru.
- Bez tekstu, liter, cyfr, logotypów, znaków wodnych, UI, ikon, ramek, ilustracji i kolaży.
- Zmienna jest wyłącznie scena filaru i jej delikatny akcent kolorystyczny.
- Prompt ma wersję; zmiana reguł wymaga podniesienia wersji i porównania wyników.

## Architektura V2
1. Panel administratora (do wykonania w osobnym etapie) wysyła tylko identyfikator filaru i opcjonalną krótką notatkę.
2. Supabase Edge Function weryfikuje token przez Auth i sprawdza role w nieedytowalnym `app_metadata`.
3. Dostęp ma administrator główny albo administrator z modułem `visual-assets`.
4. Serwer składa prompt z niezmiennych reguł i jednej z 10 zamkniętych scen.
5. OpenAI Images API generuje jeden plik WebP.
6. Backend sprawdza sygnaturę pliku, rozmiar, zapisuje go jako wersję roboczą w prywatnym bucketcie.
7. Zwraca tymczasowy podpisany URL do podglądu; plik nie jest publikowany automatycznie.
8. Każde wywołanie jest audytowane w istniejącym `admin_audit_log`; limit V2: 8 żądań na administratora na 24 godziny.
9. Akceptacja i publikacja będą oddzielnym krokiem. Wdrożenie nie może zastępować aktywnych obrazów automatycznie.

## Zasady bezpieczeństwa
- Klucze OpenAI i Supabase service-role tylko jako sekrety serwerowe; nigdy w HTML, JS klienta, repozytorium ani logach.
- JWT jest wymagany na poziomie Edge Function oraz ponownie sprawdzany przez `auth.getUser(token)`.
- Uprawnienia pochodzą wyłącznie z `app_metadata`, nie z `user_metadata`.
- CORS ograniczony do domeny strony; CORS nie jest traktowany jako mechanizm autoryzacji.
- Brak publicznego endpointu generowania dla odwiedzających.
- Limit rozmiaru wejścia, długości notatki, rozmiaru obrazu, czasu żądania i dziennej liczby generacji.
- Unikalna ścieżka pliku i `upsert:false`; brak nadpisywania zatwierdzonych grafik.
- Prywatny bucket i podpisany URL do podglądu.
- Audyt rozpoczęcia, błędów i zakończenia generacji.
- Nie zmieniamy istniejących tabel ani funkcji strony.

## Etapy ewolucji
- V2: bezpieczne generowanie wersji roboczych i stałe prompty.
- V2.1: panel administratora: wybór filaru, notatka, podgląd, ponowienie, akceptacja/odrzucenie.
- V2.2: wzorzec referencyjny i tryb edycji istniejącego obrazu; zatwierdzony obraz bazowy jest stałą referencją.
- V2.3: porównanie 1:1 w tych samych proporcjach, test miniatury, kontrola kontrastu i kadrowania.
- V3: biblioteka zatwierdzonych wersji, publikacja przez atomową zmianę manifestu, rollback do poprzedniej wersji.
- V4: automatyczne testy wizualne desktop/mobile i budżet transferu WebP/AVIF.

## Status
Kod backendu V2 i dokumentacja są przygotowane w osobnej gałęzi. Nie są wdrożone. Do uruchomienia potrzebny jest sekret `OPENAI_API_KEY` w Supabase. Panel i proces akceptacji są kolejnymi etapami; aktywne kafelki pozostają nietknięte.
