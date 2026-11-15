# Projekt polityki prywatności — Model Państwa

> **STATUS: PROJEKT WEWNĘTRZNY — NIE PUBLIKOWAĆ JAKO OBOWIĄZUJĄCEJ POLITYKI.**
>
> Dokument wymaga uzupełnienia prawdziwymi danymi administratora, sprawdzenia konfiguracji usług i zatwierdzenia przed udostępnieniem formularzy lub rejestracji. Pola w nawiasach kwadratowych są obowiązkowe do uzupełnienia. Nie wolno ich zastępować wymyślonymi danymi.

**Wersja:** robocza 0.1  
**Data opracowania:** 15 listopada 2026 r.

## 1. Administrator danych

Administratorem danych osobowych jest: **[IMIĘ I NAZWISKO / NAZWA PODMIOTU]**, prowadzący projekt hobbystyczny „Model Państwa”.

Kontakt w sprawach prywatności: **[DEDYKOWANY ADRES E-MAIL]**.  
Adres do korespondencji: **[ADRES — po ocenie, jaki adres i zakres ujawnienia są prawnie wymagane]**.

Administrator nie wyznaczył inspektora ochrony danych, chyba że zostanie to później wskazane: **[POTWIERDZIĆ]**.

## 2. Zakres i źródła danych

W zależności od używanej funkcji serwis może przetwarzać:
- dane konta: adres e-mail, identyfikator konta, daty utworzenia i logowania;
- dane profilu: pseudonim, ustawienie widoczności profilu;
- treści przesłane przez użytkownika: zgłoszenia, opisy, lokalizacje, zdjęcia, rekomendacje i deklaracje kompetencji;
- korespondencję dotyczącą zgłoszeń, korekt, reklamacji i praw osób;
- dane techniczne i bezpieczeństwa: logi żądań, znaczniki czasu, identyfikatory techniczne, informacje o błędach i ograniczenia antyspamowe;
- dane statystyczne odwiedzin, jeżeli funkcja analityczna jest aktywna.

Dane pochodzą od użytkownika, z jego urządzenia i z usług technicznych obsługujących serwis. Nie należy przesyłać danych szczególnych kategorii, danych o wyrokach lub zarzutach karnych, danych dzieci ani danych osób trzecich, jeżeli nie są niezbędne i nie istnieje odrębna podstawa prawna.

## 3. Cele i podstawy przetwarzania

Przed publikacją administrator musi przypisać każdej aktywnej funkcji właściwy cel i podstawę prawną z art. 6 RODO. Poniższa tabela jest propozycją do weryfikacji, a nie stwierdzeniem, że każda podstawa została już prawidłowo ustalona.

| Cel | Kategorie danych | Proponowana podstawa — do potwierdzenia |
|---|---|---|
| Utworzenie i obsługa konta | e-mail, identyfikator konta, dane logowania obsługiwane przez dostawcę | art. 6 ust. 1 lit. b RODO, jeśli usługa jest świadczona na żądanie użytkownika |
| Przyjmowanie i obsługa zgłoszeń | opis, kategoria, lokalizacja, zdjęcie, identyfikator konta lub dane anonimowe | art. 6 ust. 1 lit. b lub f — po analizie niezbędności i testu równowagi |
| Moderacja, bezpieczeństwo i przeciwdziałanie nadużyciom | treści, logi, ograniczone identyfikatory techniczne | art. 6 ust. 1 lit. f — po udokumentowaniu prawnie uzasadnionego interesu |
| Odpowiedzi na żądania osób i obowiązki prawne | dane potrzebne do identyfikacji sprawy i realizacji żądania | art. 6 ust. 1 lit. c, gdy istnieje konkretny obowiązek prawny |
| Statystyka odwiedzin | ścieżka strony i pseudonimowy identyfikator odwiedzającego | wymaga osobnej oceny podstawy z RODO i art. 399 PKE; rozważyć wyłączenie do czasu weryfikacji |

Nie wolno opierać przetwarzania „na zgodzie” automatycznie ani traktować akceptacji regulaminu jako zgody na wszystkie cele. Zgoda, jeżeli jest właściwą podstawą, musi być odrębna, dobrowolna, konkretna, świadoma i możliwa do wycofania.

## 4. Publikowanie treści

Zgłoszenia mogą zawierać dane osób trzecich. Zgłoszenie nie oznacza automatycznej publikacji. Przed publikacją administrator lub moderator powinien ocenić:
- czy treść jest związana z celem serwisu;
- czy zawiera dane osobowe, wizerunek, adres prywatny lub dane kontaktowe;
- czy ujawnienie jest konieczne i proporcjonalne;
- czy istnieje podstawa prawna do publikacji;
- czy trzeba zanonimizować lub zredagować treść.

Adres e-mail konta nie jest przeznaczony do publicznego wyświetlania. Pseudonim i publiczny profil są widoczne tylko w zakresie wybranym przez użytkownika i po potwierdzeniu konfiguracji.

