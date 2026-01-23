# Team HIIT - App Android

## 🚀 Status Atual

✅ **PWA configurado** - Service Worker registrado e funcionando
✅ **Projeto Android criado** - Estrutura Capacitor configurada
✅ **Build automatizado** - Scripts prontos para desenvolvimento

## 📱 Como Desenvolver o App Android

### Pré-requisitos

1. **Android Studio** instalado
2. **Java JDK** (versão 11 ou superior)
3. **Android SDK** configurado

### Comandos Úteis

```bash
# Fazer build e sincronizar com Android
npm run android:build

# Abrir projeto no Android Studio
npm run android:open

# Executar app no emulador/dispositivo
npm run android:run

# Apenas sincronizar arquivos web
npm run android:sync
```

### Fluxo de Desenvolvimento

1. **Desenvolver no navegador:**
   ```bash
   npm run dev
   ```

2. **Testar PWA:**
   - Abrir `http://localhost:5173`
   - Verificar se aparece opção "Instalar App"

3. **Atualizar app Android:**
   ```bash
   npm run android:build
   ```

4. **Abrir no Android Studio:**
   ```bash
   npm run android:open
   ```

### Estrutura do Projeto

```
TeamHIIT-web/
├── src/                    # Código React
├── dist/                   # Build web (usado pelo Android)
├── android/                # Projeto Android nativo
│   ├── app/
│   │   └── src/main/
│   │       └── assets/public/  # Arquivos web copiados
│   └── build.gradle
└── public/
    ├── manifest.json       # Configuração PWA
    └── sw.js              # Service Worker
```

## 🔧 Configurações Importantes

### PWA (Progressive Web App)
- ✅ Service Worker registrado
- ✅ Manifest.json configurado
- ✅ Ícones em múltiplos tamanhos
- ✅ Funciona offline

### Android
- ✅ Capacitor configurado
- ✅ Splash screen personalizada
- ✅ Status bar escura
- ✅ HTTPS habilitado

## 📦 Próximos Passos

1. **Instalar Android Studio** (se não tiver)
2. **Configurar emulador Android**
3. **Testar app no dispositivo físico**
4. **Configurar assinatura para Play Store**

## 🐛 Solução de Problemas

### PWA não instala
- Verificar se HTTPS está configurado
- Testar em navegador compatível (Chrome)
- Verificar console para erros

### App Android não compila
- Verificar se Android Studio está instalado
- Verificar versão do Java JDK
- Limpar cache: `npx cap clean android`

### Mudanças não aparecem
- Executar `npm run android:build`
- Verificar se arquivos foram copiados para `android/app/src/main/assets/public/`

## 📱 Recursos do App

- ✅ Interface responsiva
- ✅ Funciona offline
- ✅ Notificações push
- ✅ Autenticação Firebase
- ✅ Treinos HIIT personalizados
- ✅ Progresso do usuário
- ✅ Comunidade

## 🎯 Vantagens do App Nativo vs PWA

### App Nativo (Capacitor)
- ✅ Melhor performance
- ✅ Acesso a recursos nativos
- ✅ Distribuição via Play Store
- ✅ Notificações mais confiáveis
- ✅ Melhor experiência offline

### PWA
- ✅ Instalação rápida
- ✅ Atualizações automáticas
- ✅ Não precisa Play Store
- ✅ Funciona em qualquer dispositivo

## 🚀 Deploy

### Para Teste
1. `npm run android:build`
2. Abrir Android Studio
3. Build → Build Bundle(s) / APK(s)
4. Instalar APK no dispositivo

### Para Play Store
1. Configurar assinatura
2. Gerar AAB (Android App Bundle)
3. Upload na Google Play Console
4. Configurar store listing

---

**Dica:** O app está pronto para desenvolvimento! Você pode fazer mudanças no código React e usar `npm run android:build` para atualizar o app Android automaticamente.
























