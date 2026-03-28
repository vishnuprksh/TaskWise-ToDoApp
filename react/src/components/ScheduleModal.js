import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, Platform, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar as CalendarIcon, Clock, Copy, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { isValidDate } from '../utils/time';

export default function ScheduleModal({ visible, onClose, onSchedule, onDelete, onDuplicate, task, initialDate, defaultTime }) {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [duration, setDuration] = useState(60);

    useEffect(() => {
        if (visible) {
            if (isValidDate(initialDate)) {
                const dateObj = new Date(initialDate);
                setSelectedDate(format(dateObj, 'yyyy-MM-dd'));
                setSelectedTime(dateObj);
                setDuration(task?.duration || 60);
            } else if (defaultTime) {
                const dateObj = new Date(defaultTime);
                setSelectedDate(format(dateObj, 'yyyy-MM-dd'));
                setSelectedTime(dateObj);
                setDuration(60);
            } else {
                const now = new Date();
                setSelectedDate(format(now, 'yyyy-MM-dd'));
                setSelectedTime(now);
                setDuration(60);
            }
        }
    }, [visible, initialDate, defaultTime, task]);

    const getFinalDate = () => {
        let finalDate = new Date(selectedDate);
        finalDate.setHours(selectedTime.getHours());
        finalDate.setMinutes(selectedTime.getMinutes());
        return finalDate;
    };

    const handleSave = () => {
        onSchedule(task.id, getFinalDate(), duration);
        onClose();
    };

    const handleDuplicate = () => {
        onDuplicate?.(task.id, getFinalDate(), duration);
        onClose();
    };

    const handleTimeChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (date) {
            setSelectedTime(date);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        {/* ... header content ... */}
                        <Text style={styles.title}>Schedule Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.taskTitle} numberOfLines={1}>{task?.text}</Text>

                    <View style={styles.calendarContainer}>
                        <Calendar
                            current={selectedDate}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={day => setSelectedDate(day.dateString)}
                            markedDates={{
                                [selectedDate]: { selected: true, selectedColor: '#6366f1' }
                            }}
                            theme={{
                                backgroundColor: '#1e293b',
                                calendarBackground: '#1e293b',
                                textSectionTitleColor: '#94a3b8',
                                selectedDayBackgroundColor: '#6366f1',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#6366f1',
                                dayTextColor: '#f1f5f9',
                                textDisabledColor: '#475569',
                                arrowColor: '#6366f1',
                                monthTextColor: '#f1f5f9',
                                textDayFontWeight: '600',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                        />
                    </View>

                    <View style={styles.timeSection}>
                        <View style={styles.row}>
                            <Clock size={20} color="#94a3b8" />
                            <Text style={styles.label}>Time</Text>
                        </View>

                        {Platform.OS === 'android' && (
                            <TouchableOpacity
                                style={styles.timeDisplayButton}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.timeDisplayText}>
                                    {format(selectedTime, 'h:mm a')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {(Platform.OS === 'ios' || showTimePicker) && (
                            <View style={styles.timePickerContainer}>
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeChange}
                                    textColor="#fff"
                                    themeVariant="dark"
                                />
                            </View>
                        )}

                        <View style={styles.durationSection}>
                            <Text style={styles.durationLabel}>Duration:</Text>
                            <View style={styles.durationButtons}>
                                {[15, 30, 45, 60, 90, 120].map((d) => (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.durationButton, duration === d && styles.durationButtonActive]}
                                        onPress={() => setDuration(d)}
                                    >
                                        <Text style={[styles.durationButtonText, duration === d && styles.durationButtonTextActive]}>
                                            {d < 60 ? `${d}m` : `${d / 60}h`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <CalendarIcon size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>
                                    {initialDate ? 'Update' : 'Add'}
                                </Text>
                            </TouchableOpacity>

                            {initialDate && (
                                <TouchableOpacity style={styles.duplicateButton} onPress={handleDuplicate}>
                                    <Copy size={20} color="#fff" />
                                    <Text style={styles.saveButtonText}>Duplicate</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {initialDate && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    Alert.alert(
                                        "Remove from Calendar",
                                        "Are you sure you want to remove this event from the calendar? The task will remain in your list.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Remove",
                                                style: "destructive",
                                                onPress: () => {
                                                    onDelete?.(task.id);
                                                    onClose();
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Trash2 size={20} color="#ef4444" />
                                <Text style={styles.deleteButtonText}>Remove from Calendar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    taskTitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 20,
    },
    calendarContainer: {
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    timeSection: {
        marginBottom: 24,
    },
    timeToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#33415540',
        borderRadius: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 16,
        color: '#f1f5f9',
        fontWeight: '500',
    },
    timePickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
        flex: 1,
    },
    duplicateButton: {
        backgroundColor: '#0ea5e9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        gap: 12,
    },
    deleteButton: {
        backgroundColor: '#ef444415',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ef444430',
        flexDirection: 'row',
        gap: 8,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    timeDisplayButton: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#33415540',
        borderRadius: 12,
        marginTop: 8,
    },
    timeDisplayText: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: '600',
    },
    durationSection: {
        marginTop: 16,
    },
    durationLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 8,
        fontWeight: '600',
    },
    durationButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    durationButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#33415540',
        borderWidth: 1,
        borderColor: '#334155',
    },
    durationButtonActive: {
        backgroundColor: '#6366f120',
        borderColor: '#6366f1',
    },
    durationButtonText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    durationButtonTextActive: {
        color: '#6366f1',
    },
});
