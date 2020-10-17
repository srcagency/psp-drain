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
				read(ended, (end, data) => {
					end = ended === null ? end : ended
					if (end === true) return rs()
					if (end) return rj(end)
					Promise.resolve(op === undefined ? true : op(data)).then(
						(r) => {
							if (r === false) {
								ended = true
							}
							return drain()
						},
						abort
					)
				})
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
