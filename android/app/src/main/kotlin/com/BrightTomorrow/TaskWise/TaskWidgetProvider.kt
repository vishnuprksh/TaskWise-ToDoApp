package com.BrightTomorrow.TaskWise

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider
import java.util.Locale

class TaskWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray, widgetData: SharedPreferences) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout).apply {
                // Update Timer
                val timerSeconds = widgetData.getInt("timer_seconds", 1500)
                val timerActive = widgetData.getBoolean("timer_active", false)
                val timerTask = widgetData.getString("timer_task", "No task active")

                val minutes = timerSeconds / 60
                val seconds = timerSeconds % 60
                setTextViewText(R.id.widget_timer_value, String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds))
                setTextViewText(R.id.widget_timer_status, if (timerActive) "FOCUSING" else "PAUSED")
                setImageViewResource(R.id.widget_timer_toggle, if (timerActive) R.drawable.ic_pause else R.drawable.ic_play)

                // Update Task List (Simplified for now - showing 3 task items)
                // In a real implementation, we would use a ListView and RemoteViewsService
                // But for a quick design mockup implementation, we can populate a couple of text views if they exist.
                // For now, let's just update the UI labels.
            }
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
