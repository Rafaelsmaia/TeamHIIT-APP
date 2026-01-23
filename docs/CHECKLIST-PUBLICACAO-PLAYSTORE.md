# ✅ Checklist de Publicação - Play Store
## Team HIIT App

### 📋 PONTO 1: Configurações Básicas do App
**Status:** ✅ Concluído

#### Verificações:
- [x] **Application ID (Package Name)**
  - Atual: `com.teamhiit.app`
  - ✅ Confirmado como ID final permanente

- [x] **Version Code**
  - Atual: `4`
  - ✅ OK para primeira publicação

- [x] **Version Name**
  - Atual: `1.0.0` (atualizado)
  - ✅ Configurado para lançamento inicial

- [x] **App Name**
  - Atual: `TeamHIIT`
  - ✅ OK

---

### 📋 PONTO 2: Ícone e Assets Visuais
**Status:** ⏳ Parcialmente Concluído

#### Verificações:
- [x] **Ícones do App (Android)**
  - ✅ Ícones encontrados em todas as densidades
  - ✅ Ícone padrão: `ic_launcher.png`
  - ✅ Ícone redondo: `ic_launcher_round.png`
  
- [x] **Ícone do PWA**
  - ✅ Configurado: `LOGO TH FUNDO PRETO.png` (512x512)
  - ✅ Testado e aprovado

- [ ] **Splash Screen**
  - ⏳ **PENDENTE:** Você vai criar uma imagem personalizada
  - Arquivo atual: `splash.png` (não está sendo usado)
  - Status: Aguardando criação da imagem personalizada
  
- [x] **Screenshots (para Play Store)**
  - ✅ Screenshots criados pelo usuário
  - Tamanhos: Phone 1080x1920 (mínimo 2, recomendado 4-8)
  - Qualidade: JPG ou PNG 24-bit
  - Status: Prontos para upload na Play Store
  
- [x] **Ícone da Play Store (512x512)**
  - ✅ Confirmado: Usar `LOGO TH FUNDO PRETO.png` (512x512)
  - Status: Pronto para upload na Play Store

**Ação necessária:**
- Criar splash screen personalizada (PENDENTE - você vai criar depois)

---

### 📋 PONTO 3: Assinatura do App (Keystore)
**Status:** ✅ Concluído

#### Verificações:
- [x] **Keystore File**
  - ✅ Arquivo criado: `android/teamhiit-key.keystore`
  - ✅ Backup do arquivo antigo: `teamhiit-key.keystore.backup`
  
- [x] **Configuração de Assinatura**
  - ✅ Arquivo `keystore.properties` criado (não vai para git)
  - ✅ Configuração adicionada no `build.gradle`
  - ✅ Alias: `teamhiit`
  - ✅ Validade: 10000 dias (~27 anos)
  - ✅ Assinatura configurada para build release

**Informações do Keystore:**
- Alias: `teamhiit`
- Senha: `Pass0623*` (guarde em local seguro!)
- Arquivo: `android/teamhiit-key.keystore`

**⚠️ IMPORTANTE:** 
- Guarde a senha do keystore em local seguro
- Sem ela, não será possível atualizar o app na Play Store
- Faça backup do arquivo `.keystore`

---

### 📋 PONTO 4: Permissões do App
**Status:** ✅ Verificado

#### Permissões atuais:
- ✅ `INTERNET` - Necessário para app web/PWA
- ✅ `CAMERA` - Para funcionalidade de câmera (opcional)
- ✅ `WRITE_EXTERNAL_STORAGE` - Para salvar arquivos
- ✅ `READ_EXTERNAL_STORAGE` - Para ler arquivos

**Status:** OK - Permissões adequadas

---

### 📋 PONTO 5: Política de Privacidade
**Status:** ✅ Concluído

#### Verificações:
- [x] **URL da Política de Privacidade**
  - ✅ URL encontrada: `https://teamhiit.com.br/politica-privacidade.html`
  - ✅ URL pública e acessível
  - ✅ Política completa e em conformidade com LGPD
  - ✅ Última atualização: 04 de Novembro de 2025
  
**Status:** Pronta para usar na Play Store

---

### 📋 PONTO 6: Testes Funcionais
**Status:** ⏳ Pendente

#### Checklist de Funcionalidades:
- [ ] **Login**
  - [ ] Login com email/senha funciona
  - [ ] Login com preenchimento automático funciona
  - [ ] Login manual funciona (corrigido no último build)
  
- [ ] **Navegação**
  - [ ] Dashboard carrega corretamente
  - [ ] Navegação entre telas funciona
  
- [ ] **Webhook Greenn**
  - [ ] Teste do webhook passou ✅
  - [ ] Criação automática de usuários configurada
  
- [ ] **Funcionalidades Principais**
  - [ ] Vídeos carregam
  - [ ] Comunidade funciona
  - [ ] Perfil funciona

**Ação necessária:**
- Fazer teste completo do app em dispositivo Android real
- Verificar se todas as funcionalidades principais funcionam

---

### 📋 PONTO 7: Build e Geração do .AAB
**Status:** ⏳ Pendente

#### Passos:
1. [ ] Build do projeto (`npm run build`)
2. [ ] Sync com Capacitor (`npx cap sync android`)
3. [ ] Configurar assinatura (se necessário)
4. [ ] Gerar `.aab` (Android App Bundle)
5. [ ] Verificar tamanho do arquivo (idealmente < 100MB)

**Ação necessária:**
- Executar após resolver todos os pontos anteriores

---

### 📋 PONTO 8: Configuração no Google Play Console
**Status:** ⏳ Pendente

#### Informações necessárias:
- [ ] **Descrição do App**
  - Texto curto (80 caracteres)
  - Descrição completa (até 4000 caracteres)
  
- [ ] **Categoria**
  - Saúde e Fitness
  
- [ ] **Classificação de Conteúdo**
  - Já configurado anteriormente
  
- [ ] **Acesso ao App (Teste)**
  - Credenciais de teste já configuradas
  
- [ ] **Screenshots**
  - Upload das imagens criadas
  
- [ ] **Ícone da Play Store**
  - 512 x 512 pixels (PNG de alta qualidade)

**Ação necessária:**
- Preencher todas as informações no Play Console

---

### 📋 PONTO 9: Configurações de Segurança e Dados
**Status:** ⏳ Pendente

#### Verificações:
- [ ] **Declaração de Segurança de Dados**
  - Já preenchida anteriormente
  - Dados de saúde declarados
  
- [ ] **Permissões Declaradas**
  - Verificar se todas as permissões estão declaradas corretamente

**Status:** Provavelmente já configurado

---

### 📋 PONTO 10: Upload e Envio para Revisão
**Status:** ⏳ Pendente

#### Passos finais:
1. [ ] Upload do `.aab` no Play Console
2. [ ] Preencher todas as informações obrigatórias
3. [ ] Enviar para revisão (Beta ou Produção)
4. [ ] Aguardar aprovação (1-7 dias)

---

## 🎯 Próximo Passo

**Vamos começar pelo PONTO 1: Configurações Básicas**

Me responda:
1. Você quer manter `versionName: "3.3.2"` ou prefere `"1.0.0"` para o lançamento?
2. O `applicationId: "com.teamhiit.app"` está correto e é o que você quer usar permanentemente?

Após confirmar, vamos para o próximo ponto! 🚀

