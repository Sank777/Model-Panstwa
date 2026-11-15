# Standard bezpieczeństwa prawnego i pozyskiwania informacji

Wersja robocza: 2026-11-15  
Status: dokument wewnętrzny do przeglądu; nie jest opinią prawną ani gwarancją braku odpowiedzialności.

## 1. Cel i granice projektu

Projekt służy analizie jawności życia publicznego, edukacji obywatelskiej i prezentowaniu informacji pozyskanych zgodnie z prawem. Nie prowadzi działań operacyjnych, śledczych ani testów bezpieczeństwa cudzych systemów.

## 2. Zasada art. 267 Kodeksu karnego

Projekt nie może uzyskiwać informacji ani dostępu do systemów bez uprawnienia. W szczególności zabronione jest:
- obchodzenie lub przełamywanie zabezpieczeń;
- logowanie się na cudze konta, używanie cudzych danych uwierzytelniających lub tokenów;
- odgadywanie haseł, wykorzystywanie luk, błędów konfiguracji lub niepublicznych interfejsów do pozyskania danych;
- uzyskiwanie dostępu do paneli administracyjnych, repozytoriów, baz lub plików nieudostępnionych publicznie;
- instalowanie lub używanie narzędzi do podsłuchu, ukrytego monitoringu albo przechwytywania informacji, do których projekt nie ma uprawnienia;
- publikowanie informacji, jeżeli wiadomo, że zostały zdobyte w sposób opisany powyżej.

Samo otwarcie publicznej strony, przeczytanie opublikowanego dokumentu, podanie odnośnika do publicznego źródła lub cytowanie zgodnie z prawem nie stanowi samo przez się czynu opisanego w art. 267. Każdy przypadek ocenia się jednak według rzeczywistych okoliczności i aktualnego prawa.

## 3. Dozwolone źródła

Preferowane źródła:
1. oficjalne, publicznie dostępne rejestry i BIP;
2. dokumenty i dane opublikowane przez organy publiczne;
3. odpowiedzi na wnioski o informację publiczną uzyskane zgodnie z prawem;
4. dokumenty przekazane dobrowolnie przez uprawnioną osobę, z potwierdzeniem prawa do ich przekazania;
5. jawne orzeczenia, raporty pokontrolne i komunikaty organów;
6. wiarygodne publikacje wtórne, wyraźnie oznaczone jako źródła wtórne.

Publiczna dostępność strony nie jest automatycznym zezwoleniem na dowolne masowe pobieranie, obchodzenie ograniczeń technicznych lub ponowne rozpowszechnianie wszystkich zawartych w niej danych. Automatyzacja musi respektować prawo, warunki korzystania z serwisu, ograniczenia dostępu i rozsądne limity zapytań.

## 4. Zasady techniczne pozyskiwania

- Otwieramy wyłącznie publiczne adresy i zasoby przeznaczone do publicznego udostępnienia.
- Korzystamy z oficjalnych API i eksportów, jeśli są udostępnione do takiego celu.
- Nie obchodzimy logowania, CAPTCHA, limitów dostępu, paywalli ani innych zabezpieczeń.
- Nie skanujemy portów, nie enumerujemy ukrytych zasobów i nie testujemy podatności cudzych systemów.
- Nie używamy cudzych kont, sesji, ciasteczek, kluczy API ani tokenów.
- W razie komunikatu o braku uprawnień, blokady, niejednoznacznego dostępu lub podejrzenia ujawnienia danych niepublicznych przerywamy pobieranie i nie próbujemy uzyskać dostępu inną drogą.
- Nie przechowujemy haseł, tokenów ani danych uwierzytelniających w materiałach projektu.
- Każda automatyzacja pobierania wymaga osobnego przeglądu zakresu, podstawy, limitów, retencji i wpływu na serwis źródłowy.

## 5. Rejestr źródeł i łańcuch pochodzenia

Dla każdego rzeczywistego materiału zapisujemy:
- nazwę instytucji lub wydawcy;
- tytuł dokumentu i datę jego wydania;
- publiczny adres źródłowy;
- datę pozyskania;
- sposób pozyskania (publiczna strona, oficjalne API, odpowiedź na wniosek, dobrowolne przekazanie);
- zakres wykorzystanych fragmentów i informację o przetworzeniu;
- status autentyczności i ewentualne zastrzeżenia.

Nie zapisujemy ani nie publikujemy danych dostępowych. Wewnętrzny dziennik źródeł nie może zawierać informacji, które same w sobie naruszałyby tajemnice prawnie chronione.

## 6. Standard publikacji spraw rzeczywistych

Każda publikacja dotycząca rzeczywistej sprawy przechodzi kontrolę:
1. oddzielenie faktów potwierdzonych dokumentem od twierdzeń stron, ocen, hipotez i pytań;
2. sprawdzenie dokumentów pierwotnych i dat;
3. sprawdzenie aktualnego statusu postępowania oraz prawomocności rozstrzygnięć;
4. uwzględnienie stanowiska osoby lub podmiotu, którego publikacja dotyczy, jeśli jest to możliwe i proporcjonalne;
5. minimalizacja danych osobowych, usunięcie danych osób postronnych i danych szczególnych kategorii, chyba że istnieje konkretna podstawa prawna do ich przetwarzania;
6. zakaz przypisywania motywów bez dowodów;
7. zakaz nazywania zachowania przestępstwem bez odpowiedniego, wiarygodnego ustalenia; odróżnianie błędu, naruszenia procedury, odpowiedzialności politycznej, administracyjnej, cywilnej i karnej;
8. kontrola praw autorskich, tajemnic ustawowych, prywatności i dóbr osobistych;
9. możliwość zgłoszenia korekty, odpowiedzi lub zastrzeżenia;
10. zapisanie osoby zatwierdzającej publikację i daty przeglądu.

## 7. Scenariusze edukacyjne

Scenariusze oznaczamy jako fikcyjne. Nie kopiujemy rozpoznawalnych szczegółów realnej sprawy, nazwisk, nazw instytucji, dat, lokalizacji ani kwot, jeśli ich zestawienie mogłoby pozwolić na identyfikację osób lub zdarzeń. Fikcyjny scenariusz nie może być przedstawiany jako dowód na rzeczywiste nadużycie.

## 8. Reakcja na wątpliwość

Jeżeli nie da się potwierdzić legalnego źródła lub uprawnienia:
- wstrzymujemy pozyskiwanie i publikację;
- zabezpieczamy wyłącznie minimalny zapis techniczny potrzebny do wyjaśnienia zdarzenia, bez kopiowania niepublicznej treści;
- konsultujemy przypadek z prawnikiem;
- nie próbujemy samodzielnie „sprawdzać”, czy zabezpieczenie da się obejść.

## 9. Zastrzeżenie

Ten standard ogranicza ryzyko, ale nie zastępuje indywidualnej analizy prawnej. Odpowiedzialność zależy od konkretnych działań, zamiaru, źródła danych, uprawnień, sposobu pozyskania i publikacji. Przed uruchomieniem publicznego katalogu rzeczywistych spraw wymagany jest przegląd prawnika, w szczególności w zakresie RODO, dóbr osobistych, prawa autorskiego, dostępu do informacji publicznej i ewentualnego zastosowania DSA.

## 10. Podstawa prawna do weryfikacji

- Kodeks karny, art. 267 — tekst jednolity Dz.U. 2026 poz. 1342: https://eli.gov.pl/eli/DU/2026/1342/ogl
- Każdorazowo należy sprawdzić aktualny stan prawny i przepisy powiązane przed publikacją lub wdrożeniem zmian.
