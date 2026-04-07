package com.BrightTomorrow.TaskWise

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider
import java.text.SimpleDateFormat
import java.util.*
import android.os.Bundle

class ScheduleWidgetProvider : HomeWidgetProvider() {

    companion object {
        const val ACTION_REFRESH = "com.BrightTomorrow.TaskWise.SCHEDULE_REFRESH"
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        val maxHeight = newOptions.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
        if (maxHeight > 0) {
            prefs.edit().putInt("widget_height_$appWidgetId", maxHeight).apply()
        }
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_schedule_list)
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_REFRESH) {
            Log.d("ScheduleWidget", "Manual refresh triggered")
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetIds = appWidgetManager.getAppWidgetIds(intent.component ?: android.content.ComponentName(context, ScheduleWidgetProvider::class.java))
            appWidgetManager.notifyAppWidgetViewDataChanged(widgetIds, R.id.widget_schedule_list)
            
            // Also call onUpdate to refresh the date and re-bind intents
            val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
            onUpdate(context, appWidgetManager, widgetIds, prefs)
        }
        super.onReceive(context, intent)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray, widgetData: SharedPreferences) {
        for (appWidgetId in appWidgetIds) {
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val maxHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
            if (maxHeight > 0) {
                widgetData.edit().putInt("widget_height_$appWidgetId", maxHeight).apply()
            }
            
            val views = RemoteViews(context.packageName, R.layout.schedule_widget_layout).apply {
                
                // Update Date
                val sdf = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
                setTextViewText(R.id.widget_schedule_date, sdf.format(Date()))

                val refreshIntent = Intent(context, ScheduleWidgetProvider::class.java).apply { action = ACTION_REFRESH }
                setOnClickPendingIntent(R.id.widget_schedule_refresh, PendingIntent.getBroadcast(context, 0, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

                // Setup ListView (Timeline)
                val intent = Intent(context, ScheduleWidgetService::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                    // Distinct intent to force factory recreation
                    data = Uri.parse("schedule_widget://force_update/$appWidgetId/${System.currentTimeMillis()}")
                }
                setRemoteAdapter(R.id.widget_schedule_list, intent)
                setEmptyView(R.id.widget_schedule_list, R.id.widget_schedule_empty)

                // Task Interaction Template (Opening the app)
                val clickIntent = Intent(context, TaskWidgetProvider::class.java).apply { 
                    action = TaskWidgetProvider.ACTION_WIDGET_CLICK 
                }
                
                var flags = PendingIntent.FLAG_UPDATE_CURRENT
                if (android.os.Build.VERSION.SDK_INT >= 31) {
                    flags = flags or PendingIntent.FLAG_MUTABLE
                } else {
                    flags = flags or PendingIntent.FLAG_MUTABLE
                }
                
                val clickPendingIntent = PendingIntent.getBroadcast(
                    context,
                    10,
                    clickIntent,
                    flags
                )
                setPendingIntentTemplate(R.id.widget_schedule_list, clickPendingIntent)
            }
            appWidgetManager.updateAppWidget(appWidgetId, views)
            // Force notify data changed to ensure "Now" is recalculated
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_schedule_list)
        }
    }
}
