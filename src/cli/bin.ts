import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { input } from '@inquirer/prompts'
import { runInit } from './init'
import { runAddRoute, extractLocales } from './addRoute'

const program = new Command()

program
  .name('sacajawea')
  .description('SEO-correct multi-locale routing for Next.js App Router')

program
  .command('init')
  .description('Scaffold sacajawea.config.ts and the App Router locale segment')
  .action(() => runInit({ cwd: process.cwd() }))

program
  .command('add-route <name>')
  .description('Scaffold a new route with a slug for every configured locale')
  .action(async (name: string) => {
    const cwd = process.cwd()
    const configSource = readFileSync(join(cwd, 'sacajawea.config.ts'), 'utf8')
    const locales = extractLocales(configSource)

    const slugs: Record<string, string> = {}
    for (const locale of locales) {
      slugs[locale] = await input({ message: `Slug for "${name}" in "${locale}"`, default: name })
    }

    await runAddRoute({ cwd, name, slugs })
  })

program.parse()
