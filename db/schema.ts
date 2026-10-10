import {integer,sqliteTable,text,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const demoSessions=sqliteTable('demo_sessions',{
 id:text('id').primaryKey(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
 language:text('language').notNull(),stage:text('stage').notNull(),mode:text('mode'),
 started:integer('started').notNull().default(0),completed:integer('completed').notNull().default(0),activeSeconds:integer('active_seconds').notNull().default(0),
},table=>[index('demo_sessions_created').on(table.createdAt)]);
export const demoStages=sqliteTable('demo_stages',{
 sessionId:text('session_id').notNull().references(()=>demoSessions.id,{onDelete:'cascade'}),stage:text('stage').notNull(),
 activeSeconds:integer('active_seconds').notNull().default(0),updatedAt:integer('updated_at').notNull(),
},table=>[primaryKey({columns:[table.sessionId,table.stage]})]);
export const demoFeedback=sqliteTable('demo_feedback',{
 id:text('id').primaryKey(),createdAt:integer('created_at').notNull(),language:text('language').notNull(),
 stage:text('stage').notNull(),experience:text('experience').notNull(),message:text('message').notNull(),
},table=>[index('demo_feedback_created').on(table.createdAt)]);
export const demoLimits=sqliteTable('demo_limits',{
 bucket:text('bucket').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull(),
},table=>[index('demo_limits_expiry').on(table.expiresAt)]);
