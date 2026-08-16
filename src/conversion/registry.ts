import type { Converter } from './types'
import { parseIvy } from './parsers/ivy'
import { serializeCashew } from './serializers/cashew'

const converters = new Map<string, Converter>()

export function registerConverter(converter: Converter): void {
  converters.set(converter.id, converter)
}

export function getConverter(id: string): Converter | undefined {
  return converters.get(id)
}

export const ivyToCashew: Converter = {
  id: 'ivy-to-cashew',
  parse: parseIvy,
  serialize: serializeCashew,
}

registerConverter(ivyToCashew)
