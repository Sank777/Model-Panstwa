# Plan zabezpieczenia bazy i aplikacji

## Zakres
Pakiet jest przygotowywany na osobnej gałęzi. Nie wykonuje zmian na produkcji i nie czyści danych. Konto administratora pozostaje nietknięte.

## Potwierdzone ustalenia z audytu (2026-11-15)
- RLS jest włączone na tabelach schematu public; samo RLS nie zastępuje grantów SQL.
- Migracja etapu 1 ogranicza TRUNCATE, REFERENCES i TRIGGER dla anon/authenticated oraz CREATE w public.
- Funkcja submit-report ma verify_jwt=false i wykonuje własną weryfikację JWT. Audyt aktywnej wersji produkcyjnej (version 5) potwierdził błędny regex Bearer (`/^Bearer\\\\s+(.+)$/i`), który może nie rozpoznawać poprawnego nagłówka. Aktywna wersja nie odrzuca też jawnie błędnego formatu Authorization. Poprawka istnieje w gałęzi PR #10, ale nie jest wdrożona.
- Bucket zgloszenia-zdjecia jest publiczny, limit 5 MB, MIME JPEG/PNG/WebP.
- storage.objects ma RLS włączone, FORCE RLS wyłączone i obecnie nie ma żadnych polityk RLS. Jednocześnie role anon i authenticated mają granty SELECT/INSERT/UPDATE/DELETE na tabeli storage.objects. RLS bez polityk blokuje operacje przez API tabelowe, ale szerokie granty pozostają niepotrzebną powierzchnią uprawnień i mogą stać się aktywne po dodaniu polityk. Nie zmieniamy ich w ciemno, dopóki nie zinwentaryzujemy wszystkich sposobów użycia Storage przez frontend.
- Pliki nie są dekodowane i ponownie kodowane, więc sprawdzenie sygnatury nie usuwa EXIF/GPS.
- admin-manage-reports usuwa rekord zgłoszenia, ale nie usuwa powiązanego pliku.
- GET w funkcji administracyjnej powinien zwracać wyłącznie jawnie wskazane kolumny; nie stosować select("*").
- Advisors: 2 tabele prywatne mają RLS bez polityk; 1 FK report_events bez indeksu; 5 ostrzeżeń o kosztownych wywołaniach auth w politykach; ochrona haseł wyciekłych jest wyłączona. Te wyniki wymagają oceny kontekstu, nie automatycznej zmiany.

## Co celowo nie jest wdrażane automatycznie
1. Nie zmieniamy bucketu publicznego na prywatny, zanim frontend nie przejdzie na signed URL i testów end-to-end.
2. Nie odbieramy globalnie grantów Storage, dopóki nie potwierdzimy, że żadna część strony nie wysyła plików bezpośrednio z przeglądarki. Aktualnie submit-report używa service_role po stronie serwera.
3. Nie dodajemy polityk RLS bez znajomości modelu dostępu i testów anon/użytkownik A/użytkownik B/admin.
4. Nie włączamy automatycznie ochrony haseł wyciekłych — wymaga oceny wpływu na logowanie/rejestrację.
5. Nie kasujemy rekordów, kont ani obiektów Storage.

## Etap 2 – prace w gałęzi (bez wdrożenia)
- Zinwentaryzowano frontend: `prototyp.html` bezpośrednio czyta publiczne zdjęcia z pola `photo`, formularz wysyła pliki wyłącznie do `submit-report`, a panel administratora pobiera zdjęcia przez `admin-manage-reports`. `index.html` ma także starszy, lokalny model danych oraz publiczny odczyt REST.
- `admin-manage-reports` w gałęzi zwraca tylko kolumny potrzebne panelowi; usunięto `lat`, `lng` i `user_id`, których panel nie wyświetla. Nie zmienia to schematu bazy.
- Dodano automatyczny workflow GitHub Actions do uruchamiania testów parsera Bearer przy push/PR.
- Nadal nie przełączamy bucketu na private ani nie zmieniamy grantów Storage: publiczny frontend prototypu korzysta z publicznych URL-i. Migracja wymaga jednoczesnej zmiany sposobu dostarczania obrazów.
- WAŻNE: produkcyjna Edge Function `submit-report` version 5 nadal zawiera błąd regexu. Kod w PR #10 jest poprawiony, ale dopóki nie przejdzie testów i kontrolowanego wdrożenia, produkcja pozostaje narażona na odrzucanie poprawnych nagłówków Bearer lub niewłaściwe traktowanie nagłówka.

## Kolejność prac
1. Potwierdzić backup bazy oraz osobną kopię obiektów Storage i procedurę odtworzenia.
2. Uruchomić migrację etapu 1 na środowisku testowym i wykonać testy negatywne.
3. Poprawić submit-report: prawidłowy regex /^Bearer\\s+(.+)$/i; jeśli Authorization jest obecny, ale nie ma poprawnego Bearer lub token nie przechodzi auth.getUser, zwrócić 401. Brak nagłówka pozostaje anonimowy tylko wtedy, gdy formularz dopuszcza anonimowe zgłoszenia.
4. Zinwentaryzować wszystkie klientowe odwołania do Storage. Następnie ograniczyć granty zapisu dla anon/authenticated i wdrożyć najmniejsze wymagane polityki.
5. Przenieść zdjęcia do prywatnego pipeline: dekodowanie/re-encoding bez EXIF, walidacja wymiarów, MIME, sygnatury i rozmiaru, losowe nazwy, krótkie signed URL dla moderatorów; publikować tylko oczyszczony obraz po zatwierdzeniu.
6. Zmienić usuwanie zgłoszenia: odczytać ścieżkę obiektu, zapisać zdarzenie audytowe, usunąć rekord i plik z kontrolą błędów oraz mechanizmem ponawiania sprzątania osieroconych plików.
7. Ograniczyć kolumny w endpointach administracyjnych, dodać indeks FK report_events oraz zoptymalizować polityki RLS po testach.
8. Testy: anon, użytkownik A/B, site_admin/admin, token prawidłowy/błędny/wygasły, próby eskalacji ról, Storage, EXIF, usuwanie, rate limit.
9. Dopiero po testach i potwierdzeniu odtworzenia przeprowadzić rollout produkcyjny.

## Testy akceptacyjne
- anon nie wykonuje TRUNCATE/REFERENCES/TRIGGER i nie czyta danych prywatnych.
- użytkownik A wykonuje wyłącznie dozwolone operacje na własnych danych; B nie odczyta/zmieni/usunie danych A.
- site_admin ma wyłącznie przydzielone moduły; admin zachowuje dotychczasowe uprawnienia i konto.
- klient nie może wstrzyknąć user_id, roli, moderation_status ani ścieżki Storage.
- błędny, wygasły i źle sformatowany token kończy się 401; brak tokenu może oznaczać anonimowość tylko zgodnie z regułą formularza.
- obrazy po re-encodingu nie zawierają EXIF/GPS.
- po usunięciu zgłoszenia nie pozostają osierocone pliki, a audyt pozostaje.

## Ryzyka i ograniczenia
CORS nie jest autoryzacją. Klucz publishable/anon jest jawny z założenia; service_role nigdy nie trafia do przeglądarki. Nie logować tokenów, adresów IP ani treści zgłoszeń. Migracje i wdrożenia funkcji wymagają kopii oraz testów.
