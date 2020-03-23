import WorkerScope from './worker';

class WorkerService {
  constructor() {
    this.registry = new Map();
    this.onBeforeWindowUnload();
  }
  createInlineWorker() {
    var blobURL = URL.createObjectURL(
        new Blob(['(', WorkerScope, ')()'], {
          type: 'application/javascript'
        })
      ),
      loquWorker = new Worker(blobURL);
    return loquWorker;
  }
  register(config) {
    const worker = this.createInlineWorker();
    const hash = Date.now(); // TODO - Change now
    const token = Symbol(hash);
    config.isPayloadValid = config.isPayloadValid
      ? config.isPayloadValid.toString()
      : undefined;
    worker.postMessage(this.serialize('INIT_SERVICE', config));
    this.registry.set(token, worker);
    window.loquWorker = undefined;
    return token;
  }
  onBeforeWindowUnload() {
    window.onbeforeunload = function() {
      const registry = this.registry;
      for (const worker of registry.values()) {
        worker.postMessage(this.serialize('ON_BEFORE_UNLOAD'));
      }
    };
  }
  serialize(type, payload) {
    return JSON.stringify({
      ...(type && { type }),
      ...(payload && { payload })
    });
  }
  sendMessage(token, type, payload) {
    const message = this.serialize(type, payload);
    this.getWorkerByToken(token).postMessage(message);
  }
  getWorkerByToken(token) {
    return this.registry.get(token);
  }
}
class LogQueue {
  constructor(workerService, config) {
    this.workerService = workerService;
    this.token = workerService.register(config);
  }
  send(payload) {
    this.workerService.sendMessage(this.token, null, payload);
  }
  set onmessage(fn) {
    this.workerService.getWorkerByToken(this.token).onmessage = fn;
  }
  set onerror(fn) {
    this.workerService.getWorkerByToken(this.token).onerror = fn;
  }
}

const workerService = new WorkerService();

export default function(config) {
  return new LogQueue(workerService, config);
}
