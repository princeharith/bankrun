import { db } from './index.js';
import { users, activities, weeklyTotals } from './schema.js';
import { sql } from 'drizzle-orm';

const DUMMY_USERS = [
    { name: 'Sarah', stravaId: 1001 },
    { name: 'Marcus', stravaId: 1002 },
    { name: 'Luna', stravaId: 1003 },
    { name: 'Diego', stravaId: 1004 },
    { name: 'Zara', stravaId: 1005 }
];

const getWeekStartDate = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
};

const seed = async () => {
    console.log('🌱 Starting seed...');

    try {
        for (const dummy of DUMMY_USERS) {
            console.log(`Processing ${dummy.name}...`);

            // 1. Create User
            const [user] = await db.insert(users).values({
                stravaAthleteId: dummy.stravaId,
                username: dummy.name,
                profilePhotoUrl: `https://ui-avatars.com/api/?name=${dummy.name}&background=random`,
                accessToken: 'dummy_token',
                refreshToken: 'dummy_refresh',
                tokenExpiresAt: new Date(Date.now() + 10000000),
            }).onConflictDoUpdate({
                target: users.stravaAthleteId,
                set: { username: dummy.name }
            }).returning();

            // 2. Generate Random Activities (Last 4 weeks)
            const activitiesToInsert = [];
            const today = new Date();

            // Generate 3-5 runs per week for 4 weeks
            for (let i = 0; i < 28; i++) {
                if (Math.random() > 0.4) { // 60% chance of a run on any given day
                    const runDate = new Date(today);
                    runDate.setDate(today.getDate() - i);

                    const distance = (Math.random() * 5 + 2).toFixed(2); // 2-7 miles

                    activitiesToInsert.push({
                        userId: user.id,
                        stravaActivityId: parseInt(`${dummy.stravaId}${i}`),
                        type: 'Run',
                        distance: distance,
                        movingTime: Math.floor(distance * 9 * 60), // ~9 min/mile
                        startDate: runDate,
                        weekStartDate: getWeekStartDate(runDate),
                        updatedAt: new Date()
                    });
                }
            }

            if (activitiesToInsert.length > 0) {
                await db.insert(activities).values(activitiesToInsert)
                    .onConflictDoUpdate({
                        target: activities.stravaActivityId,
                        set: { updatedAt: new Date() }
                    });
            }

            // 3. Calculate Weekly Totals
            const weeks = [...new Set(activitiesToInsert.map(a => a.weekStartDate))];

            for (const week of weeks) {
                const weekActivities = activitiesToInsert.filter(a => a.weekStartDate === week);
                const totalMiles = weekActivities.reduce((sum, a) => sum + parseFloat(a.distance), 0);

                await db.insert(weeklyTotals).values({
                    userId: user.id,
                    weekStartDate: week,
                    totalMiles: totalMiles.toFixed(2),
                    activityCount: weekActivities.length,
                    calculatedAt: new Date()
                }).onConflictDoUpdate({
                    target: [weeklyTotals.userId, weeklyTotals.weekStartDate], // Assuming we fixed the constraint, or this might fail if not unique constraint
                    // If the schema update earlier didn't actually add a constraint name that Drizzle recognizes for inference, 
                    // we might need to rely on the index. 
                    // However, for seeding, we can just upsert.
                    set: {
                        totalMiles: totalMiles.toFixed(2),
                        activityCount: weekActivities.length,
                        calculatedAt: new Date()
                    }
                });
            }
        }

        console.log('✅ Seed complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
