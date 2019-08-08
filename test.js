'use strict'

const test = require('tape')
const {pull, values, error, infinite, take} = require('pull-stream')
const pushable = require('pull-pushable')
const drain = require('./')

test(t => {
	t.plan(2)
	const stream = pull(values([1, 2, 3]), drain())

	t.ok(stream instanceof Promise, '`stream` is a promise')
	stream.then(r => t.equal(r, undefined, 'resolved value'))
})

test('with an `op` function', t => {
	t.plan(3)
	const log = []
	const stream = pull(values([1, 2, 3]), drain((...args) => log.push(args)))

	t.ok(stream instanceof Promise, '`stream` is a promise')
	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(log, [[1], [2], [3]], '`op` calls')
	})
})

test('abort from the `op` function by returning `false`', t => {
	t.plan(2)
	const logs = []
	const stream = pull(
		values([1, 2, 3]),
		drain(v => {
			logs.push(v)
			if (v === 2) return false
		})
	)

	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [1, 2], '`op` calls')
	})
})

test('calling `abort` from the `op` function', t => {
	t.plan(2)
	const logs = []
	const sink = drain(v => {
		logs.push(v)
		if (v === 2) sink.abort()
	})
	const stream = pull(values([1, 2, 3]), sink)

	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [1, 2], '`op` calls')
	})
})

test('abort with an error', t => {
	t.plan(2)
	const error = new Error('test')
	const logs = []
	const sink = drain(v => {
		logs.push(v)
		if (v === 2) sink.abort(error)
	})
	const stream = pull(values([1, 2, 3]), sink)

	stream.catch(e => {
		t.deepEqual(logs, [1, 2], '`op` calls')
		t.equal(e, error, 'rejection value')
	})
})

test('abort before it begins', t => {
	t.plan(2)
	const logs = []
	const sink = drain(v => logs.push(v))
	sink.abort()
	const stream = pull(values([1, 2, 3]), sink)

	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [], '`op` calls')
	})
})

test('abort while pending input', t => {
	t.plan(2)
	const logs = []
	const source = pushable()
	const sink = drain(v => {
		logs.push(v)
		if (v === 1) {
			setImmediate(() => {
				sink.abort()
				source.push(2)
			})
		}
	})
	source.push(1)
	const stream = pull(source, sink)

	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [1], '`op` calls')
	})
})

test('aborting from source', t => {
	t.plan(3)
	const logs = []
	const testError = new Error('test')
	let count = 0
	const sink = drain(v => logs.push(v))
	const stream = pull((end, cb) => {
		if (end) return cb(end)
		count++
		if (count >= 2) sink.abort()
		cb(null, count)
	}, sink)

	t.ok(stream instanceof Promise, '`stream` is a promise')
	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [1], '`op` calls')
	})
})

test('drain an empty stream', t => {
	t.plan(2)
	const logs = []
	const stream = pull(values([]), drain(v => logs.push(v)))

	stream.then(r => {
		t.equal(r, undefined, 'resolved value')
		t.deepEqual(logs, [], '`op` is not called')
	})
})

test('drain a stream with an error in the beginning', t => {
	t.plan(2)
	const testError = new Error('test')
	const logs = []
	const stream = pull(error(testError), drain(v => logs.push(v)))

	stream.catch(e => {
		t.equal(e, testError, 'rejection value')
		t.deepEqual(logs, [], '`op` calls')
	})
})

test('drain a stream which errors', t => {
	t.plan(3)
	const logs = []
	const testError = new Error('test')
	let count = 0
	const stream = pull((end, cb) => {
		if (end) return cb(end)
		if (count++ < 2) return cb(null, count)
		cb(testError)
	}, drain(v => logs.push(v)))

	t.ok(stream instanceof Promise, '`stream` is a promise')
	stream.catch(e => {
		t.deepEqual(logs, [1, 2], '`op` calls')
		t.equal(e, testError, 'Rejects with the error')
	})
})

test('drain a long stream (call stack blower)', t => {
	t.plan(1)
	pull(infinite(), take(100000), drain()).then(t.pass())
})
