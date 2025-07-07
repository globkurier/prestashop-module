# Integracja z systemem Glob Kurier

## Założenia główne modułu

1. Napisany zgodnie z wytycznymi serwisu PrestaShop.
2. Ma pomyślnie przechodzić walidację na stronie validator.prestashop.com
3. Kompatybilny ze sklepem PrestaShop w wersji 1.6
4. Instalacja modułu będzie przebiegać zgodnie ze standardem PrestaShop, na podstawie stworzonej paczki instalacyjnej aplikacji, którą będzie można instalować w sklepie z poziomu panelu administracyjnego.
5. Ma posiadać możliwość aktualizacji z poziomu panelu administracyjnego, opisanej jako „Auto-updating modules” w dokumentacji serwisu PrestaShop
6. Ma umożliwiać użytkownikowi jak najprostsze i najbardziej intuicyjne zamawianie przesyłek kurierskich w serwisie www.globkurier.pl
7. Zapisuje wszystkie błędy, które wystąpiły podczas korzystania z modułu (tzw. logowanie błędów)
8. Posiada zapisany kod do mierzenia źródła zamówienia („<order_source>”) oraz kod do mierzenia wersji sklepu, z którego pochodzi zamówienie

## Funkcjonalności backend (czyli zawarte w panelu administracyjnym danego sklepu)

1. Strona z listą zamówień (sprzedaży)

    a) możliwość utworzenia przesyłki dla kilku zamówień pochodzących od tego samego klienta i skierowanych na ten sam adres dostawy

2. Strona ze szczegółami zamówienia

    a) możliwość utworzenia przesyłki bazując na danych obecnego zamówienia (adres dostawy), poprzez odpowiedni odnośnik do strony opisanej w pkt 4.

    b) jeśli do obecnego zamówienia została już zamówiona przesyłka wyświetla się możliwość pobrania listu przewozowego, oraz link do śledzenia przesyłki.

3. Strona z panelem konfiguracyjnym modułu

    a) możliwość rejestracji nowego klienta

    b) możliwość ustawienia domyślnych danych do tworzenia przesyłki, takich jak, adres nadania, wymiary i waga przesyłki, przewoźnika, metody płatności

    c) przyciski do włączenia lub wyłączenia obsługi paczkomatów InPost oraz punktów GlobBox.

    d) w przypadku włączenia obsługi, którejś z usług z pkt. c) pojawia się pole do powiązania przewoźnika z przewoźnikiem ze sklepu.

    e) w przypadku włączenia obsługi paczkomatów InPost pojawia się okienko z wyborem domyślnego punktu nadawczego

4. Strona zamawiania przesyłki

    a) oznaczenie pól obowiązkowych

    b) odpowiednia walidacja

    c) automatyczne uzupełnieni pól domyślnymi danymi opisanymi w pkt 3 b)

    d) możliwość zmiany adresu dostawy oraz adresu odbioru

    e) przy tworzeniu przesyłki do zamówienia wykrywanie, czy została wybrana przesyłka z obiorem w punkcie (usługi inpost, globbox)

    f) w przypadku kiedy system wykrył przesyłkę z odbiorem w punkcie, a po wpisaniu wymiarów i wagi przesyłki system nie znajdzie żadnej pasującej usługi, pojawia się okienko z komunikatem i dwoma możliwościami do wybory: "Zmień parametry przesyłki i wyceń jeszcze raz", oraz "Anuluj wybór klienta i pokaż wszystkie usługi".

    g) jeśli usługa wymaga również nadania w punkcie (inpost), wyświetla się pole do wybrania punktu nadania.

5. Strona z historią nadanych przesyłek

    a) zawiera wszystkie przesyłki zamówione za pośrednictwem modułu

    b) umożliwia podgląd podstawowych danych przesyłki

    c) w przypadku przesyłek powiązanych z zamówieniem, posiada odnośnik do tego zamówienia

## Funkcjonalności frontend (czyli zawarte w części sklepu widocznej dla każdego klienta)

1. Strona składania zamówienia – krok wyboru przewoźnika

    a) Klient wybiera przewoźnika - jeśli przewoźnik jest powiązany z odbiorem w punkcie, to pojawia się okienko do wyboru punktu