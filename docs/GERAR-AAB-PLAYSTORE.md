# 📱 Como Gerar AAB para Google Play Store

## 📋 **INFORMAÇÕES DA VERSÃO ATUAL**

| Item | Valor |
|------|-------|
| **versionCode** | `5` |
| **versionName** | `1.0.1` |
| **Package ID** | `com.teamhiit.app` |
| **Formato** | AAB (Android App Bundle) |

---

## 🚀 **PASSO A PASSO COMPLETO**

### **1️⃣ Gerar o AAB**

Execute o comando:

```bash
npm run android:aab
```

**O que esse comando faz:**
- ✅ Faz build do projeto web (Vite)
- ✅ Sincroniza com Capacitor
- ✅ Gera o AAB assinado com seu keystore
- ✅ Copia o AAB para a pasta `builds/`

**Tempo estimado:** 2-5 minutos

---

### **2️⃣ Localizar o AAB gerado**

Após o build, o arquivo estará em:

```
builds/TeamHIIT-release.aab
```

---

### **3️⃣ Fazer Upload no Google Play Console**

1. Acesse: [Google Play Console](https://play.google.com/console)
2. Selecione seu app **Team HIIT**
3. Vá em **Teste fechado** → **Alpha** (ou a faixa que você configurou)
4. Clique em **"Criar nova versão"**
5. Faça upload do arquivo `TeamHIIT-release.aab`
6. Preencha as **notas de versão** (changelog)
7. Clique em **"Revisar versão"**
8. Clique em **"Iniciar implementação"**

---

## 📝 **EXEMPLO DE NOTAS DE VERSÃO**

Sugestão para o changelog:

```
Versão 1.0.1 - Lançamento Alpha

✨ Novidades:
- PWA completo com todos os treinos Team HIIT
- Calculadora de calorias com IA
- Sistema de progresso e marcação de treinos
- Suporte completo offline
- Integração com sistema de assinaturas

🔧 Melhorias:
- Otimização de performance
- Correção de bugs de carregamento
- Melhor experiência em telas maiores (tablets)
```

---

## ⚙️ **COMANDOS ÚTEIS**

| Comando | Descrição |
|---------|-----------|
| `npm run android:aab` | Gera AAB para Play Store |
| `npm run android:apk` | Gera APK para testes diretos |
| `npm run android:open` | Abre projeto no Android Studio |
| `npm run android:sync` | Sincroniza mudanças com Android |

---

## 🔄 **PARA PRÓXIMAS VERSÕES**

Sempre que for gerar uma nova versão:

1. **Incrementar versionCode** em `android/app/build.gradle`
2. **Atualizar versionName** se houver mudanças significativas
3. Executar `npm run android:aab`
4. Fazer upload no Play Console

### **Regras de Versionamento:**

- **versionCode:** Sempre incrementar em +1 (5, 6, 7...)
- **versionName:** Seguir semver (1.0.1, 1.0.2, 1.1.0, 2.0.0...)

**Exemplo:**
```gradle
versionCode 6        // Era 5, agora 6
versionName "1.0.2"  // Era 1.0.1, agora 1.0.2
```

---

## ❌ **PROBLEMAS COMUNS**

### **Erro: "Keystore not found"**

**Solução:** Verifique se existe `android/keystore.properties` com:
```properties
storeFile=teamhiit-key.keystore
storePassword=SUA_SENHA
keyAlias=teamhiit-key
keyPassword=SUA_SENHA
```

### **Erro: "Upload failed - Version code already used"**

**Solução:** Incremente o `versionCode` em `android/app/build.gradle`

### **Erro: "Signature verification failed"**

**Solução:** O AAB precisa ser assinado com a mesma chave que as versões anteriores. Use sempre o mesmo `teamhiit-key.keystore`

---

## 🔐 **IMPORTANTE - SEGURANÇA**

⚠️ **NUNCA compartilhe ou comite no Git:**
- `android/teamhiit-key.keystore`
- `android/keystore.properties`
- Senhas do keystore

✅ **Faça backup seguro de:**
- `teamhiit-key.keystore`
- Senhas do keystore
- `keystore.properties`

**Perder o keystore = não poder mais atualizar o app na Play Store!**

---

## ✅ **CHECKLIST PRÉ-UPLOAD**

Antes de fazer upload, verifique:

- [ ] versionCode foi incrementado
- [ ] versionName está correto
- [ ] Build foi feito com sucesso
- [ ] AAB foi gerado em `builds/`
- [ ] Notas de versão estão preparadas
- [ ] Testou o app localmente
- [ ] Todas as funcionalidades estão ok

---

## 📞 **PRECISA DE AJUDA?**

Se algo der errado:

1. Verifique os logs do terminal
2. Tente limpar o cache: `cd android && ./gradlew clean`
3. Execute novamente: `npm run android:aab`
4. Se persistir, abra Android Studio para ver erros detalhados: `npm run android:open`

---

**Última atualização:** Dezembro 2025  
**Versão atual do guia:** 1.0

