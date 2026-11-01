import { createClient } from "@supabase/supabase-js";

/**
 * Online transport adapter. A game selects exactly one backend: ntfy (default)
 * or Supabase Realtime. Supabase uses one broadcast channel per room and does
 * not persist messages; the player requests the latest state after connecting.
 */
const NTFY_BASE_URL = "https://ntfy.sh";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 20 } },
  })
  : null;
const supabaseRooms = new Map();

export const isSupabaseConfigured = () => Boolean(supabase);

const providerFromUrl = () => {
  if (typeof window === "undefined") return "ntfy";
  return new URLSearchParams(window.location.search).get("backend") === "supabase"
    ? "supabase"
    : "ntfy";
};

const getProvider = (provider) => provider || providerFromUrl();

const getSupabaseRoom = (gameCode) => {
  if (!supabase) throw new Error("Supabase nie jest skonfigurowany.");
  const roomName = `sz-game-${gameCode.toLowerCase()}`;
  let room = supabaseRooms.get(roomName);
  if (!room) {
    const channel = supabase.channel(roomName, {
      config: { broadcast: { ack: true, self: false } },
    });
    room = { channel, ready: null, refs: 0 };
    supabaseRooms.set(roomName, room);
  }
  room.refs += 1;
  return room;
};

const ensureSupabaseRoomConnected = (room) => {
  if (!room.ready) {
    room.ready = new Promise((resolve, reject) => {
      room.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          reject(new Error(`Supabase Realtime: ${status}`));
        }
      });
    });
    // Avoid unhandled rejection when a subscriber is removed during a reconnect.
    room.ready.catch(() => {});
  }
  return room.ready;
};

const releaseSupabaseRoom = (gameCode, room) => {
  room.refs = Math.max(0, room.refs - 1);
  if (room.refs === 0) {
    supabaseRooms.delete(`sz-game-${gameCode.toLowerCase()}`);
    supabase?.removeChannel(room.channel);
  }
};

const sendSupabase = async (gameCode, event, payload) => {
  let room;
  try {
    room = getSupabaseRoom(gameCode);
    await ensureSupabaseRoomConnected(room);
    const result = await room.channel.send({ type: "broadcast", event, payload });
    return result === "ok";
  } catch (error) {
    console.error("Supabase Realtime send error:", error);
    return false;
  } finally {
    if (room) releaseSupabaseRoom(gameCode, room);
  }
};

const subscribeSupabase = (gameCode, event, callback, onConnectionChange = () => {}) => {
  if (!gameCode || !supabase) return null;
  const room = getSupabaseRoom(gameCode);
  let active = true;
  room.channel.on("broadcast", { event }, ({ payload }) => {
    if (active) callback(payload);
  });
  ensureSupabaseRoomConnected(room).then(() => {
    if (active) onConnectionChange(true);
  }).catch((error) => {
    if (active) {
      console.error("Supabase Realtime subscription error:", error);
      onConnectionChange(false);
    }
  });
  return {
    close: () => {
      if (!active) return;
      active = false;
      releaseSupabaseRoom(gameCode, room);
    },
  };
};

const publishEvent = async (gameCode, eventData, provider) => {
  if (!gameCode) return false;
  if (getProvider(provider) === "supabase") {
    return sendSupabase(gameCode, "game-event", eventData);
  }
  try {
    const topic = `sz-buzzer-${gameCode.toLowerCase()}`;
    const response = await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify(eventData),
      headers: { Title: eventData.type, Tags: "game" },
    });
    return response.ok;
  } catch (error) {
    console.error("Game event publish error:", error);
    return false;
  }
};

export const syncStateToCloud = async (gameCode, state, provider) => {
  if (!gameCode) return false;
  if (getProvider(provider) === "supabase") {
    return sendSupabase(gameCode, "game-state", state);
  }
  try {
    const topic = `sz-state-${gameCode.toLowerCase()}`;
    const response = await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: JSON.stringify(state),
      headers: { Title: "StateUpdate", Tags: "update" },
    });
    return response.ok;
  } catch (error) {
    console.error("Cloud sync error:", error);
    return false;
  }
};

export const hitBuzzer = (gameCode, playerName, provider) => publishEvent(gameCode, {
  type: "BUZZER", player: playerName, time: Date.now(),
}, provider);

export const joinGame = (gameCode, playerName, provider) => publishEvent(gameCode, {
  type: "JOIN", player: playerName, time: Date.now(),
}, provider);

export const hitWiemLepiej = (gameCode, playerName, provider) => publishEvent(gameCode, {
  type: "WIEM_LEPIEJ", player: playerName, time: Date.now(),
}, provider);

export const submitBid = (gameCode, playerName, amount, provider) => publishEvent(gameCode, {
  type: "BID", player: playerName, amount: parseInt(amount, 10), time: Date.now(),
}, provider);

export const submitAnswer = (gameCode, playerName, answer, isConfirmed = false, eventId = null, provider) => publishEvent(gameCode, {
  type: "ANSWER", player: playerName, answer, isConfirmed, eventId, time: Date.now(),
}, provider);

export const acknowledgeAnswer = (gameCode, playerName, eventId, provider) => {
  if (!gameCode || !playerName || !eventId) return Promise.resolve(false);
  return publishEvent(gameCode, {
    type: "ANSWER_ACK", player: playerName, eventId, time: Date.now(),
  }, provider);
};

export const sendWheelControl = (gameCode, playerName, action, provider) => publishEvent(gameCode, {
  type: "WHEEL_CONTROL", player: playerName, action, time: Date.now(),
}, provider);

export const requestGameState = (gameCode, provider) => publishEvent(gameCode, {
  type: "STATE_REQUEST", time: Date.now(),
}, provider);

const listenForNtfy = (gameCode, topicPrefix, onMessage, onConnectionChange) => {
  if (!gameCode) return null;
  const eventSource = new EventSource(`${NTFY_BASE_URL}/${topicPrefix}-${gameCode.toLowerCase()}/sse`);
  eventSource.onopen = () => onConnectionChange(true);
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.message) onMessage(JSON.parse(data.message));
    } catch {
      // Ignore ntfy keep-alive and non-JSON messages.
    }
  };
  eventSource.onerror = (error) => {
    console.error("ntfy connection error:", error);
    onConnectionChange(false);
  };
  return { close: () => eventSource.close() };
};

export const listenForGameState = (gameCode, onStateChange, onConnectionChange = () => {}, provider) => {
  if (getProvider(provider) === "supabase") {
    const subscription = subscribeSupabase(gameCode, "game-state", onStateChange, onConnectionChange);
    if (subscription) requestGameState(gameCode, provider);
    return subscription;
  }
  return listenForNtfy(gameCode, "sz-state", onStateChange, onConnectionChange);
};

export const listenForEvents = (gameCode, onEvent, onConnectionChange = () => {}, provider) => {
  if (getProvider(provider) === "supabase") {
    return subscribeSupabase(gameCode, "game-event", onEvent, onConnectionChange);
  }
  return listenForNtfy(gameCode, "sz-buzzer", onEvent, onConnectionChange);
};

export const clearBuzzers = async () => {
  // Events are transient; no queue is persisted by either backend.
};
