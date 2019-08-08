# Pull stream drain

A modern version of the
[pull-stream drain sink](https://pull-stream.github.io/#drain) which returns a
promise rather than calling a callback.

```js
const {pull, values} = require('pull-stream')
const drain = require('psp-drain')

pull(values([1, 2, 3]), drain(console.log)).then(() => console.log('Done'))
```

```
drain([op])
```

## Abort

```js
const {pull, values} = require('pull-stream')
const drain = require('psp-drain')

const sink = drain()
sink.abort()
pull(values([1, 2, 3]), sink).then(() => console.log('Done'))

const sink = drain()
sink.abort(new Error())
pull(values([1, 2, 3]), sink).catch(console.error)
```

```
abort([err])
```
