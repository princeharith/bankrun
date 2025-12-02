import { pgTable, uuid, varchar, text, decimal, timestamp, bigint, jsonb, integer, date, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).unique().notNull(),
    username: varchar('username', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    profilePhotoUrl: text('profile_photo_url'),
    accessToken: text('access_token'), // Should be encrypted in production
    refreshToken: text('refresh_token'), // Should be encrypted in production
    tokenExpiresAt: timestamp('token_expires_at'),
    balance: decimal('balance', { precision: 10, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activities table
export const activities = pgTable('activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    stravaActivityId: bigint('strava_activity_id', { mode: 'number' }).unique().notNull(),
    type: varchar('type', { length: 50 }).notNull(), // Run, Walk, Hike
    distance: decimal('distance', { precision: 10, scale: 2 }).notNull(), // miles
    movingTime: integer('moving_time').notNull(), // seconds
    startDate: timestamp('start_date').notNull(),
    weekStartDate: date('week_start_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userWeekIdx: index('user_week_idx').on(table.userId, table.weekStartDate),
}));

// Weekly totals table
export const weeklyTotals = pgTable('weekly_totals', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    weekStartDate: date('week_start_date').notNull(),
    totalMiles: decimal('total_miles', { precision: 10, scale: 2 }).notNull(),
    activityCount: integer('activity_count').notNull(),
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueUserWeek: index('unique_user_week').on(table.userId, table.weekStartDate),
    // Add unique constraint for upsert
    uniqueUserWeekConstraint: unique('unique_user_week_constraint').on(table.userId, table.weekStartDate),
}));

// Weekly lines table
export const weeklyLines = pgTable('weekly_lines', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    weekStartDate: date('week_start_date').notNull(),
    predictedMiles: decimal('predicted_miles', { precision: 10, scale: 2 }).notNull(),
    confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
    calculationMetadata: jsonb('calculation_metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueUserWeekLine: index('unique_user_week_line').on(table.userId, table.weekStartDate),
}));

// User stats table
export const userStats = pgTable('user_stats', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull().unique(),
    avgWeeklyMiles4wk: decimal('avg_weekly_miles_4wk', { precision: 10, scale: 2 }),
    avgWeeklyMiles12wk: decimal('avg_weekly_miles_12wk', { precision: 10, scale: 2 }),
    stdDeviation: decimal('std_deviation', { precision: 10, scale: 2 }),
    trend: varchar('trend', { length: 20 }), // increasing, decreasing, stable
    totalWeeksActive: integer('total_weeks_active').default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bets table
export const bets = pgTable('bets', {
    id: uuid('id').primaryKey().defaultRandom(),
    bettorId: uuid('bettor_id').references(() => users.id).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id).notNull(),
    weekStartDate: date('week_start_date').notNull(),
    position: varchar('position', { length: 10 }).notNull(), // 'over' or 'under'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    lineValue: decimal('line_value', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('unmatched'), // unmatched, matched, settled, cancelled
    matchedBetId: uuid('matched_bet_id'),
    matchId: uuid('match_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    unmatchedBetsIdx: index('unmatched_bets_idx').on(table.targetUserId, table.weekStartDate, table.position, table.status),
}));

// Matches table
export const matches = pgTable('matches', {
    id: uuid('id').primaryKey().defaultRandom(),
    betOverId: uuid('bet_over_id').references(() => bets.id).notNull(),
    betUnderId: uuid('bet_under_id').references(() => bets.id).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id).notNull(),
    weekStartDate: date('week_start_date').notNull(),
    lineValue: decimal('line_value', { precision: 10, scale: 2 }).notNull(),
    escrowAmount: decimal('escrow_amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active, settled, disputed
    winnerBetId: uuid('winner_bet_id'),
    settledAt: timestamp('settled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // deposit, withdrawal, bet_placed, bet_won, bet_lost, bet_cancelled
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, completed, failed
    relatedBetId: uuid('related_bet_id'),
    relatedMatchId: uuid('related_match_id'),
    stripeTransactionId: varchar('stripe_transaction_id', { length: 255 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userTransactionsIdx: index('user_transactions_idx').on(table.userId, table.createdAt),
}));

// Settlements table
export const settlements = pgTable('settlements', {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id').references(() => matches.id).notNull().unique(),
    actualMiles: decimal('actual_miles', { precision: 10, scale: 2 }).notNull(),
    lineValue: decimal('line_value', { precision: 10, scale: 2 }).notNull(),
    winnerBetId: uuid('winner_bet_id'),
    winnerPayout: decimal('winner_payout', { precision: 10, scale: 2 }),
    platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
    status: varchar('status', { length: 20 }).notNull().default('settled'), // settled, disputed, refunded
    settledAt: timestamp('settled_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    activities: many(activities),
    weeklyTotals: many(weeklyTotals),
    weeklyLines: many(weeklyLines),
    userStats: many(userStats),
    betsPlaced: many(bets, { relationName: 'bettor' }),
    betsAgainst: many(bets, { relationName: 'target' }),
    transactions: many(transactions),
}));

export const betsRelations = relations(bets, ({ one }) => ({
    bettor: one(users, {
        fields: [bets.bettorId],
        references: [users.id],
        relationName: 'bettor',
    }),
    targetUser: one(users, {
        fields: [bets.targetUserId],
        references: [users.id],
        relationName: 'target',
    }),
    match: one(matches, {
        fields: [bets.matchId],
        references: [matches.id],
    }),
}));