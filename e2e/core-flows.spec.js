import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

const QUIZ_STATE_KEY = "super-zgadywanka:game-state";

const seedGame = async (page, gameCode = "ABC234", playerState = null) => {
  await page.addInitScript(({ storageKey, code, playerState }) => {
    const quiz = {
      id: "e2e-quiz",
      name: "Quiz testowy",
      categories: [{
        id: "e2e-category",
        name: "Kategoria testowa",
        type: "standard",
        list: [{
          id: "e2e-question",
          no: 1,
          question: "Pytanie testowe?",
          answers: ["Odpowiedź A", "Odpowiedź B"],
          correctAnswer: ["Odpowiedź A"],
          done: false,
        }],
      }],
    };

    localStorage.setItem(storageKey, JSON.stringify({
      gameSettings: {
        players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
        quiz,
        wiemLepiejLimit: 1,
      },
      scoreHistory: [],
      quizLog: [],
      undoPointer: -1,
      gameCode: code,
      isQuestionActive: false,
      selectedCategoryName: null,
      wheelRoundState: null,
      buzzerQueue: [],
      auctionBids: {},
      playerAnswers: {},
      auctionStage: 0,
      isAuctionTimerRunning: false,
      showAnswer: false,
    }));

    window.__testEventSources = [];
    window.__confirmedAnswerEventId = null;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (!String(input).startsWith("https://ntfy.sh/")) return nativeFetch(input, init);
      try {
        const event = JSON.parse(init?.body || "{}");
        if (event.type === "ANSWER" && event.isConfirmed) window.__confirmedAnswerEventId = event.eventId;
      } catch (error) {
        window.__testEventParseError = error.message;
      }
      return Promise.resolve(new Response("", { status: 200 }));
    };
    window.EventSource = class {
      constructor(url) {
        this.url = url;
        window.__testEventSources.push(this);
        queueMicrotask(() => this.onopen?.());
        if (url.includes("sz-state-")) {
          queueMicrotask(() => this.emit(playerState || {
            isQuestionActive: true,
            isWriting: true,
            inputMethod: "typing",
            questionData: { acceptingAnswers: true, remainingSeconds: 30 },
            players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
            auctionBids: {},
            wiemLepiejLimit: 1,
          }));
        }
      }

      emit(message) {
        this.onmessage?.({ data: JSON.stringify({ message: JSON.stringify(message) }) });
      }

      close() {}
    };
  }, { storageKey: QUIZ_STATE_KEY, code: gameCode, playerState });
};

