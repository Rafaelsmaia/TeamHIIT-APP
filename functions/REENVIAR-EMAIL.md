# 📧 Como Reenviar Email de Acesso Manualmente

## Uso Rápido

Se um cliente disser que não recebeu o email:

```bash
cd functions
node resend-email.js email@cliente.com
```

## Exemplo

```bash
cd functions
node resend-email.js danielamenonicosta@gmail.com
```

## O que o script faz:

1. ✅ Busca as credenciais do usuário no Firestore
2. ✅ Gera um novo link de login automático
3. ✅ Envia o email com as credenciais
4. ✅ Atualiza o status no Firestore
5. ✅ Mostra a senha para você anotar (caso precise enviar por WhatsApp)

## Saída esperada:

```
🔍 Buscando credenciais para: email@cliente.com
✅ Usuário encontrado: abc123xyz
📧 Enviando email para: email@cliente.com
👤 Nome: João Silva
🔑 Senha: joaosilva123
✅ Email enviado com sucesso!
📨 ID: 6b0ef3b6-9cad-4faa-b405-e69a3b2dd505
✅ Status atualizado no Firestore
```

## Se o cliente for muito urgente:

Você pode copiar a senha que aparece no log e enviar diretamente para o cliente via WhatsApp:

```
Olá! Aqui estão suas credenciais:

Email: email@cliente.com
Senha: joaosilva123

Acesse: https://app.teamhiit.com.br
```

## Problemas?

- **Usuário não encontrado**: A pessoa ainda não comprou ou usou outro email
- **Erro ao enviar**: Verifique se a API key do Resend está correta
- **Email não chega**: Peça para o cliente verificar SPAM/Lixo eletrônico

