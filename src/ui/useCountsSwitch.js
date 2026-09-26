// The anonymous counts switch (V4), in onboarding step 3 and the popup's settings. Returns
// [on, onChange] for a checkbox. The change handler asks for Firefox's data consent as its first
// call, with no await before it: the request needs the live user gesture.

import { useEffect, useState } from 'preact/hooks';
import { setCountsOptIn } from '../lib/events.js';

export function useCountsSwitch(stored) {
  const [on, setOn] = useState(stored);

  // The stored value can change elsewhere, like Firefox's consent given after the popup asked.
  useEffect(() => setOn(stored), [stored]);

  function onChange(event) {
    const want = event.currentTarget.checked;
    const result = setCountsOptIn(want); // first: Firefox shows its own consent prompt
    setOn(want);
    result.then(setOn, () => setOn(false));
  }

  return [on, onChange];
}
