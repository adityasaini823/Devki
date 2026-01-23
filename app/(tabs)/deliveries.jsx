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
import { useRouter, useFocusEffect } from 'expo-router';
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

const getStatusConfig = (status) => {
    switch (status) {
        case 'delivered':
            return { name: 'checkmark-circle', color: '#10b981', bgColor: '#ecfdf5', label: 'Delivered' };
        case 'skipped':
            return { name: 'close-circle', color: '#6b7280', bgColor: '#f3f4f6', label: 'Skipped' };
        case 'missed':
            return { name: 'alert-circle', color: '#ef4444', bgColor: '#fef2f2', label: 'Missed' };
        case 'scheduled':
            return { name: 'time', color: '#3b82f6', bgColor: '#eff6ff', label: 'Scheduled' };
        default:
            return { name: 'help-circle', color: '#6b7280', bgColor: '#f3f4f6', label: status };
    }
};

export default function Deliveries() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { data: subscriptionData, refetch: refetchSubscription } = useGetSubscriptionQuery();
    const { data: deliveriesData, isLoading, isFetching, refetch: refetchDeliveries } = useGetMyDeliveriesQuery({});
    const [skipDelivery, { isLoading: isSkipping }] = useSkipDeliveryMutation();

    // Refetch data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            refetchSubscription();
            refetchDeliveries();
        }, [])
    );

    const subscription = subscriptionData?.subscription;
    const deliveries = deliveriesData?.deliveries || [];

    // Refetch function for pull-to-refresh
    const handleRefresh = () => {
        refetchSubscription();
        refetchDeliveries();
    };

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
        const statusConfig = getStatusConfig(delivery.status);
        
        const dDate = new Date(delivery.scheduled_date);
        dDate.setHours(0, 0, 0, 0);
        const isToday = dDate.getTime() === today.getTime();
        
        const canSkip = isUpcoming && delivery.status === 'scheduled' && !isToday;

        return (
            <View
                key={delivery._id}
                style={[
                    styles.deliveryItem,
                    { 
                        backgroundColor: theme.colors.card, 
                        borderColor: theme.colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                    }
                ]}
            >
                <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
                
                <View style={styles.deliveryContent}>
                    <View style={styles.deliveryMainInfo}>
                        <View style={styles.deliveryLeftInfo}>
                            <Text style={[styles.deliveryDate, { color: theme.colors.textPrimary }]}>
                                {formatDate(delivery.scheduled_date)}
                            </Text>
                            <View style={styles.deliveryTimeRow}>
                                <Ionicons 
                                    name={delivery.delivery_time === 'morning' ? 'sunny-outline' : 'moon-outline'} 
                                    size={14} 
                                    color={theme.colors.textSecondary} 
                                />
                                <Text style={[styles.deliveryDetails, { color: theme.colors.textSecondary }]}>
                                    {delivery.delivery_time.charAt(0).toUpperCase() + delivery.delivery_time.slice(1)} • {delivery.product_quantity}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.deliveryPriceContainer}>
                            <Text style={[styles.deliveryPrice, { color: theme.colors.primary }]}>
                                ₹{delivery.price}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.deliveryFooter}>
                        <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.bgColor }]}>
                            <Ionicons name={statusConfig.name} size={12} color={statusConfig.color} />
                            <Text style={[styles.statusBadgeSmallText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>

                        {canSkip && (
                            <TouchableOpacity
                                style={styles.skipButtonContainer}
                                onPress={() => handleSkip(delivery)}
                                disabled={isSkipping}
                            >
                                <Text style={[styles.skipButtonLabel, { color: theme.colors.error }]}>Skip Delivery</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (!subscription) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButtonStyle}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Deliveries</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="calendar-outline" size={80} color={theme.colors.muted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Active Subscription</Text>
                    <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
                        You don't have an active subscription yet. Subscribe to get fresh milk delivered to your doorstep everyday!
                    </Text>
                    <TouchableOpacity
                        style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/(tabs)/subscription')}
                    >
                        <Text style={styles.ctaButtonText}>Start Subscription</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonStyle}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Deliveries</Text>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Fetching your deliveries...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                    }
                >
                    {/* Subscription Summary Card */}
                    <View style={[styles.summaryCard, { 
                        backgroundColor: theme.colors.card, 
                        borderColor: theme.colors.border,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                    }]}>
                        <View style={styles.summaryHeader}>
                            <View>
                                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>ACTIVE PLAN</Text>
                                <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
                                    {subscription.subscription_product.quantity} {subscription.frequency}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.statusBadgeText}>Active</Text>
                            </View>
                        </View>
                        
                        <View style={styles.separator} />
                        
                        <View style={styles.summaryInfoGrid}>
                            <View style={styles.summaryInfoItem}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                                <Text style={[styles.summaryInfoText, { color: theme.colors.textSecondary }]}>
                                    {subscription.delivery_time === 'morning' ? 'Morning 06-08 AM' : 'Evening 06-08 PM'}
                                </Text>
                            </View>
                            <View style={styles.summaryInfoItem}>
                                <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
                                <Text style={[styles.summaryInfoText, { color: theme.colors.textSecondary }]}>
                                    ₹{subscription.price_per_delivery} / delivery
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Upcoming Deliveries */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                                Upcoming Deliveries
                            </Text>
                            <View style={[styles.countBadge, { backgroundColor: theme.colors.accentSoft }]}>
                                <Text style={[styles.countBadgeText, { color: theme.colors.primary }]}>
                                    {upcomingDeliveries.length}
                                </Text>
                            </View>
                        </View>
                        
                        {upcomingDeliveries.length === 0 ? (
                            <View style={[styles.emptySectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Ionicons name="calendar-outline" size={32} color={theme.colors.muted} />
                                <Text style={[styles.emptySection, { color: theme.colors.muted }]}>
                                    No upcoming deliveries scheduled.
                                </Text>
                            </View>
                        ) : (
                            upcomingDeliveries.map((d) => renderDeliveryItem(d, true))
                        )}
                    </View>

                    {/* Past Deliveries */}
                    {pastDeliveries.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                                    Recent History
                                </Text>
                            </View>
                            {pastDeliveries.slice(0, 10).map((d) => renderDeliveryItem(d, false))}
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
        paddingBottom: 16,
        minHeight: 60,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButtonStyle: {
        padding: 8,
        marginLeft: -8,
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
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    ctaButton: {
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
        padding: 20,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 28,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    summaryInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    summaryInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryInfoText: {
        fontSize: 13,
        fontWeight: '500',
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptySectionCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        gap: 8,
    },
    emptySection: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    deliveryItem: {
        flexDirection: 'row',
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 14,
        overflow: 'hidden',
    },
    statusIndicator: {
        width: 6,
        height: '100%',
    },
    deliveryContent: {
        flex: 1,
        padding: 16,
    },
    deliveryMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    deliveryLeftInfo: {
        flex: 1,
    },
    deliveryDate: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    deliveryTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deliveryDetails: {
        fontSize: 13,
        fontWeight: '500',
    },
    deliveryPriceContainer: {
        alignItems: 'flex-end',
    },
    deliveryPrice: {
        fontSize: 17,
        fontWeight: '800',
    },
    deliveryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
        paddingTop: 12,
    },
    statusBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeSmallText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    skipButtonContainer: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    skipButtonLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
});

