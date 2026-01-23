# Prompt para Integração de Webhook da Greenn

## Contexto

Este documento contém todas as informações necessárias para implementar a integração de webhook da plataforma Greenn no projeto do app Team HIIT. O webhook deve processar eventos de vendas, contratos e abandono de carrinho, criando usuários automaticamente no Firebase Authentication e enviando emails de boas-vindas.

## Objetivo

Implementar um webhook que:
1. Recebe eventos da plataforma Greenn (vendas, contratos, abandono de carrinho)
2. Cria/atualiza usuários no Firebase Authentication quando uma assinatura é paga
3. Salva dados no Firestore (vendas, contratos, clientes, leads)
4. Envia email automático de boas-vindas com credenciais de login
5. Define claims customizados no Firebase Auth para usuários com assinatura ativa

## Estrutura do Webhook

### Endpoints Necessários

1. **POST /webhook** - Endpoint principal que recebe todos os eventos
2. **GET /health** - Endpoint de health check

### Tipos de Eventos

O webhook deve processar três tipos de eventos:

1. **saleUpdated** (`type: 'sale'`, `event: 'saleUpdated'`)
   - Disparado quando uma venda é atualizada
   - Se o status for `paid` e o produto for `SUBSCRIPTION`, cria usuário

2. **contractUpdated** (`type: 'contract'`, `event: 'contractUpdated'`)
   - Disparado quando um contrato é atualizado
   - Se o status for `paid`, cria/atualiza usuário e envia email

3. **checkoutAbandoned** (`type: 'lead'`, `event: 'checkoutAbandoned'`)
   - Disparado quando um carrinho é abandonado
   - Salva como lead para follow-up

## Estrutura de Dados

### Payload de Venda (saleUpdated)

```json
{
  "oldStatus": "waiting_payment",
  "currentStatus": "paid",
  "type": "sale",
  "event": "saleUpdated",
  "product": {
    "id": 999999,
    "name": "Assinatura Team HIIT Mensal",
    "amount": 99.90,
    "type": "SUBSCRIPTION",
    "method": "CREDIT_CARD"
  },
  "sale": {
    "id": 777777,
    "status": "paid",
    "amount": 99.90,
    "method": "CREDIT_CARD",
    "installments": 1,
    "type": "SUBSCRIPTION",
    "client_id": 888888,
    "seller_id": 1,
    "coupon": null,
    "created_at": "2025-11-04 20:00:00",
    "updated_at": "2025-11-04 20:00:00"
  },
  "client": {
    "id": 888888,
    "name": "João Silva",
    "email": "joao@example.com",
    "cellphone": "11988888888",
    "cpf_cnpj": "123.456.789-00",
    "street": "Avenida Paulista",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "uf": "SP",
    "zipcode": "01310-100",
    "created_at": "2025-11-04 20:00:00",
    "updated_at": "2025-11-04 20:00:00"
  },
  "seller": {
    "id": 1,
    "name": "Team HIIT",
    "email": "vendedor@teamhiit.com.br",
    "cellphone": "11999999999"
  },
  "saleMetas": []
}
```

### Payload de Contrato (contractUpdated)

```json
{
  "oldStatus": "waiting_payment",
  "currentStatus": "paid",
  "type": "contract",
  "event": "contractUpdated",
  "product": {
    "id": 999999,
    "name": "Assinatura Team HIIT Mensal",
    "amount": 99.90,
    "type": "SUBSCRIPTION"
  },
  "contract": {
    "id": 666666,
    "status": "paid",
    "start_date": "2025-11-04 20:00:00",
    "current_period_end": "2025-12-04 20:00:00",
    "created_at": "2025-11-04 20:00:00",
    "updated_at": "2025-11-04 20:00:00"
  },
  "currentSale": {
    "id": 777777,
    "status": "paid",
    "amount": 99.90,
    "method": "CREDIT_CARD",
    "coupon": null
  },
  "client": {
    "id": 888888,
    "name": "Maria Santos",
    "email": "maria@example.com",
    "cellphone": "11977777777"
  },
  "productMetas": [],
  "proposalMetas": [],
  "saleMetas": []
}
```

### Payload de Abandono (checkoutAbandoned)

