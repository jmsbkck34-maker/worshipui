import test from 'node:test';
import {integrationTests} from './integration.mjs';
test('authenticated remote editing, concurrent writes, history and access boundaries',integrationTests);
