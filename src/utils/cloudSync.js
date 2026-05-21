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
 * Listens for buzzer hits.
 */
export const listenForBuzzers = (gameCode, onBuzzerHit) => {
  if (!gameCode) return null;

  const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
  const eventSource = new EventSource(`${NTFY_BASE_URL}/${topic}/sse`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.message) {
        const buzzerData = JSON.parse(data.message);
        onBuzzerHit({ lastHit: buzzerData });
      }
    } catch (e) {
      // Ignore
    }
  };

  eventSource.onerror = (err) => {
    console.error("Buzzer sync error:", err);
    eventSource.close();
  };

  return eventSource;
};

export const clearBuzzers = async (gameCode) => {
  // ntfy.sh doesn't store state like a DB, so "clearing" isn't strictly necessary
  // but we can send a clear signal if needed.
};
