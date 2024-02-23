import { createRealmContext } from '@realm/react';

import { Historic } from './schemas/Historic';

export const {
  RealmProvider, //Provider do RealmDB
  useRealm, //Dispinibilidade de usar a instancia do BD RealmDB
  useQuery, //Utilizar comandos de consultas
  useObject //Obert um objeto especifico
} = createRealmContext({
  schema: [Historic]
});