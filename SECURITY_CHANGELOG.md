# SECURITY_CHANGELOG

Rejestr zmian bezpieczeństwa projektu Model-Panstwa. Statusy opisują stan faktyczny; scalenie kodu nie oznacza wdrożenia na Supabase.

## 2026-11-15 — Pakiet zabezpieczeń bazy i Edge Functions

### PR #10 — etap 1–3
- PR: https://github.com/Sank777/Model-Panstwa/pull/10
- Branch: `security/database-hardening-2026-11`
- Merge: scalony do `main`, commit `1640ca937457243716f2b0aa74a2fbfb43887603`.
- Zakres: ograniczenie niebezpiecznych uprawnień SQL, poprawa parsera Bearer w kodzie `submit-report`, ograniczenie kolumn GET w `admin-manage-reports`, rejestr audytowy i kolejka sprzątania Storage.
- CI: testy pomocnicze przechodziły na gałęzi PR.
- Review: przygotowanie etapowe; brak pełnych testów integracyjnych.
- Deployment: NIE WDROŻONO na Supabase.
- Verification: produkcyjna funkcja `submit-report` pozostaje v5, `admin-manage-reports` v4; migracje etapu 1 i 3 nie występują w rejestrze migracji produkcyjnych podczas kontroli 2026-11-15.
- Ryzyko/ograniczenia: publiczny bucket i dotychczasowy frontend pozostają bez zmian; obrazy nie są jeszcze re-enkodowane, więc EXIF/GPS może pozostać.
- Rollback: nie dotyczy wdrożenia produkcyjnego, ponieważ go nie wykonano. Ewentualny rollback kodu repo przez revert merge commit po analizie zależności.

### PR #11 — worker Storage, etap 4 (zastąpiony)
- PR: https://github.com/Sank777/Model-Panstwa/pull/11
- Branch: `security/storage-cleanup-worker-2026-11`
- Status: zamknięty bez merge jako zastąpiony przez PR #12.
- CI: run 43692922064 zakończony sukcesem dla SHA `334bc7b0afd8fe0730a9f63fd7caf0d86fef9f72`.
- Zakres: kolejka retry, RPC claim z `FOR UPDATE SKIP LOCKED`, worker ograniczony do zarządzanego bucketu i ścieżek.
- Deployment: NIE WDROŻONO.

### PR #12 — worker Storage i dodatkowe utwardzenie
- PR: https://github.com/Sank777/Model-Panstwa/pull/12
- Branch: `security/worker-hardening-followup`
- Merge: scalony do `main` metodą squash, commit `4058958072b139b475dbf23910fcd61d0ac56ebc`.
- Zakres: etap 4 workera, ograniczenie body do 1000 bajtów, ścisłe UTF-8, odpowiedź 413 dla zbyt dużego żądania, walidacja JSON oraz jawne odrzucanie NULL i limitów poza 1–20 w RPC.
- CI: run 43693452800 zakończony sukcesem dla SHA `034bdd5d0c7485f4c9f5e582e9911b7466560966`; job `deno-tests` success.
- Review: zielone CI testuje helpery i parsery; nie jest testem integracyjnym migracji, RPC, Storage ani harmonogramu.
- Deployment: NIE WDROŻONO na Supabase. Nie ustawiono sekretu workera i nie skonfigurowano harmonogramu.
- Verification: migracje `202611150001`, `202611150002`, `202611150003` nie są obecne w rejestrze migracji produkcyjnych podczas kontroli 2026-11-15.
- Ryzyko/ograniczenia: worker nie będzie działał automatycznie bez bezpiecznego wyzwalacza; wymaga testu retry, współbieżności, wygasłych blokad i dead-letter.
- Rollback: nie dotyczy wdrożenia produkcyjnego, ponieważ go nie wykonano. Ewentualny rollback kodu przez revert merge commit po analizie.

## Stan produkcji po wdrożeniu etapów 1–4 (2026-11-15)
- Supabase project: `ldjrinmohlomzlyeagwd`, status `ACTIVE_HEALTHY`.
- Migracje `202611150001`, `202611150002`, `202611150003` zastosowane pomyślnie.
- Weryfikacja SQL: tabele `admin_audit_log` i `storage_cleanup_queue` istnieją, RLS jest włączone; role `anon` i `authenticated` nie mają SELECT do tych tabel; RPC `claim_storage_cleanup_jobs` jest wykonywalne przez `service_role`, nie przez role klienckie; role klienckie nie mają CREATE na schemacie public.
- Edge Function `submit-report` wdrożona jako v6, `verify_jwt=false` (zachowano dotychczasowy model ręcznej weryfikacji Bearer, honeypot i ograniczanie żądań).
- Edge Function `admin-manage-reports` wdrożona jako v5, `verify_jwt=true`; kod korzysta z kolejki Storage i rejestru audytowego.
- Pozostałe funkcje: `track-visit` v1, `admin-case-records` v4, `admin-access-management` v2 — bez zmian.
- Worker `storage-cleanup-worker` NIE jest jeszcze wdrożony; nie ustawiono `STORAGE_CLEANUP_WORKER_SECRET` i nie skonfigurowano harmonogramu/wyzwalacza.
- Nie zmieniano publiczności bucketu ani grantów `storage.objects`.
- Konto administratora, konta użytkowników i istniejące rekordy biznesowe nie były modyfikowane przez wdrożenie.
- Backup i odtworzenie: nie potwierdzono jeszcze kopii bazy i osobnej kopii Storage z testem odtworzenia. Rollback aplikacyjny można wykonać przez ponowne wdrożenie poprzednich wersji funkcji; rollback SQL wymaga osobnej migracji kompensującej i nie jest automatyczny.

## Weryfikacja po wdrożeniu
- Potwierdzono obecność trzech tabel/funkcji migracji oraz uprawnienia RLS/ACL zapytaniami SQL.
- Nie wykonano jeszcze pełnego testu przeglądarkowego formularza i panelu administratora ani testu rzeczywistego uploadu/usuwania zdjęć.
- Przed włączeniem workera wymagane jest bezpieczne ustawienie sekretu o długości co najmniej 32 znaków oraz wyzwalacza z JWT; następnie test na kontrolowanym obiekcie w Storage.

## Następne wymagane kroki
1. Wykonać i zweryfikować backup bazy oraz osobną kopię obiektów Storage; potwierdzić procedurę odtworzenia.
2. Uruchomić migracje 001–003 na odrębnym środowisku testowym, wykonać testy RLS, uprawnień, RPC i współbieżności.
3. Przetestować Edge Functions end-to-end, w tym autoryzację, usuwanie zdjęć, retry i dead-letter.
4. Dodać bezpieczny sekret workera przez Supabase secrets i skonfigurować wyzwalacz dopiero po testach.
5. Przygotować pipeline dekodowania i ponownego kodowania zdjęć usuwający EXIF/GPS; nie zmieniać publiczności bucketu przed zmianą frontendu na signed URLs.
6. Dopiero po akceptacji testów i potwierdzeniu backupu wykonać osobny rollout produkcyjny oraz test powdrożeniowy.

## Zasada dokumentacyjna
Nie oznaczać zmian jako wdrożonych ani zabezpieczeń jako aktywnych, dopóki nie zostały zastosowane i zweryfikowane na właściwym środowisku. CI, merge, deployment i verification to odrębne etapy.
