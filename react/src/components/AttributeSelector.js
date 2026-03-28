import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const getAttributeColor = (level) => {
    switch (level) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#94a3b8';
    }
};

const AttributeSelector = ({ label, value, onChange }) => (
    <View style={styles.attributeRow}>
        <Text style={styles.attributeLabel}>{label}</Text>
        <View style={styles.attributeOptions}>
            {['low', 'medium', 'high'].map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.attributeOption,
                        value === option && styles.attributeOptionSelected,
                        value === option && { backgroundColor: getAttributeColor(option) },
                    ]}
                    onPress={() => onChange(option)}
                >
                    <Text
                        style={[
                            styles.attributeOptionText,
                            value === option && styles.attributeOptionTextSelected,
                        ]}
                    >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    attributeRow: {
        marginBottom: 16,
    },
    attributeLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    attributeOptions: {
        flexDirection: 'row',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    attributeOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    attributeOptionSelected: {
        // backgroundColor is set dynamically
    },
    attributeOptionText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    attributeOptionTextSelected: {
        color: '#fff',
    },
});

export default AttributeSelector;