## 5. Odbiorcy i dostawcy usług

W kodzie projektu występują lub występowały integracje z:
- **Supabase** — hosting bazy danych, uwierzytelnianie, magazyn plików i funkcje serwerowe;
- **GitHub Pages** — udostępnianie statycznych plików strony;
- **Cloudflare Turnstile** — ochrona formularzy przed automatycznym nadużyciem;
- **OpenStreetMap** i biblioteka Leaflet — wyświetlanie map;
- **zewnętrzne serwery bibliotek** (m.in. esm.sh i unpkg) — pobieranie bibliotek JavaScript/CSS.

Przed publikacją trzeba potwierdzić, które integracje są faktycznie aktywne, kto jest ich dostawcą i podmiotem przetwarzającym, gdzie dane są przetwarzane, jakie umowy i zabezpieczenia transferu poza EOG obowiązują oraz jakie dane otrzymuje każdy dostawca. Nie wolno zakładać, że wszystkie usługi mają tę samą rolę prawną.

## 6. Okres przechowywania

Administrator ustala i publikuje konkretne okresy retencji po inwentaryzacji danych. Do uzupełnienia:
- konto i dane profilu: **[OKRES / KRYTERIUM]**;
- zgłoszenia odrzucone: **[OKRES]**;
- zgłoszenia opublikowane: **[OKRES I ZASADY ARCHIWIZACJI]**;
- zdjęcia: **[OKRES; procedura usunięcia pliku z magazynu]**;
- logi bezpieczeństwa i ograniczeń: **[OKRES]**;
- statystyki odwiedzin: **[OKRES]**;
- korespondencja i żądania osób: **[OKRES]**;
- kopie zapasowe: **[OKRES I CYKL NADPISYWANIA]**.

Dane nie będą przechowywane dłużej, niż jest to niezbędne do określonych celów, z uwzględnieniem obowiązków prawnych i możliwości obrony roszczeń.

## 7. Prawa osób

Osobie, której dane dotyczą, przysługują — zależnie od podstawy i okoliczności — prawa dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, sprzeciwu oraz wycofania zgody, jeżeli przetwarzanie opiera się na zgodzie. Można również złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.

Żądania należy kierować na: **[ADRES E-MAIL]**. Administrator może poprosić o informacje niezbędne do potwierdzenia tożsamości, ale nie powinien gromadzić nadmiarowych danych.

## 8. Bezpieczeństwo

Administrator stosuje środki odpowiednie do ryzyka, w tym ograniczenie uprawnień, RLS, ochronę sekretów po stronie serwera, ograniczenia liczby żądań, kopie zapasowe, aktualizacje zależności, kontrolę dostępu do zdjęć, procedurę reagowania na incydenty i usuwanie danych z kopii zgodnie z cyklem retencji. Szczegółów ułatwiających ataki nie publikuje się w tej polityce.

## 9. Pliki cookies, localStorage i podobne technologie

Serwis używa co najmniej mechanizmu zapamiętania motywu w localStorage. Kod prototypu wykorzystuje także sessionStorage do czasowych ograniczeń prób logowania. Inne skrypty lub usługi mogą stosować własne technologie — wymaga to sprawdzenia w przeglądarce i dokumentacji dostawców.

Przed aktywacją każdej technologii należy określić jej cel i sprawdzić, czy jest niezbędna do usługi żądanej przez użytkownika, czy wymaga uprzedniej informacji i zgody na podstawie art. 399 Prawa komunikacji elektronicznej. Nie należy uruchamiać analityki lub marketingu przed zakończeniem tej oceny.

## 10. Dzieci i osoby małoletnie

Serwis nie jest projektowany jako usługa dla dzieci. Nie należy zachęcać małoletnich do publikowania danych, lokalizacji, wizerunków ani informacji o szkole lub miejscu zamieszkania. Zgłoszenia zawierające dane dzieci wymagają szczególnie ostrożnej moderacji i co do zasady anonimizacji lub usunięcia.

## 11. Zmiany polityki

Polityka będzie aktualizowana w razie zmian funkcji, dostawców, celów, podstaw prawnych lub okresów retencji. Istotne zmiany będą komunikowane użytkownikom w odpowiedni sposób.

---

## Lista blokująca publikację

Przed publikacją trzeba:
1. wpisać prawdziwe dane administratora i kontakt;
2. sporządzić mapę danych i przepływów;
3. potwierdzić dostawców, regiony i umowy powierzenia;
4. zatwierdzić podstawy prawne dla każdej funkcji;
5. ustalić okresy retencji dla każdej kategorii;
6. sprawdzić cookies/localStorage i analitykę;
7. opisać rzeczywisty proces usuwania kont, zgłoszeń i zdjęć;
8. sprawdzić, czy publiczne zdjęcia i profile są faktycznie niezbędne;
9. zweryfikować treść z prawnikiem lub specjalistą ochrony danych.

**Nie publikować dokumentu z nieuzupełnionymi polami.**
