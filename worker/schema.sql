-- One row per event. Common fields as columns; the event's own fields as JSON.
-- received_day is the UTC day the batch arrived: nothing finer is stored, and no IP address.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  received_day TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  client_id TEXT NOT NULL,
  -- Random per event: an event sent again (the upload's answer got lost) is stored once.
  event_id TEXT NOT NULL UNIQUE,
  build TEXT NOT NULL,
  browser TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  event TEXT NOT NULL,
  fields TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS events_by_event ON events (event);
CREATE INDEX IF NOT EXISTS events_by_client_day ON events (client_id, received_day);