```json
{
  "type": "lead",
  "event": "checkoutAbandoned",
  "product": {
    "id": 999999,
    "name": "Assinatura Team HIIT Mensal",
    "amount": 99.90
  },
  "lead": {
    "id": 555555,
    "name": "Pedro Costa",
    "email": "pedro@example.com",
    "cellphone": "11966666666",
    "cpf_cnpj": "987.654.321-00",
    "city": "São Paulo",
    "street": "Rua Augusta",
    "step": 2
  },
  "productMetas": [],
  "proposalMetas": []
}
```

## Funcionalidades Necessárias

### 1. Validação do Webhook

Implementar função `validateWebhook(req)` que:
- Verifica se há token de autenticação no header `Authorization` (se a Greenn fornecer)
- Valida a estrutura básica do payload
- Retorna erro se a validação falhar

### 2. Criação de Usuário

Implementar função `createOrUpdateUser(client, contractData, saleData)` que:
- Verifica se o usuário já existe no Firebase Auth pelo email
- Se não existir:
  - Gera senha aleatória segura (12 caracteres)
  - Cria usuário no Firebase Auth com email e senha
  - Salva senha temporária no Firestore (`user_credentials`)
  - Envia email de boas-vindas com credenciais
  - Marca email como enviado no Firestore
- Se já existir:
  - Atualiza informações do usuário (nome, etc.)
- Salva/atualiza dados do usuário no Firestore (`users`)
- Se o contrato/venda estiver pago (`paid`), define claims customizados:
  ```javascript
  {
    hasSubscription: true,
    subscriptionStatus: 'active',
    contractId: contractData.contractId
  }
  ```

### 3. Geração de Senha

Implementar função `generateRandomPassword(length = 12)` que:
- Gera senha aleatória com caracteres: a-z, A-Z, 0-9, !@#$%^&*
- Retorna senha segura

### 4. Envio de Email

Implementar função `sendWelcomeEmail(email, name, password, loginUrl)` que:
- Usa Resend para enviar emails
- Email HTML com design profissional contendo:
  - Mensagem de boas-vindas personalizada
  - Email de login
  - Senha gerada
  - Botão para fazer login
  - Aviso de segurança para alterar senha
- Versão texto também (fallback)
- Retorna `true` se enviado com sucesso, `false` caso contrário

### 5. Processamento de Vendas

Implementar função `processSaleWebhook(data)` que:
- Salva dados da venda no Firestore (`sales`)
- Atualiza informações do cliente (`clients`)
- Se status for `paid` e produto for `SUBSCRIPTION`, cria usuário
- Retorna resultado do processamento

### 6. Processamento de Contratos

Implementar função `processContractWebhook(data)` que:
- Salva dados do contrato no Firestore (`contracts`)
- Atualiza informações do cliente (`clients`)
- Se status for `paid`, cria/atualiza usuário e envia email
- Retorna resultado do processamento

### 7. Processamento de Abandono

Implementar função `processCheckoutAbandonedWebhook(data)` que:
- Salva dados do carrinho abandonado (`abandoned_carts`)
- Salva como lead (`leads`) com source `checkout_abandoned`
- Retorna resultado do processamento

## Estrutura do Firestore

### Coleções Necessárias

1. **users** - Dados dos usuários
   - `uid` - ID do usuário no Firebase Auth
   - `email` - Email do usuário
   - `name` - Nome do usuário
   - `cellphone` - Telefone
   - `cpfCnpj` - CPF/CNPJ
   - `address` - Objeto com endereço completo
   - `subscription` - Dados da assinatura (se houver)
   - `sale` - Dados da venda (se houver)
   - `createdAt` - Timestamp
   - `updatedAt` - Timestamp

2. **sales** - Vendas processadas
   - `saleId` - ID da venda
   - `status` - Status da venda
   - `amount` - Valor
   - `method` - Método de pagamento
   - `product` - Dados do produto
   - `client` - Dados do cliente
   - `createdAt` - Timestamp
   - `updatedAt` - Timestamp

3. **contracts** - Contratos processados
   - `contractId` - ID do contrato
   - `status` - Status do contrato
   - `startDate` - Data de início
   - `currentPeriodEnd` - Fim do período atual
   - `product` - Dados do produto
   - `currentSale` - Venda atual
   - `client` - Dados do cliente
   - `createdAt` - Timestamp
   - `updatedAt` - Timestamp

4. **clients** - Clientes
   - Dados completos do cliente
   - `lastPurchase` - Última compra
   - `totalPurchases` - Total de compras
   - `contractStatus` - Status do contrato
   - `contractId` - ID do contrato
   - `updatedAt` - Timestamp

