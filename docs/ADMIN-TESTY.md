# System zgłoszeń — testy odbiorcze

## Zmiany w tej gałęzi
- Formularz publiczny wysyła zgłoszenia do funkcji `submit-report`.
- Publiczna lista pobiera wyłącznie rekordy z `moderation_status=zatwierdzone` (RLS anon).
- Panel administratora jest osobną stroną `admin.html`; loguje przez Supabase Auth i wykonuje operacje przez `admin-manage-reports`.
- Zdjęcia nie są jeszcze przesyłane; formularz przyjmuje je wizualnie, ale nie wysyła ich do backendu.

## Testy do wykonania po publikacji gałęzi
1. Otworzyć stronę główną i sprawdzić, czy lista publiczna pokazuje wyłącznie zatwierdzone rekordy.
2. Wysłać poprawne zgłoszenie — oczekiwany wynik: komunikat o oczekiwaniu na moderację, nowy rekord w Supabase z `oczekuje`.
3. Wysłać pusty opis lub nieprawidłową kategorię — formularz powinien zablokować wysyłkę.
4. Spróbować wywołać `admin-manage-reports` bez tokenu — oczekiwane HTTP 401.
5. Zalogować zwykłego użytkownika bez roli admin i wywołać panel/API — oczekiwane HTTP 403.
6. Zalogować administratora po odświeżeniu sesji — panel powinien pobrać kolejkę.
7. Zatwierdzić zgłoszenie — powinno pojawić się na publicznej liście po odświeżeniu.
8. Odrzucić zgłoszenie — nie powinno być publiczne.
9. Zmienić status, priorytet i komentarz — wartości powinny przetrwać odświeżenie.
10. Usunąć testowe zgłoszenie — powinno zniknąć z panelu i bazy.

## Ograniczenia i uwagi
- Nie wykonywano jeszcze rzeczywistych testów HTTP z kontem administratora.
- Nie wysyłano testowego rekordu do produkcyjnej tabeli, aby nie zaśmiecać danych.
- Nie testowano działania w przeglądarce mobilnej po wdrożeniu GitHub Pages.
- Nie zmieniano schematu ani pozostałych tabel Supabase.
- Przed połączeniem gałęzi z `main` należy wykonać testy 1–10 i sprawdzić logi funkcji.
