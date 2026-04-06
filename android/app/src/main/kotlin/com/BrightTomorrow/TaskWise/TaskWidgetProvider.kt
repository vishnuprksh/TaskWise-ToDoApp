package com.BrightTomorrow.TaskWise

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetBackgroundIntent
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider
import org.json.JSONArray
import java.util.Locale

class TaskWidgetProvider : HomeWidgetProvider() {
    
    companion object {
        const val ACTION_NEXT_PROJECT = "com.BrightTomorrow.TaskWise.NEXT_PROJECT"
        const val ACTION_PREV_PROJECT = "com.BrightTomorrow.TaskWise.PREV_PROJECT"
        const val ACTION_START_POMODORO = "com.BrightTomorrow.TaskWise.START_POMODORO"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_NEXT_PROJECT || intent.action == ACTION_PREV_PROJECT) {
            val widgetData = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
            val projectsJson = widgetData.getString("projects_json", "[]")
            val projects = JSONArray(projectsJson)
            
            if (projects.length() > 0) {
                val currentId = widgetData.getString("selected_project_id", "all")
                var currentIndex = -1
                for (i in 0 until projects.length()) {
                    if (projects.getJSONObject(i).optString("id") == currentId) {
                        currentIndex = i
                        break
                    }
                }
                
                val nextIndex = if (intent.action == ACTION_NEXT_PROJECT) {
                    (currentIndex + 1) % projects.length()
                } else {
                    (currentIndex - 1 + projects.length()) % projects.length()
                }
                
                val nextId = projects.getJSONObject(nextIndex).optString("id", "all")
                widgetData.edit().putString("selected_project_id", nextId).apply()
                
                // Trigger update
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetIds = appWidgetManager.getAppWidgetIds(intent.component ?: android.content.ComponentName(context, TaskWidgetProvider::class.java))
                appWidgetManager.notifyAppWidgetViewDataChanged(widgetIds, R.id.widget_tasks_list)
                
                // Update the provider (to refresh project name)
                this.onUpdate(context, appWidgetManager, widgetIds, widgetData)
            }
        } else if (intent.action == ACTION_START_POMODORO) {
            val taskId = intent.getStringExtra("taskId") ?: ""
            Log.d("TaskWidget", "Starting Pomodoro for taskId: $taskId")
            
            // Forward to Flutter via HomeWidgetBackgroundIntent
            val backgroundIntent = HomeWidgetBackgroundIntent.getBroadcast(
                context, 
                Uri.parse("homeWidget://startPomodoro?taskId=$taskId")
            )
            backgroundIntent.send()
        }
        super.onReceive(context, intent)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray, widgetData: SharedPreferences) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout).apply {
                // Update Timer
                val timerSeconds = widgetData.getInt("timer_seconds", 1500)
                val timerActive = widgetData.getBoolean("timer_active", false)
                val minutes = timerSeconds / 60
                val seconds = timerSeconds % 60
                setTextViewText(R.id.widget_timer_value, String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds))
                setTextViewText(R.id.widget_timer_status, if (timerActive) "FOCUSING" else "PAUSED")
                setImageViewResource(R.id.widget_timer_toggle, if (timerActive) R.drawable.ic_pause else R.drawable.ic_play)

                // Update Project Select Status
                val currentProjectId = widgetData.getString("selected_project_id", "all")
                val projectsJson = widgetData.getString("projects_json", "[]")
                val projectsArray = JSONArray(projectsJson)
                var projectName = "All Tasks"
                for (i in 0 until projectsArray.length()) {
                  val p = projectsArray.getJSONObject(i)
                  if (p.optString("id") == currentProjectId) {
                    projectName = p.optString("name", "All Tasks")
                    break
                  }
                }
                setTextViewText(R.id.widget_project_name, projectName)

                // Setup Prev/Next Project Buttons
                val nextIntent = Intent(context, TaskWidgetProvider::class.java).apply { action = ACTION_NEXT_PROJECT }
                val prevIntent = Intent(context, TaskWidgetProvider::class.java).apply { action = ACTION_PREV_PROJECT }
                setOnClickPendingIntent(R.id.widget_next_project, PendingIntent.getBroadcast(context, 0, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
                setOnClickPendingIntent(R.id.widget_prev_project, PendingIntent.getBroadcast(context, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

                // Setup ListView
                val intent = Intent(context, TaskWidgetService::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                    data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
                }
                setRemoteAdapter(R.id.widget_tasks_list, intent)
                setEmptyView(R.id.widget_tasks_list, R.id.widget_empty_view)

                // Tasks Interaction Template
                val clickIntent = Intent(context, TaskWidgetProvider::class.java).apply { action = ACTION_START_POMODORO }
                val clickPendingIntent = PendingIntent.getBroadcast(context, 2, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE)
                setPendingIntentTemplate(R.id.widget_tasks_list, clickPendingIntent)
            }
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
