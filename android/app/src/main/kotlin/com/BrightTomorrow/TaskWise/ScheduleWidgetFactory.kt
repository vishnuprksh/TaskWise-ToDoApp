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

class ScheduleWidgetFactory(private val context: Context, private val intent: Intent) : RemoteViewsService.RemoteViewsFactory {

    private val appWidgetId: Int
        get() = intent.getIntExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID, android.appwidget.AppWidgetManager.INVALID_APPWIDGET_ID)

    private var scheduleItems: JSONArray = JSONArray()
    private val slotCount = 24 // 24 hours total
    private val slotMinutes = 60
    private var windowStartTime: Long = 0
    private var spacerHeightPx = 0

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
        
        val maxHeight = prefs.getInt("widget_height_$appWidgetId", 240)
        
        // Approximate header height = 50dp. Center is (maxHeight - 50) / 2
        val listHeightDp = maxHeight - 50
        val centerOffsetDp = if (listHeightDp > 0) listHeightDp / 2 else 100
        
        val nowMillis = System.currentTimeMillis()
        
        // Time represented by the top of the ListView (Y=0)
        // Each item (1 hour) is 60dp high. So 60 mins / 60 dp = 1 min per dp.
        val millisPerDp = (slotMinutes * 60 * 1000) / 60
        val targetTopTime = nowMillis - (centerOffsetDp * millisPerDp)
        
        // Find the next 15-minute boundary AFTER targetTopTime to ensure spacer is positive
        val targetTopTimeMinutes = targetTopTime / 60000.0
        val startBoundaryMinutes = kotlin.math.ceil(targetTopTimeMinutes / slotMinutes).toLong() * slotMinutes
        windowStartTime = startBoundaryMinutes * 60 * 1000L
        
        // Spacer height in dp, converted to px
        val spacerMs = windowStartTime - targetTopTime
        val spacerDp = (spacerMs.toFloat() / millisPerDp.toFloat())
        val density = context.resources.displayMetrics.density
        spacerHeightPx = (spacerDp * density).toInt()
    }

    override fun getCount(): Int = slotCount + 1

    override fun getViewAt(position: Int): RemoteViews {
        if (position == 0) {
            val views = RemoteViews(context.packageName, R.layout.widget_schedule_spacer)
            val height = if (spacerHeightPx > 0) spacerHeightPx else 1
            val bitmap = android.graphics.Bitmap.createBitmap(1, height, android.graphics.Bitmap.Config.ARGB_8888)
            views.setImageViewBitmap(R.id.spacer_image, bitmap)
            return views
        }
        
        val slotIndex = position - 1
        val slotTime = windowStartTime + (slotIndex * slotMinutes * 60 * 1000)
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
    override fun getViewTypeCount(): Int = 2
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
    override fun onDestroy() {}
}
