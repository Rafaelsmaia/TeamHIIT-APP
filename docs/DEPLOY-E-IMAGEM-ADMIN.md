# Deploy e upload de imagem no Admin

Guia rápido para o que estava travando: **deploy** e **imagem de módulo no Dashboard** pelo painel admin.

---

## 1. Deploy do app

### Situação

- O `firebase.json` **não tinha** a seção `hosting`, então o app web não era publicado pelo Firebase.
- Agora foi adicionado **Firebase Hosting** apontando para a pasta `dist` (saída do `npm run build`).

### Como fazer deploy do app web (Firebase Hosting)

```bash
# 1. Gerar o build
npm run build

# 2. Publicar no Firebase Hosting
firebase deploy --only hosting
```

Se quiser publicar **só** regras (Firestore/Storage) ou **só** functions, use:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
# ou uma função específica:
firebase deploy --only functions:calculateCalories
```

### Se o deploy de **functions** falhar no lint

O `firebase.json` está configurado para rodar `npm run lint` **dentro da pasta `functions`** antes do deploy. Se der erro:

- Corrija os erros de lint em `functions/` e rode de novo, ou
- Para testar, você pode fazer deploy temporariamente sem o predeploy (editando o `firebase.json` e removendo o bloco `predeploy` das functions).

### Cache / versão antiga

Se após o deploy a versão antiga continuar aparecendo:

1. Limpe o cache do navegador (Ctrl+Shift+R).
2. Em DevTools: Application → Service Workers → Unregister; Application → Storage → Clear site data.
3. Aguarde alguns minutos (propagação do Firebase).

---

## 2. Imagem de módulo no Dashboard (admin “não aceitando”)

No admin, ao editar um módulo, há duas imagens:

- **Capa Team HIIT** (proporção 3:4) → vai para `imageUrl` e Storage em `training_covers/`.
- **Capa Dashboard (Treinos para hoje)** → vai para `bannerImageUrl` e Storage em `training_banners/`.

O Dashboard usa `bannerImageUrl` para o carrossel “Treinos para hoje”. Se o admin “não aceita” a imagem, em geral é um destes pontos.

### Requisitos para funcionar

1. **Usuário logado** no app (Firebase Auth).
2. **Conta com permissão de admin**: no Firestore, em `users/{seu-uid}` deve existir o campo `isAdmin: true`.
3. **Módulo já existir no Firestore**: a coleção é `trainings`. O admin busca o módulo pelo `id` do treino; se não achar nenhum documento com esse `id`, mostra “Módulo não encontrado no Firestore. Para módulos novos, use a aba Treinos para criar primeiro.” Nesse caso, crie o treino/módulo na aba **Treinos** e depois edite em **Módulos**.

### Regras atuais (resumo)

- **Storage** (`storage.rules`):  
  - `training_covers/**` e `training_banners/**`: leitura livre; escrita só com `request.auth != null`.
- **Firestore** (`firestore.rules`):  
  - `trainings`: escrita só se o usuário estiver em `users/{uid}` e tiver `isAdmin == true`.

Ou seja: qualquer usuário logado pode subir arquivo em `training_covers` e `training_banners`, mas **só admin** pode atualizar o documento do módulo no Firestore (incluindo `imageUrl` e `bannerImageUrl`). Se o seu usuário não for admin, o upload pode até concluir, mas o “Salvar” do módulo falha com permissão.

### Mensagens de erro no admin

As mensagens ao salvar o módulo foram ajustadas para ficar mais claras:

- **Sem permissão para salvar** → confira se `users/{seu-uid}.isAdmin` é `true` no Firestore.
- **Precisa estar logado** → faça login de novo e tente salvar outra vez.
- **Erro no upload da imagem / Storage** → confira se está logado e se as regras do Storage estão deployadas (`firebase deploy --only storage`).

### Checklist rápido

- [ ] Usuário logado no app.
- [ ] Em Firestore, `users/{seu-uid}` existe e tem `isAdmin: true`.
- [ ] Módulo já criado na aba **Treinos** (para existir em `trainings`).
- [ ] Regras do Storage e do Firestore já deployadas (`firebase deploy --only storage` e `firebase deploy --only firestore:rules`).

---

## 3. Resumo dos comandos

| Objetivo              | Comando |
|-----------------------|--------|
| Build do app          | `npm run build` |
| Deploy do app (web)   | `npm run build` e depois `firebase deploy --only hosting` |
| Deploy só regras      | `firebase deploy --only firestore:rules` e/ou `firebase deploy --only storage` |
| Deploy só functions   | `firebase deploy --only functions` |

Se algo ainda falhar, use o texto exato da mensagem de erro (ou um print) para checar contra as regras e o checklist acima.
