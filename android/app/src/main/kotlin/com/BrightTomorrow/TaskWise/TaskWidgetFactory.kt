package com.BrightTomorrow.TaskWise

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

class TaskWidgetFactory(private val context: Context, intent: Intent) : RemoteViewsService.RemoteViewsFactory {

    private var tasks: List<JSONObject> = listOf()
    private var projects: JSONArray = JSONArray()
    private val widgetData: SharedPreferences = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)

    override fun onCreate() {
        updateData()
    }

    override fun onDataSetChanged() {
        updateData()
    }

    private fun updateData() {
        val tasksJson = widgetData.getString("tasks_json", "[]")
        val projectsJson = widgetData.getString("projects_json", "[]")
        val selectedProjectId = widgetData.getString("selected_project_id", null)
        
        projects = JSONArray(projectsJson)
        val allTasks = JSONArray(tasksJson)
        val filteredTasks = mutableListOf<JSONObject>()
        
        for (i in 0 until allTasks.length()) {
            val task = allTasks.getJSONObject(i)
            
            // Skip completed tasks
            if (task.optBoolean("completed", false)) {
                continue
            }
            
            // Filter by project if one is selected (unless it's 'all')
            if (selectedProjectId == null || selectedProjectId == "all" || task.optString("projectId") == selectedProjectId) {
                filteredTasks.add(task)
            }
        }
        
        // Sort: By priorityScore descending (incomplete only as completed are already filtered)
        tasks = filteredTasks.sortedByDescending { it.optDouble("priorityScore", 0.0) }
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
        val taskId = task.optString("id", "")
        val projectId = task.optString("projectId", "")
        
        var projectName = ""
        for (i in 0 until projects.length()) {
            val p = projects.getJSONObject(i)
            if (p.optString("id") == projectId) {
                projectName = p.optString("name", "")
                break
            }
        }

        views.setTextViewText(R.id.widget_task_text, text)
        if (projectName.isNotEmpty()) {
            views.setTextViewText(R.id.widget_task_project, projectName)
        } else {
            views.setTextViewText(R.id.widget_task_project, "")
        }
        views.setImageViewResource(R.id.widget_task_icon, R.drawable.ic_circle)

        // Set Fill-in Intent for starting Pomodoro
        val fillInIntent = Intent().apply {
            data = Uri.parse("homeWidget://startPomodoro?taskId=$taskId")
        }
        views.setOnClickFillInIntent(R.id.widget_task_pomodoro, fillInIntent)
        
        // Also allow clicking the text to open the app (using a different action)
        val openIntent = Intent().apply {
            data = Uri.parse("homeWidget://openTask?taskId=$taskId")
        }
        views.setOnClickFillInIntent(R.id.widget_task_text, openIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
