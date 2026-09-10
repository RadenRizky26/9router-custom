export const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Enhanced circuit breaker with HALF_OPEN probing.
 */
export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.onStateChange = options.onStateChange || null;
  }

  canExecute() {
    this._refreshOpenState();
    return this.state === STATE.CLOSED || this.state === STATE.HALF_OPEN;
  }

  _refreshOpenState() {
    if (this.state === STATE.OPEN && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = STATE.HALF_OPEN;
        if (this.onStateChange) this.onStateChange(this.name, STATE.OPEN, STATE.HALF_OPEN);
      }
    }
  }

  onSuccess() {
    if (this.state === STATE.HALF_OPEN || this.state === STATE.OPEN) {
      if (this.onStateChange) this.onStateChange(this.name, this.state, STATE.CLOSED);
    }
    this.failureCount = 0;
    this.state = STATE.CLOSED;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      const oldState = this.state;
      this.state = STATE.OPEN;
      if (oldState !== STATE.OPEN && this.onStateChange) {
        this.onStateChange(this.name, oldState, STATE.OPEN);
      }
    }
  }
}

const registry = new Map();

export function getCircuitBreaker(name) {
  if (!registry.has(name)) {
    registry.set(name, new CircuitBreaker(name));
  }
  return registry.get(name);
}
