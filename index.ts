import fs, { access } from 'fs';
import path from 'path';
import { readObjSync } from '@libs/common';

type Plugin = { default: (...args: any[]) => Promise<any> };

type PluginsConfig = {
  plugins: { [id: string]: any },
  errors: Array<{ [ path: string ]: any}>
}

const pluginsDir = path.join(__dirname, 'plugins');

const getPlugins = (pluginsDir: string): PluginsConfig => {
  console.log('plugins dir:', pluginsDir);
  return fs.readdirSync(pluginsDir)
    .filter(item => fs.lstatSync(path.join(pluginsDir, item)).isDirectory())
    .reduce((acc, dir) => {
      try {
        const manifest = readObjSync(path.join(pluginsDir, dir, 'manifest.json')) as any;
        acc.plugins[manifest.id] = dir; 
      } catch (err) {
        acc.errors.push({ path: dir, error: err });
      } finally {
        return acc;
      }
    }, { plugins: {}, errors: [] });
}

const main = async () => {
  const { plugins, errors } = getPlugins(pluginsDir);
  console.log('errors:', errors);
  console.log('plugins:', plugins);

  const id = process.argv[2];
  if (!id || !plugins[id]) {
    console.log(`Plugin id = ${id} not found.`);
    process.exit(0);
  }
  try {
    const plugin = await import(path.join(pluginsDir, plugins[id])) as Plugin;
    console.log(plugin.default);
    const result = await plugin.default();
    console.log(result);
  } catch (err) {
    console.log(err);
  }
  console.log('completed');
}

main();