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
            },
            {
              no: 2,
              question:
                "W którym kraju znajduje się najstarszy na świecie działający uniwersytet?",
              answers: ["Polska", "Włochy", "Francja", "Wielka Brytania"],
              correctAnswer: ["Włochy"],
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
            },
            {
              no: 1,
              question: "Powiedz - Ich Troje",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,ich_troje,powiedz.html",
              ],
            },
            {
              no: 3,
              question: "Golec uOrkiestra - Ściernisco",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,golec_uorkiestra,sciernisco.html",
              ],
            },
            {
              no: 4,
              question: "Brathanki - Czerwone korale",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,brathanki,czerwone_korale.html",
              ],
            },
            {
              no: 5,
              question: "Baśka - Wilki",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,wilki,baska.html",
              ],
            },
            {
              no: 6,
              question: "Jeden Osiem L - Jak zapomnieć",
              correctAnswer: [
                "https://www.tekstowo.pl/szukaj,Jeden+Osiem+L+-+Jak+zapomnieć.html",
              ],
            },
            {
              no: 2,
              question: "Pan Tadeusz - Inwokacja",
              correctAnswer: [
                "https://polska-poezja.pl/lista-wierszy/141-adam-mickiewicz-pan-tadeusz-inwokacja",
              ],
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
            },
            {
              no: 1,
              question: "Które miasto jest stolicą Kazachstanu?",
              answers: ["Astana", "Ałmaty", "Karaganda", "Nur-Sułtan"],
              correctAnswer: ["Astana"],
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
            },
            {
              no: 3,
              question:
                "Co w Kazachstanie jest tradycyjnym środkiem transportu na stepie?",
              answers: ["Łoś", "Wielbłąd", "Koń", "Segway"],
              correctAnswer: ["Koń"],
            },
            {
              no: 4,
              question:
                "Kazachstan ma własną wersję Hollywood, jak się nazywa?",
              answers: ["Kazawood", "Stepwood", "Almatywood", "Boratwood"],
              correctAnswer: ["Kazawood"],
            },
            {
              no: 5,
              question: "Z kim nie graniczy Kazachstan?",
              answers: ["Kiristan", "Turkmenistan", "Mongolia", "Uzbekistan"],
              correctAnswer: ["Mongolia"],
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

            },
            {
              no: 2,
              question: "Co powstało pierwsze?",
              answers: ["iPhone", "Android", "WindowsPhone"],
              correctAnswer: ["iPhone"],
            },
            {
              no: 3,
              question: "Co powstało pierwsze?",
              answers: [
                "Czołg",
                "Rakieta balistyczna",
                "Bomba atomowa",
                "Samolot",
                "Sanichód"
              ],
              correctAnswer: ["Samolot"],
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
            },
            {
              no: 5,
              question: "Co powstało pierwsze?",
              answers: ["Mikroskop", "Teleskop", "Żyroskop", "Oscloskop"],
              correctAnswer: ["Teleskop"],
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
            },
            {
              no: 7,
              question: "Co powstało pierwsze?",
              answers: ["Mikrofon", "Gramofon", "Domofon", "Kulfon"],
              correctAnswer: ["Gramofon"],
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
            },
            {
              no: 2,
              question:
                "Gdzie odbyły się pierwsze nowożytne igrzyska olimpijskie?",
              answers: ["Ateny", "Rzym", "Korynt", "Sparta"],
              correctAnswer: ["Ateny"],
            },
            {
              no: 3,
              question: "Gdzie zbudowano Wielki Mur Chiński?",
              answers: ["Indie", "Chiny", "Wietnam", "Korea Północna"],
              correctAnswer: ["Chiny"],
            },
          ],
        },
        {type: "forehead",
          name: "Czółko",
          list: [
            {
              no: 2,
              correctAnswer: ["Janusz Tracz"],
            },
            {
              no: 1,
              correctAnswer: ["Paweł Kozioł (wójt)"],
            },
            {
              no: 3,
              correctAnswer: ["Jan Paweł II"],
            },
            {
              no: 4,
              correctAnswer: ["Lord Voldemort"],
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
              correctAnswer: ["Adam Borejko"],
              correctAnswerImage: "images/adamanswer.jpg",
            },            {
              no: 2,
              question: "Czyje to czoło?",
              image: "images/karol.png",
              correctAnswer: ["Karol Nawrocki"],
              correctAnswerImage: "images/karolanswer.jpg",
            },
                   {
              no: 3,
              question: "Czyje to czoło?",
              image: "images/całka.png",
              correctAnswer: ["Całka"],
              correctAnswerImage: "images/całkaanswer.jpg",
            },
          ],
        },
        {
          name: "Pomoc drogowa",
          type: "standard",
          list: [
            {
              no: 1,
              question: "Jaki rejon obsługuje Roman Zagroda",
                            answers: ["Wola/Bemowo", "Wilanów/Ursynów", "Śródmieście/Mokotów", "Praga Północ/Południe"],
              correctAnswer: ["Śródmieście/Mokotów"],
            },

            {
              no: 2,
              question: "Jaki rejon obsługuje Auto Pawela",
                            answers: ["Poznań", "Gorzów", "Gorzów Wielkopolski", "Wołów"],
              correctAnswer: ["Poznań"],
            },
            {
              no: 3,
              question: "Jaki rejon obsługuje auto z rejestracją D0BOJU?",
                            answers: ["Wołów", "Bielsko-Biała", "Szczecin", "Słubice"],
              correctAnswer: ["Wpołów"],
            },

          ],
        },
        {
          name: "Czółko",
          type: "forehead",
          list: [
            {
              no: 1,
              question: "Michał Nowowiejski",
            },
            {
              no: 2,
              question: "Michał Wiśniewski",
            },
            {
              no: 3,
              question: "Karol \"Friz\" Wiśniewski",
            },
            {
              no: 4,
              question: "Mrozu",
            },

          ],
        },
        {
          name: "OWU",
          type: "standard",
          list: [
            {
              no: 1,
              question: "2013/15 - co to było?",
              answers: ["Indie", "Chiny", "Wietnam", "Korea Północna"],
              correctAnswer: ["Chiny"],
            },

          ],
        },

                {
          name: "Nie pytaj",
          type: "standard",
          list: [
            {
              no: 1,
              question: <div>Uzupełnij lukę:<br/> <i>Weź nie pytaj, weź się przytul, (...) weź tu bądź</i> </div>,
              answers: ["weź bądź ze mną", "weź tu ze mną", "kiedy ciemno", "weź chodź ze mną"],
              correctAnswer: ["weź tu ze mną"],
            },
            {
              no: 2,
              question: <div>Uzupełnij lukę:<br/> <i>Weź nie pytaj, weź się przytul, weź tu ze mną, weź tu bądź, (...) weź się starzej</i> </div>,
              answers: ["weź mów głośniej", "weź zrób godnie", "nie samotnie", "to okropnie", "weź nie młodniej"],
              correctAnswer: ["weź nie młodniej"],
            },
            {
              no: 3,
              question: <div>Uzupełnij lukę:<br/> <i>Weź nie pytaj, weź się przytul, weź tu ze mną, weź tu bądź, weź nie młodniej, weź się starzej razem ze mną idź (...)</i> </div>,
              answers: ["rok w rok", "pod prąd", "krok w krok", "no chodź"],
              correctAnswer: ["rok w rok"],
            },
            {
              no: 4,
              question: "W którym roku powstała piosenka „Weź nie pytaj”?",
              answers: ["2016", "2017", "2018", "2019"],
              correctAnswer: ["2018"],
            },

          ],
        }, 
                       {
          name: "Recytacja",
          type: "standard",
          list: [
            {
              no: 1,
              question: "Ich Troje – Powiedz",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,ich_troje,powiedz.html",
              ],
            },
            {
              no: 2,
              question: "Golec uOrkiestra – Ściernisco",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,golec_uorkiestra,sciernisco.html",
              ],
            },
            {
              no: 3,
              question: "Brathanki – Czerwone korale",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,brathanki,czerwone_korale.html",
              ],
            },
            {
              no: 4,
              question: "Baśka – Wilki",
              correctAnswer: [
                "https://www.tekstowo.pl/piosenka,wilki,baska.html",
              ],
            },
            {
              no: 5,
              question: "Jeden Osiem L – Jak zapomnieć",
              correctAnswer: [
                "https://www.tekstowo.pl/szukaj,Jeden+Osiem+L+-+Jak+zapomnieć.html",
              ],
            },
            {
              no: 6,
              question: "Pan Tadeusz – Inwokacja",
              correctAnswer: [
                "https://polska-poezja.pl/lista-wierszy/141-adam-mickiewicz-pan-tadeusz-inwokacja",
              ],
            },

          ],
        },
                       {
          name: "Licytacja",
          type: "auction",
          list: [
            {
              no: 1,
              question: "Pomoce drogowe współpracujące z PZU",
            },
            {
              no: 2,
              question: "Ludzie pracujący na nockach (tak max do 2023, jak co najmniej 2 osoby znają to ok)",
            },
            {
              no: 3,
              question: "Koordynatorzy assistance + nocki (jak co najmniej 2 osoby znają to ok)",
            },

          ],
        },
                       {
          name: "Wiedza losowa",
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
            },
          {
              no: 2,
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
            },
            {
              no: 3,
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
            },            {
              no: 4,
              question: "Z kim nie graniczy Kazachstan?",
              answers: ["Kiristan", "Turkmenistan", "Mongolia", "Uzbekistan"],
              correctAnswer: ["Mongolia"],
            },   

          ],
        },
                       {
          name: "Pierwsze",
          list: [
                    {
              no: 1,
              question: "Co powstało pierwsze?",
              answers: ["Mikrofon", "Gramofon", "Domofon", "Kulfon"],
              correctAnswer: ["Gramofon"],
            },            {
              no: 2,
              question: "Co powstało pierwsze?",
              answers: ["Mikroskop", "Teleskop", "Żyroskop", "Oscloskop"],
              correctAnswer: ["Teleskop"],
            },            {
              no: 3,
              question: "Co powstało pierwsze?",
              answers: [
                "Czołg",
                "Rakieta balistyczna",
                "Bomba atomowa",
                "Samolot",
                "Sanichód"
              ],
              correctAnswer: ["Samolot"],
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
            }, 

          ],
        },
                       {
          name: "Pojedynek",
          list: [
            {
              no: 1,
              question: "Liderzy Assistance / Link4 z Warszawy",
            },

          ],
        },
                       {
          type: "album",
          name: "Znajdź kota",
          list: [
            {
              no: 1,
              images: [
                "images/find/1.jpg",
                "images/find/1a.jpg",]
            },
            {
              no: 2,
              images: [
                "images/find/2.jpg",
                "images/find/2a.jpg",]
            },
            {
              no: 3,
              images: [
                "images/find/3.jpg",
                "images/find/3a.jpg",]
            },
            {
              no: 4,
              images: [
                "images/find/4.jpg",
                "images/find/4a.jpg",]
            },
            {
              no: 5,
              images: [
                "images/find/5.jpg",
                "images/find/5a.jpg",]
            },
            {
              no: 6,
              images: [
                "images/find/6.jpg",
                "images/find/6a.jpg",]
            },
            {
              no: 7,
              images: [
                "images/find/7.jpg",
                "images/find/7a.jpg",
                "images/find/7a1.jpg",]
            },
            {
              no: 8,
              images: [
                "images/find/8.jpg",
                "images/find/8a.jpg",]
            },
            {
              no: 9,
              images: [
                "images/find/9.jpg"]
            },
            {
              no: 10,
              images: [
                "images/find/10.jpg"]
            },
            {
              no: 11,
              images: [
                "images/find/11.png",]
            },
            {
              no: 12,
              images: [
                "images/find/12.jpg",
                "images/find/12a.jpg",]
            },
            {
              no: 13,
              images: [
                "images/find/13.jpg",
                "images/find/13a.jpg",]
            },
            {
              no: 14,
              images: [
                "images/find/14.jpg",
                "images/find/14a.jpg",
                "images/find/14a1.jpg",]
            },

          ],
        },
                       {
          name: "Co to za ptak?",
          list: [
            {
              no: 1,
              question: "Posłuchaj",
              answers: [
                "Słowik",
                "Kos",
              "Drozd", "Mewa"],
              correctAnswer: ["Kos"],
              sound: "birds/kos.mp3",
            }, 
            {
              no: 2,
              question: "Posłuchaj",
              answers: [
                "Puchacz",
                "Słowik",
              "Drozd", "Mewa"],
              correctAnswer: ["mewa"],
              sound: "birds/mewa pospolita.mp3",
            }, 
            {
              no: 3,
              question: "Posłuchaj",
              answers: [
                "Puchacz",
                "Kruk",
              "Rudzik", "Bocian"],
              correctAnswer: ["Rudzik"],
              sound: "birds/rudzik.mp3",
            }, 
            {
              no: 4,
              question: "Posłuchaj",
              answers: [
                "Bocian",
                "Czapla",
              "Baźant", "Kruk"],
              correctAnswer: ["Bocian"],
              sound: "birds/bocian.mp3",
            }, 
            {
              no: 5,
              question: "Posłuchaj",
              answers: [
                "Wróbel",
                "Gołąb",
              "Kukułka", "Sójka"],
              correctAnswer: ["Kukułka"],
              sound: "birds/kukułka.mp3",
            }, 
            {
              no: 6,
              question: "Posłuchaj",
              answers: [
                "Wrona",
                "Kruk",
              "Gawron", "Politruk"],
              correctAnswer: ["Kruk"],
              sound: "birds/kruk.mp3",
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
