// Open sheets and pop ups line up here, so the phone's back button closes the newest one first.
const stack = []

/** Register a close function while something is open. Returns a function to unregister it. */
export function onBack(close) {
  const entry = { close }
  stack.push(entry)
  return () => {
    const i = stack.indexOf(entry)
    if (i >= 0) stack.splice(i, 1)
  }
}

/** Close the newest open thing. Returns true if there was one. */
export function handleBack() {
  const top = stack.pop()
  if (!top) return false
  top.close()
  return true
}
