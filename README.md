# LOQU - (log queue)

Loqu makes it simple to generate app logs. Some of the features it provides are:

- All logs are maintained in WebWorker.
- Mutiple Logging Queues Support
- Log payload validation expense in web-worker
- Push your logs to API with custom headers
- Supports Multiple retries on API-failure
- Has dead-letter queue for logs

##### How to use

#

```sh
$ npm intall loqu
```

```js
import loqu from 'loqu';
...
const logQueue = loqu(configuration); // 👇 configuration details
```

### Definition for loqu configuration

##### configuration - Object

#

| Params         | Type - Description                                                                    |
| -------------- | ------------------------------------------------------------------------------------- |
| eventsBuffer   | Number - Length of events array you want (minimum)                                    |
| isPayloadValid | Function {returns boolean} - That accepts dispatched log even and checks if its valid |
| interval       | Number - Queue logs for _Number of seconds_ before sending                            |
| onSuccess      | APIObject - Configuration given below                                                 |
| onError        | APIObject - Configuration given below                                                 |

##### APIObject - Object

#

| Params     | Type - Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------------- |
| url        | String - API URL that you wish to send logs                                                 |
| method     | String - API Method (e.g. POST, PATCH) that you wish to send logs                           |
| retryCount | Number - Try retryCount times to send logs or dead letter queue                             |
| headers    | Object - [See Docs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) |

#

# Full Example

#

```js
import loqu from 'loqu';

const networkConfig = {
      url: 'http://<my-app>.com/api/logs',
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
      retryCount: 3,
    }

const logQueue = loqu({
      eventsBuffer: 30, // Buffer atleast 30 log events
      interval: 30, //  [optional] Attempt sending to network after *interval* seconds,
      isPayloadValid: function(payload = {}) { // [optional] fn to check if log is valid and should be buffered
      const required = ['actionName', 'actionCategory', 'startDateTime'];
      const isValidPayload = required.every(key =>
        payload.hasOwnProperty(key)
      );
      return isValidPayload; // must return boolean
    },
    onSuccess: networkConfig, // [optional] - if not set you will receieve queue of logs against onmessage
    onError: networkConfig // [optional] - if not set you will receieve queue of logs against onmessage
  });

// Now you can start sending logs
  logQueue.send({ // any payload you want to send. for example
      actionName: 'tab-switch',
      actionCategory: 'UI/Interaction',
      startDateTime: new Date()
  })

loqQueue.onmessage = function(e) { // if network call fails logQueue will send you queue of messages here
    console.log('got sent loqu: ', e.data);
}
loqQueue.onmessage = function(e) {
    console.log('Error in logQueue: ', e.data);
}
```

Development is continued. Feel free to raise issues or features
[If want to contribute! WELCOME!!!](https://github.com/isaadabbasi/loqu)

## License

MIT
