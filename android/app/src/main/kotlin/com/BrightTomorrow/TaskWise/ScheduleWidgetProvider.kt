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

class ScheduleWidgetProvider : HomeWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray, widgetData: SharedPreferences) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.schedule_widget_layout).apply {
                
                // Update Date
                val sdf = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
                setTextViewText(R.id.widget_schedule_date, sdf.format(Date()))

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
