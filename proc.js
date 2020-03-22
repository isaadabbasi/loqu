function send(flightConfig, data) {
  const { url, method, headers } = flightConfig;
  return new Promise((resolve, reject) => {
    return fetch(url, {
      body: JSON.stringify(data),
      method: method || 'POST',
      headers
    })
      .then(res => {
        if (/^(2|3)\d{2}$/.test(res.status)) {
          resolve(res);
        } else reject(res);
      })
      .catch(reject);
  });
}

class ProcessQ {
  errorQueue = [];
  eventsBuffer; // queue must have this length before sending to server
  interval; // setTimeout seconds
  onError;
  onSuccess;
  queue = [];
  retryCount;
  WorkerScope;

  constructor(
    WorkerScope,
    { interval = 0, eventsBuffer = 15, onError, onSuccess }
  ) {
    this.eventsBuffer = eventsBuffer;
    this.interval = interval * 1000;
    this.onError = onError;
    this.onSuccess = onSuccess;
    this.WorkerScope = WorkerScope;
    function injectIdentifiers(target, id) {
      if (target && typeof target === 'object')
        target.toString = function() {
          return id;
        };
    }
    injectIdentifiers(onError, 'onError');
    injectIdentifiers(onSuccess, 'onSuccess');
  }

  resetAnalyticaQueue() {
    this.queue = [];
  }

  pushToQueue(payload) {
    this.queue.push(payload);
    this.postPushToQueue(payload);
  }
  postPushToQueue() {
    // * processCriteria could be one, thats why we need to check it right away.
    const isBufferFull = this.eventsBuffer <= this.queue.length;
    const intervalNotSet = this.interval === 0;
    if (isBufferFull && intervalNotSet) {
      this.sendBeats();
      return;
    }
    // TODO - forced events
  }

  deepClone(payload) {
    return JSON.parse(JSON.stringify(payload));
  }
  sendBeats(forcePush = false) {
    const isBufferFull = this.eventsBuffer <= this.queue.length;

    if (!forcePush && !isBufferFull) {
      if (this.interval > 0) this.initializeTimer();
      return;
    }
    const events = this.deepClone(this.queue);
    this.queue = [];
    clearTimeout(this.timeout);
    this.timeout = undefined;
    if (this.onSuccess && this.onSuccess.url)
      this.flight(this.onSuccess, events);
    else
      this.WorkerScope.postMessage({
        type: 'BUFFER_REACHED',
        payload: events
      });
  }
  flight(config, events) {
    let triedTimes = 1,
      success = false,
      retryCount = config.retryCount;
    const upstream = async () => {
      triedTimes += 1;
      try {
        await send(config, events);
        success = true;
      } catch (e) {
        if (!success && triedTimes <= retryCount) return;
        if (
          config.toString() === 'onSuccess' &&
          !success &&
          this.onError &&
          this.onError.url
        ) {
          this.flight(this.onError, events);
        } else {
          this.pushSanitizedErr('REJECTED_PAYLOAD', events);
          this.WorkerScope.postMessage({
            type: 'REJECTED_PAYLOAD',
            payload: {
              latestEvents: events,
              allEvents: this.errorQueue
            }
          });
        }
      } finally {
        if (!success && triedTimes <= retryCount) upstream();
      }
    };
    if (triedTimes === 1) upstream();
  }

  initializeTimer() {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    const timeout = fn => setTimeout(fn.bind(this), this.interval);
    this.timeout = timeout(this.sendBeats);
  }
  pushSanitizedErr(type = `UNIDENTIFIED_ERROR`, payload) {
    this.errorQueue.push({ type, payload });
  }
  processEvent(payload) {
    let valid = true;
    if (this.isPayloadValid) valid = this.isPayloadValid(payload);
    if (!valid) {
      this.pushSanitizedErr('PAYLOAD_VALIDATION_ERROR', payload);
      return;
    }

    const isFirstPush = this.queue.length === 0;
    const intervalNotSet = this.interval > 0;
    if (isFirstPush && intervalNotSet) this.initializeTimer();
    this.pushToQueue(payload);
  }
}
