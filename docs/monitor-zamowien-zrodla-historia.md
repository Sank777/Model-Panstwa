# Historia i dokumentacja źródeł — Monitor zamówień i przetargów (Filar 10)

**Stan opracowania:** 22 listopada 2026 r.  
**Cel:** trwały rejestr źródeł, sposobów dostępu, ograniczeń i decyzji projektowych. Ten plik jest historią projektu, a nie potwierdzeniem, że wszystkie integracje są już uruchomione.

## 1. Zasada działania monitora

Monitor ma prowadzić sprawę przez cały cykl wydatkowania środków publicznych:

1. plan postępowania;
2. ogłoszenie i dokumentacja;
3. pytania, odpowiedzi, zmiany SWZ i terminu;
4. otwarcie ofert;
5. wybór wykonawcy albo unieważnienie;
6. odwołanie i rozstrzygnięcie KIO / sądu;
7. podpisanie umowy i jej ujawnienie;
8. aneksy, zmiany wartości i terminów;
9. realizacja, odbiory, rozliczenia, kary, odstąpienie lub rozwiązanie;
10. kontrole i zalecenia pokontrolne.

**Nie wolno utożsamiać** statusu postępowania ze statusem umowy ani statusem realizacji. „Unieważnione”, „cofnięto unieważnienie”, „odwołanie”, „umowa zawarta”, „przerwa w robotach” i „zakończono realizację” to różne zdarzenia. Każde musi mieć własny dokument, datę i źródło.

## 2. Oficjalne źródła i dostęp

### A. e-Zamówienia / Biuletyn Zamówień Publicznych (BZP)

- Portal integracyjny: https://ezamowienia.gov.pl/pl/integracja/
- Publiczny punkt odczytu API BZP wskazany przez portal: https://ezamowienia.gov.pl/mo-board/api/v1/notice
- Informacja o limicie: https://ezamowienia.gov.pl/pl/mechanizm-kontroli-ruchu-dla-endpointow-w-ramach-api-bzp/
- Regulamin: https://ezamowienia.gov.pl/pl/regulamin/

**Potwierdzone zasady:** odczyt opublikowanych ogłoszeń krajowych i statystyk przez API BZP nie wymaga przejścia procedury integracyjnej; usługa jest bezpłatna. Od 6 października 2026 r. obowiązuje limit 30 zapytań na minutę z jednego IP; przekroczenie powoduje HTTP 403. Oficjalna informacja o planowanej zmianie podaje maksymalny PageSize 100 (zamiast 500) oraz walidację parametrów; termin produkcyjny wskazany w komunikacie to 11 stycznia 2027 r.

**Stan po poprawce 23.11.2026:** klient w `filary.html` został przełączony ze starej ścieżki `/mo-board/api/v1/Board/Search` na oficjalną `/mo-board/api/v1/notice`. Parametry i mapowanie odpowiedzi nadal wymagają rzeczywistego testu na produkcyjnym API; nie uznajemy integracji za działającą, dopóki nie zapiszemy odpowiedzi HTTP, schematu danych i testu widoku. Nie zakładamy, że CORS lub odpowiedź endpointu są poprawne.

### B. TED — unijne ogłoszenia o zamówieniach

- Dokumentacja Search API: https://docs.ted.europa.eu/api/latest/search.html
- Publiczny Swagger: https://api.ted.europa.eu/swagger-ui/index.html
- TED Open Data: https://data.ted.europa.eu/
- Wyszukiwarka: https://ted.europa.eu/

**Potwierdzone zasady:** Search API udostępnia opublikowane ogłoszenia, przyjmuje zapytania eksperckie i umożliwia pobieranie XML do analizy. Dokumentacja stwierdza wprost, że API jest przeznaczone do ponownego wykorzystania danych i nie wymaga uwierzytelnienia. Główny endpoint wyszukiwania: `POST /v3/notices/search`.

**Zakres:** TED to źródło ogłoszeń publikowanych na poziomie unijnym; nie zastępuje BZP ani dokumentacji zamawiającego. Ogłoszenie TED nie dowodzi samo w sobie podpisania umowy, odbioru lub wykonania zamówienia.

