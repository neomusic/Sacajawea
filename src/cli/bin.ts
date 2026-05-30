import { Command } from 'commander'
import { runInit } from './init'

const program = new Command()

program
  .name('sacajawea')
  .description('SEO-correct multi-locale routing for Next.js App Router')

program
  .command('init')
  .description('Scaffold sacajawea.config.ts and the App Router locale segment')
  .action(() => runInit({ cwd: process.cwd() }))

program.parse()
