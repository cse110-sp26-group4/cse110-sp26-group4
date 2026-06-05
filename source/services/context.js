let currentActor = null;

/**
 * Sets the active actor for this session.
 * @param {object|null} actor - The authenticated agent/user object, or null to clear.
 */
export function setCurrentActor(actor) {
  currentActor = actor;
}

/**
 * Returns the full authenticated actor object for this session.
 * @returns {object|null}
 */
export function getCurrentActor() {
  return currentActor;
}

/**
 * Returns the ID of the authenticated actor, or null if not set.
 * @returns {number|null}
 */
export function getCurrentActorId() {
  return currentActor?.id ?? null;
}
