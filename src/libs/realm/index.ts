import { createRealmContext } from '@realm/react';

import { Historic } from './schemas/Historic';

const realmAccessBehavior: Realm.OpenRealmBehaviorConfiguration = {
  type: Realm.OpenRealmBehaviorType.OpenImmediately
}

//Habilitação do medo de sincronismo
export const syncConfig: any = {
  flexible: true,
  newRealmFileBehavior: realmAccessBehavior,
  existingRealmFileBehavior: realmAccessBehavior
}

export const {
  RealmProvider, //Provider do RealmDB
  useRealm, //Dispinibilidade de usar a instancia do BD RealmDB
  useQuery, //Utilizar comandos de consultas
  useObject //Obert um objeto especifico
} = createRealmContext({
  schema: [Historic]
});