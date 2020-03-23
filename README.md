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

```sh
1-  import loqu from 'loqu';
...
3-  const logQueue = loqu(configuration); // 👇 configuration details
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

### Insights

![](https://drive.google.com/open?id=1IRlorMXIs0eKGqa1gfVuw5RAjEBO-hpO)

### Development

Development is continued. Feel free to raise issues or features
[If want to contribute! WELCOME!!!](https://github.com/isaadabbasi/loqu)

## License

MIT
