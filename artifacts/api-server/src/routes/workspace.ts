import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";
import { db, userSettingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

async function getOrCreateSettings(userId: string) {
  await db
    .insert(userSettingsTable)
    .values({ userId })
    .onConflictDoNothing({ target: userSettingsTable.userId });

  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId))
    .limit(1);

  if (!settings) {
    throw new Error("Could not load workspace settings");
  }

  return settings;
}

router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings(req.userId!);
  res.json(
    GetSettingsResponse.parse({
      selectedSymbol: settings.selectedSymbol,
      analysisTimeframe: settings.analysisTimeframe,
      operatingMode: settings.operatingMode,
      maxStake: settings.maxStake,
      dailyLossLimit: settings.dailyLossLimit,
      maxConsecutiveLosses: settings.maxConsecutiveLosses,
      maxOpenPositions: settings.maxOpenPositions,
      maxTradesPerDay: settings.maxTradesPerDay,
      cooldownMinutes: settings.cooldownMinutes,
      updatedAt: settings.updatedAt,
    }),
  );
});

router.put("/settings", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid workspace settings");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settings] = await db
    .insert(userSettingsTable)
    .values({
      userId: req.userId!,
      ...parsed.data,
    })
    .onConflictDoUpdate({
      target: userSettingsTable.userId,
      set: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json(
    UpdateSettingsResponse.parse({
      selectedSymbol: settings.selectedSymbol,
      analysisTimeframe: settings.analysisTimeframe,
      operatingMode: settings.operatingMode,
      maxStake: settings.maxStake,
      dailyLossLimit: settings.dailyLossLimit,
      maxConsecutiveLosses: settings.maxConsecutiveLosses,
      maxOpenPositions: settings.maxOpenPositions,
      maxTradesPerDay: settings.maxTradesPerDay,
      cooldownMinutes: settings.cooldownMinutes,
      updatedAt: settings.updatedAt,
    }),
  );
});

router.get(
  "/dashboard/summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const settings = await getOrCreateSettings(req.userId!);
    res.json(
      GetDashboardSummaryResponse.parse({
        selectedSymbol: settings.selectedSymbol,
        operatingMode: settings.operatingMode,
        accountStatus: "not_connected",
        accountBalance: null,
        dailyProfitLoss: null,
        activeSignalCount: 0,
        openPositionCount: null,
        marketDataProvider: "deriv_public_websocket",
      }),
    );
  },
);

export default router;
