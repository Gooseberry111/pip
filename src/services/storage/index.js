// The single place that decides where Pip is saved.
//
// To add Firebase later, create `firebaseAdapter.js` with the same
// load / save / clear interface (e.g. backed by a Firestore document per user)
// and return it here once the user is signed in. The store never needs to change.

import { createLocalStorageAdapter } from './localStorageAdapter'

let adapter = createLocalStorageAdapter()

export function getStorage() {
  return adapter
}

export function setStorage(nextAdapter) {
  adapter = nextAdapter
}
