# Plan zabezpieczenia bazy i aplikacji

## Zakres
Ten pakiet jest przygotowany jako osobna gałąź. Nie wykonuje zmian na produkcji i nie czyści danych. Konto administratora nie jest modyfikowane.

## Ustalenia z audytu
- RLS jest włączone na 14 tabelach schematu public; to nie zastępuje kontroli uprawnień SQL.
- Występują nadmiarowe uprawnienia tabelowe. Migracja ogranicza wyłącznie TRUNCATE, REFERENCES i TRIGGER dla anon/authenticated, pozostawiając zwykłe operacje pod kontrolą RLS.
- Funkcja submit-report ma verify_jwt=false i wykonuje własną weryfikację JWT. W jej kodzie regex Bearer jest błędnie zapisany jako /^Bearer\\\\s+(.+)$/i, co może powodować pomijanie prawidłowych tokenów.
- Bucket zgloszenia-zdjecia jest publiczny. Pliki nie są dekodowane i ponownie kodowane, więc walidacja sygnatury nie usuwa EXIF/GPS.
- admin-manage-reports usuwa rekord zgłoszenia, ale nie usuwa powiązanego pliku.
- Usunięcia i korekty wymagają pełnego, nieusuwalnego śladu audytowego.

## Ważne: co celowo NIE jest automatycznie wdrażane
1. Nie zmieniamy istniejącego bucketu z publicznego na prywatny w tej migracji. Frontend używa publicznych URL-i zdjęć; zmiana bez jednoczesnej migracji odczytu na krótkotrwałe signed URL-e zepsułaby widoki.
2. Nie dodajemy nowych polityk do istniejących tabel bez sprawdzenia ich kolumn, istniejących polityk i wszystkich zapytań frontendowych.
3. Nie włączamy automatycznie ochrony haseł wyciekłych, bo to ustawienie Auth może zmienić zachowanie rejestracji i zmiany hasła.
4. Nie kasujemy żadnych rekordów, kont ani obiektów Storage.

## Kolejność wdrożenia
1. Wykonać kopię/backup i potwierdzić możliwość odtworzenia.
2. Uruchomić migrację 1 na środowisku testowym i wykonać testy negatywne.
3. Poprawić submit-report: prawidłowy regex /^Bearer\\s+(.+)$/i; gdy nagłówek Authorization jest podany, ale token nie przechodzi weryfikacji, zwrócić 401 zamiast zapisywać zgłoszenie anonimowe.
4. Zmienić pipeline zdjęć: prywatny bucket pending, dekodowanie i ponowne kodowanie do bezpiecznego formatu (usunąć EXIF), walidacja MIME/sygnatury/wymiarów/rozmiaru, losowy UUID, krótko żyjące signed URL-e dla moderatorów; publiczna publikacja wyłącznie przetworzonego obrazu po zatwierdzeniu.
5. Zmienić usuwanie zgłoszenia: pobrać powiązane ścieżki, zapisać zdarzenie audytowe, usunąć rekord i obiekt Storage z kontrolą błędów oraz zadaniem ponawiającym sprzątanie osieroconych plików. Nie usuwać historii audytowej.
6. Dodać testy własności kont, dostępu do szkiców, eskalacji ról i ograniczeń kolumn.
7. Po przejściu testów dopiero wykonać rollout na produkcję.

## Testy akceptacyjne
- anon: nie może wykonywać TRUNCATE/REFERENCES/TRIGGER ani czytać danych prywatnych.
- użytkownik A: może wykonać wyłącznie dozwolone operacje na własnych danych.
- użytkownik B: nie może odczytać/zmienić/usunąć danych użytkownika A.
- site_admin: dostęp wyłącznie do przydzielonych modułów.
- admin: zachowuje dotychczasowe uprawnienia; konto i identyfikator pozostają bez zmian.
- próby wstrzyknięcia user_id, role, moderation_status i storage path przez klienta są odrzucane lub ignorowane.
- token poprawny, błędny, wygasły, brakujący i niepoprawny nagłówek Authorization są testowane oddzielnie.
- obrazy z EXIF/GPS po przetworzeniu nie zawierają tych metadanych.
- po usunięciu zgłoszenia nie pozostają osierocone zdjęcia, a ślad audytowy pozostaje.

## Ryzyka i ograniczenia
CORS nie jest mechanizmem autoryzacji. Publiczny klucz Supabase jest z założenia widoczny w przeglądarce; bezpieczeństwo musi wynikać z RLS, grantów, walidacji serwerowej i ograniczeń Storage. Nie należy umieszczać service_role w kodzie frontendowym ani logować tokenów, adresów IP lub treści zgłoszeń.
