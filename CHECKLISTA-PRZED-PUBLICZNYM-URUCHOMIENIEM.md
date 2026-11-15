# Lista blokad przed publicznym uruchomieniem

Status dokumentów prawnych i funkcji — 15 listopada 2026 r.

## Tożsamość i informacje usługodawcy
- [ ] Uzupełnić prawdziwe dane usługodawcy i skuteczny kontakt.
- [ ] Zweryfikować, jakie dane kontaktowe/adresowe trzeba ujawnić zgodnie z UŚUDE i innymi przepisami.
- [ ] Zdecydować, czy projekt pozostaje wyłącznie hobbystyczny i niekomercyjny oraz czy model usługi ma cechy hostingu/platformy.

## Prywatność
- [ ] Zatwierdzić politykę prywatności po inwentaryzacji danych.
- [ ] Ustalić podstawę prawną dla każdej funkcji i sporządzić test równowagi dla uzasadnionego interesu.
- [ ] Potwierdzić regiony danych, role dostawców, umowy powierzenia i transfery poza EOG.
- [ ] Ustalić retencję kont, zgłoszeń, zdjęć, logów, analityki i kopii zapasowych.
- [ ] Dodać realną procedurę realizacji praw osób.
- [ ] Ocenić ryzyko DPIA; udokumentować, czy jest wymagana.
- [ ] Zdecydować, czy rejestracja kont i publiczne profile są konieczne.

## Cookies i technologie
- [ ] Zinwentaryzować localStorage, sessionStorage, cookies, CAPTCHA, mapy, analitykę i zewnętrzne skrypty.
- [ ] Rozdzielić technologie niezbędne od pozostałych.
- [ ] Nie uruchamiać analityki/technologii niewymaganych do usługi przed odpowiednią informacją i zgodą, jeśli jest wymagana.
- [ ] Opisać dostawców i przepływy danych.

## Regulamin i DSA
- [ ] Opublikować regulamin przed rozpoczęciem świadczenia usług.
- [ ] Uruchomić mechanizm zgłaszania treści bezprawnych, jeśli ma zastosowanie DSA.
- [ ] Zapewnić uzasadnienia decyzji moderacyjnych i możliwość ich zakwestionowania, jeżeli wymagają tego przepisy.
- [ ] Zweryfikować, które obowiązki DSA mają zastosowanie do tego usługodawcy i czy działa ewentualne wyłączenie dla mikro-/małego przedsiębiorstwa.
- [ ] Uruchomić procedurę reklamacji.

## Zdjęcia i zgłoszenia
- [ ] Wyłączyć publiczny upload zdjęć do czasu wdrożenia kontroli EXIF i bezpiecznej publikacji.
- [ ] Oddzielić pliki oczekujące na moderację od plików publicznych.
- [ ] Zapewnić usuwanie pliku ze Storage wraz z usuwaniem lub anonimizacją zgłoszenia.
- [ ] Zweryfikować przypisanie zgłoszeń do kont użytkowników.
- [ ] Ograniczyć pola formularzy i ostrzec przed danymi osób postronnych.

## Treści rzeczywiste
- [ ] Wymagać źródła i daty pozyskania.
- [ ] Rozdzielać fakty, twierdzenia, hipotezy i rozstrzygnięcia.
- [ ] Wprowadzić procedurę odpowiedzi, korekty i historii zmian.
- [ ] Wstrzymywać publikację materiałów o niepewnym pochodzeniu.
- [ ] Nie publikować materiałów z nieuprawnionego dostępu.

## Bezpieczeństwo techniczne
- [ ] Włączyć ochronę haseł ujawnionych w wyciekach w Supabase Auth.
- [ ] Naprawić i przetestować parsowanie nagłówka Bearer w funkcji submit-report.
- [ ] Usunąć lub zanonimizować metadane EXIF zdjęć.
- [ ] Przetestować RLS, role, rate limiting, upload i usuwanie danych.
- [ ] Przypiąć wersje zależności i wdrożyć aktualizacje.
- [ ] Przeprowadzić testy na telefonie i komputerze.
- [ ] Nie wdrażać zmian do produkcji bez przeglądu i zgody właściciela.

## Publikacja
- [ ] Przeprowadzić końcowy przegląd prawny.
- [ ] Zatwierdzić wersje dokumentów i daty wejścia w życie.
- [ ] Udostępnić dokumenty przed rejestracją i wysłaniem zgłoszenia.
- [ ] Zachować kopię każdej wersji regulaminu i polityki.
