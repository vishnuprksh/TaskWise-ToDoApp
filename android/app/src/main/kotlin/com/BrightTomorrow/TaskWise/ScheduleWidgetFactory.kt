package com.BrightTomorrow.TaskWise

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class ScheduleWidgetFactory(private val context: Context, intent: Intent) : RemoteViewsService.RemoteViewsFactory {

    private var scheduleItems: JSONArray = JSONArray()
    private val slotCount = 36 // 9 hours total (increased for better scroll feel)
    private val slotMinutes = 15
    private var windowStartTime: Long = 0

    override fun onCreate() {}

    override fun onDataSetChanged() {
        Log.d("ScheduleWidget", "Updating data...")
        val prefs = context.getSharedPreferences("HomeWidgetPreferences", Context.MODE_PRIVATE)
        val jsonString = prefs.getString("schedule_json", "[]")
        try {
            scheduleItems = JSONArray(jsonString)
        } catch (e: Exception) {
            scheduleItems = JSONArray()
        }
        
        // Calculate the window start time: now minus 18 slots (4.5 hours, half of the 9h window)
        val now = Calendar.getInstance()
        // Round to nearest 15 mins for stability
        now.set(Calendar.SECOND, 0)
        now.set(Calendar.MILLISECOND, 0)
        val minutes = now.get(Calendar.MINUTE)
        now.set(Calendar.MINUTE, minutes - (minutes % slotMinutes))
        
        windowStartTime = now.timeInMillis - (18 * slotMinutes * 60 * 1000)
    }

    override fun getCount(): Int = slotCount

    override fun getViewAt(position: Int): RemoteViews {
        val slotTime = windowStartTime + (position * slotMinutes * 60 * 1000)
        val views = RemoteViews(context.packageName, R.layout.widget_schedule_item)
        
        // Format time label
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        views.setTextViewText(R.id.item_time_label, sdf.format(Date(slotTime)))

        // Find tasks that overlap this slot
        var foundTask: JSONObject? = null
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        isoFormat.timeZone = TimeZone.getDefault()
        
        for (i in 0 until scheduleItems.length()) {
            val item = scheduleItems.getJSONObject(i)
            val startTimeStr = item.optString("scheduledAt", "")
            if (startTimeStr.isNotEmpty()) {
                try {
                    val cleanTimeStr = startTimeStr.replace("Z", "").split(".")[0] // Handle precision
                    val taskStartTime = isoFormat.parse(cleanTimeStr)?.time ?: 0L
                    val duration = item.optInt("duration", 60)
                    val taskEndTime = taskStartTime + (duration * 60 * 1000)
                    
                    // If slot starts during this task OR task starts during this slot
                    if (slotTime >= taskStartTime && slotTime < taskEndTime) {
                        foundTask = item
                        break
                    }
                } catch (e: Exception) {
                    // Log.e("ScheduleWidget", "Error parsing time: $startTimeStr", e)
                }
            }
        }

        if (foundTask != null) {
            views.setViewVisibility(R.id.item_event_container, View.VISIBLE)
            views.setTextViewText(R.id.item_event_title, foundTask.optString("text", "Task"))
            val duration = foundTask.optInt("duration", 60)
            views.setTextViewText(R.id.item_event_duration, "$duration mins")
            
            // Highlight active task? (If now is within task)
            val now = System.currentTimeMillis()
            // views.setInt(R.id.item_event_container, "setBackgroundResource", R.drawable.widget_event_background_active)

            // Deep link click
            val taskId = foundTask.optString("id", "")
            val fillInIntent = Intent().apply {
                action = TaskWidgetProvider.ACTION_WIDGET_CLICK
                data = Uri.parse("homeWidget://editTask?taskId=$taskId")
            }
            views.setOnClickFillInIntent(R.id.item_event_container, fillInIntent)
        } else {
            views.setViewVisibility(R.id.item_event_container, View.INVISIBLE)
        }

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
    override fun onDestroy() {}
}
