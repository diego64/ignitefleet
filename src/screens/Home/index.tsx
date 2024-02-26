import { useEffect, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { CloudArrowUp } from 'phosphor-react-native';
import dayjs from 'dayjs';

//RealmDB
import { useQuery, useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';
import { useUser } from '@realm/react';

import { getLastAsyncTimestamp, saveLastSyncTimestamp } from '../../libs/asyncStorage/syncStorage';

//Componentes
import { HomeHeader } from '../../components/HomeHeader';
import { CarStatus } from '../../components/CarStatus';
import { HistoricCard, HistoricCardProps } from '../../components/HistoricCard';
import { TopMessage } from '../../components/TopMessage';

//Estilização
import {
  Container,
  Content,
  Label,
  Title
} from './styles';

export function Home() {
  const [vehicleInUse, setVehicleInUse] = useState<Historic | null>(null);
  const [vehicleHistoric, setVehicleHistoric] = useState<HistoricCardProps[]>([]);
  const [percetageToSync, setPercentageToSync] = useState<string | null>(null);

  const { navigate } = useNavigation();

  const historic = useQuery(Historic);
  const realm = useRealm();
  const user = useUser();

  //Registro de Veiculo
  function handleRegisterMoviment() {
    if(vehicleInUse?._id) {
      navigate('arrival', { id: vehicleInUse._id.toString() });
    } else {
      navigate('departure')
    }
  }

   //Registro de Veiculo ocupados
  function fetchVehicleInUse() {
    try {
      const vehicle = historic.filtered("status='departure'")[0];
      setVehicleInUse(vehicle);
    } catch (error) {
      Alert.alert('Veículo em uso', 'Não foi possível carregar o veículo em uso.');
      console.log(error);
    }
  }

  //Listagem do histórico de veículos
  async function fetchHistoric() {
     try {
      const response = historic.filtered("status='arrival' SORT(created_at DESC)");

      const lastSync = await getLastAsyncTimestamp();

      const formattedHistoric = response.map((item) => {
        return ({
          id: item._id.toString(),
          licensePlate: item.license_plate,
          isSync: lastSync > item.updated_at!.getTime(),
          created: dayjs(item.created_at).format('[Saída em] DD/MM/YYYY [às] HH:mm')

        })
      })
      setVehicleHistoric(formattedHistoric);
    } catch (error) {
      console.log(error);
      Alert.alert('Histórico', 'Não foi possível carregar o histórico.')
    }
  }

  //Redireciomento para a página de detalhes de um veiculo
  function handleHistoricDetails(id: string) {
    navigate('arrival', { id })
  };

  //Verificação da Sincronização dos dados entre os Bancos de dados
  async function progressNotification(transferred: number, transferable: number) {
  const percentage = (transferred/transferable) * 100;

  if(percentage === 100) {
    await saveLastSyncTimestamp();
    await fetchHistoric();
    setPercentageToSync(null);

    Toast.show({
      type: 'info',
      text1: 'Todos os dados estão sincronizado.'
      })
    }

    if(percentage < 100) {
      setPercentageToSync(`${percentage.toFixed(0)}% sincronizado.`)
    }
  }

  //Atualização dos dados quando a interface é carregada
  useEffect(() => {
    fetchVehicleInUse();
  },[]);

  //Atualização dos dados quando o Banco de dados tem alguma alteração
  useEffect(() => {
    realm.addListener('change', () => fetchVehicleInUse())
    return () => {
      if(realm && !realm.isClosed) {
        realm.removeListener('change', fetchVehicleInUse)
      }
    };
  },[]);

  //Atualização dos histórico de veículos
  useEffect(() => {
    fetchHistoric();
  },[historic]);

  //Envio dos dados do RealmDB para o MongoDB
  useEffect(() => {
    realm.subscriptions.update((mutableSubs, realm) => {
      const historicByUserQuery = realm.objects('Historic').filtered(`user_id = '${user!.id}'`);

      mutableSubs.add(historicByUserQuery, { name: 'hostoric_by_user' });
    })
  },[realm]);

  //Sincronização entre RealmDB e MongoDB
  useEffect(() => {
    const syncSession = realm.syncSession;

    if(!syncSession) {
      return;
    }

    syncSession.addProgressNotification(
      Realm.ProgressDirection.Upload,
      Realm.ProgressMode.ReportIndefinitely,
      progressNotification
    )

    return () => {
      syncSession.removeProgressNotification(progressNotification);
    }
  },[]);

  return (
    <Container>
       {
        percetageToSync && <TopMessage title={percetageToSync} icon={CloudArrowUp} />
      }
      <HomeHeader />

      <Content>
        <CarStatus 
          licensePlate={vehicleInUse?.license_plate}
          onPress={handleRegisterMoviment} 
        />

        <Title>
          Histórico
        </Title>

        <FlatList 
          data={vehicleHistoric}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <HistoricCard 
              data={item} 
              onPress={() => handleHistoricDetails(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={(
            <Label>
              Nenhum registro de utilização.
            </Label>
          )}
        />
      </Content>
    </Container>
  );
}