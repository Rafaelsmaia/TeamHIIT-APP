package com.teamhiit.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Habilitar debug do WebView para inspeção via Chrome DevTools
        WebView.setWebContentsDebuggingEnabled(true);
        
        // Log para confirmar inicialização
        android.util.Log.d("TeamHIIT", "MainActivity iniciada - WebView debugging habilitado");
    }
}