**Status integracji w projekcie:** w `filary.html` dodano przycisk pobierania danych z publicznego API TED. Składnia kodu została sprawdzona, ale nie potwierdzono jeszcze wizualnie i sieciowo działania żądania na opublikowanej stronie. Trzeba przetestować query, schemat odpowiedzi, nazwy pól i ewentualne CORS; błędu nie wolno maskować przykładowymi rekordami.

### C. Centralny Rejestr Umów JSFP (CRU JSFP)

- Publiczny rejestr: https://rejestrumow.gov.pl/
- Portal pracowników jednostek: https://jsfp.rejestrumow.gov.pl/
- Informacja o publicznym rejestrze: https://www.gov.pl/web/finanse/centralny-rejestr-umow-jsfp---kluczowy-etap-1-lipca-2026-r
- Dokumentacja API: https://www.gov.pl/web/finanse/udostepnienie-api-do-systemu-centralny-rejestr-umow-jsfp

**Potwierdzone zasady:** publiczne wyszukiwanie i przeglądanie informacji o umowach udostępnionych przez jednostki jest przeznaczone dla wszystkich zainteresowanych. Obowiązek ujawniania w CRU JSFP dotyczy umów zawartych od 1 lipca 2026 r. API integracyjne pozwala wyszukiwać streszczenia i pobierać szczegóły umów, ale używa autoryzacji `X-API-KEY`; obsługuje także publikację i aktualizację informacji przez jednostki.

**Decyzja projektowa:** nie próbujemy obchodzić `X-API-KEY`. W pierwszej kolejności korzystamy z publicznej wyszukiwarki, publicznych stron umów i dokumentów BIP. Jeżeli kiedyś będzie potrzebny integracyjny dostęp API, musi być uzyskany zgodnie z zasadami MF; klucza nie wolno umieszczać w publicznym kodzie front-endu ani repozytorium.

### D. Orzeczenia KIO i UZP

- Wyszukiwarka orzeczeń: https://orzeczenia.uzp.gov.pl/Home/Search
- Informacje UZP: https://www.gov.pl/web/uzp/orzecznictwo-kio2

Służy do sprawdzania odwołań, postanowień, wyroków i przebiegu sporu. Sygnatura KIO musi być powiązana z konkretnym postępowaniem i zamawiającym. Samo wniesienie odwołania nie oznacza, że zarzuty zostały potwierdzone. Umorzenie postępowania nie jest automatycznie merytorycznym rozstrzygnięciem zarzutów.

### E. Najwyższa Izba Kontroli (NIK)

- BIP NIK: https://bip.nik.gov.pl/
- Wyniki kontroli: https://bip.nik.gov.pl/kontrole/wyniki-kontroli-nik/
- Zamówienia NIK: https://bip.nik.gov.pl/zamowienia-publiczne

NIK dostarcza wyników kontroli, wystąpień pokontrolnych, dokumentów i ustaleń dotyczących gospodarowania środkami publicznymi. Wynik kontroli NIK należy opisywać zgodnie z treścią dokumentu, zakresem kontroli i stanowiskiem jednostki; nie dopisywać ustaleń, których raport nie zawiera.

### F. BIP zamawiającego i dokumenty wykonawcze

Dla każdego postępowania trzeba sprawdzać także BIP zamawiającego i jego platformę zakupową. Tam mogą być publikowane m.in. SWZ, załączniki, pytania i odpowiedzi, protokoły, zawiadomienia, umowy, aneksy, harmonogramy, protokoły odbioru i informacje o karach. Brak dokumentu w jednym rejestrze nie oznacza, że zdarzenie nie nastąpiło.

## 3. Co już zapisano w stronie

- Monitor przeniesiono do głównej strony Filaru 10.
- Zachowano 11 kategorii zamówień.
- Dodano katalog oficjalnych źródeł.
- Dodano prototyp bezkluczowego wyszukiwania TED.
- Dodano prototyp bezkluczowego odczytu BZP; jego endpoint i parametry wymagają korekty oraz rzeczywistego testu według oficjalnej dokumentacji.
- Publiczny CRU jest wskazany jako źródło umów; integracyjne API CRU nie jest uruchomione z powodu wymogu klucza.
- Orzeczenia KIO i wyniki kontroli NIK są wskazane jako źródła dalszej weryfikacji.

