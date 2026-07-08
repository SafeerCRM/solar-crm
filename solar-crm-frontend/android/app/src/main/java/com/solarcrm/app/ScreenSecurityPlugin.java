package com.solarcrm.app;

import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenSecurity")
public class ScreenSecurityPlugin extends Plugin {

    @PluginMethod
    public void block(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            );

            JSObject ret = new JSObject();
            ret.put("blocked", true);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void allow(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().clearFlags(
                WindowManager.LayoutParams.FLAG_SECURE
            );

            JSObject ret = new JSObject();
            ret.put("blocked", false);
            call.resolve(ret);
        });
    }
}