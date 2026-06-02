/**
 * Cloud Sync Utility using ntfy.sh (Public Pub/Sub service).
 * Provides zero-config real-time state sharing and buzzer support.
 */

const NTFY_BASE_URL = "https://ntfy.sh";

/**
 * Pushes the current game state to the cloud.
 */
export const syncStateToCloud = async (gameCode, state) => {
  if (!gameCode) return;
  try {
    // We use a unique topic for the state
    const topic = `sz-state-${gameCode.toLowerCase()}`;
    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify(state),
      headers: {
        "Title": "StateUpdate",
        "Tags": "update"
      }
    });
  } catch (error) {
    console.error("Cloud sync error:", error);
  }
};

/**
 * Registers a buzzer hit.
 */
export const hitBuzzer = async (gameCode, playerName) => {
  if (!gameCode) return;
  try {
    const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify({
        type: "BUZZER",
        player: playerName,
        time: Date.now(),
      }),
      headers: {
        "Title": "BuzzerHit",
        "Tags": "trumpet"
      }
    });
  } catch (error) {
    console.error("Buzzer hit error:", error);
  }
};

/**
 * Registers a player joining.
 */
export const joinGame = async (gameCode, playerName) => {
  if (!gameCode) return;
  try {
    const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify({
        type: "JOIN",
        player: playerName,
        time: Date.now(),
      }),
      headers: {
        "Title": "PlayerJoined",
        "Tags": "wave"
      }
    });
  } catch (error) {
    console.error("Join game error:", error);
  }
};

/**
 * Registers a "Wiem Lepiej" action.
 */
export const hitWiemLepiej = async (gameCode, playerName) => {
  if (!gameCode) return;
  try {
    const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify({
        type: "WIEM_LEPIEJ",
        player: playerName,
        time: Date.now(),
      }),
      headers: {
        "Title": "WiemLepiejHit",
        "Tags": "sparkles"
      }
    });
  } catch (error) {
    console.error("Wiem Lepiej hit error:", error);
  }
};

/**
 * Submits an auction bid.
 */
export const submitBid = async (gameCode, playerName, amount) => {
  if (!gameCode) return;
  try {
    const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify({
        type: "BID",
        player: playerName,
        amount: parseInt(amount, 10),
        time: Date.now(),
      }),
      headers: {
        "Title": "AuctionBid",
        "Tags": "moneybag"
      }
    });
  } catch (error) {
    console.error("Submit bid error:", error);
  }
};

/**
 * Listens for game state changes.
 */
export const listenForGameState = (gameCode, onStateChange) => {
  if (!gameCode) return null;

  const topic = `sz-state-${gameCode.toLowerCase()}`;
  const eventSource = new EventSource(`${NTFY_BASE_URL}/${topic}/sse`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // ntfy.sh sends the message in the 'message' field
      if (data && data.message) {
        const state = JSON.parse(data.message);
        onStateChange(state);
      }
    } catch (e) {
      // Ignore non-json or keep-alive messages
    }
  };

  eventSource.onerror = (err) => {
    console.error("Game state sync error:", err);
    eventSource.close();
  };

  return eventSource;
};

/**
 * Listens for buzzer hits and joins.
 */
export const listenForEvents = (gameCode, onEvent) => {
  if (!gameCode) return null;

  const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
  const eventSource = new EventSource(`${NTFY_BASE_URL}/${topic}/sse`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.message) {
        const eventData = JSON.parse(data.message);
        onEvent(eventData);
      }
    } catch (e) {
      // Ignore
    }
  };

  eventSource.onerror = (err) => {
    console.error("Event sync error:", err);
    eventSource.close();
  };

  return eventSource;
};

export const clearBuzzers = async (gameCode) => {
  // ntfy.sh doesn't store state like a DB, so "clearing" isn't strictly necessary
  // but we can send a clear signal if needed.
};
