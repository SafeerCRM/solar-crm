package com.solarcrm.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Capacitor bridge used by the Next.js application to control the native
 * foreground location service.
 */
@CapacitorPlugin(
        name = "LiveLocationNative",
        permissions = {
                @Permission(
                        alias = "location",
                        strings = {
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        }
                ),
                @Permission(
                        alias = "notifications",
                        strings = {
                                Manifest.permission.POST_NOTIFICATIONS
                        }
                )
        }
)
public class LiveLocationPlugin extends Plugin {

    private static final String PREFS_NAME =
            "solar_crm_live_location_native";

    private static final String PREF_ACTIVE =
            "active";

    private static final String PREF_SESSION_ID =
            "sessionId";

    private PluginCall pendingPermissionCall;

    @PluginMethod
    public void startTracking(PluginCall call) {
        long sessionId =
                call.getLong(
                        "sessionId",
                        0L
                );

        String authToken =
                call.getString(
                        "authToken",
                        ""
                );

        String apiBaseUrl =
                call.getString(
                        "apiBaseUrl",
                        ""
                );

        String deviceId =
                call.getString(
                        "deviceId",
                        ""
                );

        String platform =
                call.getString(
                        "platform",
                        "ANDROID"
                );

        if (sessionId < 1L) {
            call.reject(
                    "A valid sessionId is required"
            );

            return;
        }

        if (
                authToken == null ||
                authToken.trim().isEmpty()
        ) {
            call.reject(
                    "Authentication token is required"
            );

            return;
        }

        if (
                apiBaseUrl == null ||
                apiBaseUrl.trim().isEmpty()
        ) {
            call.reject(
                    "API base URL is required"
            );

            return;
        }

        if (!hasLocationPermission()) {
            call.reject(
                    "Location permission is not granted",
                    "LOCATION_PERMISSION_REQUIRED"
            );

            return;
        }

        Intent serviceIntent =
                new Intent(
                        getContext(),
                        LiveLocationForegroundService.class
                );

        serviceIntent.setAction(
                LiveLocationForegroundService.ACTION_START
        );

        serviceIntent.putExtra(
                LiveLocationForegroundService.EXTRA_SESSION_ID,
                sessionId
        );

        serviceIntent.putExtra(
                LiveLocationForegroundService.EXTRA_AUTH_TOKEN,
                authToken.trim()
        );

        serviceIntent.putExtra(
                LiveLocationForegroundService.EXTRA_API_BASE_URL,
                apiBaseUrl.trim()
        );

        serviceIntent.putExtra(
                LiveLocationForegroundService.EXTRA_DEVICE_ID,
                deviceId == null ? "" : deviceId
        );

        serviceIntent.putExtra(
                LiveLocationForegroundService.EXTRA_PLATFORM,
                platform == null ? "ANDROID" : platform
        );

        try {
            ContextCompat.startForegroundService(
                    getContext(),
                    serviceIntent
            );

            JSObject response =
                    new JSObject();

            response.put(
                    "running",
                    true
            );

            response.put(
                    "sessionId",
                    sessionId
            );

            response.put(
                    "notificationPermission",
                    getNotificationPermissionValue()
            );

            call.resolve(response);
        } catch (Exception error) {
            call.reject(
                    "Unable to start native live-location tracking",
                    error
            );
        }
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Intent serviceIntent =
                new Intent(
                        getContext(),
                        LiveLocationForegroundService.class
                );

        serviceIntent.setAction(
                LiveLocationForegroundService.ACTION_STOP
        );

        try {
            getContext().startService(
                    serviceIntent
            );
        } catch (Exception ignored) {
            getContext().stopService(
                    new Intent(
                            getContext(),
                            LiveLocationForegroundService.class
                    )
            );
        }

        SharedPreferences preferences =
                getContext().getSharedPreferences(
                        PREFS_NAME,
                        Context.MODE_PRIVATE
                );

        preferences
                .edit()
                .putBoolean(
                        PREF_ACTIVE,
                        false
                )
                .remove(
                        PREF_SESSION_ID
                )
                .apply();

        JSObject response =
                new JSObject();

        response.put(
                "running",
                false
        );

        call.resolve(response);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        SharedPreferences preferences =
                getContext().getSharedPreferences(
                        PREFS_NAME,
                        Context.MODE_PRIVATE
                );

        boolean running =
                preferences.getBoolean(
                        PREF_ACTIVE,
                        false
                );

        long sessionId =
                preferences.getLong(
                        PREF_SESSION_ID,
                        0L
                );

        JSObject response =
                new JSObject();

        response.put(
                "running",
                running
        );

        if (sessionId > 0L) {
            response.put(
                    "sessionId",
                    sessionId
            );
        }

        response.put(
                "locationPermission",
                hasLocationPermission()
                        ? "GRANTED"
                        : "DENIED"
        );

        response.put(
                "notificationPermission",
                getNotificationPermissionValue()
        );

        call.resolve(response);
    }

    @PluginMethod
    public void requestNativePermissions(
            PluginCall call
    ) {
        if (
                getPermissionState("location") !=
                        PermissionState.GRANTED
        ) {
            pendingPermissionCall = call;

            requestPermissionForAlias(
                    "location",
                    call,
                    "locationPermissionCallback"
            );

            return;
        }

        requestNotificationPermissionIfNeeded(
                call
        );
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void locationPermissionCallback(
            PluginCall call
    ) {
        if (
                getPermissionState("location") !=
                        PermissionState.GRANTED
        ) {
            pendingPermissionCall = null;

            JSObject response =
                    buildPermissionResponse();

            call.resolve(response);
            return;
        }

        requestNotificationPermissionIfNeeded(
                call
        );
    }

    private void requestNotificationPermissionIfNeeded(
            PluginCall call
    ) {
        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.TIRAMISU &&
                getPermissionState("notifications") !=
                        PermissionState.GRANTED
        ) {
            pendingPermissionCall = call;

            requestPermissionForAlias(
                    "notifications",
                    call,
                    "notificationPermissionCallback"
            );

            return;
        }

        pendingPermissionCall = null;

        call.resolve(
                buildPermissionResponse()
        );
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationPermissionCallback(
            PluginCall call
    ) {
        pendingPermissionCall = null;

        call.resolve(
                buildPermissionResponse()
        );
    }

    private JSObject buildPermissionResponse() {
        JSObject response =
                new JSObject();

        response.put(
                "locationPermission",
                hasLocationPermission()
                        ? "GRANTED"
                        : "DENIED"
        );

        response.put(
                "notificationPermission",
                getNotificationPermissionValue()
        );

        return response;
    }

    private boolean hasLocationPermission() {
        Context context = getContext();

        return ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED;
    }

    private String getNotificationPermissionValue() {
        if (
                Build.VERSION.SDK_INT <
                        Build.VERSION_CODES.TIRAMISU
        ) {
            return "GRANTED";
        }

        return ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
                ? "GRANTED"
                : "DENIED";
    }
}