## 4. Historia zmian w repozytorium

- **PR #101** — monitor wbudowany na głównej stronie Filaru 10; dodano pierwsze rzeczywiste przykłady spraw i dokumentów.
- **PR #102** — katalog oficjalnych źródeł BZP, TED, CRU JSFP, KIO/UZP i NIK.
- **PR #103** — przycisk bezpośredniego wyszukiwania TED bez klucza API.
- **PR #104** — prototyp wyszukiwania BZP bez klucza; do korekty według aktualnego endpointu z dokumentacji.

## 5. Zasady dalszego rozwoju

1. Najpierw źródło pierwotne; portale wtórne tylko jako trop do dokumentu.
2. Każdy rekord ma mieć: identyfikator postępowania, zamawiającego, przedmiot, datę publikacji, status i datę statusu, źródło, link do dokumentu oraz datę ostatniej weryfikacji.
3. Zdarzenia przechowujemy jako historię, nie nadpisujemy poprzedniego stanu bez śladu.
4. Statusy rozdzielamy: postępowanie / odwołanie / umowa / realizacja / kontrola.
5. Brak danych oznaczamy jako „nieustalone” lub „brak potwierdzenia”, nigdy jako „brak zdarzenia”.
6. Każdy wpis o wstrzymaniu, opóźnieniu, unieważnieniu, karze lub odstąpieniu musi mieć konkretny dokument i datę.
7. Nie obchodzimy autoryzacji, limitów, CAPTCHA ani kontroli dostępu. Korzystamy z publicznych interfejsów, jawnych eksportów, BIP, wniosków o informację publiczną i legalnie uzyskanych kluczy.
8. Nie trzymamy sekretów w HTML/JS front-endu, publicznym repozytorium ani historii commitów. Klucze i tokeny, jeśli kiedykolwiek będą potrzebne, przechowujemy po stronie serwera w sekretach środowiskowych.
9. Przy zmianie API aktualizujemy ten plik z datą, linkiem do komunikatu i opisem wpływu na integrację.
10. Nie nazywamy integracji „działającą”, dopóki nie przetestowano odpowiedzi rzeczywistego źródła, obsługi błędów i widoku na opublikowanej stronie.

## 6. Najbliższe zadania techniczne

- [x] Skorygować adres klienta BZP do oficjalnego `GET /mo-board/api/v1/notice`.
- [ ] Zweryfikować parametry i wykonać rzeczywiste zapytanie testowe do BZP; zapisać odpowiedź HTTP i przykładową odpowiedź bez danych wrażliwych.
- [ ] Przetestować TED Search API z query i schematem odpowiedzi zgodnym z dokumentacją.
- [ ] Dodać trwały rejestr zdarzeń w pliku danych (np. JSON), zawierający historię zmian statusu i daty weryfikacji.
- [ ] Dodać cykliczne pobieranie i porównywanie nowych ogłoszeń bez przekraczania limitów.
- [ ] Dla umów łączyć ogłoszenie BZP/TED z CRU, KIO i dokumentami BIP po identyfikatorach, numerach i zamawiającym.
- [ ] Dopiero po walidacji danych oznaczać integrację jako aktywną.

---
**Status prawdy:** ten dokument opisuje potwierdzone możliwości oficjalnych źródeł i aktualny stan implementacji. Nie jest dowodem, że każde źródło jest już automatycznie synchronizowane z monitorem.


## 7. Zmiany 23 listopada 2026 r.

- Dodano pilotażowy moduł „Ślad finansowy umów” w Filarze 10 i plik `assets/cru/contracts.json` z czterema rekordami CRU.
- Dodano wyszukiwanie po treści i filtr rekordów z ujawnioną / nieujawnioną wartością.
- Dodano jawne pola nieustalone; nie utożsamia się wartości umowy z płatnością.
- Skorygowano ścieżkę BZP na `/mo-board/api/v1/notice`; test rzeczywistego połączenia pozostaje otwarty.
- Usunięto z Centrum Jawności nieaktywny skrypt starego widoku NIK, który nie miał wymaganego kontenera `nik-visual-workspace`. Aktualny widok 11 tematów NIK i 9 kart SWS pozostaje oparty na `sws-visual.js`.
