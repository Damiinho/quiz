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

## Format importu i eksportu

Quizy sa eksportowane jako JSON. Minimalny przyklad:

```json
{
  "name": "Moj quiz",
  "categories": [
    {
      "name": "Wiedza",
      "type": "standard",
      "list": [
        {
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

Dostepne typy kategorii: `standard`, `illustrated`, `forehead`, `auction`, `duel`, `album`.
`auction` moze miec `timerSeconds`, np. `"timerSeconds": 45`. `duel` sluzy do pojedynku bez licznika czasu i bez jednej poprawnej odpowiedzi.

`localStorage` przechowuje stan gry tylko w przegladarce na tym komputerze. Dzieki temu odswiezenie strony nie kasuje graczy, punktow ani wykorzystanych pytan.

## Pomysly na rozwoj

- historia punktow i cofanie ostatniej zmiany,
- tryb losowania pytan zamiast stalej kolejnosci,
- osobny panel prowadzacego i widok dla graczy na drugim ekranie,
- eksport wynikow po grze do pliku.
