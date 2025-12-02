import express from 'express';
import axios from 'axios';
import { db } from '../db/index.js';
import { users, activities, weeklyTotals } from '../db/schema.js';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

const router = express.Router();
function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Helper: Get week start date (Monday)
function lastThreeWeeks(date = new Date()) {
    const d = new Date(date);
    const diff = d.getDate() - 21;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

console.log(lastThreeWeeks());


//TODO change this so its usernames and weekly totals...
router.get('/', async (req, res) => {
    try {

        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            profile_pic: users.profilePhotoUrl,
        }).from(users);


        const usersWithPredictions = await Promise.all(
            allUsers.map(async (user) => {
                console.log(user);
                const lastThreeWeeks = await db.select({
                    totalMiles: weeklyTotals.totalMiles,
                })
                    .from(weeklyTotals)
                    .where(eq(weeklyTotals.userId, user.id))
                    .orderBy(desc(weeklyTotals.weekStartDate))
                    .limit(3);

                const calculateWeightedAverage = (weeks) => {
                    if (weeks.length === 0) return 0;

                    const weights = [.5, .25, .25];

                    const weightedSum = weeks.reduce((total, week, index) => {
                        const weight = weights[index];
                        return total + (week.totalMiles * weight)
                    }, 0);

                    return weightedSum;

                }


                const avgMiles = calculateWeightedAverage(lastThreeWeeks);


                return {
                    id: user.id,
                    username: user.username,
                    profile_pic: user.profile_pic,
                    mileLine: Math.round(avgMiles * 2) / 2,
                }

            })
        )



        // remember to use below syntax to log objects
        console.log('[DEBUG] Fetched', usersWithPredictions);
        res.json(usersWithPredictions);
    } catch (error) {
        console.error('Fetch Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
