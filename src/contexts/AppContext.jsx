import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [screen, setScreen] = useState("start");
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    players: [],
    quiz: {},
  });

  const quizList = [
    // dodać piłkarz, tynkarz, polityk czy sportowiec
    // dodać licytację
    // dodać
    {
      type: "standard",
      name: "Testowy",
      categories: [
        {
          name: "Polska lub nie",
          list: [
            {
              no: 1,
              question:
                "W którym kraju znajduje się miejscowość o nazwie Poland, w której najszybciej na świecie wita się nowy rok?",
              answers: ["Kiribati", "Nauru", "Palau", "Vanuatu"],
              correctAnswer: ["Kiribati"],
              done: false,
            },
            {
              no: 2,
              question:
                "W którym kraju znajduje się najstarszy na świecie działający uniwersytet?",
              answers: ["Polska", "Włochy", "Francja", "Wielka Brytania"],
              correctAnswer: ["Włochy"],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Recyacja",
          list: [
            {
              no: 7,
              question: "Przbieżeli do Betlejem",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,koleda,przybiezeli_do_betlejem.html",
              ],
              done: false,
            },
            {
              no: 1,
              question: "Powiedz - Ich Troje",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,ich_troje,powiedz.html",
              ],
              done: false,
            },
            {
              no: 3,
              question: "Golec uOrkiestra - Ściernisco",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,golec_uorkiestra,sciernisco.html",
              ],
              done: false,
            },
            {
              no: 4,
              question: "Brathanki - Czerwone korale",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,brathanki,czerwone_korale.html",
              ],
              done: false,
            },
            {
              no: 5,
              question: "Baśka - Wilki",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,wilki,baska.html",
              ],
              done: false,
            },
            {
              no: 6,
              question: "Jeden Osiem L - Jak zapomnieć",
              correctAnswer: [
                "https://www.tekstowo.pl/szukaj,Jeden+Osiem+L+-+Jak+zapomnieć.html",
              ],
              done: false,
            },
            {
              no: 2,
              question: "Pan Tadeusz - Inwokacja",
              correctAnswer: [
                "https://polska-poezja.pl/lista-wierszy/141-adam-mickiewicz-pan-tadeusz-inwokacja",
              ],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Kto to powiedział",
          list: [
            {
              no: 1,
              question:
                "Kto powiedział: 'Dobry wieczór. Coś się... coś się popsuło i nie było mnie słychać, to powtórzę jeszcze raz'?",
              answers: [
                "Janusz Korwin-Mikke",
                "Zbigniew Stonoga",
                "Krzysztof Stanowski",
                "Krzysztof Kononowicz",
              ],
              correctAnswer: ["Zbigniew Stonoga"],
              done: false,
            },
            {
              no: 2,
              question:
                "Kto powiedział: 'Mnie nie interesuje prawo, mnie interesuje sprawiedliwość'?",
              answers: [
                "Adolf Hitler",
                "Jarosław Kaczyński",
                "Lech Kaczyński",
                "Donald Tusk",
              ],
              correctAnswer: ["Adolf Hitler"],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Ekspert",
          list: [
            {
              no: 1,
              question: "Co jest prawdą?",
              answers: [
                "Na księżycu woda jest bezbarwna, ponieważ nie ma atmosfery i nie może odbijać kolorów",
                "Na księżycu nie ma wody",
                "Na księżycu woda jest złota ze względu na różne reakcje w gónych warstwach gruntu",
                "Na księżycu woda występuje wyłącznie w stanie stałym",
              ],
              correctAnswer: [
                "Na księżycu woda jest bezbarwna, ponieważ nie ma atmosfery i nie może odbijać kolorów",
              ],
              done: false,
            },
            {
              no: 2,
              question: "Czy delfiny mają własne imiona?",
              answers: [
                "Każdy delfin w grupie ma swój unikalny dźwięk, który pełni funkcję imienia",
                "Delfiny komunikują się tylko poprzez dźwięki, ale nie przypisują sobie imion",
                "Tylko te, które żyją w oceanach południowych",
                "Delfiny używają imion tylko w celach towarzyskich, nie do identyfikacj",
              ],
              correctAnswer: [
                "Każdy delfin w grupie ma swój unikalny dźwięk, który pełni funkcję imienia",
              ],
              done: false,
            },

            {
              no: 3,
              question: "Czy ludzie mogą widzieć w podczerwieni?",
              answers: [
                "Tak, człowiek może widzieć w podczerwieni, ale tylko w przypadku ekstremalnego nasłonecznienia",
                "Nie, ludzie nie widzą w podczerwieni, ale mogą wykrywać ciepło ciał dzięki specjalnym komórkom w siatkówce",
                "Tak, dzieci w wieku do 3 lat mogą widzieć w podczerwieni do pewnego stopnia",
                "Nie, jednak ludzie potrafią widzieć „na granicy” podczerwieni, jeśli mają odpowiednie okulary",
              ],
              correctAnswer: [
                "Nie, ludzie nie widzą w podczerwieni, ale mogą wykrywać ciepło ciał dzięki specjalnym komórkom w siatkówce",
              ],
              done: false,
            },
            {
              no: 4,
              question:
                "Czy istnieje kraj, który oficjalnie uznaje płynność granic?",
              answers: [
                "Tak, w Szwajcarii granice zmieniają się każdego roku w zależności od decyzji mieszkańców.",
                "Tak, w Niemczech istnieje region, w którym granice między krajami nie są ustalone na stałe, zmieniają się zgodnie z porozumieniem.",
                "Nie, nie istnieje żaden kraj, który by to uznawał.",
                "Tak, w USA istnieją tzw. 'graniczne kameleony', które są płynne.",
              ],
              correctAnswer: [
                "Nie, nie istnieje żaden kraj, który by to uznawał.",
              ],
              done: false,
            },
            {
              no: 5,
              question: "Czy pingwiny potrafią latać?",
              answers: [
                "Tak, pingwiny mają krótkie skrzydła, które mogą używać do latania na dużych wysokościach w zimie.",
                "Tak, pingwiny mogą latać, ale tylko w wodzie, jak delfiny.",
                "Nie, pingwiny nie latają, ale potrafią „skakać” na wysokość kilku metrów.",
                "Nie, pingwiny nie potrafią latać, ale czasami używają skrzydeł do pływania w wodzie.",
              ],
              correctAnswer: [
                "Nie, pingwiny nie potrafią latać, ale czasami używają skrzydeł do pływania w wodzie.",
              ],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Wynalazek",
          list: [
            {
              no: 1,
              question:
                "W XIX wieku znaleziono sposób na ludzi, którzy bali się, że zostaną pochowani żywcem. Co to było?",
              answers: [
                "Dzwonek połączony sznurkiem z trumną",
                "Nóż wyskakujący z trumny po zamknięciu wieka",
                "Kot wpuszczany do trumny",
              ],
              correctAnswer: ["Dzwonek połączony sznurkiem z trumną"],
              done: false,
            },
            {
              no: 2,
              question: "Jaką funkcję miał radiowy kapelusz z lat 40.?",
              answers: [
                "Był anteną do odbioru radia",
                "Służył do podsłuchiwania sąsiadów",
                "Dawał noszącemu elektryczne impulsy poprawiające nastrój",
                "Chronił przed UFO",
              ],
              correctAnswer: ["Był anteną do odbioru radia"],
              done: false,
            },

            {
              no: 3,
              question: "Czym był 'Nose Stylizer' z lat 30.?",
              answers: [
                "Metalową klamrą zakładaną na nos, by zmienić jego kształt",
                "Kapturem, który nadawał nosowi połysk",
                "Urządzeniem do odsysania powietrza z nosa, by poprawić oddychanie",
                "Nakładką na nos, która miała poprawiać jakość śpiewu",
              ],
              correctAnswer: [
                "Metalową klamrą zakładaną na nos, by zmienić jego kształt",
              ],
              done: false,
            },
            {
              no: 4,
              question:
                "Jaki wynalazek miał na celu wyeliminowanie konieczności mycia rąk w XIX wieku?",
              answers: [
                "Rękawice do noszenia zamiast mycia rąk",
                "Specjalny proszek do posypywania rąk, który je oczyszczał",
                "Zestaw do czyszczenia rąk za pomocą powietrza",
                "Skrzynka z mikrofalami do dezynfekcji dłoni",
              ],
              correctAnswer: [
                "Specjalny proszek do posypywania rąk, który je oczyszczał",
              ],
              done: false,
            },
          ],
        },

        {type: "standard",
          name: "Kluczowa wiedza o Kazachsanie",
          list: [
            {
              no: 0,
              question:
                "Kazachstan jest jednym z największych światowych eksporterów...",
              answers: ["Uranu", "Żubrówki", "Siodeł do koni", "Matrioszek"],
              correctAnswer: ["Uranu"],
              done: false,
            },
            {
              no: 1,
              question: "Które miasto jest stolicą Kazachstanu?",
              answers: ["Astana", "Ałmaty", "Karaganda", "Nur-Sułtan"],
              correctAnswer: ["Astana"],
              done: false,
            },
            {
              no: 2,
              question:
                "Jak Kazachowie nazywają swojego prezydenta, jeśli chcą brzmieć super oficjalnie?",
              answers: [
                "Jego Stepowa Wysokość",
                "Bałchaszański Władca",
                "Lider Narodu",
                "Kazachinator",
              ],
              correctAnswer: ["Lider Narodu"],
              done: false,
            },
            {
              no: 3,
              question:
                "Co w Kazachstanie jest tradycyjnym środkiem transportu na stepie?",
              answers: ["Łoś", "Wielbłąd", "Koń", "Segway"],
              correctAnswer: ["Koń"],
              done: false,
            },
            {
              no: 4,
              question:
                "Kazachstan ma własną wersję Hollywood, jak się nazywa?",
              answers: ["Kazawood", "Stepwood", "Almatywood", "Boratwood"],
              correctAnswer: ["Kazawood"],
              done: false,
            },
            {
              no: 5,
              question: "Z kim nie graniczy Kazachstan?",
              answers: ["Kiristan", "Turkmenistan", "Mongolia", "Uzbekistan"],
              correctAnswer: ["Mongolia"],
              done: false,
            },
            {
              no: 6,
              question: "Co nie jest prawdą o Kazachstanie?",
              answers: [
                "Ma największy na świecie rezerwat dzikich koni Przewalskiego",
                "Ma najwięcej jezior na świecie, ale zalicza do nich również małe stawy i duże kałuże na stepach",
                "Ma największe złoża uranu na świecie",
                "Ma największą na świecie przestrzeń do testowania rakiet kosmicznych",
              ],
              correctAnswer: [
                "Ma najwięcej jezior na świecie, ale zalicza do nich również małe stawy i duże kałuże na stepach",
              ],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Pierwsze",
          list: [
            {
              no: 1,
              question: "Co powstało pierwsze?",
              answers: ["Facebook", "YouTube", "Grono.net", "Kurnik.pl"],
              correctAnswer: ["Kurnik.pl"],
              done: false,
            },
            {
              no: 2,
              question: "Co powstało pierwsze?",
              answers: ["iPhone", "Android", "WindowsPhone"],
              correctAnswer: ["iPhone"],
              done: false,
            },
            {
              no: 3,
              question: "Co powstało pierwsze?",
              answers: [
                "Czołg",
                "Rakieta balistyczna",
                "Bomba atomowa",
                "Samolot",
              ],
              correctAnswer: ["Samolot"],
              done: false,
            },

            {
              no: 4,
              question: "Co powstało pierwsze?",
              answers: [
                "Wielki mur chiński",
                "Piramidy w Egipcie",
                "Koloseum w Rzymie",
                "Statua Wolności w Nowym Jorku",
              ],
              correctAnswer: ["Piramidy w Egipcie"],
              done: false,
            },
            {
              no: 5,
              question: "Co powstało pierwsze?",
              answers: ["Mikroskop", "Teleskop", "Żyroskop", "Oscloskop"],
              correctAnswer: ["Teleskop"],
              done: false,
            },
            {
              no: 6,
              question: "Co powstało pierwsze?",
              answers: [
                "Piramidy Majów",
                "Wielki Mur Chiński",
                "Stonehenge",
                "Koloseum w Rzymie",
              ],
              correctAnswer: ["Stonehenge"],
              done: false,
            },
            {
              no: 7,
              question: "Co powstało pierwsze?",
              answers: ["Mikrofon", "Gramofon", "Domofon", "Kulfon"],
              correctAnswer: ["Gramofon"],
              done: false,
            },
          ],
        },
        {type: "standard",
          name: "Gdzie to się wydarzyło?",
          list: [
            {
              no: 1,
              question:
                "Gdzie odbyły się pierwsze starożytne igrzyska olimpijskie?",
              answers: ["Ateny", "Rzym", "Korynt", "Sparta"],
              correctAnswer: ["Ateny"],
              done: false,
            },
            {
              no: 2,
              question:
                "Gdzie odbyły się pierwsze nowożytne igrzyska olimpijskie?",
              answers: ["Ateny", "Rzym", "Korynt", "Sparta"],
              correctAnswer: ["Ateny"],
              done: false,
            },
            {
              no: 3,
              question: "Gdzie zbudowano Wielki Mur Chiński?",
              answers: ["Indie", "Chiny", "Wietnam", "Korea Północna"],
              correctAnswer: ["Chiny"],
              done: false,
            },
          ],
        },
        {type: "forehead",
          name: "Czółko",
          list: [
            {
              no: 2,
              correctAnswer: ["Janusz Tracz"],
              done: false,
            },
            {
              no: 1,
              correctAnswer: ["Paweł Kozioł (wójt)"],
              done: false,
            },
            {
              no: 3,
              correctAnswer: ["Jan Paweł II"],
              done: false,
            },
            {
              no: 4,
              correctAnswer: ["Lord Voldemort"],
              done: false,
            },
          ],
        },
      ],
    },
    {
      name: "Urodziny",
      categories: [
        {
          type: "illustrated",
          name: "Czoło",
          list: [
            {
              no: 1,
              question: "Czyje to czoło?",
              image: "images/adam.png",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },            {
              no: 1,
              question: "Czyje to czoło?",
              image: "images/adam.png",
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
        {
          name: "Niemcy",
          list: [
            {
              no: 1,
              question: "Jak das się masz?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
            {
              no: 2,
              question: "Jak das się masz hier?",
              answers: ["Dobrze", "Źle", "Jako-tako", "Bywało lepiej"],
              correctAnswer: ["Bywało lepiej"],
              done: false,
            },
          ],
        },
      ],
    },
  ];

  const providerValue = {
    windowWidth,
    screen,
    setScreen,
    gameSettings,
    setGameSettings,
    quizList,
    isQuestionActive,
    setIsQuestionActive,
    selectedCategory,
    setSelectedCategory,
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
