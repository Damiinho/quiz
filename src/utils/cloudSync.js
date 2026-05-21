/**
 * Cloud Sync Utility using Firebase Realtime Database REST API.
 * This allows real-time state sharing and buzzer support without heavy SDKs.
 */

const FIREBASE_BASE_URL = "https://super-zgadywanka-default-rtdb.europe-west1.firebasedatabase.app";

/**
 * Pushes the current game state to the cloud.
 */
export const syncStateToCloud = async (gameCode, state) => {
  if (!gameCode) return;
  try {
    await fetch(`${FIREBASE_BASE_URL}/games/${gameCode}/state.json`, {
      method: "PUT",
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error("Cloud sync error:", error);
  }
};

/**
 * Listens for buzzer hits from players.
 */
export const listenForBuzzers = (gameCode, onBuzzerHit) => {
  if (!gameCode) return null;

  const url = `${FIREBASE_BASE_URL}/games/${gameCode}/buzzers.json`;
  const eventSource = new EventSource(url);

  const handleUpdate = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.data) {
        onBuzzerHit(data.data);
      }
    } catch (e) {
      console.error("Buzzer parse error:", e);
    }
  };

  eventSource.addEventListener("put", handleUpdate);
  eventSource.addEventListener("patch", handleUpdate);

  eventSource.onerror = (err) => {
    console.error("Buzzer EventSource error:", err);
    eventSource.close();
  };

  return eventSource;
};

/**
 * Registers a buzzer hit (used by the player's phone).
 */
export const hitBuzzer = async (gameCode, playerName) => {
  if (!gameCode) return;
  try {
    await fetch(`${FIREBASE_BASE_URL}/games/${gameCode}/buzzers.json`, {
      method: "PATCH",
      body: JSON.stringify({
        lastHit: {
          player: playerName,
          time: Date.now(),
        }
      }),
    });
  } catch (error) {
    console.error("Buzzer hit error:", error);
  }
};

export const clearBuzzers = async (gameCode) => {
  if (!gameCode) return;
  try {
    await fetch(`${FIREBASE_BASE_URL}/games/${gameCode}/buzzers.json`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Clear buzzers error:", error);
  }
};

/**
 * Listens for game state changes.
 */
export const listenForGameState = (gameCode, onStateChange) => {
  if (!gameCode) return null;

  const url = `${FIREBASE_BASE_URL}/games/${gameCode}/state.json`;
  const eventSource = new EventSource(url);

  const handleUpdate = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Firebase SSE wysyła cały obiekt pod kluczem 'data' przy zdarzeniu 'put'
      if (data && data.data) {
        onStateChange(data.data);
      }
    } catch (e) {
      console.error("State parse error:", e);
    }
  };

  eventSource.addEventListener("put", handleUpdate);
  eventSource.addEventListener("patch", handleUpdate);

  eventSource.onerror = (err) => {
    console.error("Game state EventSource error:", err);
    eventSource.close();
  };

  return eventSource;
};
