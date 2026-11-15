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
- Deployment: wdrożenie produkcyjne potwierdzone poniżej w sekcji „Aktualny stan produkcji”.
- Ryzyko/ograniczenia: publiczny bucket i dotychczasowy frontend pozostają bez zmian; obrazy nie są jeszcze re-enkodowane, więc EXIF/GPS może pozostać.

### PR #11 — worker Storage, etap 4 (zastąpiony)
- PR: https://github.com/Sank777/Model-Panstwa/pull/11
- Branch: `security/storage-cleanup-worker-2026-11`
- Status: zamknięty bez merge jako zastąpiony przez PR #12.
- CI: run 43692922064 zakończony sukcesem dla SHA `334bc7b0afd8fe0730a9f63fd7caf0d86fef9f72`.

### PR #12 — worker Storage i dodatkowe utwardzenie
- PR: https://github.com/Sank777/Model-Panstwa/pull/12
- Branch: `security/worker-hardening-followup`
- Merge: scalony do `main` metodą squash, commit `4058958072b139b475dbf23910fcd61d0ac56ebc`.
- Zakres: worker etap 4, ograniczenie body do 1000 bajtów, ścisłe UTF-8, walidacja JSON oraz jawne odrzucanie NULL i limitów poza 1–20 w RPC.
- CI: run 43693452800 zakończony sukcesem; job `deno-tests` success.
- Deployment i weryfikacja produkcyjna: worker v1 aktywny; szczegóły poniżej. Nie skonfigurowano harmonogramu/wyzwalacza.

### PR #13 — utwardzenie funkcji audytowej
- PR: https://github.com/Sank777/Model-Panstwa/pull/13
- Merge: scalony do `main` metodą squash, commit `8774597d0f49f435ecf746379947b7fa7038d023`.
- Migracja: `20261115090000_harden_investment_audit_search_path.sql`.
- Zakres: pusty `search_path` dla `private.log_investment_audit_event()`; odebranie EXECUTE rolom PUBLIC, anon i authenticated.
- Wdrożenie produkcyjne: migracja zastosowana pomyślnie.
- Weryfikacja SQL po wdrożeniu: `search_path=""`; EXECUTE dla anon=false, authenticated=false, service_role=false; ACL pozostawia EXECUTE właścicielowi postgres. Funkcja jest wyzwalaczem, nie endpointem RPC.

## Aktualny stan produkcji — kontrola 2026-11-15

- Supabase project: `ldjrinmohlomzlyeagwd`, status `ACTIVE_HEALTHY`.
- Zastosowane migracje: `202611150001_security_privilege_hardening`, `202611150002_admin_audit_and_cleanup_queue`, `202611150003_storage_cleanup_worker`, `20261115090000_harden_investment_audit_search_path`.
- Tabele `admin_audit_log` i `storage_cleanup_queue` istnieją; RLS włączone. Role anon i authenticated nie mają SELECT do tych tabel. RPC `claim_storage_cleanup_jobs` jest wykonywalne przez service_role, nie przez role klienckie.
- Edge Function `submit-report`: v6 ACTIVE, `verify_jwt=false`; zachowano ręczną weryfikację Bearer w funkcji.
- Edge Function `admin-manage-reports`: v5 ACTIVE, `verify_jwt=true`.
- Edge Function `storage-cleanup-worker`: v1 ACTIVE, `verify_jwt=true`; dodatkowo wymaga sekretu `STORAGE_CLEANUP_WORKER_SECRET` w nagłówku `x-worker-secret`. Sekret ustawiono w Supabase Dashboard; jego wartości nie zapisuje się w repozytorium ani changelogu.
- Worker nie ma jeszcze harmonogramu/wyzwalacza. Kolejka była pusta podczas ostatniej kontroli; nie wykonano testu usunięcia rzeczywistego obiektu.
- Pozostałe funkcje: `track-visit` v1, `admin-case-records` v4, `admin-access-management` v2 — bez zmian.
- Nie zmieniano publiczności bucketu `zgloszenia-zdjecia` ani grantów `storage.objects`.
- Konto administratora, konta użytkowników i istniejące rekordy biznesowe nie były modyfikowane w ramach tych zmian.
- Kopia zapasowa i odtworzenie: nie potwierdzono jeszcze osobnej kopii bazy i Storage z testem odtworzenia.

## Wyniki audytu funkcji uprzywilejowanych

- Przejrzano definicje wszystkich znalezionych funkcji `SECURITY DEFINER` w schematach public/private.
- `claim_storage_cleanup_jobs`, `get_site_analytics`, `record_site_visit`, `capture_report_changes` i `handle_new_auth_user` mają pusty `search_path`; odwołania do obiektów aplikacyjnych są kwalifikowane schematem.
- `private.log_investment_audit_event()` została dodatkowo utwardzona migracją PR #13.
- `get_site_analytics` i `record_site_visit` sprawdzają rolę service_role w treści funkcji; ACL ograniczone do postgres/service_role.
- Nie zmieniano istniejących polityk RLS ani konta administratora. Złożone polityki wymagają dalszego przeglądu pod kątem semantyki OR i rzeczywistych ścieżek frontendowych.

## Testy i ograniczenia nadal otwarte

- Nie wykonano pełnego testu przeglądarkowego formularza zgłoszeniowego i panelu administratora.
- Nie wykonano kontrolowanego testu workera na sztucznym obiekcie Storage; nie uruchamiać workera na istniejącym jedynym pliku.
- Obrazy są sprawdzane pod kątem MIME/sygnatury i limitu, ale nie są jeszcze dekodowane i ponownie kodowane. EXIF/GPS może pozostać.
- Nie potwierdzono backupu i testowego odtworzenia.
- Publiczne SELECT tabeli `zgloszenia` może ujawniać także kolumny `user_id`, `lat`, `lng`; ograniczenie wymaga najpierw audytu frontendu i zaprojektowania bezpiecznego widoku/API.
- W `admin-manage-reports` audyt operacji administracyjnej jest wykonywany po zmianie danych; należy zbadać obsługę awarii audytu i rozważyć atomowe rozwiązanie bazodanowe.
- Nie skonfigurowano automatycznego wyzwalania workera. Nie wolno umieszczać sekretu ani klucza service_role w repozytorium, frontendzie lub jawnym SQL.

## Następne kroki

1. Potwierdzić backup bazy i osobną kopię Storage oraz procedurę odtworzenia.
2. Przetestować formularz, panel administratora i Edge Functions end-to-end.
3. Przetestować worker wyłącznie na kontrolowanym, sztucznym obiekcie.
4. Zaprojektować bezpieczny mechanizm harmonogramu workera; dopiero potem uruchomić automatyzację.
5. Dodać dekodowanie i ponowne kodowanie zdjęć z usuwaniem EXIF/GPS oraz limitem wymiarów/pikseli.
6. Zbadać atomowość rejestru audytowego i ekspozycję kolumn publicznych zgłoszeń.

## Zasada dokumentacyjna

Nie oznaczać zmian jako wdrożonych ani zabezpieczeń jako aktywnych, dopóki nie zostały zastosowane i zweryfikowane na właściwym środowisku. CI, merge, deployment i verification to odrębne etapy.
