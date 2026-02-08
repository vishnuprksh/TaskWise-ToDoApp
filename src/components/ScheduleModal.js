import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { format } from 'date-fns';

export default function ScheduleModal({ visible, onClose, onSchedule, onDelete, task, initialDate }) {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [hasTime, setHasTime] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());

    useEffect(() => {
        if (visible && initialDate) {
            const dateObj = new Date(initialDate);
            setSelectedDate(format(dateObj, 'yyyy-MM-dd'));
            setSelectedTime(dateObj);
            setHasTime(true); // Assuming editing always implies time for now, or check if hours/mins are handled
        } else if (visible) {
            // Reset to defaults for new schedule
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
            setHasTime(false);
            setSelectedTime(new Date());
        }
    }, [visible, initialDate]);

    const handleSave = () => {
        let finalDate = new Date(selectedDate);
        if (hasTime) {
            finalDate.setHours(selectedTime.getHours());
            finalDate.setMinutes(selectedTime.getMinutes());
        } else {
            finalDate.setHours(9, 0, 0, 0);
        }

        onSchedule(task.id, finalDate);
        onClose();
    };

    const toggleTime = (value) => {
        setHasTime(value);
        if (value && Platform.OS === 'android') {
            setShowTimePicker(true);
        }
    };

    const handleTimeChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (date) {
            setSelectedTime(date);
        } else {
            // If cancelled on Android, maybe we want to keep hasTime true but just not update time?
            // Or if they cancelled the "initial" pick, maybe set hasTime false?
            // Let's keep it simple: just hide picker. User can toggle off if they want.
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
                        <View style={styles.timeToggle}>
                            <View style={styles.row}>
                                <Clock size={20} color="#94a3b8" />
                                <Text style={styles.label}>Set Time</Text>
                            </View>
                            <Switch
                                value={hasTime}
                                onValueChange={toggleTime}
                                trackColor={{ false: '#334155', true: '#6366f1' }}
                                thumbColor={'#fff'}
                            />
                        </View>

                        {hasTime && (
                            <View>
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
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <CalendarIcon size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {initialDate ? 'Update Schedule' : 'Add to Calendar'}
                            </Text>
                        </TouchableOpacity>

                        {initialDate && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    Alert.alert(
                                        "Delete Task",
                                        "Are you sure you want to delete this task?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Delete",
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
                                <Text style={styles.deleteButtonText}>Delete Task</Text>
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
        borderWidth: 1,
        borderColor: '#ef444430',
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
});
