import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../_theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    useGetMyDeliveriesQuery,
    useSkipDeliveryMutation,
} from '../../src/redux/api/deliveryApi';
import { useGetSubscriptionQuery } from '../../src/redux/api/subscriptionApi';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    }

    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'delivered':
            return { name: 'checkmark-circle', color: '#10b981' };
        case 'skipped':
            return { name: 'close-circle', color: '#6b7280' };
        case 'missed':
            return { name: 'alert-circle', color: '#ef4444' };
        default:
            return { name: 'time', color: '#3b82f6' };
    }
};

export default function Deliveries() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { data: subscriptionData } = useGetSubscriptionQuery();
    const { data: deliveriesData, isLoading, isFetching, refetch } = useGetMyDeliveriesQuery({});
    const [skipDelivery, { isLoading: isSkipping }] = useSkipDeliveryMutation();

    const subscription = subscriptionData?.subscription;
    const deliveries = deliveriesData?.deliveries || [];

    // Separate upcoming and past deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDeliveries = deliveries.filter((d) => {
        const dDate = new Date(d.scheduled_date);
        dDate.setHours(0, 0, 0, 0);
        return dDate >= today && d.status === 'scheduled';
    });

    const pastDeliveries = deliveries.filter((d) => {
        return d.status !== 'scheduled';
    });

    const handleSkip = (delivery) => {
        Alert.alert(
            'Skip Delivery',
            `Are you sure you want to skip the ${formatDate(delivery.scheduled_date)} ${delivery.delivery_time} delivery?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await skipDelivery({ id: delivery._id }).unwrap();
                            Toast.show({
                                type: 'success',
                                text1: 'Delivery Skipped',
                                text2: 'This delivery will not be charged.',
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error?.data?.message || 'Failed to skip delivery',
                            });
                        }
                    },
                },
            ]
        );
    };

    const renderDeliveryItem = (delivery, isUpcoming) => {
        const statusIcon = getStatusIcon(delivery.status);
        const canSkip = isUpcoming && delivery.status === 'scheduled';

        return (
            <View
                key={delivery._id}
                style={[styles.deliveryItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
                <View style={styles.deliveryLeft}>
                    <Ionicons name={statusIcon.name} size={24} color={statusIcon.color} />
                </View>
                <View style={styles.deliveryCenter}>
                    <Text style={[styles.deliveryDate, { color: theme.colors.textPrimary }]}>
                        {formatDate(delivery.scheduled_date)}
                    </Text>
                    <Text style={[styles.deliveryDetails, { color: theme.colors.textSecondary }]}>
                        {delivery.delivery_time === 'morning' ? '🌅 Morning' : '🌙 Evening'} • {delivery.product_quantity}
                    </Text>
                    <Text style={[styles.deliveryPrice, { color: theme.colors.primary }]}>
                        ₹{delivery.price}
                    </Text>
                </View>
                <View style={styles.deliveryRight}>
                    {canSkip ? (
                        <TouchableOpacity
                            style={[styles.skipButton, { borderColor: theme.colors.error }]}
                            onPress={() => handleSkip(delivery)}
                            disabled={isSkipping}
                        >
                            <Text style={[styles.skipButtonText, { color: theme.colors.error }]}>Skip</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.statusText, { color: statusIcon.color }]}>
                            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (!subscription) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Deliveries</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color={theme.colors.muted} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Active Subscription</Text>
                    <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
                        Subscribe to start receiving milk deliveries
                    </Text>
                    <TouchableOpacity
                        style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/(tabs)/subscription')}
                    >
                        <Text style={styles.ctaButtonText}>Subscribe Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Deliveries</Text>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Loading deliveries...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />
                    }
                >
                    {/* Subscription Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <View style={styles.summaryHeader}>
                            <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
                                🥛 {subscription.subscription_product.quantity} {subscription.frequency}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.statusBadgeText}>Active</Text>
                            </View>
                        </View>
                        <Text style={[styles.summaryDetails, { color: theme.colors.textSecondary }]}>
                            {subscription.delivery_time === 'morning' ? '🌅 Morning' : '🌙 Evening'} delivery • ₹{subscription.price_per_delivery}/delivery
                        </Text>
                    </View>

                    {/* Upcoming Deliveries */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            📅 Upcoming Deliveries
                        </Text>
                        {upcomingDeliveries.length === 0 ? (
                            <Text style={[styles.emptySection, { color: theme.colors.muted }]}>
                                No upcoming deliveries scheduled. Check back soon!
                            </Text>
                        ) : (
                            upcomingDeliveries.map((d) => renderDeliveryItem(d, true))
                        )}
                    </View>

                    {/* Past Deliveries */}
                    {pastDeliveries.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                                📜 Past Deliveries
                            </Text>
                            {pastDeliveries.slice(0, 7).map((d) => renderDeliveryItem(d, false))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        minHeight: 60,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    ctaButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 16,
    },
    ctaButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    summaryDetails: {
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    emptySection: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    deliveryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    deliveryLeft: {
        marginRight: 12,
    },
    deliveryCenter: {
        flex: 1,
    },
    deliveryDate: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    deliveryDetails: {
        fontSize: 13,
        marginBottom: 2,
    },
    deliveryPrice: {
        fontSize: 14,
        fontWeight: '600',
    },
    deliveryRight: {
        marginLeft: 12,
    },
    skipButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    skipButtonText: {
        fontWeight: '600',
        fontSize: 13,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 13,
    },
});
