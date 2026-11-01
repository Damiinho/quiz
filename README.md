# Super zgadywanka

Lokalna aplikacja quizowa zbudowana w React + Vite. Projekt sluzy do prowadzenia gry z graczami, punktami, gotowymi zestawami pytan i kilkoma typami rund.

## Co aplikacja potrafi

- wybor gotowego zestawu quizowego,
- import i eksport quizow w plikach JSON,
- tworzenie nowych quizow w kreatorze z osobna lista kategorii,
- edycja kategorii i pytan po utworzeniu,
- edycja quizu wczytanego z pliku JSON,
- komponowanie nowego zestawu z kategorii dostepnych w gotowych i wczytanych quizach,
- walidacja struktury quizu przed gra lub eksportem,
- dodawanie, edycja i usuwanie graczy,
- ustawienie punktacji poczatkowej,
- zapis stanu rozgrywki w localStorage,
- wyswietlanie kategorii z licznikiem pozostalych pytan,
- obsluga pytan standardowych, obrazkowych, albumow zdjec, dzwiekow, czolka i licytacji,
- reczna korekta punktow w panelu wynikow,
- oznaczanie wykorzystanych pytan jako zakonczonych,
- ranking koncowy.
- eksport rankingu po grze do CSV.
- stabilne identyfikatory quizow, kategorii i pytan.
- automatyczny szkic kreatora z odzyskiwaniem po odswiezeniu strony.
- ranking koncowy z wykresem zmian punktow i eksportem raportu CSV.
- potwierdzenie odbioru zatwierdzonej odpowiedzi przez prowadzacego.
- mobilny widok gracza z trescia aktywnego pytania i wariantami odpowiedzi bez mozliwosci ich zaznaczenia.
- import pytan z arkusza CSV z walidacja przed edycja quizu.

## Struktura

- `src/contexts/AppContext.jsx` - globalny stan aplikacji, zapis gry i lista quizow.
- `src/data/defaultQuizzes.jsx` - wbudowane quizy.
- `src/utils/quizStorage.js` - localStorage, eksport, import i serializacja quizow.
- `src/utils/quizValidation.js` - walidator struktury quizu.
- `src/Menu.jsx` - prosty router ekranow.
- `src/Menu/CreateNew.jsx` - wejscie do edytora quizu.
- `src/Menu/QuizEditor.jsx` - kreator i edytor quizow, kategorii oraz pytan.
- `src/Menu/ComposeSet.jsx` - komponowanie zestawu z istniejacych kategorii.
- `src/Menu/Game.jsx` - wybor kategorii i widok rozgrywki.
- `src/Menu/Game/Question.jsx` - logika pojedynczego pytania.
- `src/Menu/Game/Results.jsx` - panel wynikow.
- `src/Menu/Ranking.jsx` - ranking koncowy.
- `public/images` i `public/birds` - zasoby multimedialne.

## Uruchamianie

```bash
npm install
npm run dev
```

Build produkcyjny:

```bash
npm run build
```

Sprawdzenie lintem:

```bash
npm run lint
```

Testy logiki:

```bash
npm test
```

Testy przegladarkowe Playwright (przy pierwszym uruchomieniu pobierz Chromium):

```bash
npx playwright install chromium
npm run test:e2e
```

## Import arkusza CSV

W kreatorze wybierz `Importuj arkusz CSV`. Zapisz arkusz z pierwszym wierszem zawierajacym naglowki. Wymagane sa kolumny `Pytanie` i `Poprawna odpowiedz`; opcjonalne: `Kategoria`, `Odpowiedz A`, `Odpowiedz B`, `Odpowiedz C`, `Odpowiedz D` oraz `Kontekst`. Naglowki moga byc tez po angielsku, a parser rozpoznaje przecinek lub srednik jako separator.

Przyklad:

```csv
Kategoria;Pytanie;Odpowiedz A;Odpowiedz B;Poprawna odpowiedz;Kontekst
Geografia;Jaka jest stolica Polski?;Krakow;Warszawa;B;Najwieksze miasto kraju
Historia;Kto byl pierwszym krolem Polski?;;;;Boleslaw Chrobry
```

W kolumnie poprawnej odpowiedzi mozna wpisac litere wariantu A-D albo jego pelna tresc. Pytania bez wariantow sa importowane jako otwarte. Import otwiera quiz w kreatorze i przed zapisem pokazuje bledy wraz z numerem wadliwego wiersza.

## Format importu i eksportu

Quizy sa eksportowane jako JSON. Minimalny przyklad:

```json
{
  "id": "quiz-przyklad",
  "name": "Moj quiz",
  "description": "Krotki opis zestawu pytan.",
  "categories": [
    {
      "id": "kategoria-wiedza",
      "name": "Wiedza",
      "type": "standard",
      "list": [
        {
          "id": "pytanie-1",
          "no": 1,
          "question": "Ile to 2 + 2?",
          "answers": ["3", "4", "5"],
          "correctAnswer": ["4"]
        }
      ]
    }
  ]
}
```

Pola `id` sa nadawane automatycznie nowym quizom i kategoriom. Starsze pliki bez identyfikatorow nadal mozna importowac; aplikacja uzupelni brakujace wartosci. `description` jest opcjonalny.

Dostepne typy kategorii: `standard`, `illustrated`, `forehead`, `auction`, `duel`, `album`, `openAnswer`, `wheel`.
`auction` moze miec `timerSeconds`, np. `"timerSeconds": 45`. `duel` sluzy do pojedynku bez licznika czasu i bez jednej poprawnej odpowiedzi.

Pytanie typu `wheel` przechowuje konfiguracje kola przy sobie. `weight` jest wzgledna waga losowania segmentu:

```json
{
  "name": "Hasla",
  "type": "wheel",
  "list": [{
    "no": 1,
    "correctAnswer": ["SUPER HASLO"],
    "wheelValues": [
      { "value": 1, "weight": 20 },
      { "value": 5, "weight": 15 },
      { "value": 0, "weight": 20 },
      { "value": "bankrupt", "weight": 5 },
      { "value": "freeVowel", "weight": 10 }
    ],
    "vowelCost": 2,
    "timerSeconds": 30,
    "wheelHint": "Film"
  }]
}
```

`bankrupt` zeruje dodatni wynik gracza, ale nie zmienia wyniku ujemnego. Punkty zdobyte literami sa trzymane osobno do momentu rozwiazania hasla. Samogloska jest kupowana najpierw za punkty rundy, a dopiero przy ich braku za wynik calkowity.

`localStorage` przechowuje stan gry tylko w przegladarce na tym komputerze. Dzieki temu odswiezenie strony nie kasuje graczy, punktow ani wykorzystanych pytan.

Kod dolaczenia do gry jest losowym identyfikatorem pokoju, a synchronizacja korzysta z publicznych tematow ntfy.sh. Kod ulatwia znalezienie pokoju, ale nie jest mechanizmem prywatnosci ani uwierzytelniania; nie nalezy przesylac przez ten kanal poufnych danych.

## Pomysly na rozwoj

- historia punktow i cofanie ostatniej zmiany,
- tryb losowania pytan zamiast stalej kolejnosci,
- osobny panel prowadzacego i widok dla graczy na drugim ekranie,
- dolaczanie do gry kodem QR z automatycznie uzupelnionym kodem pokoju,
- mobilny uklad paneli prowadzacego i przewijalnej listy kategorii,
- eksport wynikow po grze do pliku.
- tryb druzynowy z przypisywaniem graczy do druzyn i wspolna punktacja.
