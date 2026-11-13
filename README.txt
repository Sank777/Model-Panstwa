MODEL PAŃSTWA – PAKIET PREZENTACYJNY 1.1

Zawartość:
- index.html – strona główna, oparta na przekazanym index(4).html; dodana nawigacja do podstron
- model.html – założenia i sposób myślenia o państwie
- filary.html – rozwinięcie 10 filarów
- reformy.html – proces przygotowania i oceny reform
- zasady.html – zasady projektowe i proporcjonalność
- prototyp.html – opis demonstracyjnego systemu zgłoszeń

Publikacja:
Umieść wszystkie pliki HTML razem w katalogu głównym repozytorium GitHub Pages.
Nie zmieniaj nazw plików. Strona główna to index.html.

WAŻNE – GRANICE PROTOTYPU:
Formularz i panel testowy na stronie głównej są demonstracyjne. Dane są przechowywane lokalnie w przeglądarce (localStorage), a panel nie ma prawdziwego logowania. Nie używaj tej wersji do prawdziwych, poufnych ani urzędowych zgłoszeń. Formularz nie jest jeszcze połączony z Supabase.

RAPORT KONTROLI 13.11.2026:
- 6 plików HTML sprawdzonych parserem HTML: bez zgłoszonych błędów naprawy składni.
- Skrypt JavaScript na stronie głównej sprawdzony przez node --check: poprawna składnia.
- Linki wewnętrzne do plików i kotwic: wszystkie znalezione cele istnieją.
- Identyfikatory HTML: brak powtórzonych ID.
- Odwołania JavaScript do elementów DOM: brak brakujących ID.
- Nawigacja otrzymała oznaczenie bieżącej podstrony (aria-current) i widoczny fokus klawiatury.

NIEPOTWIERDZONE TESTY RUNTIME:
Nie udało się uruchomić testu przeglądarkowego w tym środowisku, ponieważ przeglądarka blokowała zarówno adres localhost, jak i pliki lokalne (ERR_BLOCKED_BY_ADMINISTRATOR). Nie potwierdzono więc działania mapy na żywo, kafelków OpenStreetMap ani pełnego przebiegu formularza w prawdziwej przeglądarce. Mapa wymaga zewnętrznej biblioteki Leaflet i dostępu do usług mapowych.

NASTĘPNY KROK:
Przygotować prostą bazę Supabase i zmienić przepływ formularza tak, aby nowe zgłoszenia trafiały do kolejki oczekujących na moderację, a publicznie pojawiały się dopiero po zatwierdzeniu. Konto administratora można skonfigurować na końcu.
