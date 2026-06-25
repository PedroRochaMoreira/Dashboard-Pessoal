const functions = require('firebase-functions');
const axios = require('axios'); // Instale: npm install axios

exports.enviarNotificacaoCompromisso = functions.firestore
    .document('compromissos/{compromissoId}')
    .onCreate(async (snap, context) => {
        const novoCompromisso = snap.data();

        // Dados para o OneSignal
        const payload = {
            app_id: "SEU_APP_ID_DO_ONESIGNAL",
            contents: { "en": `Novo compromisso: ${novoCompromisso.titulo}` },
            included_segments: ["All"], // Ou filtre pelo ID do usuário
            send_after: novoCompromisso.horario // Aqui você coloca o timestamp do horário
        };

        try {
            await axios.post('https://onesignal.com/api/v1/notifications', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic SUA_CHAVE_API_DO_ONESIGNAL'
                }
            });
            console.log("Notificação enviada com sucesso!");
        } catch (error) {
            console.error("Erro ao enviar notificação:", error);
        }
    });