test("QR prowadzi do formularza gracza z wypełnionym kodem", async ({ page }) => {
  await seedGame(page);
  await page.goto("/gra");

  await page.getByRole("button", { name: "Pokaż kod QR" }).click();
  await expect(page.getByRole("dialog")).toContainText("ABC234");
  await expect(page.getByRole("img", { name: "Kod QR do gry ABC234" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("/gracz?code=ABC234");

  await page.goto("/gracz?code=ABC234");
  await expect(page.getByRole("textbox", { name: "KOD GRY" })).toHaveValue("ABC234");
});

test("desktopowe panele wyników i historii otwierają się, a wybór wpisu cofa stan", async ({ page }) => {
  await seedGame(page, null);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/gra");
  const desktopSettings = await page.locator(".header__right-controls").boundingBox();
  expect(desktopSettings.x).toBeGreaterThan(1100);

  await page.getByRole("heading", { name: "WYNIKI" }).click();
  await expect(page.getByPlaceholder("Dodaj gracza...")).toBeVisible();

  await page.getByText("Kategoria testowa", { exact: true }).click();
  await page.getByRole("button", { name: "POKAŻ ODPOWIEDŹ" }).click();
  await page.getByRole("heading", { name: "HISTORIA" }).click();

  const firstAction = page.getByRole("button", { name: /Przejdź do akcji 1:/ });
  await expect(firstAction).toBeVisible();
  await firstAction.click();
  await expect(page.locator(".quiz-log-panel")).toContainText("1/2");
  await expect(page.getByRole("button", { name: "POKAŻ ODPOWIEDŹ" })).toBeVisible();

  await page.getByRole("button", { name: /Wróć/ }).click();
  const addPlayerInput = page.getByPlaceholder("Dodaj gracza...");
  if (!(await addPlayerInput.isVisible())) {
    await page.locator(".game-results-panel").getByText("WYNIKI", { exact: true }).click();
  }
  await expect(addPlayerInput).toBeVisible();
  await page.getByRole("button", { name: "+1" }).click();
  await page.getByRole("button", { name: "RANKING GRACZY" }).click();
  await expect(page.getByText("Historia punktów", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Wykres zmian punktów graczy" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "POBIERZ WYNIKI CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("wyniki-");
});

test("kreator blokuje pusty quiz i zachowuje opis w zapisanym zestawie", async ({ page }) => {
  await page.goto("/stworz");
  await page.getByRole("button", { name: "4 Podgląd" }).click();
  await page.getByRole("button", { name: "ZAPISZ QUIZ" }).click();
  await expect(page.getByRole("alert")).toContainText("co najmniej jedną kategorię");

  await page.getByRole("button", { name: "1 Informacje" }).click();
  await page.getByPlaceholder("Wpisz nazwę quizu...").fill("Quiz z opisem E2E");
  await page.getByPlaceholder("O czym jest ten quiz?").fill("Opis widoczny w bibliotece quizów.");
  await expect(page.getByRole("status")).toContainText("Szkic zapisany");
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Odzyskano szkic");
  await expect(page.getByPlaceholder("Wpisz nazwę quizu...")).toHaveValue("Quiz z opisem E2E");
  await expect(page.getByPlaceholder("O czym jest ten quiz?")).toHaveValue("Opis widoczny w bibliotece quizów.");

  await page.getByRole("button", { name: "2 Kategorie" }).click();
  await page.getByPlaceholder("Nazwa kategorii...").fill("Wiedza");
  await page.getByRole("button", { name: "DODAJ", exact: true }).click();
  await page.getByRole("button", { name: "3 Pytania" }).click();
  await page.getByPlaceholder("Wpisz treść pytania...").fill("Ile to jest dwa plus dwa?");
  await page.getByPlaceholder("Wpisz treść odpowiedzi A...").fill("Cztery");
  await page.getByPlaceholder("Wpisz treść odpowiedzi B...").fill("Pięć");
  await page.getByRole("button", { name: "DODAJ DO KATEGORII" }).click();
  await page.getByRole("button", { name: "4 Podgląd" }).click();
  await page.getByRole("button", { name: "ZAPISZ QUIZ" }).click();

  await expect(page).toHaveURL(/\/kategorie$/);
  await page.getByRole("button", { name: /Quiz z opisem E2E/ }).click();
  await expect(page.locator(".MuiModal-root .MuiPaper-root").getByText("Opis widoczny w bibliotece quizów.", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Testowy/ }).click();
  await expect(page.locator(".MuiModal-root .MuiPaper-root").getByText("Brak opisu dla tego quizu.", { exact: true })).toBeVisible();
});

test("gracz widzi potwierdzenie dopiero po ACK hosta", async ({ page }) => {
  await seedGame(page);
  await page.goto("/gracz?code=ABC234");
  await page.getByRole("textbox", { name: "TWOJA NAZWA (DLA BUZZERA)" }).fill("Ala");
  await page.getByRole("button", { name: "DOŁĄCZ" }).click();
  await page.getByPlaceholder("Wpisz swoją odpowiedź tutaj...").fill("Odpowiedź testowa");
  await page.getByRole("button", { name: "ZATWIERDŹ ODPOWIEDŹ" }).click();

  await expect(page.getByRole("status")).toContainText("Czekam na odbiór");
  await page.waitForFunction(() => window.__confirmedAnswerEventId);
  const eventId = await page.evaluate(() => window.__confirmedAnswerEventId);
  await page.evaluate((ackEventId) => {
    window.__testEventSources
      .filter((eventSource) => eventSource.url.includes("sz-buzzer-"))
      .forEach((eventSource) => eventSource.emit({ type: "ANSWER_ACK", player: "Ala", eventId: ackEventId }));
  }, eventId);

  await expect(page.getByRole("status")).toContainText("Prowadzący odebrał");
  await expect(page.getByRole("button", { name: "ODEBRANO PRZEZ PROWADZĄCEGO" })).toBeDisabled();
});

test("import arkusza CSV otwiera quiz z kategorią i pytaniem w kreatorze", async ({ page }) => {
  await page.goto("/wybor");
  await page.locator('input[type="file"][accept=".csv,text/csv"]').setInputFiles({
    name: "Arkusz E2E.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Kategoria;Pytanie;Odpowiedź A;Odpowiedź B;Poprawna odpowiedź",
      "Geografia;Jaka jest stolica Polski?;Kraków;Warszawa;B",
    ].join("\n")),
  });

  await expect(page).toHaveURL(/\/stworz$/);
  await expect(page.getByPlaceholder("Wpisz nazwę quizu...")).toHaveValue("Arkusz E2E");
  await page.getByRole("button", { name: "2 Kategorie" }).click();
  await expect(page.getByText("Geografia", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "3 Pytania" }).click();
  await expect(page.getByText("Jaka jest stolica Polski?", { exact: false })).toBeVisible();
});

test("gracz widzi pytanie i warianty bez zaznaczania, a buzzer używa akcentu aplikacji", async ({ page }) => {
  await seedGame(page, "ABC234", {
    isQuestionActive: true,
    isWriting: false,
    isAuction: false,
    isWheel: false,
    isBiddingClosed: false,
    currentQuestion: "Kategoria testowa",
    questionData: {
      categoryName: "Kategoria testowa",
      question: "Jaka jest stolica Polski?",
      answers: ["Kraków", "Warszawa"],
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90'%3E%3Crect width='160' height='90' fill='%232ecc71'/%3E%3C/svg%3E",
    },
    players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
    auctionBids: {},
    wiemLepiejLimit: 1,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gracz?code=ABC234");
  await expect(page.locator(".header--player")).toBeHidden();
  const joinForm = await page.locator(".container--player").boundingBox();
  expect(joinForm.y).toBeLessThan(20);
  await expect(page.getByRole("button", { name: "Otwórz szybkie ustawienia" })).toBeHidden();
  await expect(page.locator(".header__left-controls--player")).toBeHidden();
  await page.getByRole("textbox", { name: "TWOJA NAZWA (DLA BUZZERA)" }).fill("Ala");
  await page.getByRole("button", { name: "DOŁĄCZ" }).click();
  const playerTopbar = await page.locator(".player-view__topbar").boundingBox();
  expect(playerTopbar.y).toBeLessThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await expect(page.getByText("Jaka jest stolica Polski?", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Ilustracja pytania" })).toBeVisible();
  await expect(page.locator(".player-question-card")).not.toContainText("STATUS");
  const choices = page.locator(".player-question-card__answers li");
  await expect(choices).toHaveCount(2);
  await expect(choices.nth(0)).toContainText("Kraków");
  await expect(choices.nth(1)).toContainText("Warszawa");
  await expect(page.getByRole("button", { name: /Odpowiedź A/ })).toHaveCount(0);
  await expect(page.locator(".player-view__connection")).toHaveAttribute("aria-label", "Połączono z grą");
  const buzz = page.getByRole("button", { name: "Zgłoś się do odpowiedzi" });
  await expect(buzz).toBeVisible();
  const buzzGradient = await buzz.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(buzzGradient).toContain("rgb(46, 204, 113)");
});

test("informuje, gdy przeglądarka odrzuca zapis localStorage", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage full", "QuotaExceededError"); };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Nie udało się zapisać stanu gry");
});

test("gracz nie może pisać ani wysłać odpowiedzi przed startem i po zerze timera", async ({ page }) => {
  await seedGame(page, "ABC234", {
    isQuestionActive: true,
    isWriting: true,
    inputMethod: "typing",
    questionData: { categoryName: "Pisanie", question: "Pytanie na czas", acceptingAnswers: false, remainingSeconds: 20 },
    players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
    auctionBids: {},
    wiemLepiejLimit: 1,
  });
  await page.goto("/gracz?code=ABC234");
  await page.getByRole("textbox", { name: "TWOJA NAZWA (DLA BUZZERA)" }).fill("Ala");
  await page.getByRole("button", { name: "DOŁĄCZ" }).click();
  const answerField = page.getByPlaceholder("Wpisz swoją odpowiedź tutaj...");
  const submitButton = page.getByRole("button", { name: "ODPOWIEDZI ZAMKNIĘTE" });

  await expect(answerField).toBeDisabled();
  await expect(submitButton).toBeDisabled();

  await page.evaluate(() => {
    window.__testEventSources
      .filter((eventSource) => eventSource.url.includes("sz-state-"))
      .forEach((eventSource) => eventSource.emit({
        isQuestionActive: true,
        isWriting: true,
        inputMethod: "typing",
        questionData: { categoryName: "Pisanie", question: "Pytanie na czas", acceptingAnswers: true, remainingSeconds: 1 },
        players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
        auctionBids: {},
        wiemLepiejLimit: 1,
      }));
  });
  await expect(answerField).toBeEnabled();
  await answerField.fill("Odpowiedź");
  await page.evaluate(() => {
    window.__testEventSources
      .filter((eventSource) => eventSource.url.includes("sz-state-"))
      .forEach((eventSource) => eventSource.emit({
        isQuestionActive: true,
        isWriting: true,
        inputMethod: "typing",
        questionData: { categoryName: "Pisanie", question: "Pytanie na czas", acceptingAnswers: false, remainingSeconds: 0 },
        players: [{ name: "Ala", points: 0, wiemLepiejUsed: 0 }],
        auctionBids: {},
        wiemLepiejLimit: 1,
      }));
  });
  await expect(answerField).toBeDisabled();
  await expect(page.getByRole("button", { name: "ODPOWIEDZI ZAMKNIĘTE" })).toBeDisabled();
});