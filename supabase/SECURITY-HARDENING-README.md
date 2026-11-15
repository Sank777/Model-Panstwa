# Pakiet hardeningu bazy danych

Ten katalog zawiera:
- migrację ograniczającą niebezpieczne uprawnienia tabelowe bez kasowania danych,
- zapytania weryfikacyjne po migracji,
- plan bezpiecznej migracji zdjęć, formularzy, kont i historii.

Migracja nie zmienia konta administratora, nie usuwa danych i nie zmienia widoczności istniejącego bucketu. To celowy etap 1, ponieważ bez równoczesnej zmiany frontendu odcięłoby to zdjęcia używane przez stronę.
