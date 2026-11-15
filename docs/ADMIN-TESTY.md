# System zgłoszeń — testy odbiorcze

## Zmiany w obsłudze zdjęć
- Formularz przyjmuje jedno opcjonalne zdjęcie JPG, PNG lub WebP do 5 MB.
- Zdjęcie jest wysyłane jako multipart/form-data do funkcji `submit-report`.
- Funkcja serwerowa sprawdza MIME i sygnaturę pliku, zapisuje obraz w bucket `zgloszenia-zdjecia` i zapisuje jego publiczny URL w kolumnie `photo`.
- W przypadku błędu zapisu zgłoszenia funkcja próbuje usunąć wcześniej przesłany plik.
- Publiczna lista pokazuje zdjęcie dopiero przy zatwierdzonym zgłoszeniu; panel administratora pokazuje zdjęcie również w kolejce moderacji.
- Bucket jest publiczny: każdy, kto zna bezpośredni URL pliku, może go odczytać. Nie należy przesyłać zdjęć zawierających dane osobowe, dokumenty ani informacje poufne.

## Testy do wykonania
1. Otworzyć prototyp i sprawdzić, czy lista publiczna pokazuje wyłącznie zatwierdzone rekordy.
2. Wysłać zgłoszenie bez zdjęcia i bez pinezki — oczekiwany zapis rekordu z `photo = null`, `lat = null`, `lng = null`.
3. Wysłać zgłoszenie ze zdjęciem JPG do 5 MB — oczekiwany zapis w Storage i URL w kolumnie `photo`.
4. Sprawdzić w panelu administratora podgląd zdjęcia zgłoszenia oczekującego na moderację.
5. Zatwierdzić zgłoszenie ze zdjęciem — powinno pojawić się na publicznej liście wraz ze zdjęciem.
6. Odrzucić zgłoszenie ze zdjęciem — nie powinno pojawić się na publicznej liście.
7. Spróbować wysłać plik większy niż 5 MB — oczekiwane odrzucenie.
8. Spróbować wysłać plik o niedozwolonym typie lub niezgodnej sygnaturze — oczekiwane odrzucenie.
9. Sprawdzić, że wysyłka bez zdjęcia nadal działa.
10. Sprawdzić logi funkcji po testach; nie powinno być błędów 5xx.

## Stan testów
- Zmiany kodu formularza zapisane na gałęzi `feature/report-photo-upload`.
- Funkcja `submit-report` została wdrożona w Supabase w wersji obsługującej multipart/form-data i zdjęcia.
- Nie wykonano jeszcze pełnego testu przeglądarkowego z rzeczywistym zdjęciem i kontem administratora.
- Nie scalono zmian frontendowych do `main`; główna strona pozostaje bez zmian.
- Testy ręczne 1–10 należy wykonać przed uznaniem funkcji za gotową produkcyjnie.
