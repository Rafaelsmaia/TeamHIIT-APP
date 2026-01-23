# Team HIIT - Aplicativo Mobile

Aplicativo de treinamento HIIT desenvolvido com React, Vite e Capacitor para Android.

## 🚀 Tecnologias

- **Frontend**: React + Vite
- **Mobile**: Capacitor (Android)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Estilização**: Tailwind CSS
- **Notificações**: Firebase Cloud Messaging (FCM)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Android Studio (para builds Android)
- Conta Firebase configurada

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Copie .env.example para .env e configure suas credenciais Firebase
```

## 🏃 Executar

```bash
# Desenvolvimento (web)
npm run dev

# Build para produção
npm run build

# Android
npm run android:sync    # Sincronizar com Android
npm run android:open    # Abrir no Android Studio
npm run android:apk    # Gerar APK assinado
npm run android:aab     # Gerar AAB para Play Store
```

## 📱 Estrutura do Projeto

```
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── services/       # Serviços (Firebase, APIs)
│   ├── utils/          # Utilitários
│   └── config/         # Configurações
├── public/             # Arquivos estáticos
├── android/            # Projeto Android nativo
├── functions/          # Cloud Functions (Firebase)
└── scripts/            # Scripts de build e utilitários
```

## 🔐 Segurança

- Arquivos sensíveis (credenciais, chaves) estão protegidos pelo `.gitignore`
- Nunca commite `serviceAccountKey.json` ou arquivos `.env`

## 📄 Licença

Proprietário - Team HIIT

---

**Desenvolvido com 💪 para a comunidade Team HIIT**
