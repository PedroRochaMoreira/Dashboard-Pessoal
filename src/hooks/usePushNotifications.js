import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function usePushNotifications(userId) {
  useEffect(() => {
    // Essa função só deve rodar se o app estiver rodando
    // dentro do Capacitor (Android/iOS), não no navegador normal.
    // Capacitor.isNativePlatform() responde true/false pra isso.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Não faz sentido registrar notificação sem saber de qual
    // usuário é o token, então esperamos ter um userId.
    if (!userId) {
      return;
    }

    async function registerNotifications() {
      // 1. Pergunta a permissão atual (o usuário já autorizou antes?)
      let permStatus = await PushNotifications.checkPermissions();

      // 2. Se ainda não foi decidido, pede a permissão agora
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      // 3. Se o usuário negou, não tem o que fazer, só paramos aqui
      if (permStatus.receive !== 'granted') {
        console.log('Permissão de notificação negada');
        return;
      }

      // 4. Registra o dispositivo no Firebase Cloud Messaging
      await PushNotifications.register();
    }

    // Esse "listener" escuta o momento em que o Firebase termina
    // de gerar o token único do dispositivo, e aí a gente salva
    // ele no Firestore, associado ao usuário logado.
    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token) => {
        console.log('Token do dispositivo:', token.value);

        await setDoc(
          doc(db, 'users', userId, 'meta', 'pushToken'),
          { token: token.value, updatedAt: new Date().toISOString() }
        );
      }
    );

    // Se der algum erro no registro, aparece aqui no console
    const errorListener = PushNotifications.addListener(
      'registrationError',
      (error) => {
        console.error('Erro ao registrar push notification:', error);
      }
    );

    registerNotifications();

    // Isso "limpa" os listeners quando o componente sai de tela,
    // evitando que fiquem duplicados se o hook rodar de novo
    return () => {
      registrationListener.remove();
      errorListener.remove();
    };
  }, [userId]);
}