5. **leads** - Leads para follow-up
   - Dados do lead
   - `source` - Origem (ex: `checkout_abandoned`)
   - `step` - Passo do checkout
   - `productId` - ID do produto
   - `createdAt` - Timestamp

6. **abandoned_carts** - Carrinhos abandonados
   - `leadId` - ID do lead
   - `step` - Passo do checkout
   - `product` - Dados do produto
   - `client` - Dados do cliente
   - `createdAt` - Timestamp
   - `updatedAt` - Timestamp

7. **user_credentials** - Credenciais temporárias
   - `email` - Email do usuário
   - `tempPassword` - Senha temporária
   - `sent` - Se o email foi enviado
   - `sentAt` - Timestamp de envio
   - `createdAt` - Timestamp

## Configurações Necessárias

### Variáveis de Ambiente

1. **RESEND_API_KEY** - API Key do Resend (começa com `re_`)
2. **RESEND_FROM_EMAIL** - Email remetente (ex: `noreply@teamhiit.com.br`)
3. **APP_LOGIN_URL** - URL de login do app (ex: `https://app.teamhiit.com.br/login`)

### Dependências NPM

```json
{
  "dependencies": {
    "express": "^4.21.2",
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^6.6.0",
    "resend": "^6.4.1"
  }
}
```

### Firebase Functions

- Usar Firebase Functions v2 (Gen 2)
- Configurar `maxInstances: 10`
- Deploy da função principal: `greennWebhook`

## Regras do Firestore

As regras devem permitir que o webhook escreva nas coleções:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{leadId} {
      allow read: if request.auth != null;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /sales/{saleId} {
      allow read: if request.auth != null;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /contracts/{contractId} {
      allow read: if request.auth != null;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /abandoned_carts/{cartId} {
      allow read: if request.auth != null;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /clients/{clientId} {
      allow read: if request.auth != null;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if true; // Webhook precisa escrever
    }
    
    match /user_credentials/{credentialId} {
      allow read: if request.auth != null && request.auth.uid == credentialId;
      allow write: if true; // Webhook precisa escrever
    }
  }
}
```

## Template de Email

O email deve conter:
- Design profissional e responsivo
- Mensagem de boas-vindas personalizada com nome do cliente
- Box destacado com email e senha de acesso
- Botão para fazer login no app
- Aviso de segurança sobre alterar senha após primeiro acesso
- Rodapé com informações da empresa

## Fluxo Completo

1. **Evento recebido** → Webhook recebe POST da Greenn
2. **Validação** → Valida webhook e estrutura do payload
3. **Processamento** → Processa baseado no tipo e evento
4. **Salvamento** → Salva dados no Firestore
5. **Criação de usuário** → Se necessário, cria usuário no Firebase Auth
6. **Envio de email** → Envia email com credenciais
7. **Claims customizados** → Define claims para usuários com assinatura ativa
8. **Resposta** → Retorna 200 OK com resultado

## Tratamento de Erros

- Logs detalhados para debug
- Não falhar o webhook se o email falhar (usuário já foi criado)
- Retornar erros apropriados (400, 401, 500)
- Registrar erros no Firestore para análise posterior

## Testes

Criar scripts de teste para:
- Testar endpoint de health check
- Testar processamento de vendas pagas
- Testar processamento de contratos pagos
- Testar processamento de abandono de carrinho
- Verificar criação de usuários
- Verificar envio de emails
- Verificar salvamento no Firestore

## URLs Importantes

- **URL do Webhook**: Configurar na plataforma Greenn
- **URL de Login do App**: `https://app.teamhiit.com.br/login`
- **Health Check**: `https://seu-projeto.cloudfunctions.net/greennWebhook/health`

## Observações Importantes

1. A validação do webhook deve ser implementada conforme a documentação da Greenn (se fornecerem token de autenticação)
2. A senha temporária deve ser salva no Firestore para possível reenvio
3. O email deve ser enviado apenas para novos usuários (não reenviar para usuários existentes)
4. Claims customizados devem ser atualizados quando o status do contrato mudar
5. Os dados devem ser salvos de forma idempotente (merge ao invés de set)
6. Logs devem ser detalhados para facilitar debugging

## Próximos Passos Após Implementação

1. Configurar webhook na plataforma Greenn
2. Testar com compra real de teste
3. Verificar criação de usuários no Firebase Auth
4. Verificar envio de emails
5. Verificar dados no Firestore
6. Monitorar logs do Firebase Functions
7. Configurar alertas para erros críticos

