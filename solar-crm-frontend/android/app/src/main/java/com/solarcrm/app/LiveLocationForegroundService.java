package com.solarcrm.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Native foreground service for continuous staff live-location tracking.
 *
 * Responsibilities:
 * - collect GPS/network location updates;
 * - preserve points in a persistent offline queue;
 * - upload queued points in batches;
 * - send tracking-health heartbeats;
 * - detect when the backend has stopped the session;
 * - recover after Android recreates the service.
 */
public class LiveLocationForegroundService extends Service
        implements LocationListener {

    public static final String ACTION_START =
            "com.solarcrm.app.live_location.START";

    public static final String ACTION_STOP =
            "com.solarcrm.app.live_location.STOP";

    public static final String EXTRA_SESSION_ID =
            "sessionId";

    public static final String EXTRA_AUTH_TOKEN =
            "authToken";

    public static final String EXTRA_API_BASE_URL =
            "apiBaseUrl";

    public static final String EXTRA_DEVICE_ID =
            "deviceId";

    public static final String EXTRA_PLATFORM =
            "platform";

    private static final String TAG =
            "LiveLocationService";

    private static final String PREFS_NAME =
            "solar_crm_live_location_native";

    private static final String PREF_ACTIVE =
            "active";

    private static final String PREF_SESSION_ID =
            "sessionId";

    private static final String PREF_AUTH_TOKEN =
            "authToken";

    private static final String PREF_API_BASE_URL =
            "apiBaseUrl";

    private static final String PREF_DEVICE_ID =
            "deviceId";

    private static final String PREF_PLATFORM =
            "platform";

    private static final String PREF_SEQUENCE_NUMBER =
            "sequenceNumber";

    private static final String PREF_POINT_QUEUE =
            "pointQueue";

    private static final String NOTIFICATION_CHANNEL_ID =
            "solar_crm_live_location";

    private static final String NOTIFICATION_CHANNEL_NAME =
            "Live Location Tracking";

    private static final int NOTIFICATION_ID = 9101;

    private static final long LOCATION_INTERVAL_MS =
            10_000L;

    private static final float LOCATION_MIN_DISTANCE_METRES =
            10.0f;

    private static final long HEARTBEAT_INTERVAL_SECONDS =
            60L;

    private static final int MAX_UPLOAD_BATCH_SIZE = 50;

    private static final int CONNECTION_TIMEOUT_MS =
            20_000;

    private static final int READ_TIMEOUT_MS =
            20_000;

    private SharedPreferences preferences;

    private LocationManager locationManager;

    private ExecutorService networkExecutor;

    private ScheduledExecutorService heartbeatExecutor;

    private PowerManager.WakeLock wakeLock;

    private final Object queueLock = new Object();

    private volatile boolean serviceRunning = false;

    private volatile boolean locationUpdatesRegistered = false;

    private volatile boolean uploadInProgress = false;

    private long sessionId = 0L;

    private String authToken = "";

    private String apiBaseUrl = "";

    private String deviceId = "";

    private String platform = "ANDROID";

    @Override
    public void onCreate() {
        super.onCreate();

        preferences = getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
        );

        locationManager =
                (LocationManager) getSystemService(
                        Context.LOCATION_SERVICE
                );

        networkExecutor =
                Executors.newSingleThreadExecutor();

        heartbeatExecutor =
                Executors.newSingleThreadScheduledExecutor();

        createNotificationChannel();

        acquireWakeLock();
    }

    @Override
    public int onStartCommand(
            @Nullable Intent intent,
            int flags,
            int startId
    ) {
        if (
                intent != null &&
                ACTION_STOP.equals(intent.getAction())
        ) {
            stopTrackingService(true);
            return START_NOT_STICKY;
        }

        if (
                intent != null &&
                ACTION_START.equals(intent.getAction())
        ) {
            readStartDataFromIntent(intent);
            saveServiceConfiguration();
        } else {
            restoreServiceConfiguration();
        }

        if (!hasValidConfiguration()) {
            Log.e(
                    TAG,
                    "Cannot start: native tracking configuration is incomplete"
            );

            stopTrackingService(false);
            return START_NOT_STICKY;
        }

        startAsForeground();

        serviceRunning = true;

        preferences
                .edit()
                .putBoolean(PREF_ACTIVE, true)
                .apply();

        registerLocationUpdates();
        startHeartbeatSchedule();

        networkExecutor.execute(() -> {
            flushPointQueue();
            sendHeartbeat();
        });

        /*
         * START_STICKY asks Android to recreate the service when possible.
         * Configuration and the offline queue are restored from preferences.
         */
        return START_STICKY;
    }

    private void readStartDataFromIntent(
            @NonNull Intent intent
    ) {
        sessionId = intent.getLongExtra(
                EXTRA_SESSION_ID,
                0L
        );

        authToken = safeString(
                intent.getStringExtra(
                        EXTRA_AUTH_TOKEN
                )
        );

        apiBaseUrl = normalizeApiBaseUrl(
                intent.getStringExtra(
                        EXTRA_API_BASE_URL
                )
        );

        deviceId = safeString(
                intent.getStringExtra(
                        EXTRA_DEVICE_ID
                )
        );

        String receivedPlatform =
                safeString(
                        intent.getStringExtra(
                                EXTRA_PLATFORM
                        )
                );

        platform = receivedPlatform.isEmpty()
                ? "ANDROID"
                : receivedPlatform;
    }

    private void saveServiceConfiguration() {
        preferences
                .edit()
                .putLong(
                        PREF_SESSION_ID,
                        sessionId
                )
                .putString(
                        PREF_AUTH_TOKEN,
                        authToken
                )
                .putString(
                        PREF_API_BASE_URL,
                        apiBaseUrl
                )
                .putString(
                        PREF_DEVICE_ID,
                        deviceId
                )
                .putString(
                        PREF_PLATFORM,
                        platform
                )
                .putBoolean(
                        PREF_ACTIVE,
                        true
                )
                .apply();
    }

    private void restoreServiceConfiguration() {
        boolean wasActive =
                preferences.getBoolean(
                        PREF_ACTIVE,
                        false
                );

        if (!wasActive) {
            return;
        }

        sessionId =
                preferences.getLong(
                        PREF_SESSION_ID,
                        0L
                );

        authToken =
                safeString(
                        preferences.getString(
                                PREF_AUTH_TOKEN,
                                ""
                        )
                );

        apiBaseUrl =
                normalizeApiBaseUrl(
                        preferences.getString(
                                PREF_API_BASE_URL,
                                ""
                        )
                );

        deviceId =
                safeString(
                        preferences.getString(
                                PREF_DEVICE_ID,
                                ""
                        )
                );

        platform =
                safeString(
                        preferences.getString(
                                PREF_PLATFORM,
                                "ANDROID"
                        )
                );

        if (platform.isEmpty()) {
            platform = "ANDROID";
        }
    }

    private boolean hasValidConfiguration() {
        return sessionId > 0L &&
                !authToken.isEmpty() &&
                !apiBaseUrl.isEmpty();
    }

    private void startAsForeground() {
        Notification notification =
                buildNotification();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            );
        } else {
            startForeground(
                    NOTIFICATION_ID,
                    notification
            );
        }
    }

    private void createNotificationChannel() {
        if (
                Build.VERSION.SDK_INT <
                        Build.VERSION_CODES.O
        ) {
            return;
        }

        NotificationManager manager =
                (NotificationManager)
                        getSystemService(
                                Context.NOTIFICATION_SERVICE
                        );

        if (manager == null) {
            return;
        }

        NotificationChannel channel =
                new NotificationChannel(
                        NOTIFICATION_CHANNEL_ID,
                        NOTIFICATION_CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_LOW
                );

        channel.setDescription(
                "Shown while official staff live-location sharing is active"
        );

        channel.setShowBadge(false);

        manager.createNotificationChannel(
                channel
        );
    }

    private Notification buildNotification() {
        Intent launchIntent =
                getPackageManager()
                        .getLaunchIntentForPackage(
                                getPackageName()
                        );

        PendingIntent launchPendingIntent = null;

        if (launchIntent != null) {
            launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_SINGLE_TOP |
                            Intent.FLAG_ACTIVITY_CLEAR_TOP
            );

            launchPendingIntent =
                    PendingIntent.getActivity(
                            this,
                            9102,
                            launchIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT |
                                    PendingIntent.FLAG_IMMUTABLE
                    );
        }

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        this,
                        NOTIFICATION_CHANNEL_ID
                )
                        .setSmallIcon(
                                R.mipmap.ic_launcher
                        )
                        .setContentTitle(
                                "Solar CRM live location"
                        )
                        .setContentText(
                                "Your location is being shared for official work tracking"
                        )
                        .setPriority(
                                NotificationCompat.PRIORITY_LOW
                        )
                        .setCategory(
                                NotificationCompat.CATEGORY_SERVICE
                        )
                        .setOngoing(true)
                        .setOnlyAlertOnce(true)
                        .setShowWhen(true)
                        .setWhen(
                                System.currentTimeMillis()
                        );

        if (launchPendingIntent != null) {
            builder.setContentIntent(
                    launchPendingIntent
            );
        }

        return builder.build();
    }

    private void acquireWakeLock() {
        try {
            PowerManager powerManager =
                    (PowerManager)
                            getSystemService(
                                    Context.POWER_SERVICE
                            );

            if (powerManager == null) {
                return;
            }

            wakeLock =
                    powerManager.newWakeLock(
                            PowerManager.PARTIAL_WAKE_LOCK,
                            "SolarCRM:LiveLocation"
                    );

            wakeLock.setReferenceCounted(false);

            wakeLock.acquire();
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "Unable to acquire wake lock",
                    error
            );
        }
    }

    private void releaseWakeLock() {
        if (
                wakeLock != null &&
                wakeLock.isHeld()
        ) {
            try {
                wakeLock.release();
            } catch (Exception error) {
                Log.w(
                        TAG,
                        "Unable to release wake lock",
                        error
                );
            }
        }

        wakeLock = null;
    }

    private boolean hasLocationPermission() {
        return ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
                ActivityCompat.checkSelfPermission(
                        this,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED;
    }

    private void registerLocationUpdates() {
        if (
                locationUpdatesRegistered ||
                locationManager == null
        ) {
            return;
        }

        if (!hasLocationPermission()) {
            Log.e(
                    TAG,
                    "Location permission is missing"
            );

            sendHeartbeatFailure(
                    "PERMISSION_REMOVED",
                    "Location permission is not granted"
            );

            return;
        }

        boolean registeredAnyProvider = false;

        try {
            if (
                    locationManager.isProviderEnabled(
                            LocationManager.GPS_PROVIDER
                    )
            ) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        LOCATION_INTERVAL_MS,
                        LOCATION_MIN_DISTANCE_METRES,
                        this
                );

                registeredAnyProvider = true;
            }
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "GPS provider registration failed",
                    error
            );
        }

        try {
            if (
                    locationManager.isProviderEnabled(
                            LocationManager.NETWORK_PROVIDER
                    )
            ) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        LOCATION_INTERVAL_MS,
                        LOCATION_MIN_DISTANCE_METRES,
                        this
                );

                registeredAnyProvider = true;
            }
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "Network provider registration failed",
                    error
            );
        }

        locationUpdatesRegistered =
                registeredAnyProvider;

        if (!registeredAnyProvider) {
            sendHeartbeatFailure(
                    "GPS_DISABLED",
                    "No device location provider is enabled"
            );
        }
    }

    private void unregisterLocationUpdates() {
        if (
                locationManager == null ||
                !locationUpdatesRegistered
        ) {
            return;
        }

        try {
            locationManager.removeUpdates(this);
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "Unable to remove location updates",
                    error
            );
        }

        locationUpdatesRegistered = false;
    }

    private synchronized long nextSequenceNumber() {
        long current =
                preferences.getLong(
                        PREF_SEQUENCE_NUMBER,
                        0L
                );

        long next = current + 1L;

        preferences
                .edit()
                .putLong(
                        PREF_SEQUENCE_NUMBER,
                        next
                )
                .apply();

        return next;
    }

    @Override
    public void onLocationChanged(
            @NonNull Location location
    ) {
        if (!serviceRunning) {
            return;
        }

        try {
            JSONObject point =
                    createPointFromLocation(
                            location
                    );

            appendPointToQueue(point);

            networkExecutor.execute(
                    this::flushPointQueue
            );
        } catch (Exception error) {
            Log.e(
                    TAG,
                    "Unable to queue location point",
                    error
            );
        }
    }

    private JSONObject createPointFromLocation(
            @NonNull Location location
    ) throws JSONException {
        JSONObject point = new JSONObject();

        point.put(
                "sequenceNumber",
                nextSequenceNumber()
        );

        point.put(
                "latitude",
                location.getLatitude()
        );

        point.put(
                "longitude",
                location.getLongitude()
        );

        if (location.hasAccuracy()) {
            point.put(
                    "accuracyMetres",
                    location.getAccuracy()
            );
        }

        if (location.hasAltitude()) {
            point.put(
                    "altitudeMetres",
                    location.getAltitude()
            );
        }

        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.O &&
                location.hasVerticalAccuracy()
        ) {
            point.put(
                    "altitudeAccuracyMetres",
                    location.getVerticalAccuracyMeters()
            );
        }

        if (location.hasSpeed()) {
            point.put(
                    "speedMetresPerSecond",
                    location.getSpeed()
            );
        }

        if (location.hasBearing()) {
            point.put(
                    "headingDegrees",
                    location.getBearing()
            );
        }

        int batteryPercentage =
                getBatteryPercentage();

        if (batteryPercentage >= 0) {
            point.put(
                    "batteryPercentage",
                    batteryPercentage
            );
        }

        point.put(
                "isCharging",
                isDeviceCharging()
        );

        point.put(
                "isMockLocation",
                isMockLocation(location)
        );

        point.put(
                "wasRecordedOffline",
                !isNetworkOnline()
        );

        point.put(
                "recordedAt",
                toIsoUtc(
                        location.getTime() > 0L
                                ? location.getTime()
                                : System.currentTimeMillis()
                )
        );

        return point;
    }

    private boolean isMockLocation(
            @NonNull Location location
    ) {
        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.S
        ) {
            return location.isMock();
        }

        return location.isFromMockProvider();
    }

    private void appendPointToQueue(
            @NonNull JSONObject point
    ) {
        synchronized (queueLock) {
            JSONArray queue =
                    readPointQueueLocked();

            queue.put(point);

            /*
             * Prevent unlimited storage growth in extreme offline cases.
             * This retains the newest 10,000 points.
             */
            if (queue.length() > 10_000) {
                JSONArray trimmed =
                        new JSONArray();

                int start =
                        queue.length() - 10_000;

                for (
                        int index = start;
                        index < queue.length();
                        index++
                ) {
                    trimmed.put(
                            queue.opt(index)
                    );
                }

                queue = trimmed;
            }

            writePointQueueLocked(queue);
        }
    }

    private JSONArray readPointQueueLocked() {
        String raw =
                preferences.getString(
                        PREF_POINT_QUEUE,
                        "[]"
                );

        try {
            return new JSONArray(
                    raw == null ? "[]" : raw
            );
        } catch (JSONException error) {
            Log.e(
                    TAG,
                    "Invalid stored point queue; resetting it",
                    error
            );

            return new JSONArray();
        }
    }

    private void writePointQueueLocked(
            @NonNull JSONArray queue
    ) {
        preferences
                .edit()
                .putString(
                        PREF_POINT_QUEUE,
                        queue.toString()
                )
                .apply();
    }

    private int getPendingPointCount() {
        synchronized (queueLock) {
            return readPointQueueLocked().length();
        }
    }

    private JSONArray takePointBatch() {
        synchronized (queueLock) {
            JSONArray queue =
                    readPointQueueLocked();

            JSONArray batch =
                    new JSONArray();

            int count = Math.min(
                    queue.length(),
                    MAX_UPLOAD_BATCH_SIZE
            );

            for (
                    int index = 0;
                    index < count;
                    index++
            ) {
                batch.put(
                        queue.opt(index)
                );
            }

            return batch;
        }
    }

    private void removeUploadedPoints(
            int uploadedCount
    ) {
        if (uploadedCount <= 0) {
            return;
        }

        synchronized (queueLock) {
            JSONArray current =
                    readPointQueueLocked();

            JSONArray remaining =
                    new JSONArray();

            for (
                    int index = uploadedCount;
                    index < current.length();
                    index++
            ) {
                remaining.put(
                        current.opt(index)
                );
            }

            writePointQueueLocked(remaining);
        }
    }

    private void flushPointQueue() {
        if (
                uploadInProgress ||
                !serviceRunning ||
                !isNetworkOnline()
        ) {
            return;
        }

        uploadInProgress = true;

        try {
            while (
                    serviceRunning &&
                    isNetworkOnline()
            ) {
                JSONArray points =
                        takePointBatch();

                if (points.length() == 0) {
                    break;
                }

                JSONObject payload =
                        new JSONObject();

                payload.put(
                        "platform",
                        platform
                );

                if (!deviceId.isEmpty()) {
                    payload.put(
                            "deviceId",
                            deviceId
                    );
                }

                payload.put(
                        "points",
                        points
                );

                HttpResult result =
                        postJson(
                                "/staff-location/me/session/" +
                                        sessionId +
                                        "/points",
                                payload
                        );

                if (
                        result.statusCode >= 200 &&
                        result.statusCode < 300
                ) {
                    removeUploadedPoints(
                            points.length()
                    );
                } else {
                    Log.w(
                            TAG,
                            "Point upload failed with HTTP " +
                                    result.statusCode
                    );

                    break;
                }
            }
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "Point queue upload failed",
                    error
            );
        } finally {
            uploadInProgress = false;
        }
    }

    private void startHeartbeatSchedule() {
        if (
                heartbeatExecutor == null ||
                heartbeatExecutor.isShutdown()
        ) {
            heartbeatExecutor =
                    Executors.newSingleThreadScheduledExecutor();
        }

        heartbeatExecutor.scheduleWithFixedDelay(
                () -> {
                    if (!serviceRunning) {
                        return;
                    }

                    flushPointQueue();
                    sendHeartbeat();
                },
                HEARTBEAT_INTERVAL_SECONDS,
                HEARTBEAT_INTERVAL_SECONDS,
                TimeUnit.SECONDS
        );
    }

    private void sendHeartbeat() {
        sendHeartbeatFailure(
                null,
                null
        );
    }

    private void sendHeartbeatFailure(
            @Nullable String failureCode,
            @Nullable String failureMessage
    ) {
        if (
                !serviceRunning ||
                !hasValidConfiguration()
        ) {
            return;
        }

        try {
            JSONObject payload =
                    new JSONObject();

            payload.put(
                    "platform",
                    platform
            );

            payload.put(
                    "permissionStatus",
                    hasLocationPermission()
                            ? "GRANTED"
                            : "DENIED"
            );

            payload.put(
                    "gpsStatus",
                    isAnyLocationProviderEnabled()
                            ? "ENABLED"
                            : "DISABLED"
            );

            payload.put(
                    "networkStatus",
                    isNetworkOnline()
                            ? "ONLINE"
                            : "OFFLINE"
            );

            payload.put(
                    "backgroundRestricted",
                    false
            );

            payload.put(
                    "appInBackground",
                    true
            );

            if (!deviceId.isEmpty()) {
                payload.put(
                        "deviceId",
                        deviceId
                );
            }

            int batteryPercentage =
                    getBatteryPercentage();

            if (batteryPercentage >= 0) {
                payload.put(
                        "batteryPercentage",
                        batteryPercentage
                );
            }

            payload.put(
                    "isCharging",
                    isDeviceCharging()
            );

            payload.put(
                    "pendingOfflinePoints",
                    getPendingPointCount()
            );

            if (
                    failureCode != null &&
                    !failureCode.trim().isEmpty()
            ) {
                payload.put(
                        "failureCode",
                        failureCode
                );
            }

            if (
                    failureMessage != null &&
                    !failureMessage.trim().isEmpty()
            ) {
                payload.put(
                        "failureMessage",
                        failureMessage
                );
            }

            HttpResult result =
                    postJson(
                            "/staff-location/me/session/" +
                                    sessionId +
                                    "/heartbeat",
                            payload
                    );

            if (
                    result.statusCode >= 200 &&
                    result.statusCode < 300
            ) {
                handleHeartbeatResponse(
                        result.body
                );

                if (
                        hasLocationPermission() &&
                        isAnyLocationProviderEnabled() &&
                        !locationUpdatesRegistered
                ) {
                    registerLocationUpdates();
                }
            }
        } catch (Exception error) {
            Log.w(
                    TAG,
                    "Heartbeat failed",
                    error
            );
        }
    }

    private void handleHeartbeatResponse(
            @Nullable String body
    ) {
        if (
                body == null ||
                body.trim().isEmpty()
        ) {
            return;
        }

        try {
            JSONObject session =
                    new JSONObject(body);

            boolean active =
                    session.optBoolean(
                            "isActive",
                            true
                    );

            String status =
                    session.optString(
                            "status",
                            ""
                    );

            if (
                    !active ||
                    isTerminalStatus(status)
            ) {
                Log.i(
                        TAG,
                        "Backend session is no longer active"
                );

                stopTrackingService(true);
            }
        } catch (JSONException error) {
            Log.w(
                    TAG,
                    "Unable to read heartbeat response",
                    error
            );
        }
    }

    private boolean isTerminalStatus(
            @Nullable String status
    ) {
        if (status == null) {
            return false;
        }

        switch (
                status.trim()
                        .toUpperCase(Locale.US)
        ) {
            case "APP_STOPPED":
            case "STOPPED_BY_OWNER":
            case "STOPPED_BY_STAFF":
            case "SESSION_EXPIRED":
            case "COMPLETED":
                return true;

            default:
                return false;
        }
    }

    private HttpResult postJson(
            @NonNull String path,
            @NonNull JSONObject payload
    ) throws Exception {
        HttpURLConnection connection = null;

        try {
            URL url =
                    new URL(
                            apiBaseUrl + path
                    );

            connection =
                    (HttpURLConnection)
                            url.openConnection();

            connection.setRequestMethod(
                    "POST"
            );

            connection.setConnectTimeout(
                    CONNECTION_TIMEOUT_MS
            );

            connection.setReadTimeout(
                    READ_TIMEOUT_MS
            );

            connection.setDoOutput(true);

            connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
            );

            connection.setRequestProperty(
                    "Accept",
                    "application/json"
            );

            connection.setRequestProperty(
                    "Authorization",
                    "Bearer " + authToken
            );

            byte[] body =
                    payload
                            .toString()
                            .getBytes(
                                    StandardCharsets.UTF_8
                            );

            connection.setFixedLengthStreamingMode(
                    body.length
            );

            try (
                    OutputStream outputStream =
                            connection.getOutputStream()
            ) {
                outputStream.write(body);
                outputStream.flush();
            }

            int responseCode =
                    connection.getResponseCode();

            InputStream responseStream =
                    responseCode >= 200 &&
                            responseCode < 400
                            ? connection.getInputStream()
                            : connection.getErrorStream();

            String responseBody =
                    readStream(responseStream);

            return new HttpResult(
                    responseCode,
                    responseBody
            );
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String readStream(
            @Nullable InputStream stream
    ) throws Exception {
        if (stream == null) {
            return "";
        }

        StringBuilder builder =
                new StringBuilder();

        try (
                BufferedReader reader =
                        new BufferedReader(
                                new InputStreamReader(
                                        stream,
                                        StandardCharsets.UTF_8
                                )
                        )
        ) {
            String line;

            while (
                    (line = reader.readLine()) != null
            ) {
                builder.append(line);
            }
        }

        return builder.toString();
    }

    private boolean isNetworkOnline() {
        ConnectivityManager manager =
                (ConnectivityManager)
                        getSystemService(
                                Context.CONNECTIVITY_SERVICE
                        );

        if (manager == null) {
            return false;
        }

        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.M
        ) {
            Network network =
                    manager.getActiveNetwork();

            if (network == null) {
                return false;
            }

            NetworkCapabilities capabilities =
                    manager.getNetworkCapabilities(
                            network
                    );

            return capabilities != null &&
                    (
                            capabilities.hasTransport(
                                    NetworkCapabilities.TRANSPORT_WIFI
                            ) ||
                            capabilities.hasTransport(
                                    NetworkCapabilities.TRANSPORT_CELLULAR
                            ) ||
                            capabilities.hasTransport(
                                    NetworkCapabilities.TRANSPORT_ETHERNET
                            ) ||
                            capabilities.hasTransport(
                                    NetworkCapabilities.TRANSPORT_VPN
                            )
                    );
        }

        return false;
    }

    private boolean isAnyLocationProviderEnabled() {
        if (locationManager == null) {
            return false;
        }

        try {
            return locationManager.isProviderEnabled(
                    LocationManager.GPS_PROVIDER
            ) ||
                    locationManager.isProviderEnabled(
                            LocationManager.NETWORK_PROVIDER
                    );
        } catch (Exception error) {
            return false;
        }
    }

    private int getBatteryPercentage() {
        BatteryManager batteryManager =
                (BatteryManager)
                        getSystemService(
                                Context.BATTERY_SERVICE
                        );

        if (batteryManager == null) {
            return -1;
        }

        return batteryManager.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_CAPACITY
        );
    }

    private boolean isDeviceCharging() {
        BatteryManager batteryManager =
                (BatteryManager)
                        getSystemService(
                                Context.BATTERY_SERVICE
                        );

        if (batteryManager == null) {
            return false;
        }

        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.M
        ) {
            return batteryManager.isCharging();
        }

        return false;
    }

    private String toIsoUtc(long timestamp) {
        java.text.SimpleDateFormat formatter =
                new java.text.SimpleDateFormat(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                        Locale.US
                );

        formatter.setTimeZone(
                java.util.TimeZone.getTimeZone(
                        "UTC"
                )
        );

        return formatter.format(
                new java.util.Date(timestamp)
        );
    }

    private String normalizeApiBaseUrl(
            @Nullable String value
    ) {
        String normalized =
                safeString(value).trim();

        while (
                normalized.endsWith("/")
        ) {
            normalized =
                    normalized.substring(
                            0,
                            normalized.length() - 1
                    );
        }

        return normalized;
    }

    private String safeString(
            @Nullable String value
    ) {
        return value == null ? "" : value;
    }

    private void stopTrackingService(
            boolean clearConfiguration
    ) {
        serviceRunning = false;

        unregisterLocationUpdates();

        if (
                heartbeatExecutor != null &&
                !heartbeatExecutor.isShutdown()
        ) {
            heartbeatExecutor.shutdownNow();
        }

        if (
                clearConfiguration &&
                preferences != null
        ) {
            /*
             * Point queue is cleared only after the backend has stopped the
             * session or JavaScript explicitly stops native tracking.
             */
            preferences
                    .edit()
                    .putBoolean(
                            PREF_ACTIVE,
                            false
                    )
                    .remove(
                            PREF_SESSION_ID
                    )
                    .remove(
                            PREF_AUTH_TOKEN
                    )
                    .remove(
                            PREF_API_BASE_URL
                    )
                    .remove(
                            PREF_DEVICE_ID
                    )
                    .remove(
                            PREF_PLATFORM
                    )
                    .remove(
                            PREF_SEQUENCE_NUMBER
                    )
                    .remove(
                            PREF_POINT_QUEUE
                    )
                    .apply();
        }

        releaseWakeLock();

        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onProviderEnabled(
            @NonNull String provider
    ) {
        if (
                !locationUpdatesRegistered &&
                hasLocationPermission()
        ) {
            registerLocationUpdates();
        }
    }

    @Override
    public void onProviderDisabled(
            @NonNull String provider
    ) {
        if (!isAnyLocationProviderEnabled()) {
            locationUpdatesRegistered = false;

            sendHeartbeatFailure(
                    "GPS_DISABLED",
                    "Device location service is disabled"
            );
        }
    }

    @Override
    public void onStatusChanged(
            String provider,
            int status,
            Bundle extras
    ) {
        // Retained for Android versions where this callback is used.
    }

    @Override
    public void onTaskRemoved(
            Intent rootIntent
    ) {
        /*
         * Do not stop tracking merely because the user removes the WebView
         * task from recent apps. The foreground service remains visible and
         * active until staff, OWNER, backend expiry, or Android stops it.
         */
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        serviceRunning = false;

        unregisterLocationUpdates();

        if (
                heartbeatExecutor != null &&
                !heartbeatExecutor.isShutdown()
        ) {
            heartbeatExecutor.shutdownNow();
        }

        if (
                networkExecutor != null &&
                !networkExecutor.isShutdown()
        ) {
            networkExecutor.shutdownNow();
        }

        releaseWakeLock();

        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private static final class HttpResult {
        private final int statusCode;
        private final String body;

        private HttpResult(
                int statusCode,
                String body
        ) {
            this.statusCode = statusCode;
            this.body = body == null ? "" : body;
        }
    }
}