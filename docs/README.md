# 🏋️ Team HIIT - Aplicativo de Treinos

Aplicativo mobile e web para treinos HIIT com sincronização Firebase.

---

## 📱 **Versão Atual**

**v3.1 - Upload de Dados**

**APK:** `TeamHIIT-Upload-v3.1.apk`

---

## 🚀 **Funcionalidades**

- ✅ Sincronização automática com Firebase
- ✅ Upload e download manual de dados
- ✅ Múltiplos dispositivos sincronizados
- ✅ Progresso de treinos com gráficos
- ✅ Hábitos diários (água, sono, treino, alimentação)
- ✅ Ofensiva de treinos (streak)
- ✅ Modo claro/escuro
- ✅ PWA e App nativo (Android)

---

## 📚 **Documentações**

### **Principais:**
- **[GUIA-UPLOAD-DADOS.md](GUIA-UPLOAD-DADOS.md)** - Como usar upload e sync de dados
- **[FIREBASE-SYNC-IMPLEMENTATION.md](FIREBASE-SYNC-IMPLEMENTATION.md)** - Implementação da sincronização
- **[CORRECOES-DEFINITIVAS-v3.0.md](CORRECOES-DEFINITIVAS-v3.0.md)** - Histórico de correções v3.0

### **Android:**
- **[README-ANDROID.md](README-ANDROID.md)** - Instruções para build Android
- **[INSTRUCOES-INSTALACAO-APK.md](INSTRUCOES-INSTALACAO-APK.md)** - Como instalar o APK

---

## 🛠️ **Comandos**

### **Desenvolvimento:**
```bash
npm install          # Instalar dependências
npm run dev          # Rodar servidor de desenvolvimento
npm run build        # Build para produção
```

### **Android:**
```bash
npx cap sync android                    # Sincronizar com Capacitor
cd android && .\gradlew.bat assembleDebug   # Gerar APK
```

---

## 📂 **Estrutura do Projeto**

```
TeamHIIT - APP/
├── src/
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas da aplicação
│   ├── hooks/            # Custom hooks
│   ├── services/         # FirebaseSync e outros serviços
│   ├── utils/            # Utilitários (ProgressManager, etc)
│   └── contexts/         # Contextos React (Theme)
├── public/               # Assets públicos
├── android/              # Projeto Android (Capacitor)
├── dist/                 # Build de produção
└── TeamHIIT-Upload-v3.1.apk  # APK atual
```

---

## 🔥 **Firebase**

### **Estrutura do Firestore:**

```
users/
  └─ {userId}/
      ├─ progress/
      │   ├─ workouts/
      │   │   ├─ completedVideos: [...]
      │   │   ├─ workoutDates: {...}
      │   │   └─ lastSync: timestamp
      │   └─ habits/
      │       ├─ waterIntake: number
      │       ├─ sleepHours: number
      │       └─ lastSync: timestamp
      └─ (outros dados do perfil)
```

---

## 📱 **Como Usar o App**

### **1. Upload de Dados (Web → Firebase):**
```
1. Abra localhost:5173
2. Faça login
3. Complete treinos
4. Clique "📤 Upload"
5. Dados enviados para Firebase!
```

### **2. Sync de Dados (Firebase → App):**
```
1. Instale o APK
2. Faça login (mesma conta)
3. Clique "🔄 Sync"
4. Dados baixados do Firebase!
```

---

## 🧪 **Debug**

### **Chrome DevTools (App Android):**
```
1. Conecte o celular via USB
2. Ative "Depuração USB" no Android
3. Abra chrome://inspect no navegador
4. Veja logs em tempo real
```

### **Logs Importantes:**
```javascript
🔄 [APP] Inicializando FirebaseSync...
📥 [FirebaseSync] Carregando progresso...
✅ [Dashboard] Upload concluído!
📊 [Dashboard] Progresso carregado: {...}
```

---

## 🎯 **Tecnologias**

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Router:** React Router DOM (HashRouter)
- **Mobile:** Capacitor
- **Backend:** Firebase (Auth + Firestore + Storage)
- **UI Components:** Shadcn/ui + Lucide Icons

---

## 📦 **Versões**

### **v3.1 (Atual) - Upload de Dados**
- ✅ Botão de upload manual
- ✅ Botão de sync manual
- ✅ Validação de dados
- ✅ Mensagens informativas

### **v3.0 - Correções Definitivas**
- ✅ SVG nativo para ícones
- ✅ Aguarda Firebase antes de renderizar
- ✅ Logs detalhados

### **v2.0 - Sincronização Firebase**
- ✅ FirebaseSync service
- ✅ Sincronização automática
- ✅ Merge de conflitos

---

## 👨‍💻 **Desenvolvimento**

### **Comandos úteis:**

```bash
# Limpar cache e rebuild
npm run build && npx cap sync android

# Gerar novo APK
cd android && .\gradlew.bat assembleDebug

# Copiar APK para raiz
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "TeamHIIT-v{version}.apk"
```

---

## 📄 **Licença**

Projeto privado - Team HIIT

---

## 📞 **Suporte**

Para dúvidas ou problemas:
1. Veja os logs no chrome://inspect
2. Consulte as documentações na pasta raiz
3. Verifique o Firestore Console

---

**Última atualização:** Outubro 2025  
**Versão:** 3.1

