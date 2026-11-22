import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userSettingsTable = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  selectedSymbol: text("selected_symbol").notNull().default("R_100"),
  analysisTimeframe: text("analysis_timeframe").notNull().default("M15"),
  operatingMode: text("operating_mode").notNull().default("analysis_only"),
  maxStake: doublePrecision("max_stake"),
  dailyLossLimit: doublePrecision("daily_loss_limit"),
  maxConsecutiveLosses: integer("max_consecutive_losses"),
  maxOpenPositions: integer("max_open_positions"),
  maxTradesPerDay: integer("max_trades_per_day"),
  cooldownMinutes: integer("cooldown_minutes"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
