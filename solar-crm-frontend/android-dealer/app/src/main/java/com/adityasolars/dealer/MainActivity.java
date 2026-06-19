package com.adityasolars.dealer;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CallControlPlugin.class);
        super.onCreate(savedInstanceState);
    }
}