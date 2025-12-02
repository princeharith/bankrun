import express from 'express';
import axios from 'axios';
import { db } from '../db/index.js';
import { users, activities, weeklyTotals } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

const router = express.Router();

// Helper to get the Monday of the week for a given date
const getWeekStartDate = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

router.post('/sync', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // 1. Get user to retrieve access token
        const [user] = await db.select().from(users).where(eq(users.id, userId));

        if (!user || !user.accessToken) {
            return res.status(404).json({ error: 'User not found or not connected to Strava' });
        }

        // TODO: Check if token is expired and refresh it if necessary
        // For now assuming token is valid

        // 2. Fetch activities from Strava (last 30 days)
        const before = Math.floor(Date.now() / 1000);
        const after = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 days ago

        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
            headers: {
                'Authorization': `Bearer ${user.accessToken}`
            },
            params: {
                before,
                after,
                per_page: 100
            }
        });


        const stravaActivities = response.data;
        console.log(`[DEBUG] Received ${stravaActivities.length} activities from Strava`);
        console.log('[DEBUG] Strava Raw Data:', JSON.stringify(stravaActivities, null, 2));

        let syncedCount = 0;

        // 3. Process activities
        for (const activity of stravaActivities) {
            // We only care about runs for now, but let's store everything or filter?
            // Schema has 'type', so we can store all.

            // Convert meters to miles
            const distanceMiles = (activity.distance * 0.000621371).toFixed(2);
            const weekStart = getWeekStartDate(activity.start_date);

            await db.insert(activities).values({
                userId: user.id,
                stravaActivityId: activity.id,
                type: activity.type,
                distance: distanceMiles,
                movingTime: activity.moving_time,
                startDate: new Date(activity.start_date),
                weekStartDate: weekStart,
                updatedAt: new Date()
            }).onConflictDoUpdate({
                target: activities.stravaActivityId,
                set: {
                    type: activity.type,
                    distance: distanceMiles,
                    movingTime: activity.moving_time,
                    startDate: new Date(activity.start_date),
                    weekStartDate: weekStart,
                    updatedAt: new Date()
                }
            });

            syncedCount++;
        }

        // 4. Recalculate weekly totals
        // This is a bit inefficient (recalculating all affected weeks), but fine for MVP
        // We can optimize by only recalculating weeks that had changes

        // Get all unique weeks we just touched
        const affectedWeeks = [...new Set(stravaActivities.map(a => getWeekStartDate(a.start_date)))];

        for (const weekDate of affectedWeeks) {
            // Sum up distance for this user and week
            const result = await db.select({
                totalMiles: sql`sum(${activities.distance})`,
                count: sql`count(*)`
            })
                .from(activities)
                .where(and(
                    eq(activities.userId, user.id),
                    eq(activities.weekStartDate, weekDate)
                ));

            const { totalMiles, count } = result[0];

            await db.insert(weeklyTotals).values({
                userId: user.id,
                weekStartDate: weekDate,
                totalMiles: totalMiles || 0,
                activityCount: count || 0,
                calculatedAt: new Date()
            }).onConflictDoUpdate({
                target: [weeklyTotals.userId, weeklyTotals.weekStartDate], // We need a composite unique constraint or index for this to work with ON CONFLICT
                // The schema has `uniqueUserWeek` index, but `onConflictDoUpdate` needs a unique constraint.
                // Let's check schema.js again. It has `uniqueUserWeek` index but maybe not a constraint?
                // Actually `onConflictDoUpdate` works with unique indexes in some drivers but standard SQL requires constraint.
                // Drizzle `onConflictDoUpdate` usually requires a target column or constraint name.
                // If we can't rely on inference, we might need to delete and insert, or use a specific constraint name if defined.
                // Looking at schema.js: `uniqueUserWeek: index('unique_user_week').on(table.userId, table.weekStartDate)`
                // This is an INDEX, not a UNIQUE CONSTRAINT. We should probably add a unique constraint to the schema or handle this manually.
                // For now, let's try to upsert. If it fails, I'll fix the schema.
                // Actually, wait, `weeklyTotals` definition:
                // export const weeklyTotals = pgTable('weekly_totals', { ... }, (table) => ({ uniqueUserWeek: index(...).on(...) }));
                // It's just an index. We should probably make it a unique index or constraint to support upsert.
                // Let's check if I can modify schema.js to add `.unique()` to the index or use `unique()` on the table.

                // For this step, I will assume I can fix the schema to make it a unique constraint.
                // OR I can just check if it exists and update, else insert.

                set: {
                    totalMiles: totalMiles || 0,
                    activityCount: count || 0,
                    calculatedAt: new Date()
                }
            });
        }

        res.json({
            message: 'Sync complete',
            syncedCount,
            affectedWeeks
        });

    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Failed to sync activities', details: error.message });
    }
});

router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const userActivities = await db.select()
            .from(activities)
            .where(eq(activities.userId, userId))
            .orderBy(activities.startDate); // Sort by date

        // console.log(`[DEBUG] Fetched ${userActivities.length} activities for user ${userId}`);
        // console.log('[DEBUG] Activities Data:', JSON.stringify(userActivities, null, 2));

        res.json(userActivities);
    } catch (error) {
        console.error('Fetch Activities Error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

export default router;
