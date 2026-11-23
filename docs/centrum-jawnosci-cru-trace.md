# Ślad finansowy CRU JSFP — wersja pilotażowa

**Stan:** 23 listopada 2026 r.  
**Zakres:** cztery przykłady publicznych wpisów CRU JSFP. To demonstracja modelu danych i widoku, nie integracja API CRU.

## Zasady
- Wpis CRU jest źródłem informacji o ujawnionych danych umowy, nie dowodem nieprawidłowości.
- Wartość umowy nie jest utożsamiana z kwotą zapłaconą.
- Wartości netto, brutto i nieustalone są rozróżniane.
- Dane wyłączone z jawności nie są zastępowane zerem ani domysłem.
- Status rejestrowy, wykonanie, odbiór i rozliczenie są osobnymi informacjami.
- Dokumenty umowy, faktury, aneksy i protokoły są oznaczane jako niepozyskane, jeśli nie ma ich bezpośredniego źródła.
- Dane są przechowywane w `assets/cru/contracts.json`, a interfejs w `assets/cru-trace.js`.

## Rekordy pilotażowe
1. Łódzkie Centrum Wydarzeń — Happysad, 50 000 zł ujawnione w CRU.
2. Sinfonietta Cracovia — koncert „Kolory Polski”; kontrahent i wartość wyłączone z jawności w rejestrze.
3. Szyb Staszic — sprzęt oświetleniowy/nagłośnienie i obsługa sceny, 4 500 zł netto.
4. Gminny Ośrodek Kultury w Sanoku — usługa instrumentalna podczas dożynek, 221 zł ujawnione w CRU.

Każdy rekord ma bezpośredni link do strony umowy w CRU. Przed użyciem w analizie sprawy należy ponownie otworzyć rekord źródłowy i uzupełnić datę ponownej weryfikacji.

## Integracja
Publiczna strona nie wykonuje połączenia z integracyjnym API CRU. API integracyjne wymaga `X-API-KEY`; sekret nie może trafić do HTML, JavaScript ani publicznego repozytorium. Obecna wersja korzysta z lokalnego, ręcznie opracowanego pliku JSON.

## Testy wymagane przed oznaczeniem jako integracja
- walidacja schematu i unikalności UUID;
- sprawdzenie, że kwota `null` nie jest renderowana jako 0;
- sprawdzenie bezpiecznego renderowania tekstu przez `textContent`;
- test wyszukiwarki i filtra danych nieujawnionych;
- test mobilnego układu i odnośników do CRU;
- osobny test API dopiero po uzyskaniu legalnego klucza i wykonaniu rzeczywistego żądania.
