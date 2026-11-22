# Pakiet wiedzy: legalny dostęp bez kluczy i ponowne wykorzystanie danych

**Wersja:** 22.11.2026  
**Cel:** wspólna instrukcja dla wszystkich modułów Modelu Państwa. To nie jest instrukcja obchodzenia zabezpieczeń. To katalog publicznych kanałów, alternatywnych ścieżek dostępu i reguł, dzięki którym nie powtarzamy błędów integracyjnych.

## 1. Najważniejsza lekcja

Nie „obchodzimy” kluczy. Rozpoznajemy dokładnie, który endpoint wymaga uwierzytelnienia, a który jest publiczny:
- TED Search API: publiczne wyszukiwanie opublikowanych ogłoszeń nie wymaga klucza. Inne usługi TED, np. publikowanie, mogą wymagać klucza.
- BZP: odczyt publicznych ogłoszeń przez API BZP nie wymaga procedury integracyjnej.
- CRU JSFP: publiczny rejestr można przeglądać; integracyjne API wymaga X-API-KEY. Nie obchodzimy go.
- KIO/UZP, NIK i BIP: korzystamy z publicznych wyszukiwarek i dokumentów.

## 2. Potwierdzone informacje techniczne

### BZP
Oficjalny punkt dostępu: `https://ezamowienia.gov.pl/mo-board/api/v1/notice`
Dokumentacja: https://ezamowienia.gov.pl/pl/integracja/
Regulamin: https://ezamowienia.gov.pl/pl/regulamin/
Limit: 30 zapytań/minutę z jednego IP; przekroczenie zwraca HTTP 403.
Planowana zmiana produkcyjna od 11.01.2027: PageSize maks. 100 i walidacja parametrów.
**Błąd do zapamiętania:** wcześniejszy prototyp używał `/mo-board/api/v1/Board/Search` i zgadywanych parametrów. Dokumentacja wskazuje `/mo-board/api/v1/notice`. Prototyp nie jest potwierdzoną integracją i musi zostać poprawiony po sprawdzeniu dokładnej instrukcji i rzeczywistej odpowiedzi.

### TED
Search API: `POST https://api.ted.europa.eu/v3/notices/search`
Dokumentacja: https://docs.ted.europa.eu/api/latest/search.html
Search API nie wymaga uwierzytelnienia. Udostępnia wyszukiwanie opublikowanych ogłoszeń i pobieranie XML. Nie przenosić zasady „bez klucza” na Publication API ani pozostałe operacje TED.

### CRU JSFP
Publiczny rejestr: https://rejestrumow.gov.pl/
Dokumentacja integracyjnego API: https://jsfp.rejestrumow.gov.pl/api-gw/docs/int/api.html
API wymaga `X-API-KEY`, generowanego w aplikacji CRU przez uprawnionego użytkownika. Publiczna wyszukiwarka jest alternatywną drogą do przeglądania ujawnionych umów. Nie wkładać klucza do HTML/JS ani repozytorium.

### Pozostałe źródła
- KIO/UZP: https://orzeczenia.uzp.gov.pl/Home/Search
- NIK: https://bip.nik.gov.pl/kontrole/wyniki-kontroli-nik/
- TED Open Data: https://data.ted.europa.eu/
- BIP i platforma zakupowa konkretnego zamawiającego: umowy, aneksy, protokoły, odbiory, rozliczenia.

## 3. Dane i przykłady zebrane do monitora

W monitorze zapisano pięć przykładów do dalszej weryfikacji:
1. Roboty drogowe — wcześniejsza umowa nr 201/2024, przerwa w pracach, odstąpienie i późniejsze odwołanie KIO.
2. Wiadukt w Przemyślu — unieważnienie postępowania, cofnięcie czynności i umorzenie odwołania przez KIO.
3. Sprzęt serwerowy i backup — wycofanie jedynej oferty i unieważnienie postępowania.
4. Transport publiczny w Chodczu — status zawartej umowy, do dalszego monitorowania wykonania usług.
5. Ambulans 4×4 w Raciborzu — termin ofert minął, wynik wymaga ponownego potwierdzenia.

**Uwaga dowodowa:** te pięć rekordów przepisano z treści monitora i powiązanych odnośników. Nie są surowymi odpowiedziami API ani dowodem, że wykonano automatyczny import. Przed publikacją aktualnego statusu trzeba ponownie otworzyć dokumenty pierwotne.

## 4. Czego jeszcze nie potwierdziliśmy

- Nie zapisano surowej odpowiedzi API BZP ani TED.
- Nie potwierdzono, że żądania działają z przeglądarki produkcyjnej (CORS).
- Nie ma automatycznej synchronizacji ani trwałej historii pobranych zdarzeń.
- Nie pozyskano żadnego klucza API.
- Przycisk w interfejsie nie oznacza, że integracja działa.

## 5. Checklista, aby nie powielać błędów

1. Czytam dokumentację konkretnego endpointu, nie tylko stronę główną API.
2. Rozróżniam wyszukiwanie/odczyt od publikowania/zapisu — mogą mieć inne klucze.
3. Zapisuję metodę HTTP, pełny URL, parametry, nagłówki, paginację i schemat odpowiedzi.
4. Nie zgaduję endpointów, nazw parametrów ani pól JSON.
5. Wykonuję jeden mały test i zapisuję surową odpowiedź, datę i status HTTP.
6. Testuję puste wyniki, błędne parametry, 403, 404, 429, 5xx i paginację.
7. Sprawdzam CORS. Jeśli przeglądarka nie może wywołać API, stosuję legalny serwerowy pośrednik.
8. Respektuję limity i cache'uję wyniki.
9. Klucze przechowuję wyłącznie po stronie serwera w sekretach środowiskowych.
10. Każde zdarzenie zapisuję z datą, źródłem i dokumentem; nie nadpisuję historii.
11. Rozdzielam status postępowania, odwołania, umowy, realizacji i kontroli.
12. Brak danych to „nieustalone”, nigdy automatycznie „brak zdarzenia”.
13. Integrację nazywam działającą dopiero po rzeczywistym teście API i stronie produkcyjnej.

## 6. Kryterium aktywacji integracji

Wymagane: surowa odpowiedź HTTP/API, potwierdzony schemat, obsługa błędów, paginacja, respektowanie limitów, test widoku na opublikowanej stronie oraz zapis daty ostatniej poprawnej synchronizacji.

## 7. Oficjalne źródła dokumentacji

- BZP integracja: https://ezamowienia.gov.pl/pl/integracja/
- BZP limity: https://ezamowienia.gov.pl/pl/mechanizm-kontroli-ruchu-dla-endpointow-w-ramach-api-bzp/
- TED Search API: https://docs.ted.europa.eu/api/latest/search.html
- TED API: https://docs.ted.europa.eu/api/latest/
- CRU API: https://jsfp.rejestrumow.gov.pl/api-gw/docs/int/api.html
- MF — API CRU: https://www.gov.pl/web/finanse/udostepnienie-api-do-systemu-centralny-rejestr-umow-jsfp
