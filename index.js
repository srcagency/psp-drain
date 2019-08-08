'use strict'

module.exports = drain

function drain(op) {
	let ended = null
	let read
	sink.abort = abort
	return sink

	function sink(_read) {
		read = _read
		return new Promise((rs, rj) => {
			drain()

			function drain() {
				let more = true
				let looped = false
				while (more) {
					looped = false
					more = false
					read(ended, (end, data) => {
						end = ended === null ? end : ended
						if (end === true) return rs()
						if (end) return rj(end)
						if (op !== undefined && op(data) === false) ended = true
						if (looped) return drain()
						more = true
					})

					looped = true
				}
			}
		})
	}

	function abort(end = true) {
		ended = end
		if (read) {
			read(end, () => undefined)
		}
	}
}
