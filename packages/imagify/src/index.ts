import { Context, h, Schema } from 'koishi'
import {} from 'koishi-plugin-template'

export const name = 'imagify'
export const using = ['template'] as const

export interface Config {
  minLength: number
  minLines: number
}

export const Config: Schema<Config> = Schema.object({
  minLength: Schema.natural().default(0).description('要转换为图片的最短消息长度。'),
  minLines: Schema.natural().default(0).description('要转换为图片的最短消息行数。'),
})

export function apply(ctx: Context, config: Config) {
  ctx.template.define('default', async (slots) => {
    const elements = await slots.default()
    const content = h('', elements).toString(true)
    if (content.length < (config.minLength || Infinity)) return elements
    if (content.split('\n').length < (config.minLines || Infinity)) return elements
    return h('html', {
      style: {
        padding: '1rem',
      },
    }, elements)
  })
}
