# Leon Visual Engine V1

## Cel
Tworzenie dziesięciu spójnych, realistycznych zdjęć-kafelków. Generator tworzy wyłącznie fotografię; tekst, ikony, gradienty i obramowania pozostają w HTML/CSS.

## Stałe reguły obrazu
- 1536 × 1024, poziomy kadr 3:2.
- Fotografia dokumentalna/editorial, granatowa baza, naturalne światło i realistyczne materiały.
- Główny temat czytelny w małym kafelku; dolne 25% pozostawione ciemniejsze pod tekst HTML.
- Zakaz tekstów, liter, liczb, logotypów, znaków wodnych, flag, UI, ramek, ikon i ilustracji.
- Każdy filar ma osobną scenę i akcent; styl, kadr i światło są wspólne.

## Architektura
1. Administrator wywołuje Supabase Edge Function.
2. Funkcja weryfikuje sesję i rolę z `app_metadata`, nigdy z edytowalnego `user_metadata`.
3. Prompt jest składany ze stałych reguł i jednej z 10 scen.
4. OpenAI Images API generuje pojedynczy WebP.
5. Funkcja zapisuje unikalny plik do osobnego bucketu `visual-assets`; nie nadpisuje zatwierdzonych grafik.
6. Zwracany jest publiczny adres obrazu; strona tylko go odczytuje.

## Ograniczenia
- Jedno żądanie generuje dokładnie jeden obraz; brak automatycznego generowania odwiedzającym.
- Klucze API i service-role pozostają wyłącznie po stronie serwera.
- Dodatkowy opis sceny maksymalnie 500 znaków.
- WebP, kompresja 82, limit pliku 5 MB.
- Nowe grafiki są wersjami testowymi; nie podmieniają aktywnych kafelków.

## Konfiguracja i status
Wymagany sekret Supabase `OPENAI_API_KEY`. Opcjonalny `OPENAI_IMAGE_MODEL`; domyślnie `gpt-image-2.5-flare`. Funkcja musi być wdrożona z `verify_jwt=true`. V1 jest przygotowany do przeglądu, ale nie jest wdrożony ani połączony z kafelkami. Bez sekretu nie można wykonać testu generowania.
