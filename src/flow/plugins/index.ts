import type FlowLite from '../lite'
import type { Digit } from '../lite'
import type { Data } from '../formatter'

export type Plugin = {
	onUpdate?(data: Data, prev: Data, context: FlowLite): void
	getDelta?(value: number, prev: number, context: Digit): number | void
}

export { continuous } from './continuous'
