// Builds the English edition for Windows: the same app with second-language controls hidden and without the
// offline translator (about 250 MB smaller). Output: release-english/WorshipUI-English-Setup-<version>.exe
import {readFileSync} from 'node:fs';
import {build,Platform,Arch} from 'electron-builder';

const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
await build({
 targets:Platform.WINDOWS.createTarget('nsis',Arch.x64),
 publish:'never',
 config:{
  ...pkg.build,
  files:[...pkg.build.files,'!assets/translator/**'],
  extraMetadata:{worshipuiEdition:'english'},
  artifactName:'WorshipUI-English-Setup-${version}.${ext}',
  directories:{...pkg.build.directories,output:'release-english'}
 }
});
