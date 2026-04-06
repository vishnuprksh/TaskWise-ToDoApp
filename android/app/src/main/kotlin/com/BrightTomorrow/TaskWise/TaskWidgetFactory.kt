package com.BrightTomorrow.TaskWise

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject

class TaskWidgetFactory(private val context: Context, intent: Intent) : RemoteViewsService.RemoteViewsFactory {

    private var tasks: List<JSONObject> = listOf()
    private val widgetData: SharedPreferences = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)

    override fun onCreate() {
        updateData()
    }

    override fun onDataSetChanged() {
        updateData()
    }

    private fun updateData() {
        val tasksJson = widgetData.getString("tasks_json", "[]")
        val selectedProjectId = widgetData.getString("selected_project_id", null)
        
        val allTasks = JSONArray(tasksJson)
        val filteredTasks = mutableListOf<JSONObject>()
        
        for (i in 0 until allTasks.length()) {
            val task = allTasks.getJSONObject(i)
            // Filter by project if one is selected (unless it's 'all')
            if (selectedProjectId == null || selectedProjectId == "all" || task.optString("projectId") == selectedProjectId) {
                filteredTasks.add(task)
            }
        }
        
        // Sort: Incomplete first, then by priority (simplified for now)
        tasks = filteredTasks.sortedWith(compareBy({ it.optBoolean("completed") }, { it.optString("priority") }))
    }

    override fun onDestroy() {
        tasks = listOf()
    }

    override fun getCount(): Int = tasks.size

    override fun getViewAt(position: Int): RemoteViews {
        if (position >= tasks.size) return RemoteViews(context.packageName, R.layout.widget_task_item)

        val task = tasks[position]
        val views = RemoteViews(context.packageName, R.layout.widget_task_item)
        
        val text = task.optString("text", "")
        val completed = task.optBoolean("completed", false)
        val taskId = task.optString("id", "")

        views.setTextViewText(R.id.widget_task_text, text)
        views.setImageViewResource(R.id.widget_task_icon, if (completed) R.drawable.ic_check_circle else R.drawable.ic_circle)

        // Set Fill-in Intent for starting Pomodoro
        val fillInIntent = Intent().apply {
            putExtra("taskId", taskId)
            putExtra("taskText", text)
            putExtra("action", "START_POMODORO")
        }
        views.setOnClickFillInIntent(R.id.widget_task_pomodoro, fillInIntent)
        
        // Also allow clicking the text to open the app (using a different action)
        val openIntent = Intent().apply {
            putExtra("taskId", taskId)
            putExtra("action", "OPEN_TASK")
        }
        views.setOnClickFillInIntent(R.id.widget_task_text, openIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
