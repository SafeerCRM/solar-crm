package com.solarcrm.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import androidx.core.content.ContextCompat;

import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "CallControl",
        permissions = {
                @Permission(
                        alias = "callPhone",
                        strings = { Manifest.permission.CALL_PHONE }
                )
        }
)
public class CallControlPlugin extends Plugin {

    @PluginMethod
    public void placeCall(PluginCall call) {
        String number = call.getString("number");

        if (number == null || number.trim().isEmpty()) {
            call.reject("Phone number is required");
            return;
        }

        if (getPermissionState("callPhone") != PermissionState.GRANTED) {
            requestPermissionForAlias("callPhone", call, "callPhonePermsCallback");
            return;
        }

        performCall(call);
    }

    @PermissionCallback
    private void callPhonePermsCallback(PluginCall call) {
        if (getPermissionState("callPhone") == PermissionState.GRANTED) {
            performCall(call);
        } else {
            call.reject("CALL_PHONE permission not granted");
        }
    }

    private void performCall(PluginCall call) {
        String number = call.getString("number");

        if (number == null || number.trim().isEmpty()) {
            call.reject("Phone number is required");
            return;
        }

        int permission = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.CALL_PHONE
        );

        if (permission != PackageManager.PERMISSION_GRANTED) {
            call.reject("CALL_PHONE permission not granted");
            return;
        }


        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + number));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        getContext().startActivity(intent);
        call.resolve();
    }
}