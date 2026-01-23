# Sistema de Notificações Push - Team HIIT

## Como Funciona

O sistema de notificações permite que administradores enviem notificações push para todos os usuários que ativaram as notificações no app.

## Configuração Completa

### 1. Frontend (Já Implementado)
- ✅ Firebase Cloud Messaging configurado
- ✅ Hook `useNotifications` para gerenciar tokens
- ✅ Botão de notificações no Dashboard
- ✅ Service Worker atualizado
- ✅ Interface administrativa

### 2. Como Usar

#### Para Usuários:
1. Acesse o Dashboard
2. Clique no ícone de sino (Bell) na seção de saudação
3. Permita as notificações quando solicitado
4. Pronto! Você receberá notificações

#### Para Administradores:
1. Acesse `/admin/notifications` no app
2. Preencha o título e mensagem
3. Clique em "Enviar Notificação"
4. A notificação será enviada para todos os usuários cadastrados

### 3. Configuração do Firebase

Para funcionar completamente, você precisa:

1. **Gerar chaves VAPID no Firebase Console:**
   - Acesse Firebase Console > Project Settings > Cloud Messaging
   - Clique em "Generate new key pair"
   - Copie a chave pública

2. **Atualizar a chave VAPID:**
   - Edite `src/hooks/useNotifications.js`
   - Substitua a chave VAPID pela sua chave real

3. **Configurar Cloud Functions (Opcional):**
   - Para envio automático, implemente uma Cloud Function
   - Use o código em `src/services/NotificationService.js` como base

### 4. Estrutura do Banco de Dados

O sistema cria estas coleções no Firestore:

```
fcm_tokens/
  - userId: { token, userId, userEmail, createdAt, platform }

notifications_queue/
  - notificationId: { title, body, createdAt, status, sentBy }
```

### 5. Monitoramento

- Acesse `/admin/notifications` para ver quantos usuários estão cadastrados
- Verifique o console do navegador para logs de debug
- Monitore o Firestore para ver tokens registrados

### 6. Limitações Atuais

- O envio real via FCM ainda precisa ser implementado (Cloud Functions)
- Apenas funciona em navegadores que suportam Service Workers
- Requer HTTPS em produção

### 7. Próximos Passos

1. Implementar Cloud Functions para envio real
2. Adicionar analytics de notificações
3. Implementar segmentação de usuários
4. Adicionar templates de notificação

## Troubleshooting

### Notificações não aparecem:
- Verifique se o usuário permitiu notificações
- Confirme se o Service Worker está registrado
- Verifique o console para erros

### Botão não funciona:
- Verifique se o Firebase está configurado corretamente
- Confirme se as chaves VAPID estão corretas
- Verifique se o navegador suporta notificações

### Erro de permissão:
- O usuário deve permitir notificações manualmente
- Alguns navegadores bloqueiam notificações por padrão
- Verifique as configurações do navegador

























